import {
  normalizeCustomCommands,
  renderCustomCommandTemplate,
  slugifyCommandId
} from "./custom-commands.js";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEYS, normalizeSettings } from "./settings.js";
import { CONTEXT_ACTIONS_QWEN, SERVICE_CONFIGS, SPECIAL_ACTIONS } from "./services.js";

const servicesListElement = document.getElementById("servicesList");
const specialActionsListElement = document.getElementById("specialActionsList");
const contextActionsQwenListElement = document.getElementById("contextActionsQwenList");
const defaultServiceSelectElement = document.getElementById("defaultServiceSelect");
const saveButtonElement = document.getElementById("saveButton");
const resetButtonElement = document.getElementById("resetButton");
const statusElement = document.getElementById("status");
const showSpecialActionsElement = document.getElementById("showSpecialActions");
const showContextActionsQwenElement = document.getElementById("showContextActionsQwen");

const addCustomCommandButtonElement = document.getElementById("addCustomCommandButton");
const customCommandsListElement = document.getElementById("customCommandsList");
const customCommandsEmptyElement = document.getElementById("customCommandsEmpty");
const customCommandFormElement = document.getElementById("customCommandForm");
const customCommandFormTitleElement = document.getElementById("customCommandFormTitle");
const customCommandTitleElement = document.getElementById("customCommandTitle");
const customCommandDescriptionElement = document.getElementById("customCommandDescription");
const customCommandServiceElement = document.getElementById("customCommandService");
const customCommandContextElement = document.getElementById("customCommandContext");
const customCommandEnabledElement = document.getElementById("customCommandEnabled");
const customCommandTemplateElement = document.getElementById("customCommandTemplate");
const customCommandWarningElement = document.getElementById("customCommandWarning");
const customCommandPreviewElement = document.getElementById("customCommandPreview");
const previewCustomCommandButtonElement = document.getElementById("previewCustomCommandButton");
const deleteCustomCommandButtonElement = document.getElementById("deleteCustomCommandButton");
const cancelCustomCommandButtonElement = document.getElementById("cancelCustomCommandButton");

const state = {
  services: [],
  selectedCustomCommandId: null,
  settings: {
    serviceOrder: [],
    enabledServices: {},
    defaultServiceId: null,
    showSpecialActions: true,
    enabledSpecialActions: {},
    showContextActionsQwen: true,
    enabledContextActionsQwen: {},
    customCommands: []
  }
};

let draggedServiceId = null;

function loadStoredSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(SETTINGS_STORAGE_KEYS, (storedSettings) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(storedSettings);
    });
  });
}

function saveSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({
      serviceOrder: state.settings.serviceOrder,
      enabledServices: state.settings.enabledServices,
      defaultServiceId: state.settings.defaultServiceId,
      showSpecialActions: state.settings.showSpecialActions !== false,
      enabledSpecialActions: state.settings.enabledSpecialActions,
      showContextActionsQwen: state.settings.showContextActionsQwen !== false,
      enabledContextActionsQwen: state.settings.enabledContextActionsQwen,
      customCommands: state.settings.customCommands
    }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

function getServiceTitle(serviceId) {
  const service = state.services.find((item) => item.id === serviceId);
  return service ? service.title : serviceId;
}

function setStatus(text, isError) {
  statusElement.textContent = text;
  statusElement.style.color = isError ? "#b91c1c" : "#166534";
}

function getSelectedCustomCommand() {
  return state.settings.customCommands.find((command) => command.id === state.selectedCustomCommandId) || null;
}

function buildNewCustomCommand() {
  const baseTitle = "Новая команда";
  const usedIds = new Set(state.settings.customCommands.map((command) => command.id));
  let id = slugifyCommandId(baseTitle);
  let index = 2;

  while (usedIds.has(id)) {
    id = `${slugifyCommandId(baseTitle)}-${index}`;
    index += 1;
  }

  return {
    id,
    title: baseTitle,
    description: "",
    enabled: true,
    serviceId: state.settings.defaultServiceId || state.settings.serviceOrder[0] || SERVICE_CONFIGS[0]?.id || "",
    contextType: "selection",
    template: "Обработай следующий текст:\n\n{selection}",
    menuGroup: "custom",
    order: state.settings.customCommands.length + 100
  };
}

function normalizeAndKeepSelection() {
  state.settings.customCommands = normalizeCustomCommands(
    state.settings.customCommands,
    state.settings.serviceOrder
  );

  if (state.selectedCustomCommandId && !getSelectedCustomCommand()) {
    state.selectedCustomCommandId = state.settings.customCommands[0]?.id || null;
  }
}

function reorderService(draggedId, targetId, placeAfter = false) {
  if (!draggedId || !targetId || draggedId === targetId) {
    return;
  }

  const currentOrder = [...state.settings.serviceOrder];
  const draggedIndex = currentOrder.indexOf(draggedId);
  const targetIndex = currentOrder.indexOf(targetId);

  if (draggedIndex < 0 || targetIndex < 0) {
    return;
  }

  currentOrder.splice(draggedIndex, 1);

  const adjustedTargetIndex = currentOrder.indexOf(targetId);
  const insertIndex = placeAfter ? adjustedTargetIndex + 1 : adjustedTargetIndex;
  currentOrder.splice(insertIndex, 0, draggedId);

  state.settings.serviceOrder = currentOrder;
  render();
}

function renderServicesList() {
  servicesListElement.textContent = "";

  state.settings.serviceOrder.forEach((serviceId) => {
    const row = document.createElement("div");
    row.className = "service-row";
    row.draggable = true;
    row.dataset.serviceId = serviceId;

    row.addEventListener("dragstart", (event) => {
      draggedServiceId = serviceId;
      row.classList.add("is-dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", serviceId);
      }
    });

    row.addEventListener("dragend", () => {
      draggedServiceId = null;
      row.classList.remove("is-dragging", "drop-before", "drop-after");
      servicesListElement.querySelectorAll(".service-row").forEach((item) => {
        item.classList.remove("drop-before", "drop-after");
      });
    });

    row.addEventListener("dragover", (event) => {
      if (!draggedServiceId || draggedServiceId === serviceId) {
        return;
      }

      event.preventDefault();
      const bounds = row.getBoundingClientRect();
      const placeAfter = event.clientY > bounds.top + bounds.height / 2;
      row.classList.toggle("drop-before", !placeAfter);
      row.classList.toggle("drop-after", placeAfter);
    });

    row.addEventListener("dragleave", () => {
      row.classList.remove("drop-before", "drop-after");
    });

    row.addEventListener("drop", (event) => {
      if (!draggedServiceId || draggedServiceId === serviceId) {
        return;
      }

      event.preventDefault();
      const bounds = row.getBoundingClientRect();
      const placeAfter = event.clientY > bounds.top + bounds.height / 2;
      reorderService(draggedServiceId, serviceId, placeAfter);
    });

    const toggleLabel = document.createElement("label");
    toggleLabel.className = "service-toggle";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.settings.enabledServices[serviceId] !== false;
    checkbox.addEventListener("change", () => {
      state.settings.enabledServices[serviceId] = checkbox.checked;

      if (!checkbox.checked && state.settings.defaultServiceId === serviceId) {
        const nextDefaultId = state.settings.serviceOrder.find((id) => state.settings.enabledServices[id]);
        state.settings.defaultServiceId = nextDefaultId || null;
      }

      renderDefaultSelect();
      renderCustomCommandForm();
    });

    const title = document.createElement("span");
    title.textContent = getServiceTitle(serviceId);

    toggleLabel.append(checkbox, title);

    const controls = document.createElement("div");
    controls.className = "service-controls";

    const dragHandle = document.createElement("span");
    dragHandle.className = "drag-handle";
    dragHandle.textContent = "::";
    dragHandle.title = "Перетащи, чтобы изменить порядок";
    dragHandle.setAttribute("aria-hidden", "true");

    controls.append(dragHandle);

    row.append(toggleLabel, controls);
    servicesListElement.append(row);
  });
}

function renderSpecialActionsList() {
  specialActionsListElement.textContent = "";

  for (const action of SPECIAL_ACTIONS) {
    const row = document.createElement("label");
    row.className = "special-action-row";
    if (!state.settings.showSpecialActions) {
      row.classList.add("is-disabled");
    }

    const title = document.createElement("span");
    title.className = "special-action-title";
    title.textContent = action.title;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.settings.enabledSpecialActions[action.id] !== false;
    checkbox.disabled = !state.settings.showSpecialActions;
    checkbox.addEventListener("change", () => {
      state.settings.enabledSpecialActions[action.id] = checkbox.checked;
    });

    row.append(title, checkbox);
    specialActionsListElement.append(row);
  }
}

function renderContextActionsQwenList() {
  contextActionsQwenListElement.textContent = "";

  for (const action of CONTEXT_ACTIONS_QWEN) {
    const row = document.createElement("label");
    row.className = "special-action-row";
    if (!state.settings.showContextActionsQwen) {
      row.classList.add("is-disabled");
    }

    const title = document.createElement("span");
    title.className = "special-action-title";
    title.textContent = action.title;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.settings.enabledContextActionsQwen[action.id] !== false;
    checkbox.disabled = !state.settings.showContextActionsQwen;
    checkbox.addEventListener("change", () => {
      state.settings.enabledContextActionsQwen[action.id] = checkbox.checked;
    });

    row.append(title, checkbox);
    contextActionsQwenListElement.append(row);
  }
}

