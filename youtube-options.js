import { SERVICE_CONFIGS } from "./services.js";
import { normalizeYouTubeTemplates, renderYouTubeTemplate } from "./youtube-templates.js";

const youtubeTemplatesListElement = document.getElementById("youtubeTemplatesList");
const saveButtonElement = document.getElementById("saveButton");
const statusElement = document.getElementById("status");

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

initYouTubeTemplates();
