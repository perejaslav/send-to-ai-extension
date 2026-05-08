export const DIAGNOSTICS_STORAGE_KEY = "diagnosticsLog";
export const DIAGNOSTICS_MAX_ENTRIES = 20;

export const DIAGNOSTIC_STATUS_TITLES = {
  success: "Успешно",
  error: "Общая ошибка",
  tab_unavailable: "Вкладка недоступна",
  unsupported_link: "Неподдерживаемая ссылка",
  page_text_empty: "Текст страницы не извлечён",
  input_not_found: "Поле ввода не найдено",
  insert_failed: "Вставка не удалась",
  service_disabled: "Сервис отключён",
  service_not_found: "Сервис не найден",
  command_invalid: "Команда некорректна",
  unknown: "Неизвестный статус"
};

export function getDiagnosticStatusTitle(status) {
  return DIAGNOSTIC_STATUS_TITLES[status] || DIAGNOSTIC_STATUS_TITLES.unknown;
}

function storageLocalGet(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(result?.[key]);
    });
  });
}

function storageLocalSet(value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [DIAGNOSTICS_STORAGE_KEY]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

function storageLocalRemove(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove([key], () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

export function normalizeDiagnosticEntry(entry) {
  const source = entry && typeof entry === "object" ? entry : {};

  return {
    id: typeof source.id === "string" && source.id ? source.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: typeof source.timestamp === "string" ? source.timestamp : new Date().toISOString(),
    status: typeof source.status === "string" ? source.status : "unknown",
    serviceId: typeof source.serviceId === "string" ? source.serviceId : "",
    serviceTitle: typeof source.serviceTitle === "string" ? source.serviceTitle : "",
    actionId: typeof source.actionId === "string" ? source.actionId : "",
    actionTitle: typeof source.actionTitle === "string" ? source.actionTitle : "",
    selector: typeof source.selector === "string" ? source.selector : "",
    tagName: typeof source.tagName === "string" ? source.tagName : "",
    url: typeof source.url === "string" ? source.url : "",
    message: typeof source.message === "string" ? source.message : getDiagnosticStatusTitle(source.status),
    details: source.details && typeof source.details === "object" ? source.details : {}
  };
}

export async function readDiagnosticsLog() {
  const entries = await storageLocalGet(DIAGNOSTICS_STORAGE_KEY);
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.map(normalizeDiagnosticEntry).slice(0, DIAGNOSTICS_MAX_ENTRIES);
}

export async function appendDiagnosticsLog(entry) {
  const current = await readDiagnosticsLog();
  const normalized = normalizeDiagnosticEntry(entry);
  const next = [normalized, ...current].slice(0, DIAGNOSTICS_MAX_ENTRIES);
  await storageLocalSet(next);
  return next;
}

export async function clearDiagnosticsLog() {
  await storageLocalRemove(DIAGNOSTICS_STORAGE_KEY);
}