function renderDefaultSelect() {
  defaultServiceSelectElement.textContent = "";

  const enabledIds = state.settings.serviceOrder.filter((serviceId) => state.settings.enabledServices[serviceId]);
  for (const serviceId of enabledIds) {
    const option = document.createElement("option");
    option.value = serviceId;
    option.textContent = getServiceTitle(serviceId);
    defaultServiceSelectElement.append(option);
  }

  const fallbackId = enabledIds[0] || "";
  if (!enabledIds.includes(state.settings.defaultServiceId)) {
    state.settings.defaultServiceId = fallbackId || null;
  }

  defaultServiceSelectElement.value = state.settings.defaultServiceId || "";
  defaultServiceSelectElement.disabled = enabledIds.length === 0;
}

function renderCustomCommandsList() {
  customCommandsListElement.textContent = "";
  customCommandsEmptyElement.hidden = state.settings.customCommands.length > 0;

  for (const command of state.settings.customCommands) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "custom-command-item";
    button.classList.toggle("is-active", command.id === state.selectedCustomCommandId);
    button.classList.toggle("is-disabled", command.enabled === false);
    button.addEventListener("click", () => {
      state.selectedCustomCommandId = command.id;
      renderCustomCommandsList();
      renderCustomCommandForm();
    });

    const title = document.createElement("span");
    title.className = "custom-command-title";
    title.textContent = command.title;

    const meta = document.createElement("span");
    meta.className = "custom-command-meta";
    meta.textContent = `${getServiceTitle(command.serviceId)} · ${getContextTitle(command.contextType)}${command.enabled === false ? " · выключена" : ""}`;

    button.append(title, meta);
    customCommandsListElement.append(button);
  }
}

function getContextTitle(contextType) {
  const titles = {
    selection: "выделенный текст",
    page: "страница",
    link: "ссылка",
    youtube: "YouTube",
    page_text: "текст страницы"
  };

  return titles[contextType] || contextType;
}

function renderCustomCommandServiceOptions() {
  customCommandServiceElement.textContent = "";

  for (const serviceId of state.settings.serviceOrder) {
    const option = document.createElement("option");
    option.value = serviceId;
    option.textContent = getServiceTitle(serviceId);
    customCommandServiceElement.append(option);
  }
}

