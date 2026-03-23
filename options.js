const SETTINGS_STORAGE_KEYS = ["serviceOrder", "enabledServices", "defaultServiceId"];

const servicesListElement = document.getElementById("servicesList");
const defaultServiceSelectElement = document.getElementById("defaultServiceSelect");
const saveButtonElement = document.getElementById("saveButton");
const resetButtonElement = document.getElementById("resetButton");
const statusElement = document.getElementById("status");

const state = {
  services: [],
  settings: {
    serviceOrder: [],
    enabledServices: {},
    defaultServiceId: null
  }
};

function fetchServiceConfigs() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "getServiceConfigs" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response || !Array.isArray(response.services)) {
        reject(new Error("Invalid service config response"));
        return;
      }

      resolve(response);
    });
  });
}

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
      defaultServiceId: state.settings.defaultServiceId
    }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

function normalizeSettings(rawSettings) {
  const allServiceIds = state.services.map((service) => service.id);
  const source = rawSettings && typeof rawSettings === "object" ? rawSettings : {};

  const orderFromStorage = Array.isArray(source.serviceOrder) ? source.serviceOrder : [];
  const normalizedOrder = [];
  const seen = new Set();

  for (const serviceId of orderFromStorage) {
    if (!allServiceIds.includes(serviceId) || seen.has(serviceId)) {
      continue;
    }

    seen.add(serviceId);
    normalizedOrder.push(serviceId);
  }

  for (const serviceId of allServiceIds) {
    if (seen.has(serviceId)) {
      continue;
    }

    seen.add(serviceId);
    normalizedOrder.push(serviceId);
  }

  const enabledFromStorage = source.enabledServices && typeof source.enabledServices === "object"
    ? source.enabledServices
    : {};

  const normalizedEnabled = {};
  for (const serviceId of allServiceIds) {
    normalizedEnabled[serviceId] = typeof enabledFromStorage[serviceId] === "boolean"
      ? enabledFromStorage[serviceId]
      : true;
  }

  const enabledServiceIds = normalizedOrder.filter((serviceId) => normalizedEnabled[serviceId]);
  const hasValidDefault = typeof source.defaultServiceId === "string" && enabledServiceIds.includes(source.defaultServiceId);
  const fallbackDefaultId = enabledServiceIds[0] || normalizedOrder[0] || null;

  return {
    serviceOrder: normalizedOrder,
    enabledServices: normalizedEnabled,
    defaultServiceId: hasValidDefault ? source.defaultServiceId : fallbackDefaultId
  };
}

function getServiceTitle(serviceId) {
  const service = state.services.find((item) => item.id === serviceId);
  return service ? service.title : serviceId;
}

function setStatus(text, isError) {
  statusElement.textContent = text;
  statusElement.style.color = isError ? "#b91c1c" : "#166534";
}

function moveService(serviceId, direction) {
  const currentIndex = state.settings.serviceOrder.indexOf(serviceId);
  if (currentIndex < 0) {
    return;
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= state.settings.serviceOrder.length) {
    return;
  }

  const nextOrder = [...state.settings.serviceOrder];
  const swappedId = nextOrder[targetIndex];
  nextOrder[targetIndex] = nextOrder[currentIndex];
  nextOrder[currentIndex] = swappedId;
  state.settings.serviceOrder = nextOrder;
  render();
}

function renderServicesList() {
  servicesListElement.textContent = "";

  state.settings.serviceOrder.forEach((serviceId, index) => {
    const row = document.createElement("div");
    row.className = "service-row";

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

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.className = "icon";
    upButton.textContent = "↑";
    upButton.title = "Сдвинуть вверх";
    upButton.disabled = index === 0;
    upButton.addEventListener("click", () => moveService(serviceId, "up"));

    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.className = "icon";
    downButton.textContent = "↓";
    downButton.title = "Сдвинуть вниз";
    downButton.disabled = index === state.settings.serviceOrder.length - 1;
    downButton.addEventListener("click", () => moveService(serviceId, "down"));

    controls.append(upButton, downButton);

    row.append(toggleLabel, controls);
    servicesListElement.append(row);
  });
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
  renderDefaultSelect();
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
  const allIds = state.services.map((service) => service.id);
  state.settings = {
    serviceOrder: [...allIds],
    enabledServices: Object.fromEntries(allIds.map((serviceId) => [serviceId, true])),
    defaultServiceId: allIds[0] || null
  };
  render();
  setStatus('Настройки сброшены. Нажми "Сохранить" для применения.', false);
}

async function init() {
  try {
    const [configResponse, storedSettings] = await Promise.all([
      fetchServiceConfigs(),
      loadStoredSettings()
    ]);

    state.services = configResponse.services;
    state.settings = normalizeSettings(storedSettings);
    render();
  } catch (error) {
    setStatus(`Ошибка инициализации: ${error.message}`, true);
  }
}

defaultServiceSelectElement.addEventListener("change", () => {
  state.settings.defaultServiceId = defaultServiceSelectElement.value || null;
});

saveButtonElement.addEventListener("click", handleSave);
resetButtonElement.addEventListener("click", handleReset);

init();
