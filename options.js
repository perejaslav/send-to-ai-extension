import {
  normalizeCustomCommands,
  renderCustomCommandTemplate,
  slugifyCommandId
} from "./custom-commands.js";
import {
  clearDiagnosticsLog,
  getDiagnosticStatusTitle,
  readDiagnosticsLog
} from "./diagnostics.js";
import {
  ALL_PROFILES_ID,
  BUILT_IN_PROFILES,
  getProfileTitle,
  normalizeActiveProfileIds,
  normalizeCommandProfileIds
} from "./profiles.js";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEYS, normalizeSettings } from "./settings.js";
import { CONTEXT_ACTIONS_QWEN, CONTEXT_ACTIONS_GROK, SERVICE_CONFIGS, SPECIAL_ACTIONS } from "./services.js";

const EXPORT_SCHEMA_VERSION = 1;
const PINNED_SERVICE_IDS = ["sendToChatGPT", "sendToQwen", "sendToGrok"];

const pinnedServicesListElement = document.getElementById("pinnedServicesList");
const servicesListElement = document.getElementById("servicesList");
const specialActionsListElement = document.getElementById("specialActionsList");
const contextActionsQwenListElement = document.getElementById("contextActionsQwenList");
const contextActionsGrokListElement = document.getElementById("contextActionsGrokList");
const saveButtonElement = document.getElementById("saveButton");
const resetButtonElement = document.getElementById("resetButton");
const statusElement = document.getElementById("status");
const showSpecialActionsElement = document.getElementById("showSpecialActions");
const showContextActionsQwenElement = document.getElementById("showContextActionsQwen");
const showContextActionsGrokElement = document.getElementById("showContextActionsGrok");
const activeProfilesListElement = document.getElementById("activeProfilesList");

const addCustomCommandButtonElement = document.getElementById("addCustomCommandButton");
const customCommandsListElement = document.getElementById("customCommandsList");
const customCommandsEmptyElement = document.getElementById("customCommandsEmpty");
const customCommandFormElement = document.getElementById("customCommandForm");
const customCommandFormTitleElement = document.getElementById("customCommandFormTitle");
const customCommandTitleElement = document.getElementById("customCommandTitle");
const customCommandDescriptionElement = document.getElementById("customCommandDescription");
const customCommandServiceElement = document.getElementById("customCommandService");
const customCommandContextElement = document.getElementById("customCommandContext");
const customCommandProfilesListElement = document.getElementById("customCommandProfilesList");
const customCommandEnabledElement = document.getElementById("customCommandEnabled");
const customCommandTemplateElement = document.getElementById("customCommandTemplate");
const customCommandWarningElement = document.getElementById("customCommandWarning");
const customCommandPreviewElement = document.getElementById("customCommandPreview");
const previewCustomCommandButtonElement = document.getElementById("previewCustomCommandButton");
const deleteCustomCommandButtonElement = document.getElementById("deleteCustomCommandButton");
const cancelCustomCommandButtonElement = document.getElementById("cancelCustomCommandButton");

const diagnosticsEmptyElement = document.getElementById("diagnosticsEmpty");
const diagnosticsListElement = document.getElementById("diagnosticsList");
const refreshDiagnosticsButtonElement = document.getElementById("refreshDiagnosticsButton");
const clearDiagnosticsButtonElement = document.getElementById("clearDiagnosticsButton");

const exportSettingsButtonElement = document.getElementById("exportSettingsButton");
const importSettingsButtonElement = document.getElementById("importSettingsButton");
const resetAllSettingsButtonElement = document.getElementById("resetAllSettingsButton");
const importSettingsFileElement = document.getElementById("importSettingsFile");

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
    showContextActionsGrok: true,
    enabledContextActionsGrok: {},
    customCommands: [],
    activeProfileIds: [ALL_PROFILES_ID]
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
      showContextActionsGrok: state.settings.showContextActionsGrok !== false,
      enabledContextActionsGrok: state.settings.enabledContextActionsGrok,
      customCommands: state.settings.customCommands,
      activeProfileIds: state.settings.activeProfileIds
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

function getServiceById(serviceId) {
  return state.services.find((item) => item.id === serviceId) || null;
}

function getEnabledServiceIds() {
  return state.settings.serviceOrder.filter((serviceId) => state.settings.enabledServices[serviceId] !== false);
}

function ensureDefaultServiceCompatibility() {
  const enabledIds = getEnabledServiceIds();
  if (!enabledIds.includes(state.settings.defaultServiceId)) {
    state.settings.defaultServiceId = enabledIds[0] || null;
  }
}

