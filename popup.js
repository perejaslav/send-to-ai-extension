import { SPECIAL_ACTIONS, SERVICE_CONFIGS } from "./services.js";
import { SETTINGS_STORAGE_KEYS, normalizeSettings } from "./settings.js";

const subtitleElement = document.getElementById("subtitle");
const selectionPreviewElement = document.getElementById("selectionPreview");
const serviceSelectElement = document.getElementById("serviceSelect");
const sendButtonElement = document.getElementById("sendButton");
const specialActionsElement = document.getElementById("specialActions");
const statusElement = document.getElementById("status");
const settingsButtonElement = document.getElementById("settingsButton");

const state = {
  settings: normalizeSettings({}),
  selectionText: "",
  pageTitle: "",
  pageUrl: ""
};

function setStatus(text, isError = false) {
  statusElement.textContent = text;
  statusElement.style.color = isError ? "#b91c1c" : "#166534";
}

function sanitizeSelection(text) {
  return String(text || "").trim();
}

function truncate(text, limit = 220) {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit).trimEnd()}...`;
}

function renderSelectionPreview() {
  const selection = sanitizeSelection(state.selectionText);
  if (selection) {
    selectionPreviewElement.textContent = truncate(selection);
    subtitleElement.textContent = state.pageTitle ? `${state.pageTitle}` : "Выделение готово";
    return;
  }

  selectionPreviewElement.textContent = "Выдели текст на странице, чтобы отправить его в AI-сервис.";
  subtitleElement.textContent = state.pageUrl ? state.pageUrl : "Нет выделения";
}

function renderServices() {
  serviceSelectElement.textContent = "";

  const enabledServices = state.settings.serviceOrder.filter((serviceId) => state.settings.enabledServices[serviceId] !== false);

  for (const serviceId of enabledServices) {
    const service = SERVICE_CONFIGS.find((item) => item.id === serviceId);
    if (!service) {
      continue;
    }

    const option = document.createElement("option");
    option.value = service.id;
    option.textContent = service.title;
    serviceSelectElement.append(option);
  }

  serviceSelectElement.value = state.settings.defaultServiceId && enabledServices.includes(state.settings.defaultServiceId)
    ? state.settings.defaultServiceId
    : enabledServices[0] || "";
}

function renderSpecialActions() {
  specialActionsElement.textContent = "";

  const visibleActions = SPECIAL_ACTIONS.filter((action) =>
    state.settings.showSpecialActions !== false
    && state.settings.enabledSpecialActions[action.id] !== false
  );

  if (visibleActions.length === 0) {
    specialActionsElement.innerHTML = '<div class="subtitle">Специальные команды скрыты в настройках.</div>';
    return;
  }

  for (const action of visibleActions) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.title;
    button.disabled = !state.selectionText;
    button.addEventListener("click", async () => {
      await runAction(action.serviceId, action.transformText(state.selectionText));
    });
    specialActionsElement.append(button);
  }
}

async function loadSettings() {
  const storedSettings = await new Promise((resolve, reject) => {
    chrome.storage.sync.get(SETTINGS_STORAGE_KEYS, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(result);
    });
  });

  state.settings = normalizeSettings(storedSettings);
}

async function readActiveTabSelection() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return;
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        text: window.getSelection?.().toString() || "",
        title: document.title || "",
        url: location.href || ""
      })
    });

    const result = results?.[0]?.result || {};
    state.selectionText = sanitizeSelection(result.text);
    state.pageTitle = String(result.title || "");
    state.pageUrl = String(result.url || tab.url || "");
  } catch (error) {
    console.warn("Failed to read selection:", error.message);
    state.selectionText = "";
    state.pageTitle = tab.title || "";
    state.pageUrl = tab.url || "";
  }
}

function sendRuntimeMessage(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(response);
    });
  });
}

async function runAction(serviceId, text) {
  sendButtonElement.disabled = true;
  setStatus("Отправка...", false);

  try {
    const response = await sendRuntimeMessage({
      type: "runServiceAction",
      serviceId,
      text
    });

    if (response?.status === "success") {
      setStatus("Готово", false);
      return;
    }

    setStatus("Не удалось выполнить действие", true);
  } catch (error) {
    setStatus(`Ошибка: ${error.message}`, true);
  } finally {
    sendButtonElement.disabled = false;
  }
}

async function handleSendClick() {
  const selection = sanitizeSelection(state.selectionText);
  const serviceId = serviceSelectElement.value;
  let shouldClose = false;

  try {
    if (!selection) {
    setStatus("Сначала выдели текст на странице.", true);
    return;
  }

    if (!serviceId) {
    setStatus("Нет доступных сервисов.", true);
    return;
  }

    shouldClose = true;
    await runAction(serviceId, selection);
  } finally {
    if (shouldClose) {
      window.close();
    }
  }
}

settingsButtonElement.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

sendButtonElement.addEventListener("click", handleSendClick);

(async function init() {
  try {
    await loadSettings();
    await readActiveTabSelection();
    renderSelectionPreview();
    renderServices();
    renderSpecialActions();

    if (!state.selectionText) {
      setStatus("Выдели текст на странице и вернись сюда.", true);
    }
  } catch (error) {
    setStatus(`Ошибка инициализации: ${error.message}`, true);
  }
})();