function buildPreviewContext(command) {
  return {
    selection: "Пример выделенного текста для проверки команды.",
    url: command.contextType === "link" ? "https://example.com/article" : "https://example.com/page",
    title: "Пример заголовка страницы",
    date: "2026-05-08",
    service: getServiceTitle(command.serviceId),
    pageText: "Пример извлечённого текста страницы. Полная реализация извлечения появится в следующем milestone.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  };
}

function updateCustomCommandPreview() {
  const command = getSelectedCustomCommand();
  if (!command) {
    customCommandPreviewElement.textContent = "";
    return;
  }

  customCommandPreviewElement.textContent = renderCustomCommandTemplate(command.template, buildPreviewContext(command));
}

function renderCustomCommandWarning(command) {
  const warnings = [];

  if (!command.title.trim()) {
    warnings.push("Название команды не заполнено.");
  }

  if (!command.template.trim()) {
    warnings.push("Prompt-шаблон не заполнен.");
  }

  if (!command.serviceId) {
    warnings.push("Сервис не выбран.");
  } else if (state.settings.enabledServices[command.serviceId] === false) {
    warnings.push("Выбранный сервис сейчас отключён. Команда не появится в меню, пока сервис выключен.");
  }

  customCommandWarningElement.hidden = warnings.length === 0;
  customCommandWarningElement.textContent = warnings.join(" ");
}

function renderCustomCommandForm() {
  renderCustomCommandServiceOptions();

  const command = getSelectedCustomCommand();
  customCommandFormElement.hidden = !command;

  if (!command) {
    return;
  }

  customCommandFormTitleElement.textContent = command.title || "Новая команда";
  customCommandTitleElement.value = command.title;
  customCommandDescriptionElement.value = command.description || "";
  customCommandServiceElement.value = command.serviceId;
  customCommandContextElement.value = command.contextType;
  customCommandEnabledElement.checked = command.enabled !== false;
  customCommandTemplateElement.value = command.template;
  deleteCustomCommandButtonElement.disabled = false;

  renderCustomCommandWarning(command);
  updateCustomCommandPreview();
}

function updateSelectedCustomCommand(patch) {
  const command = getSelectedCustomCommand();
  if (!command) {
    return;
  }

  Object.assign(command, patch);
  state.settings.customCommands = normalizeCustomCommands(
    state.settings.customCommands,
    state.settings.serviceOrder
  );

  if (patch.title && command.id.startsWith("новая-команда")) {
    const updated = state.settings.customCommands.find((item) => item.title === patch.title);
    if (updated) {
      state.selectedCustomCommandId = updated.id;
    }
  }

  renderCustomCommandsList();
  renderCustomCommandForm();
}

function addCustomCommand() {
  const command = buildNewCustomCommand();
  state.settings.customCommands.push(command);
  normalizeAndKeepSelection();
  state.selectedCustomCommandId = command.id;
  renderCustomCommandsList();
  renderCustomCommandForm();
  setStatus('Команда добавлена. Нажми "Сохранить" для применения.', false);
}

function deleteSelectedCustomCommand() {
  const command = getSelectedCustomCommand();
  if (!command) {
    return;
  }

  const confirmed = window.confirm(`Удалить команду «${command.title}»?`);
  if (!confirmed) {
    return;
  }

  state.settings.customCommands = state.settings.customCommands.filter((item) => item.id !== command.id);
  state.selectedCustomCommandId = state.settings.customCommands[0]?.id || null;
  renderCustomCommandsList();
  renderCustomCommandForm();
  setStatus('Команда удалена. Нажми "Сохранить" для применения.', false);
}

function closeCustomCommandForm() {
  state.selectedCustomCommandId = null;
  renderCustomCommandsList();
  renderCustomCommandForm();
}

function render() {
  renderServicesList();
  renderSpecialActionsList();
  renderContextActionsQwenList();
  renderDefaultSelect();
  renderCustomCommandsList();
  renderCustomCommandForm();
  showSpecialActionsElement.checked = state.settings.showSpecialActions !== false;
  showContextActionsQwenElement.checked = state.settings.showContextActionsQwen !== false;
}

async function handleSave() {
  saveButtonElement.disabled = true;
  setStatus("Сохранение...", false);

  try {
    normalizeAndKeepSelection();
    await saveSettings();
    render();
    setStatus("Настройки сохранены", false);
  } catch (error) {
    setStatus(`Ошибка: ${error.message}`, true);
  } finally {
    saveButtonElement.disabled = false;
  }
}

function handleReset() {
  state.settings = structuredClone(DEFAULT_SETTINGS);
  state.selectedCustomCommandId = null;
  render();
  setStatus('Настройки сброшены. Нажми "Сохранить" для применения.', false);
}

async function init() {
  try {
    const storedSettings = await loadStoredSettings();
    state.services = SERVICE_CONFIGS.map(({ id, title }) => ({ id, title }));
    state.settings = normalizeSettings(storedSettings);
    state.selectedCustomCommandId = state.settings.customCommands[0]?.id || null;
    render();
  } catch (error) {
    setStatus(`Ошибка инициализации: ${error.message}`, true);
  }
}

defaultServiceSelectElement.addEventListener("change", () => {
  state.settings.defaultServiceId = defaultServiceSelectElement.value || null;
});

showSpecialActionsElement.addEventListener("change", () => {
  state.settings.showSpecialActions = showSpecialActionsElement.checked;
  renderSpecialActionsList();
});

showContextActionsQwenElement.addEventListener("change", () => {
  state.settings.showContextActionsQwen = showContextActionsQwenElement.checked;
  renderContextActionsQwenList();
});

addCustomCommandButtonElement.addEventListener("click", addCustomCommand);
deleteCustomCommandButtonElement.addEventListener("click", deleteSelectedCustomCommand);
cancelCustomCommandButtonElement.addEventListener("click", closeCustomCommandForm);
previewCustomCommandButtonElement.addEventListener("click", updateCustomCommandPreview);

customCommandTitleElement.addEventListener("input", () => {
  updateSelectedCustomCommand({ title: customCommandTitleElement.value });
});

customCommandDescriptionElement.addEventListener("input", () => {
  updateSelectedCustomCommand({ description: customCommandDescriptionElement.value });
});

customCommandServiceElement.addEventListener("change", () => {
  updateSelectedCustomCommand({ serviceId: customCommandServiceElement.value });
});

customCommandContextElement.addEventListener("change", () => {
  updateSelectedCustomCommand({ contextType: customCommandContextElement.value });
});

customCommandEnabledElement.addEventListener("change", () => {
  updateSelectedCustomCommand({ enabled: customCommandEnabledElement.checked });
});

customCommandTemplateElement.addEventListener("input", () => {
  updateSelectedCustomCommand({ template: customCommandTemplateElement.value });
});

saveButtonElement.addEventListener("click", handleSave);
resetButtonElement.addEventListener("click", handleReset);

init();