function getOtherServiceIds() {
  return state.settings.serviceOrder.filter((serviceId) => !PINNED_SERVICE_IDS.includes(serviceId));
}

function setStatus(text, isError) {
  statusElement.textContent = text;
  statusElement.style.color = isError ? "#b91c1c" : "#166534";
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || "";
  }

  return date.toLocaleString("ru-RU");
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
    serviceId: state.settings.defaultServiceId || getEnabledServiceIds()[0] || SERVICE_CONFIGS[0]?.id || "",
    contextType: "selection",
    template: "Обработай следующий текст:\n\n{selection}",
    menuGroup: "custom",
    profileIds: [],
    order: state.settings.customCommands.length + 100
  };
}

function validateCustomCommands() {
  const errors = [];

  state.settings.customCommands.forEach((command, index) => {
    const label = command.title?.trim() || `Команда ${index + 1}`;

    if (!command.title?.trim()) {
      errors.push(`«${label}»: не заполнено название.`);
    }

    if (!command.template?.trim()) {
      errors.push(`«${label}»: не заполнен prompt-шаблон.`);
    }

    if (!command.serviceId) {
      errors.push(`«${label}»: не выбран сервис.`);
    }
  });

  return errors;
}

function normalizeAndKeepSelection() {
  ensureDefaultServiceCompatibility();
  state.settings.customCommands = normalizeCustomCommands(
    state.settings.customCommands,
    state.settings.serviceOrder
  );
  state.settings.activeProfileIds = normalizeActiveProfileIds(state.settings.activeProfileIds);

  if (state.selectedCustomCommandId && !getSelectedCustomCommand()) {
    state.selectedCustomCommandId = state.settings.customCommands[0]?.id || null;
  }
}

