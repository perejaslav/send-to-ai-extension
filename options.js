import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEYS, normalizeSettings } from "./settings.js";
import { SERVICE_CONFIGS, SPECIAL_ACTIONS } from "./services.js";

const servicesListElement = document.getElementById("servicesList");
const specialActionsListElement = document.getElementById("specialActionsList");
const defaultServiceSelectElement = document.getElementById("defaultServiceSelect");
const saveButtonElement = document.getElementById("saveButton");
const resetButtonElement = document.getElementById("resetButton");
const statusElement = document.getElementById("status");
const showSpecialActionsElement = document.getElementById("showSpecialActions");

const state = {
  services: [],
  settings: {
    serviceOrder: [],
    enabledServices: {},
    defaultServiceId: null,
    showSpecialActions: true,
    enabledSpecialActions: {}
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
      enabledSpecialActions: state.settings.enabledSpecialActions
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

function render() {
  renderServicesList();
  renderSpecialActionsList();
  renderDefaultSelect();
  showSpecialActionsElement.checked = state.settings.showSpecialActions !== false;
}

async function handleSave() {
  saveButtonElement.disabled = true;
  setStatus("Сохранение...", false);

  try {
    await saveSettings();
    setStatus("Настройки сохранены", false);
  } catch (error) {
    setStatus(`Ошибка: ${error.message}`, true);
  } finally {
    saveButtonElement.disabled = false;
  }
}

function handleReset() {
  state.settings = structuredClone(DEFAULT_SETTINGS);
  render();
  setStatus('Настройки сброшены. Нажми "Сохранить" для применения.', false);
}

async function init() {
  try {
    const storedSettings = await loadStoredSettings();
    state.services = SERVICE_CONFIGS.map(({ id, title }) => ({ id, title }));
    state.settings = normalizeSettings(storedSettings);
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

saveButtonElement.addEventListener("click", handleSave);
resetButtonElement.addEventListener("click", handleReset);

init();
