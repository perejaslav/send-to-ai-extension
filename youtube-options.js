import { SERVICE_CONFIGS } from "./services.js";
import { normalizeYouTubeTemplates, renderYouTubeTemplate } from "./youtube-templates.js";

const youtubeTemplatesListElement = document.getElementById("youtubeTemplatesList");
const saveButtonElement = document.getElementById("saveButton");
const statusElement = document.getElementById("status");
const exportSettingsButtonElement = document.getElementById("exportSettingsButton");
const importSettingsFileElement = document.getElementById("importSettingsFile");
const resetAllSettingsButtonElement = document.getElementById("resetAllSettingsButton");

const state = {
  youtubeTemplates: []
};

function setStatus(text, isError = false) {
  if (!statusElement) {
    return;
  }

  statusElement.textContent = text;
  statusElement.style.color = isError ? "#b91c1c" : "#166534";
}

function getServiceTitle(serviceId) {
  return SERVICE_CONFIGS.find((service) => service.id === serviceId)?.title || serviceId;
}

function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(result);
    });
  });
}

function storageSet(value) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(value, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

async function saveYouTubeTemplates(showMessage = true) {
  state.youtubeTemplates = normalizeYouTubeTemplates(state.youtubeTemplates);
  await storageSet({ youtubeTemplates: state.youtubeTemplates });

  if (showMessage) {
    setStatus("YouTube-шаблоны сохранены", false);
  }
}

function updateTemplate(templateId, patch) {
  const template = state.youtubeTemplates.find((item) => item.id === templateId);
  if (!template) {
    return;
  }

  Object.assign(template, patch);
  renderYouTubeTemplates();
}

function renderServiceSelect(template) {
  const select = document.createElement("select");
  select.value = template.serviceId;

  for (const service of SERVICE_CONFIGS) {
    const option = document.createElement("option");
    option.value = service.id;
    option.textContent = service.title;
    select.append(option);
  }

  select.value = template.serviceId;
  select.addEventListener("change", () => {
    updateTemplate(template.id, { serviceId: select.value });
  });

  return select;
}

function renderYouTubeTemplates() {
  if (!youtubeTemplatesListElement) {
    return;
  }

  youtubeTemplatesListElement.textContent = "";

  for (const template of state.youtubeTemplates) {
    const item = document.createElement("details");
    item.className = "youtube-template-item";
    item.open = false;

    const summary = document.createElement("summary");
    summary.textContent = `${template.title} · ${getServiceTitle(template.serviceId)}${template.enabled === false ? " · выключен" : ""}`;

    const body = document.createElement("div");
    body.className = "youtube-template-body";

    const enabledLabel = document.createElement("label");
    enabledLabel.className = "service-toggle";
    const enabledInput = document.createElement("input");
    enabledInput.type = "checkbox";
    enabledInput.checked = template.enabled !== false;
    enabledInput.addEventListener("change", () => {
      updateTemplate(template.id, { enabled: enabledInput.checked });
    });
    const enabledText = document.createElement("span");
    enabledText.textContent = "Показывать в меню";
    enabledLabel.append(enabledInput, enabledText);

    const titleLabel = document.createElement("label");
    titleLabel.className = "field-label";
    titleLabel.textContent = "Название";
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = template.title;
    titleInput.addEventListener("input", () => {
      template.title = titleInput.value;
      summary.textContent = `${template.title || "Без названия"} · ${getServiceTitle(template.serviceId)}${template.enabled === false ? " · выключен" : ""}`;
    });
    titleLabel.append(titleInput);

    const serviceLabel = document.createElement("label");
    serviceLabel.className = "field-label";
    serviceLabel.textContent = "Сервис";
    serviceLabel.append(renderServiceSelect(template));

    const templateLabel = document.createElement("label");
    templateLabel.className = "field-label";
    templateLabel.textContent = "Prompt-шаблон";
    const textarea = document.createElement("textarea");
    textarea.rows = 8;
    textarea.value = template.template;
    textarea.addEventListener("input", () => {
      template.template = textarea.value;
      preview.textContent = renderYouTubeTemplate(template, { youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });
    });
    templateLabel.append(textarea);

    const help = document.createElement("div");
    help.className = "variables-help";
    help.innerHTML = "Доступная переменная: <code>{youtubeUrl}</code>.";

    const previewTitle = document.createElement("strong");
    previewTitle.textContent = "Предпросмотр";
    const preview = document.createElement("pre");
    preview.textContent = renderYouTubeTemplate(template, { youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });

    body.append(enabledLabel, titleLabel, serviceLabel, templateLabel, help, previewTitle, preview);
    item.append(summary, body);
    youtubeTemplatesListElement.append(item);
  }
}

function downloadJsonFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function exportSettingsWithYouTubeTemplates(event) {
  event.preventDefault();
  event.stopImmediatePropagation();

  try {
    await saveYouTubeTemplates(false);
    const stored = await storageGet([
      "serviceOrder",
      "enabledServices",
      "defaultServiceId",
      "showSpecialActions",
      "enabledSpecialActions",
      "showContextActionsQwen",
      "enabledContextActionsQwen",
      "customCommands",
      "activeProfileIds",
      "youtubeTemplates"
    ]);

    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      extension: "send-to-ai-extension",
      settings: {
        ...stored,
        youtubeTemplates: normalizeYouTubeTemplates(stored.youtubeTemplates)
      }
    };

    const datePart = new Date().toISOString().slice(0, 10);
    downloadJsonFile(`send-to-ai-settings-${datePart}.json`, payload);
    setStatus("Настройки экспортированы в JSON", false);
  } catch (error) {
    setStatus(`Ошибка экспорта: ${error.message}`, true);
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(new Error("Не удалось прочитать файл")));
    reader.readAsText(file);
  });
}