function reorderService(draggedId, targetId, placeAfter = false) {
  if (!draggedId || !targetId || draggedId === targetId) {
    return;
  }

  if (PINNED_SERVICE_IDS.includes(draggedId) || PINNED_SERVICE_IDS.includes(targetId)) {
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

function createServiceRow(serviceId, { pinned = false } = {}) {
  const row = document.createElement("div");
  row.className = "service-row";
  row.classList.toggle("is-pinned", pinned);
  row.draggable = !pinned;
  row.dataset.serviceId = serviceId;

  if (!pinned) {
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
  }

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "service-toggle";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = state.settings.enabledServices[serviceId] !== false;
  checkbox.addEventListener("change", () => {
    state.settings.enabledServices[serviceId] = checkbox.checked;
    ensureDefaultServiceCompatibility();
    renderCustomCommandForm();
  });

  const title = document.createElement("span");
  title.textContent = getServiceTitle(serviceId);

  toggleLabel.append(checkbox, title);

  const controls = document.createElement("div");
  controls.className = "service-controls";

  if (pinned) {
    const badge = document.createElement("span");
    badge.className = "service-badge";
    badge.textContent = serviceId === "sendToChatGPT" ? "1 место" : "2 место";
    controls.append(badge);
  } else {
    const dragHandle = document.createElement("span");
    dragHandle.className = "drag-handle";
    dragHandle.textContent = "::";
    dragHandle.title = "Перетащи, чтобы изменить порядок";
    dragHandle.setAttribute("aria-hidden", "true");
    controls.append(dragHandle);
  }

  row.append(toggleLabel, controls);
  return row;
}

function renderServicesList() {
  pinnedServicesListElement.textContent = "";
  servicesListElement.textContent = "";

  for (const serviceId of PINNED_SERVICE_IDS) {
    if (getServiceById(serviceId)) {
      pinnedServicesListElement.append(createServiceRow(serviceId, { pinned: true }));
    }
  }

  for (const serviceId of getOtherServiceIds()) {
    if (getServiceById(serviceId)) {
      servicesListElement.append(createServiceRow(serviceId));
    }
  }
}
function renderActiveProfilesList() {
  activeProfilesListElement.textContent = "";
  const profiles = [{ id: ALL_PROFILES_ID, title: "Все профили", description: "Показывать все пользовательские команды." }, ...BUILT_IN_PROFILES];

  for (const profile of profiles) {
    const label = document.createElement("label");
    label.className = "profile-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.settings.activeProfileIds.includes(profile.id);
    checkbox.addEventListener("change", () => {
      if (profile.id === ALL_PROFILES_ID && checkbox.checked) {
        state.settings.activeProfileIds = [ALL_PROFILES_ID];
      } else {
        const next = new Set(state.settings.activeProfileIds.filter((id) => id !== ALL_PROFILES_ID));
        if (checkbox.checked) {
          next.add(profile.id);
        } else {
          next.delete(profile.id);
        }
        state.settings.activeProfileIds = normalizeActiveProfileIds([...next]);
      }

      renderActiveProfilesList();
    });

    const text = document.createElement("span");
    text.innerHTML = `<strong>${profile.title}</strong><small>${profile.description || ""}</small>`;

    label.append(checkbox, text);
    activeProfilesListElement.append(label);
  }
}

function getCompactSpecialActionTitle(action) {
  const titles = {
    sendAndTranslateToQwen: "Перевести на русский",
    sendAndTranslateToChatGPT: "Перевести на русский",
    sendAndTranslateToGrok: "Перевести на русский",
    summarizeInChatGPT: "Сделать саммари",
    summarizeInGrok: "Сделать саммари",
    factCheckInChatGPT: "Провести фактчекинг",
    factCheckInGrok: "Провести фактчекинг"
  };

  return titles[action.id] || action.title;
}

function renderActionGroup(serviceId, actions) {
  const group = document.createElement("div");
  group.className = "action-group";

  const heading = document.createElement("h3");
  heading.className = "settings-subheading";
  heading.textContent = getServiceTitle(serviceId);
  group.append(heading);

  for (const action of actions) {
    const row = document.createElement("label");
    row.className = "special-action-row";
    if (!state.settings.showSpecialActions) {
      row.classList.add("is-disabled");
    }

    const title = document.createElement("span");
    title.className = "special-action-title";
    title.textContent = getCompactSpecialActionTitle(action);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.settings.enabledSpecialActions[action.id] !== false;
    checkbox.disabled = !state.settings.showSpecialActions;
    checkbox.addEventListener("change", () => {
      state.settings.enabledSpecialActions[action.id] = checkbox.checked;
    });

    row.append(title, checkbox);
    group.append(row);
  }

  return group;
}

function renderSpecialActionsList() {
  specialActionsListElement.textContent = "";

  for (const serviceId of PINNED_SERVICE_IDS) {
    const actions = SPECIAL_ACTIONS.filter((action) => action.serviceId === serviceId);
    if (actions.length > 0) {
      specialActionsListElement.append(renderActionGroup(serviceId, actions));
    }
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

function renderContextActionsGrokList() {
  contextActionsGrokListElement.textContent = "";

  for (const action of CONTEXT_ACTIONS_GROK) {
    const row = document.createElement("label");
    row.className = "special-action-row";
    if (!state.settings.showContextActionsGrok) {
      row.classList.add("is-disabled");
    }

    const title = document.createElement("span");
    title.className = "special-action-title";
    title.textContent = action.title;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.settings.enabledContextActionsGrok[action.id] !== false;
    checkbox.disabled = !state.settings.showContextActionsGrok;
    checkbox.addEventListener("change", () => {
      state.settings.enabledContextActionsGrok[action.id] = checkbox.checked;
    });

    row.append(title, checkbox);
    contextActionsGrokListElement.append(row);
  }
}

function getCommandProfileText(command) {
  const profileIds = normalizeCommandProfileIds(command.profileIds);
  if (profileIds.length === 0) {
    return "все профили";
  }

  return profileIds.map(getProfileTitle).join(", ");
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
    title.textContent = command.title || "Без названия";

    const meta = document.createElement("span");
    meta.className = "custom-command-meta";
    meta.textContent = `${getServiceTitle(command.serviceId)} · ${getContextTitle(command.contextType)} · ${getCommandProfileText(command)}${command.enabled === false ? " · выключена" : ""}`;

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

function renderCustomCommandProfiles(command) {
  customCommandProfilesListElement.textContent = "";
  const selected = new Set(normalizeCommandProfileIds(command.profileIds));

  for (const profile of BUILT_IN_PROFILES) {
    const label = document.createElement("label");
    label.className = "profile-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selected.has(profile.id);
    checkbox.addEventListener("change", () => {
      const next = new Set(normalizeCommandProfileIds(command.profileIds));
      if (checkbox.checked) {
        next.add(profile.id);
      } else {
        next.delete(profile.id);
      }
      updateSelectedCustomCommand({ profileIds: [...next] });
    });

    const text = document.createElement("span");
    text.innerHTML = `<strong>${profile.title}</strong><small>${profile.description}</small>`;

    label.append(checkbox, text);
    customCommandProfilesListElement.append(label);
  }
}

function buildPreviewContext(command) {
  return {
    selection: "Пример выделенного текста для проверки команды.",
    url: command.contextType === "link" ? "https://example.com/article" : "https://example.com/page",
    title: "Пример заголовка страницы",
    date: "2026-05-08",
    service: getServiceTitle(command.serviceId),
    pageText: "Пример извлечённого текста страницы.",
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

  renderCustomCommandProfiles(command);
  renderCustomCommandWarning(command);
  updateCustomCommandPreview();
}

function updateSelectedCustomCommand(patch) {
  const command = getSelectedCustomCommand();
  if (!command) {
    return;
  }

  Object.assign(command, patch);
  renderCustomCommandsList();
  renderCustomCommandForm();
}

function addCustomCommand() {
  const command = buildNewCustomCommand();
  state.settings.customCommands.push(command);
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

  const confirmed = window.confirm(`Удалить команду «${command.title || "Без названия"}»?`);
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

function createExportPayload() {
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    extension: "send-to-ai-extension",
    settings: {
      serviceOrder: state.settings.serviceOrder,
      enabledServices: state.settings.enabledServices,
      defaultServiceId: state.settings.defaultServiceId,
      showSpecialActions: state.settings.showSpecialActions !== false,
      enabledSpecialActions: state.settings.enabledSpecialActions,
      showContextActionsQwen: state.settings.showContextActionsQwen !== false,
      enabledContextActionsQwen: state.settings.enabledContextActionsQwen,
      customCommands: state.settings.customCommands,
      activeProfileIds: state.settings.activeProfileIds
    }
  };
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

function exportSettings() {
  const payload = createExportPayload();
  const datePart = new Date().toISOString().slice(0, 10);
  downloadJsonFile(`send-to-ai-settings-${datePart}.json`, payload);
  setStatus("Настройки экспортированы в JSON", false);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(new Error("Не удалось прочитать файл")));
    reader.readAsText(file);
  });
}

function extractSettingsFromImportPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Файл не похож на JSON с настройками");
  }

  if (payload.settings && typeof payload.settings === "object") {
    return payload.settings;
  }

  return payload;
}

async function importSettingsFromFile(file) {
  if (!file) {
    return;
  }

  try {
    const text = await readFileAsText(file);
    const payload = JSON.parse(text);
    const importedSettings = extractSettingsFromImportPayload(payload);
    const normalizedSettings = normalizeSettings(importedSettings);
    const confirmed = window.confirm("Импорт заменит текущие настройки расширения. Продолжить?");

    if (!confirmed) {
      setStatus("Импорт отменён", false);
      return;
    }

    state.settings = normalizedSettings;
    ensureDefaultServiceCompatibility();
    state.selectedCustomCommandId = state.settings.customCommands[0]?.id || null;
    await saveSettings();
    render();
    setStatus("Настройки импортированы и сохранены", false);
  } catch (error) {
    setStatus(`Ошибка импорта: ${error.message}`, true);
  } finally {
    importSettingsFileElement.value = "";
  }
}

async function resetAllSettings() {
  const confirmed = window.confirm("Сбросить все настройки расширения к значениям по умолчанию?");
  if (!confirmed) {
    return;
  }

  state.settings = structuredClone(DEFAULT_SETTINGS);
  ensureDefaultServiceCompatibility();
  state.selectedCustomCommandId = null;
  await saveSettings();
  render();
  setStatus("Все настройки сброшены и сохранены", false);
}

async function renderDiagnosticsLog() {
  const entries = await readDiagnosticsLog();
  diagnosticsListElement.textContent = "";
  diagnosticsEmptyElement.hidden = entries.length > 0;

  for (const entry of entries) {
    const item = document.createElement("details");
    item.className = "diagnostic-item";

    const summary = document.createElement("summary");
    const title = entry.serviceTitle || entry.serviceId || "Неизвестный сервис";
    summary.textContent = `${formatDateTime(entry.timestamp)} · ${getDiagnosticStatusTitle(entry.status)} · ${title}`;

    const body = document.createElement("div");
    body.className = "diagnostic-body";

    const rows = [
      ["Сообщение", entry.message],
      ["Команда", entry.actionTitle || entry.actionId],
      ["URL", entry.url],
      ["Селектор", entry.selector],
      ["Элемент", entry.tagName],
      ["Метод", entry.details?.method],
      ["Время, мс", entry.details?.elapsedMs],
      ["Ожидалось символов", entry.details?.expectedLength],
      ["Вставлено символов", entry.details?.actualLength],
      ["Проверенные селекторы", Array.isArray(entry.details?.attemptedSelectors) ? entry.details.attemptedSelectors.join(", ") : ""]
    ].filter(([, value]) => value !== undefined && value !== null && String(value).length > 0);

    for (const [label, value] of rows) {
      const row = document.createElement("div");
      row.className = "diagnostic-row";
      const key = document.createElement("strong");
      key.textContent = `${label}:`;
      const text = document.createElement("span");
      text.textContent = String(value);
      row.append(key, text);
      body.append(row);
    }

    item.append(summary, body);
    diagnosticsListElement.append(item);
  }
}

async function clearDiagnostics() {
  const confirmed = window.confirm("Очистить журнал диагностики?");
  if (!confirmed) {
    return;
  }

  await clearDiagnosticsLog();
  await renderDiagnosticsLog();
  setStatus("Журнал диагностики очищен", false);
}

function render() {
  ensureDefaultServiceCompatibility();
  renderServicesList();
  renderActiveProfilesList();
  renderSpecialActionsList();
  renderContextActionsQwenList();
  renderContextActionsGrokList();
  renderCustomCommandsList();
  renderCustomCommandForm();
  showSpecialActionsElement.checked = state.settings.showSpecialActions !== false;
  showContextActionsQwenElement.checked = state.settings.showContextActionsQwen !== false;
  showContextActionsGrokElement.checked = state.settings.showContextActionsGrok !== false;
  renderDiagnosticsLog().catch((error) => setStatus(`Ошибка диагностики: ${error.message}`, true));
}

async function handleSave() {
  saveButtonElement.disabled = true;
  setStatus("Сохранение...", false);

  try {
    const errors = validateCustomCommands();
    if (errors.length > 0) {
      setStatus(errors[0], true);
      return;
    }

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
  ensureDefaultServiceCompatibility();
  state.selectedCustomCommandId = null;
  render();
  setStatus('Настройки сброшены. Нажми "Сохранить" для применения.', false);
}

async function init() {
  try {
    const storedSettings = await loadStoredSettings();
    state.services = SERVICE_CONFIGS.map(({ id, title }) => ({ id, title }));
    state.settings = normalizeSettings(storedSettings);
    ensureDefaultServiceCompatibility();
    state.selectedCustomCommandId = state.settings.customCommands[0]?.id || null;
    render();
  } catch (error) {
    setStatus(`Ошибка инициализации: ${error.message}`, true);
  }
}

showSpecialActionsElement.addEventListener("change", () => {
  state.settings.showSpecialActions = showSpecialActionsElement.checked;
  renderSpecialActionsList();
});

showContextActionsQwenElement.addEventListener("change", () => {
  state.settings.showContextActionsQwen = showContextActionsQwenElement.checked;
  renderContextActionsQwenList();
});

showContextActionsGrokElement.addEventListener("change", () => {
  state.settings.showContextActionsGrok = showContextActionsGrokElement.checked;
  renderContextActionsGrokList();
});

addCustomCommandButtonElement.addEventListener("click", addCustomCommand);
deleteCustomCommandButtonElement.addEventListener("click", deleteSelectedCustomCommand);
cancelCustomCommandButtonElement.addEventListener("click", closeCustomCommandForm);
previewCustomCommandButtonElement.addEventListener("click", updateCustomCommandPreview);
refreshDiagnosticsButtonElement.addEventListener("click", () => {
  renderDiagnosticsLog().catch((error) => setStatus(`Ошибка диагностики: ${error.message}`, true));
});
clearDiagnosticsButtonElement.addEventListener("click", () => {
  clearDiagnostics().catch((error) => setStatus(`Ошибка очистки журнала: ${error.message}`, true));
});

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

exportSettingsButtonElement.addEventListener("click", exportSettings);
importSettingsButtonElement.addEventListener("click", () => importSettingsFileElement.click());
importSettingsFileElement.addEventListener("change", () => importSettingsFromFile(importSettingsFileElement.files?.[0]));
resetAllSettingsButtonElement.addEventListener("click", () => {
  resetAllSettings().catch((error) => setStatus(`Ошибка сброса: ${error.message}`, true));
});

saveButtonElement.addEventListener("click", handleSave);
resetButtonElement.addEventListener("click", handleReset);

init();