async function importYouTubeTemplatesFromFile(file) {
  if (!file) {
    return;
  }

  try {
    const text = await readFileAsText(file);
    const payload = JSON.parse(text);
    const importedSettings = payload.settings && typeof payload.settings === "object" ? payload.settings : payload;

    if (!importedSettings.youtubeTemplates) {
      return;
    }

    state.youtubeTemplates = normalizeYouTubeTemplates(importedSettings.youtubeTemplates);
    await saveYouTubeTemplates(false);
    renderYouTubeTemplates();
  } catch {
    // Основной обработчик импорта покажет ошибку пользователю.
  }
}

async function resetYouTubeTemplatesAfterFullReset() {
  setTimeout(async () => {
    try {
      const stored = await storageGet(["youtubeTemplates"]);
      state.youtubeTemplates = normalizeYouTubeTemplates(stored.youtubeTemplates);
      renderYouTubeTemplates();
    } catch {
      // noop
    }
  }, 300);
}

async function initYouTubeTemplates() {
  if (!youtubeTemplatesListElement) {
    return;
  }

  try {
    const stored = await storageGet(["youtubeTemplates"]);
    state.youtubeTemplates = normalizeYouTubeTemplates(stored.youtubeTemplates);
    renderYouTubeTemplates();
  } catch (error) {
    setStatus(`Ошибка YouTube-шаблонов: ${error.message}`, true);
  }
}

if (saveButtonElement) {
  saveButtonElement.addEventListener("click", () => {
    saveYouTubeTemplates(false).catch((error) => {
      setStatus(`Ошибка сохранения YouTube-шаблонов: ${error.message}`, true);
    });
  });
}

if (exportSettingsButtonElement) {
  exportSettingsButtonElement.addEventListener("click", exportSettingsWithYouTubeTemplates, true);
}

if (importSettingsFileElement) {
  importSettingsFileElement.addEventListener("change", () => {
    importYouTubeTemplatesFromFile(importSettingsFileElement.files?.[0]);
  }, true);
}

if (resetAllSettingsButtonElement) {
  resetAllSettingsButtonElement.addEventListener("click", resetYouTubeTemplatesAfterFullReset);
}

initYouTubeTemplates();
