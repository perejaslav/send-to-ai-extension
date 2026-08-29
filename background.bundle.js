// GENERATED FILE — do not edit by hand.
// Built from background.js by scripts/build-background.js via "npm run build:background".
// Kept as a single classic script because Yandex Browser does not support
// ES-module service workers ("type": "module") and fails registration with
// "Service worker registration failed. Status code: 2".
// === profiles.js ===
const BUILT_IN_PROFILES = [
  {
    id: "basic",
    title: "Базовый",
    description: "Общие команды: отправка, саммари, перевод и фактчекинг."
  },
  {
    id: "marketing",
    title: "Маркетинг",
    description: "Офферы, аудитории, рекламные тексты, посты и лендинги."
  },
  {
    id: "editing",
    title: "Редактура",
    description: "Исправление, сокращение, расширение и литературная обработка текста."
  },
  {
    id: "translation",
    title: "Перевод",
    description: "Перевод, адаптация и сохранение терминологии."
  },
  {
    id: "research",
    title: "Исследование",
    description: "Тезисы, факты, имена, даты и критика аргументов."
  },
  {
    id: "youtube",
    title: "YouTube",
    description: "Команды для обработки YouTube-ссылок и материалов по видео."
  },
  {
    id: "hermes",
    title: "Hermes Agent",
    description: "ТЗ, задачи, prompt'ы и сценарии для Hermes Agent."
  }
];

const BUILT_IN_PROFILE_IDS = BUILT_IN_PROFILES.map((profile) => profile.id);
const ALL_PROFILES_ID = "all";

function normalizeActiveProfileIds(rawProfileIds) {
  if (!Array.isArray(rawProfileIds)) {
    return [ALL_PROFILES_ID];
  }

  const allowedIds = new Set([ALL_PROFILES_ID, ...BUILT_IN_PROFILE_IDS]);
  const result = [];

  for (const profileId of rawProfileIds) {
    if (typeof profileId !== "string" || !allowedIds.has(profileId) || result.includes(profileId)) {
      continue;
    }

    result.push(profileId);
  }

  return result.length > 0 ? result : [ALL_PROFILES_ID];
}

function normalizeCommandProfileIds(rawProfileIds) {
  if (!Array.isArray(rawProfileIds)) {
    return [];
  }

  const allowedIds = new Set(BUILT_IN_PROFILE_IDS);
  const result = [];

  for (const profileId of rawProfileIds) {
    if (typeof profileId !== "string" || !allowedIds.has(profileId) || result.includes(profileId)) {
      continue;
    }

    result.push(profileId);
  }

  return result;
}

function isProfileFilterActive(activeProfileIds) {
  return Array.isArray(activeProfileIds)
    && activeProfileIds.length > 0
    && !activeProfileIds.includes(ALL_PROFILES_ID);
}

function isCommandVisibleForProfiles(command, activeProfileIds) {
  if (!isProfileFilterActive(activeProfileIds)) {
    return true;
  }

  const commandProfileIds = normalizeCommandProfileIds(command?.profileIds);
  if (commandProfileIds.length === 0) {
    return true;
  }

  return commandProfileIds.some((profileId) => activeProfileIds.includes(profileId));
}

function getProfileTitle(profileId) {
  if (profileId === ALL_PROFILES_ID) {
    return "Все профили";
  }

  return BUILT_IN_PROFILES.find((profile) => profile.id === profileId)?.title || profileId;
}

// === custom-commands.js ===
const CUSTOM_COMMANDS_MENU_ID = "customCommands";
const CUSTOM_COMMANDS_MENU_TITLE = "Мои команды";

const CUSTOM_COMMAND_CONTEXTS = new Set(["selection", "page", "link", "youtube", "page_text"]);

const DEFAULT_COMMAND = Object.freeze({
  id: "",
  title: "",
  description: "",
  enabled: true,
  serviceId: "",
  contextType: "selection",
  template: "",
  menuGroup: "custom",
  profileIds: [],
  order: 100
});

function toSafeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function slugifyCommandId(value, fallback = "custom-command") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || fallback;
}

function uniqueCommandId(baseId, usedIds) {
  const safeBaseId = slugifyCommandId(baseId);
  let candidate = safeBaseId;
  let index = 2;

  while (usedIds.has(candidate)) {
    candidate = `${safeBaseId}-${index}`;
    index += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function normalizeCustomCommands(rawCommands, availableServiceIds = []) {
  if (!Array.isArray(rawCommands)) {
    return [];
  }

  const serviceIdSet = new Set(availableServiceIds);
  const usedIds = new Set();
  const normalized = [];

  for (const rawCommand of rawCommands) {
    if (!rawCommand || typeof rawCommand !== "object") {
      continue;
    }

    const title = toSafeString(rawCommand.title);
    const template = typeof rawCommand.template === "string" ? rawCommand.template.trim() : "";
    const serviceId = toSafeString(rawCommand.serviceId);

    if (!title || !template || !serviceId) {
      continue;
    }

    if (serviceIdSet.size > 0 && !serviceIdSet.has(serviceId)) {
      continue;
    }

    const contextType = CUSTOM_COMMAND_CONTEXTS.has(rawCommand.contextType)
      ? rawCommand.contextType
      : DEFAULT_COMMAND.contextType;

    const order = Number.isFinite(Number(rawCommand.order))
      ? Number(rawCommand.order)
      : DEFAULT_COMMAND.order;

    const id = uniqueCommandId(rawCommand.id || title, usedIds);

    normalized.push({
      ...DEFAULT_COMMAND,
      id,
      title,
      description: toSafeString(rawCommand.description),
      enabled: rawCommand.enabled !== false,
      serviceId,
      contextType,
      template,
      menuGroup: toSafeString(rawCommand.menuGroup) || DEFAULT_COMMAND.menuGroup,
      profileIds: normalizeCommandProfileIds(rawCommand.profileIds),
      order
    });
  }

  return normalized.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "ru"));
}

function formatDate(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function buildVariables(context = {}) {
  return {
    selection: context.selection || "",
    url: context.url || "",
    title: context.title || "",
    date: context.date || formatDate(),
    service: context.service || "",
    pageText: context.pageText || "",
    youtubeUrl: context.youtubeUrl || context.url || ""
  };
}

function renderCustomCommandTemplate(template, context = {}) {
  const variables = buildVariables(context);

  return String(template || "").replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(variables, key)) {
      return match;
    }

    return variables[key];
  });
}

function buildCustomCommandPrompt(command, context = {}) {
  if (!command || typeof command.template !== "string") {
    return null;
  }

  const prompt = renderCustomCommandTemplate(command.template, context).trim();
  return prompt || null;
}

function isCustomCommandVisible(command, settings) {
  if (!command || command.enabled === false) {
    return false;
  }

  if (!settings || !settings.enabledServices) {
    return true;
  }

  return settings.enabledServices[command.serviceId] !== false;
}

function getContextMenuContextsForCommand(command) {
  switch (command?.contextType) {
    case "selection":
      return ["selection"];
    case "page":
    case "page_text":
      return ["page"];
    case "link":
      return ["link"];
    case "youtube":
      return ["link"];
    default:
      return ["selection"];
  }
}

function getCustomCommandSourceContext(command, info = {}, tab = {}, extra = {}) {
  const contextType = command?.contextType || "selection";
  const pageUrl = info.pageUrl || tab.url || "";
  const linkUrl = info.linkUrl || "";

  if (contextType === "link" || contextType === "youtube") {
    return {
      selection: info.selectionText || "",
      url: linkUrl || pageUrl,
      title: tab.title || "",
      youtubeUrl: contextType === "youtube" ? linkUrl : "",
      pageText: extra.pageText || "",
      date: extra.date,
      service: extra.service || ""
    };
  }

  return {
    selection: info.selectionText || "",
    url: pageUrl,
    title: tab.title || "",
    youtubeUrl: "",
    pageText: extra.pageText || "",
    date: extra.date,
    service: extra.service || ""
  };
}

// === diagnostics.js ===
const DIAGNOSTICS_STORAGE_KEY = "diagnosticsLog";
const DIAGNOSTICS_MAX_ENTRIES = 20;

const DIAGNOSTIC_STATUS_TITLES = {
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

function getDiagnosticStatusTitle(status) {
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

function normalizeDiagnosticEntry(entry) {
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

async function readDiagnosticsLog() {
  const entries = await storageLocalGet(DIAGNOSTICS_STORAGE_KEY);
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.map(normalizeDiagnosticEntry).slice(0, DIAGNOSTICS_MAX_ENTRIES);
}

async function appendDiagnosticsLog(entry) {
  const current = await readDiagnosticsLog();
  const normalized = normalizeDiagnosticEntry(entry);
  const next = [normalized, ...current].slice(0, DIAGNOSTICS_MAX_ENTRIES);
  await storageLocalSet(next);
  return next;
}

async function clearDiagnosticsLog() {
  await storageLocalRemove(DIAGNOSTICS_STORAGE_KEY);
}

// === insertion.js ===
function insertTextIntoPage(text, profile) {
  const selectors = Array.isArray(profile?.selectors) && profile.selectors.length > 0
    ? profile.selectors
    : ["textarea", 'div[contenteditable="true"]'];

  const intervalMs = Number(profile?.intervalMs) > 0 ? Number(profile.intervalMs) : 200;
  const timeoutMs = Number(profile?.timeoutMs) > 0 ? Number(profile.timeoutMs) : 15000;
  const usePasteFirst = Boolean(profile?.usePasteFirst);
  const settleMs = Number(profile?.settleMs) > 0 ? Number(profile.settleMs) : 0;
  const retryOnInsertFail = Boolean(profile?.retryOnInsertFail);
  const startedAt = Date.now();
  const attemptedSelectors = [];

  const isEditableElement = (element) => {
    if (!element) {
      return false;
    }

    if (element.tagName === "TEXTAREA") {
      return true;
    }

    if (element.tagName === "INPUT" && element.type !== "hidden") {
      return true;
    }

    const contenteditable = element.getAttribute("contenteditable");
    return contenteditable === "true" || contenteditable === "plaintext-only" || element.isContentEditable;
  };

  const findInputElement = () => {
    for (const selector of selectors) {
      if (!attemptedSelectors.includes(selector)) {
        attemptedSelectors.push(selector);
      }

      const candidate = document.querySelector(selector);
      if (!candidate) {
        continue;
      }

      if (isEditableElement(candidate)) {
        return { element: candidate, selector };
      }

      const nestedEditable = candidate.querySelector(
        'textarea, input[type="text"], input:not([type]), [contenteditable="true"], [contenteditable="plaintext-only"]'
      );
      if (nestedEditable && isEditableElement(nestedEditable)) {
        return { element: nestedEditable, selector };
      }
    }

    return null;
  };

  const dispatchStandardEvents = (element) => {
    ["input", "change", "keydown", "keyup"].forEach((eventType) => {
      element.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
    });

    try {
      element.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText"
      }));
    } catch {
      // noop
    }
  };

  const setNativeInputValue = (element, value) => {
    const prototype = element.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;

    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    const setter = descriptor?.set;

    if (setter) {
      setter.call(element, value);
    } else {
      element.value = value;
    }
  };

  const placeCursorAtEnd = (element) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const tryPasteEvent = (element, value) => {
    try {
      if (typeof DataTransfer === "undefined" || typeof ClipboardEvent === "undefined") {
        return false;
      }

      const clipboardData = new DataTransfer();
      clipboardData.setData("text/plain", value);

      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData
      });

      element.dispatchEvent(pasteEvent);
      return Boolean(element.textContent && element.textContent.trim().length > 0);
    } catch {
      return false;
    }
  };

  const waitForPasteCommit = async (element, value) => {
    const pastedAt = Date.now();

    while (Date.now() - pastedAt < 800) {
      if (isMeaningfullyInserted(element.textContent, value)) {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return isMeaningfullyInserted(element.textContent, value);
  };

  const clearEditableContent = (element) => {
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch {
      // noop
    }

    try {
      document.execCommand("delete");
    } catch {
      // noop
    }

    if (element.textContent) {
      element.textContent = "";
    }
  };

  const normalizeForCompare = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const isMeaningfullyInserted = (actualValue, expectedValue) => {
    const actual = normalizeForCompare(actualValue);
    const expected = normalizeForCompare(expectedValue);

    if (!actual || !expected) {
      return false;
    }

    if (actual === expected) {
      return true;
    }

    const head = expected.slice(0, Math.min(80, expected.length));
    const tail = expected.slice(Math.max(0, expected.length - 80));
    const longEnough = actual.length >= Math.floor(expected.length * 0.75);

    return longEnough && actual.includes(head) && (tail.length < 20 || actual.includes(tail));
  };

  const getElementValue = (element) => {
    if (!element) {
      return "";
    }

    if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") {
      return element.value || "";
    }

    return element.textContent || "";
  };

  const setContentEditableValue = async (element, value) => {
    element.focus();
    element.click();
    clearEditableContent(element);

    let inserted = false;
    let method = "fallback-textContent";

    if (usePasteFirst) {
      tryPasteEvent(element, value);

      // React may commit the pasted content asynchronously — give it a short
      // window before falling back to execCommand/textContent.
      inserted = await waitForPasteCommit(element, value);
      if (inserted) {
        method = "paste-event";
      }
    }

    if (!inserted) {
      try {
        inserted = document.execCommand("insertText", false, value);
        if (inserted) {
          method = "execCommand-insertText";
        }
      } catch {
        inserted = false;
      }
    }

    if (!inserted || !isMeaningfullyInserted(element.textContent, value)) {
      element.textContent = value;
      method = "textContent";
    }

    dispatchStandardEvents(element);
    placeCursorAtEnd(element);

    return {
      inserted: isMeaningfullyInserted(element.textContent, value),
      method
    };
  };

  const tryInsert = async (element, value) => {
    if (!element) {
      return { inserted: false, method: "none", actualLength: 0 };
    }

    const currentValue = getElementValue(element);

    if (isMeaningfullyInserted(currentValue, value)) {
      return {
        inserted: true,
        method: "already-present",
        actualLength: currentValue.length
      };
    }

    const isTextInput = element.tagName === "TEXTAREA" || element.tagName === "INPUT";

    if (isTextInput) {
      element.focus();
      element.click();
      setNativeInputValue(element, value);
      dispatchStandardEvents(element);
      return {
        inserted: isMeaningfullyInserted(element.value, value),
        method: "native-value-setter",
        actualLength: getElementValue(element).length
      };
    }

    if (isEditableElement(element)) {
      const result = await setContentEditableValue(element, value);
      return {
        ...result,
        actualLength: getElementValue(element).length
      };
    }

    return { inserted: false, method: "unsupported-element", actualLength: getElementValue(element).length };
  };

  const buildBaseDiagnostic = () => ({
    url: location.href || "",
    title: document.title || "",
    expectedLength: String(text || "").length,
    elapsedMs: Date.now() - startedAt,
    attemptedSelectors: [...attemptedSelectors]
  });

  return new Promise((resolve) => {
    let finished = false;
    let waitForInput = null;
    let timeoutId = null;
    let observer = null;
    let settleId = null;
    let lastMatch = null;
    let lastInsertResult = null;
    let inserting = false;

    const finish = (result) => {
      if (finished) {
        return;
      }

      finished = true;
      inserting = false;

      if (waitForInput !== null) {
        clearInterval(waitForInput);
      }

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      if (observer !== null) {
        observer.disconnect();
      }

      if (settleId !== null) {
        clearTimeout(settleId);
      }

      resolve({
        ...buildBaseDiagnostic(),
        ...result,
        elapsedMs: Date.now() - startedAt
      });
    };

    const attemptInsert = async () => {
      if (finished || inserting) {
        return;
      }

      // If a settle re-check is pending, don't start a new attempt yet.
      if (settleId !== null) {
        return;
      }

      const match = findInputElement();
      if (!match) {
        return;
      }

      inserting = true;
      lastMatch = match;
      let insertResult;
      try {
        insertResult = await tryInsert(match.element, text);
      } catch (error) {
        finish({
          status: "insert_failed",
          selector: match.selector,
          tagName: match.element.tagName.toLowerCase(),
          method: "error",
          actualLength: 0,
          error: error && error.message ? error.message : String(error)
        });
        return;
      } finally {
        inserting = false;
      }
      lastInsertResult = insertResult;

      if (!insertResult.inserted) {
        if (retryOnInsertFail) {
          return; // element not ready yet — keep polling
        }

        finish({
          status: "insert_failed",
          selector: match.selector,
          tagName: match.element.tagName.toLowerCase(),
          method: insertResult.method,
          actualLength: insertResult.actualLength
        });
        return;
      }

      if (settleMs <= 0) {
        match.element.scrollIntoView({ behavior: "smooth", block: "center" });
        finish({
          status: "success",
          selector: match.selector,
          tagName: match.element.tagName.toLowerCase(),
          method: insertResult.method,
          actualLength: insertResult.actualLength
        });
        return;
      }

      // Immediate check passed — wait settleMs for the framework to re-render,
      // then re-verify the value is still present (not wiped by React).
      settleId = setTimeout(() => {
        settleId = null;
        if (finished) {
          return;
        }

        const current = getElementValue(match.element);
        if (isMeaningfullyInserted(current, text)) {
          match.element.scrollIntoView({ behavior: "smooth", block: "center" });
          finish({
            status: "success",
            selector: match.selector,
            tagName: match.element.tagName.toLowerCase(),
            method: insertResult.method,
            actualLength: current.length
          });
          return;
        }

        // Framework wiped the value — fall through; polling will retry on the next tick.
      }, settleMs);
    };

    if (typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(() => {
        if (!finished) {
          attemptInsert();
        }
      });

      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    waitForInput = setInterval(attemptInsert, intervalMs);
    timeoutId = setTimeout(() => {
      if (lastMatch && lastInsertResult) {
        finish({
          status: "insert_failed",
          selector: lastMatch.selector,
          tagName: lastMatch.element.tagName.toLowerCase(),
          method: lastInsertResult.method,
          actualLength: lastInsertResult.actualLength
        });
        return;
      }

      finish({
        status: "input_not_found",
        timeoutMs
      });
    }, timeoutMs);

    attemptInsert();
  });
}

// === page-extractor.js ===
function extractVisiblePageText(options = {}) {
  const DEFAULT_MAX_TEXT_LENGTH = 30000;
  const BLOCK_TAGS = new Set([
    "ARTICLE",
    "ASIDE",
    "BLOCKQUOTE",
    "BR",
    "DD",
    "DIV",
    "DL",
    "DT",
    "FIGCAPTION",
    "FIGURE",
    "FOOTER",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "HEADER",
    "HR",
    "LI",
    "MAIN",
    "NAV",
    "OL",
    "P",
    "PRE",
    "SECTION",
    "TABLE",
    "TBODY",
    "TD",
    "TFOOT",
    "TH",
    "THEAD",
    "TR",
    "UL"
  ]);

  const IGNORED_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "SVG",
    "CANVAS",
    "IFRAME",
    "OBJECT",
    "EMBED",
    "TEMPLATE"
  ]);

  function isElementHidden(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    if (element.hidden || element.getAttribute("aria-hidden") === "true") {
      return true;
    }

    const style = window.getComputedStyle(element);
    return style.display === "none" || style.visibility === "hidden" || style.opacity === "0";
  }

  function normalizeText(value) {
    return String(value || "")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function appendTextPart(parts, text) {
    const normalized = String(text || "").replace(/\s+/g, " ").trim();
    if (normalized) {
      parts.push(normalized);
    }
  }

  function appendBreak(parts) {
    if (parts.length > 0 && parts[parts.length - 1] !== "\n") {
      parts.push("\n");
    }
  }

  function walkNode(node, parts) {
    if (!node) {
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      appendTextPart(parts, node.textContent);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const tagName = node.tagName;
    if (IGNORED_TAGS.has(tagName) || isElementHidden(node)) {
      return;
    }

    if (BLOCK_TAGS.has(tagName)) {
      appendBreak(parts);
    }

    for (const child of node.childNodes) {
      walkNode(child, parts);
    }

    if (BLOCK_TAGS.has(tagName)) {
      appendBreak(parts);
    }
  }

  function readMetaDescription() {
    const element = document.querySelector('meta[name="description"], meta[property="og:description"]');
    return element?.getAttribute("content")?.trim() || "";
  }

  const maxTextLength = Number(options.maxTextLength) > 0
    ? Number(options.maxTextLength)
    : DEFAULT_MAX_TEXT_LENGTH;

  const root = document.querySelector("main, article") || document.body || document.documentElement;
  const parts = [];
  walkNode(root, parts);

  const fullText = normalizeText(parts.join(" ").replace(/\s*\n\s*/g, "\n"));
  const wasTruncated = fullText.length > maxTextLength;
  const text = wasTruncated ? fullText.slice(0, maxTextLength).trimEnd() : fullText;
  const selection = window.getSelection?.().toString().trim() || "";

  return {
    status: text ? "success" : "empty",
    url: location.href || "",
    title: document.title || "",
    description: readMetaDescription(),
    selection,
    text,
    textLength: fullText.length,
    returnedTextLength: text.length,
    wasTruncated,
    maxTextLength
  };
}

// === context-prompts.js ===
const CONTEXT_LABELS = {
  page: "текущую страницу",
  link: "ссылку"
};

const ACTION_LABELS = {
  summary: "сделай подробное саммари",
  factcheck: "проведи фактчекинг утверждений",
  translate: "переведи содержимое на русский язык",
  key_points: "извлеки ключевые тезисы"
};

const ACTION_EXTRA_LINES = {
  summary: [
    "- выдели главную тему и ключевые тезисы;",
    "- сохрани важные факты, цифры, даты, имена и выводы;"
  ],
  factcheck: [
    "- разбей проверку на отдельные утверждения;",
    "- для каждого утверждения используй формат: 🔹 Утверждение → 📌 Статус (✅ Верно / 🟡 Частично верно / ❌ Неверно / ⚪ Недостаточно данных) → 📖 Краткое обоснование (2–5 предложений) → 🔍 Что важно уточнить → 📚 Источники/основание;",
    "- не выдумывай источники и явно помечай случаи, где данных недостаточно;",
    "- если утверждение спорное среди историков/учёных — явно укажи это;",
    "- в конце добавь краткий общий вывод о степени достоверности текста в целом (1–3 предложения);",
  ],
  translate: [
    "- переведи весь доступный содержательный текст;",
    "- сохрани структуру абзацев, термины, числовые данные, имена;",
    "- адаптируй идиомы и культурные отсылки, не добавляй комментариев от себя;"
  ],
  key_points: [
    "- выдели только ключевые тезисы и практические выводы;",
    "- не раздувай ответ лишними пояснениями;"
  ]
};

function buildContextPrompt(contextType, actionType, sourceUrl, sourceTitle = "") {
  const contextLabel = CONTEXT_LABELS[contextType] || "контент";
  const actionLabel = ACTION_LABELS[actionType];
  const extraLines = ACTION_EXTRA_LINES[actionType] || [];

  if (!actionLabel) {
    return null;
  }

  const titleLine = sourceTitle ? `\nЗаголовок: ${sourceTitle}` : "";

  return [
    `Проанализируй ${contextLabel} по этому URL и ${actionLabel}:`,
    "",
    sourceUrl,
    titleLine,
    "",
    "Требования:",
    "- без вступительной воды;",
    ...extraLines,
    "- если страница или ссылка недоступны, требуют авторизации или содержимое не читается, честно сообщи об этом."
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPageOrLinkPrompt(contextType, actionType, sourceUrl, sourceTitle = "") {
  return buildContextPrompt(contextType, actionType, sourceUrl, sourceTitle);
}

// === services.js ===
const ROOT_MENU_ID = "sendToAI";
const YOUTUBE_MENU_ID_PREFIX = "openYouTubeTemplate:";
const YOUTUBE_MENU_IDS = {
  article: "openYouTubeArticleInGemini",
  summary: "openYouTubeSummaryInGemini",
  facts: `${YOUTUBE_MENU_ID_PREFIX}facts`,
  telegram: `${YOUTUBE_MENU_ID_PREFIX}telegram`,
  research: `${YOUTUBE_MENU_ID_PREFIX}research`
};
const CONTEXT_ACTIONS_MENU_ID = "pageAndLinkActions";
const CONTEXT_ACTIONS_QWEN_MENU_ID = "pageAndLinkActionsQwen";
const CONTEXT_ACTIONS_GROK_MENU_ID = "pageAndLinkActionsGrok";
const QUICK_DEFAULT_MENU_ID = "sendToAIDefault";

const ROOT_MENU_TITLE = "Отправить в AI";
const YOUTUBE_MENU_TITLES = {
  article: "Статья по YouTube-транскрипции в Gemini",
  summary: "Краткое резюме YouTube-видео в Gemini",
  facts: "Список фактов из YouTube-видео в Gemini",
  telegram: "Telegram-пост по YouTube-видео в Gemini",
  research: "Тезисы для исследования по YouTube-видео в Gemini"
};
const CONTEXT_ACTIONS_MENU_TITLE = "Страницы и ссылки";
const CONTEXT_ACTIONS_QWEN_MENU_TITLE = "Страницы и ссылки в Qwen";
const CONTEXT_ACTIONS_GROK_MENU_TITLE = "Страницы и ссылки в Grok";

const SERVICE_CONFIGS = [
  {
    id: "sendToGrok",
    title: "Grok",
    urlPattern: "https://grok.com/*",
    newUrl: "https://grok.com/",
    profile: {
      selectors: [
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="Type"]',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]',
        '[aria-label*="message"]',
        '[aria-label*="input"]',
        '[aria-label*="prompt"]',
        "textarea",
        'input[type="text"]'
      ],
      timeoutMs: 20000,
      intervalMs: 200,
      usePasteFirst: true,
      delayMs: 1500,
      settleMs: 300,
      retryOnInsertFail: true
    }
  },
  {
    id: "sendToChatGPT",
    title: "ChatGPT",
    urlPattern: "https://chatgpt.com/*",
    newUrl: "https://chatgpt.com/",
    profile: {
      selectors: [
        "#prompt-textarea",
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]',
        "textarea"
      ],
      usePasteFirst: true
    }
  },
  {
    id: "sendToGemini",
    title: "Google Gemini",
    urlPattern: "https://gemini.google.com/*",
    newUrl: "https://gemini.google.com/app",
    profile: {
      selectors: [
        'div[aria-label*="Enter a prompt"]',
        'div[aria-label*="prompt"]',
        'div[contenteditable="true"]',
        "textarea"
      ]
    }
  },
  {
    id: "sendToAistudio",
    title: "Google AI Studio",
    urlPattern: "https://aistudio.google.com/*",
    newUrl: "https://aistudio.google.com/app/prompts/new_chat",
    profile: {
      selectors: [
        'textarea[aria-label*="Enter a prompt"]',
        'textarea[placeholder*="Start typing a prompt"]',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]',
        "textarea",
        'input[type="text"]'
      ],
      timeoutMs: 20000,
      intervalMs: 200,
      usePasteFirst: false
    }
  },
  {
    id: "sendToClaude",
    title: "Claude",
    urlPattern: "https://claude.ai/*",
    newUrl: "https://claude.ai/new",
    profile: {
      selectors: [
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]',
        'textarea[placeholder*="How can Claude help"]',
        "textarea"
      ],
      usePasteFirst: true,
      timeoutMs: 20000
    }
  },
  {
    id: "sendToDeepSeek",
    title: "DeepSeek",
    urlPattern: "https://chat.deepseek.com/*",
    newUrl: "https://chat.deepseek.com/",
    profile: {
      selectors: [
        '[data-slate-editor="true"]',
        'div[contenteditable="plaintext-only"]',
        'div[contenteditable="true"][role="textbox"]',
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="Type"]',
        "textarea",
        'div[contenteditable="true"]',
        '[aria-label*="prompt"]',
        '[aria-label*="message"]',
        '[class*="chat-input"]',
        '[class*="input"]'
      ],
      usePasteFirst: true,
      timeoutMs: 20000,
      intervalMs: 200,
      delayMs: 1500
    }
  },
  {
    id: "sendToZai",
    title: "Z.ai",
    urlPattern: "https://chat.z.ai/*",
    newUrl: "https://chat.z.ai/",
    profile: {
      selectors: ["#chat-input", "textarea", 'div[contenteditable="true"]'],
      intervalMs: 100,
      timeoutMs: 10000
    }
  },
  {
    id: "sendToKimi",
    title: "Kimi AI",
    urlPattern: "https://www.kimi.ai/*",
    newUrl: "https://www.kimi.ai/",
    profile: {
      selectors: [
        ".chat-input-editor",
        'div[contenteditable="true"]',
        "textarea",
        'input[type="text"]'
      ],
      usePasteFirst: true
    }
  },
  {
    id: "sendToQwen",
    title: "Qwen AI",
    urlPattern: "https://chat.qwen.ai/*",
    newUrl: "https://chat.qwen.ai/",
    profile: {
      selectors: [
        '[data-slate-editor="true"]',
        'div[contenteditable="plaintext-only"]',
        'div[contenteditable="true"][role="textbox"]',
        "textarea",
        'div[contenteditable="true"]',
        '[aria-label*="prompt"]',
        '[aria-label*="message"]',
        '[class*="chat-input"]',
        '[class*="input"]'
      ],
      usePasteFirst: true,
      timeoutMs: 20000,
      intervalMs: 200,
      delayMs: 1500
    }
  },
  {
    id: "sendToMinimax",
    title: "Minimax",
    urlPattern: "https://agent.minimax.io/*",
    newUrl: "https://agent.minimax.io/",
    profile: {
      selectors: [
        '[data-slate-editor="true"]',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]',
        'textarea[placeholder*="Type"]',
        'textarea[placeholder*="Ask"]',
        '[class*="chat-input"]',
        "textarea"
      ],
      usePasteFirst: true,
      timeoutMs: 20000
    }
  }
];

const SPECIAL_ACTIONS = [
  {
    id: "sendAndTranslateToQwen",
    title: "Отправить и перевести в Qwen",
    serviceId: "sendToQwen",
    transformText: (selectedText) =>
      "Ты - профессиональный переводчик. Переведи на русский язык с сохранением структуры абзацев и минимальной литературной обработкой.\n\nСохрани термины, числовые данные, имена и форматирование. Адаптируй идиомы и культурные отсылки. Не добавляй пояснений и комментариев от себя.\n\n" + selectedText
  },
  {
    id: "summarizeInQwen",
    title: "Сделать саммари в Qwen",
    serviceId: "sendToQwen",
    transformText: (selectedText) =>
      "Без вступительного текста. Сделай краткое саммари --- \n\n" + selectedText
  },
  {
    id: "factCheckInQwen",
    title: "Провести фактчекинг в Qwen",
    serviceId: "sendToQwen",
    transformText: (selectedText) =>
      `Проведи фактчекинг утверждений только из текста ниже.

Требования к ответу:

Разбей проверку на отдельные утверждения.
Для каждого утверждения используй следующий формат:

🔹 Утверждение:
(цитата или краткий пересказ)

📌 Статус:
✅ Верно / 🟡 Частично верно / ❌ Неверно / ⚪ Недостаточно данных

📖 Краткое обоснование:
2–5 предложений без лишней воды. Только проверяемые факты и суть.

🔍 Что важно уточнить:
Какие детали требуют дополнительной проверки, контекста или конкретизации.

📚 Источники/основание:
Укажи, на каких данных или научном консенсусе основан вывод. Не выдумывай источники.

Дополнительные правила:

- Не пересказывай весь исходный текст.
- Не пиши длинных вступлений и выводов.
- Если утверждение спорное среди историков/учёных — явно укажи это.
- Если данных недостаточно — прямо так и напиши.
- Не объединяй несколько утверждений в одно.
- Сохраняй максимально наглядную структуру и короткие абзацы.
- В конце добавь краткий общий вывод о степени достоверности текста в целом (1–3 предложения).

---

` + selectedText
  },
  {
    id: "sendAndTranslateToChatGPT",
    title: "Отправить и перевести в ChatGPT",
    serviceId: "sendToChatGPT",
    transformText: (selectedText) =>
      "Ты - профессиональный переводчик. Переведи на русский язык с сохранением структуры абзацев и минимальной литературной обработкой.\n\nСохрани термины, числовые данные, имена и форматирование. Адаптируй идиомы и культурные отсылки. Не добавляй пояснений и комментариев от себя.\n\n" + selectedText
  },
  {
    id: "summarizeInChatGPT",
    title: "Сделать саммари в ChatGPT",
    serviceId: "sendToChatGPT",
    transformText: (selectedText) =>
      "Без вступительного текста. Сделай краткое саммари --- \n\n" + selectedText
  },
  {
    id: "factCheckInChatGPT",
    title: "Провести фактчекинг в ChatGPT",
    serviceId: "sendToChatGPT",
    transformText: (selectedText) =>
      `Проведи фактчекинг утверждений только из текста ниже.

Требования к ответу:

Разбей проверку на отдельные утверждения.
Для каждого утверждения используй следующий формат:

🔹 Утверждение:
(цитата или краткий пересказ)

📌 Статус:
✅ Верно / 🟡 Частично верно / ❌ Неверно / ⚪ Недостаточно данных

📖 Краткое обоснование:
2–5 предложений без лишней воды. Только проверяемые факты и суть.

🔍 Что важно уточнить:
Какие детали требуют дополнительной проверки, контекста или конкретизации.

📚 Источники/основание:
Укажи, на каких данных или научном консенсусе основан вывод. Не выдумывай источники.

Дополнительные правила:

- Не пересказывай весь исходный текст.
- Не пиши длинных вступлений и выводов.
- Если утверждение спорное среди историков/учёных — явно укажи это.
- Если данных недостаточно — прямо так и напиши.
- Не объединяй несколько утверждений в одно.
- Сохраняй максимально наглядную структуру и короткие абзацы.
- В конце добавь краткий общий вывод о степени достоверности текста в целом (1–3 предложения).

---

` + selectedText
  },
  {
    id: "sendAndTranslateToGrok",
    title: "Отправить и перевести в Grok",
    serviceId: "sendToGrok",
    transformText: (selectedText) =>
      "Ты - профессиональный переводчик. Переведи на русский язык с сохранением структуры абзацев и минимальной литературной обработкой.\n\nСохрани термины, числовые данные, имена и форматирование. Адаптируй идиомы и культурные отсылки. Не добавляй пояснений и комментариев от себя.\n\n" + selectedText
  },
  {
    id: "summarizeInGrok",
    title: "Сделать саммари в Grok",
    serviceId: "sendToGrok",
    transformText: (selectedText) =>
      "Без вступительного текста. Сделай краткое саммари --- \n\n" + selectedText
  },
  {
    id: "factCheckInGrok",
    title: "Провести фактчекинг в Grok",
    serviceId: "sendToGrok",
    transformText: (selectedText) =>
      `Проведи фактчекинг утверждений только из текста ниже.

Требования к ответу:

Разбей проверку на отдельные утверждения.
Для каждого утверждения используй следующий формат:

🔹 Утверждение:
(цитата или краткий пересказ)

📌 Статус:
✅ Верно / 🟡 Частично верно / ❌ Неверно / ⚪ Недостаточно данных

📖 Краткое обоснование:
2–5 предложений без лишней воды. Только проверяемые факты и суть.

🔍 Что важно уточнить:
Какие детали требуют дополнительной проверки, контекста или конкретизации.

📚 Источники/основание:
Укажи, на каких данных или научном консенсусе основан вывод. Не выдумывай источники.

Дополнительные правила:

- Не пересказывай весь исходный текст.
- Не пиши длинных вступлений и выводов.
- Если утверждение спорное среди историков/учёных — явно укажи это.
- Если данных недостаточно — прямо так и напиши.
- Не объединяй несколько утверждений в одно.
- Сохраняй максимально наглядную структуру и короткие абзацы.
- В конце добавь краткий общий вывод о степени достоверности текста в целом (1–3 предложения).

---

` + selectedText
  }
];

const CONTEXT_ACTIONS = [
  {
    id: "pageSummaryInChatGPT",
    title: "Саммари страницы в ChatGPT",
    contextType: "page",
    actionType: "summary",
    serviceId: "sendToChatGPT"
  },
  {
    id: "pageFactCheckInChatGPT",
    title: "Фактчекинг страницы в ChatGPT",
    contextType: "page",
    actionType: "factcheck",
    serviceId: "sendToChatGPT"
  },
  {
    id: "pageTranslateInChatGPT",
    title: "Перевести страницу в ChatGPT",
    contextType: "page",
    actionType: "translate",
    serviceId: "sendToChatGPT"
  },
  {
    id: "pageKeyPointsInChatGPT",
    title: "Тезисы страницы в ChatGPT",
    contextType: "page",
    actionType: "key_points",
    serviceId: "sendToChatGPT"
  },
  {
    id: "linkSummaryInChatGPT",
    title: "Саммари ссылки в ChatGPT",
    contextType: "link",
    actionType: "summary",
    serviceId: "sendToChatGPT"
  },
  {
    id: "linkFactCheckInChatGPT",
    title: "Фактчекинг ссылки в ChatGPT",
    contextType: "link",
    actionType: "factcheck",
    serviceId: "sendToChatGPT"
  },
  {
    id: "linkTranslateInChatGPT",
    title: "Перевести ссылку в ChatGPT",
    contextType: "link",
    actionType: "translate",
    serviceId: "sendToChatGPT"
  },
  {
    id: "linkKeyPointsInChatGPT",
    title: "Тезисы ссылки в ChatGPT",
    contextType: "link",
    actionType: "key_points",
    serviceId: "sendToChatGPT"
  }
];

const SERVICES_BY_ID = Object.fromEntries(SERVICE_CONFIGS.map((service) => [service.id, service]));
const SPECIAL_ACTIONS_BY_ID = Object.fromEntries(SPECIAL_ACTIONS.map((action) => [action.id, action]));

const SPECIAL_ACTION_COMPACT_TITLES = {
  sendAndTranslateToQwen: "Перевести на русский",
  sendAndTranslateToChatGPT: "Перевести на русский",
  sendAndTranslateToGrok: "Перевести на русский",
  summarizeInQwen: "Сделать саммари",
  summarizeInChatGPT: "Сделать саммари",
  summarizeInGrok: "Сделать саммари",
  factCheckInQwen: "Провести фактчекинг",
  factCheckInChatGPT: "Провести фактчекинг",
  factCheckInGrok: "Провести фактчекинг"
};

function getCompactSpecialActionTitle(action) {
  return SPECIAL_ACTION_COMPACT_TITLES[action.id] || action.title;
}
const CONTEXT_ACTIONS_QWEN = [
  {
    id: "pageSummaryInQwen",
    title: "Саммари страницы в Qwen",
    contextType: "page",
    actionType: "summary",
    serviceId: "sendToQwen"
  },
  {
    id: "pageFactCheckInQwen",
    title: "Фактчекинг страницы в Qwen",
    contextType: "page",
    actionType: "factcheck",
    serviceId: "sendToQwen"
  },
  {
    id: "pageTranslateInQwen",
    title: "Перевести страницу в Qwen",
    contextType: "page",
    actionType: "translate",
    serviceId: "sendToQwen"
  },
  {
    id: "pageKeyPointsInQwen",
    title: "Тезисы страницы в Qwen",
    contextType: "page",
    actionType: "key_points",
    serviceId: "sendToQwen"
  },
  {
    id: "linkSummaryInQwen",
    title: "Саммари ссылки в Qwen",
    contextType: "link",
    actionType: "summary",
    serviceId: "sendToQwen"
  },
  {
    id: "linkFactCheckInQwen",
    title: "Фактчекинг ссылки в Qwen",
    contextType: "link",
    actionType: "factcheck",
    serviceId: "sendToQwen"
  },
  {
    id: "linkTranslateInQwen",
    title: "Перевести ссылку в Qwen",
    contextType: "link",
    actionType: "translate",
    serviceId: "sendToQwen"
  },
  {
    id: "linkKeyPointsInQwen",
    title: "Тезисы ссылки в Qwen",
    contextType: "link",
    actionType: "key_points",
    serviceId: "sendToQwen"
  }
];

const CONTEXT_ACTIONS_GROK = [
  {
    id: "pageSummaryInGrok",
    title: "Саммари страницы в Grok",
    contextType: "page",
    actionType: "summary",
    serviceId: "sendToGrok"
  },
  {
    id: "pageFactCheckInGrok",
    title: "Фактчекинг страницы в Grok",
    contextType: "page",
    actionType: "factcheck",
    serviceId: "sendToGrok"
  },
  {
    id: "pageTranslateInGrok",
    title: "Перевести страницу в Grok",
    contextType: "page",
    actionType: "translate",
    serviceId: "sendToGrok"
  },
  {
    id: "pageKeyPointsInGrok",
    title: "Тезисы страницы в Grok",
    contextType: "page",
    actionType: "key_points",
    serviceId: "sendToGrok"
  },
  {
    id: "linkSummaryInGrok",
    title: "Саммари ссылки в Grok",
    contextType: "link",
    actionType: "summary",
    serviceId: "sendToGrok"
  },
  {
    id: "linkFactCheckInGrok",
    title: "Фактчекинг ссылки в Grok",
    contextType: "link",
    actionType: "factcheck",
    serviceId: "sendToGrok"
  },
  {
    id: "linkTranslateInGrok",
    title: "Перевести ссылку в Grok",
    contextType: "link",
    actionType: "translate",
    serviceId: "sendToGrok"
  },
  {
    id: "linkKeyPointsInGrok",
    title: "Тезисы ссылки в Grok",
    contextType: "link",
    actionType: "key_points",
    serviceId: "sendToGrok"
  }
];

const CONTEXT_ACTIONS_BY_ID = Object.fromEntries(CONTEXT_ACTIONS.map((action) => [action.id, action]));
const CONTEXT_ACTIONS_QWEN_BY_ID = Object.fromEntries(CONTEXT_ACTIONS_QWEN.map((action) => [action.id, action]));
const CONTEXT_ACTIONS_GROK_BY_ID = Object.fromEntries(CONTEXT_ACTIONS_GROK.map((action) => [action.id, action]));
const ALL_SERVICE_IDS = SERVICE_CONFIGS.map((service) => service.id);
const ALL_CONTEXT_ACTION_QWEN_IDS = CONTEXT_ACTIONS_QWEN.map((action) => action.id);
const ALL_CONTEXT_ACTION_GROK_IDS = CONTEXT_ACTIONS_GROK.map((action) => action.id);

// === youtube-templates.js ===
const YOUTUBE_TEMPLATE_IDS = {
  article: "article",
  summary: "summary",
  facts: "facts",
  telegram: "telegram",
  research: "research"
};

const DEFAULT_YOUTUBE_TEMPLATES = [
  {
    id: YOUTUBE_TEMPLATE_IDS.article,
    title: "Статья по YouTube-транскрипции",
    enabled: true,
    serviceId: "sendToGemini",
    template: [
      "Ты — профессиональный редактор и литературный обработчик YouTube-транскрипций.",
      "",
      "Преобразуй **полную транскрипцию этого видео от начала до конца** в полноценную, связную и хорошо структурированную статью на русском языке:",
      "",
      "{youtubeUrl}",
      "",
      "## Главный принцип",
      "",
      "**Редактируй форму, но не сокращай содержание.**",
      "",
      "Готовая статья должна максимально полно передавать содержание видео, чтобы человек, не смотревший его, получил практически тот же объём информации.",
      "",
      "## Требования",
      "",
      "1. **Не делай краткий пересказ, конспект или резюме.** Не сокращай материал ради компактности.",
      "",
      "2. Сохрани все содержательные элементы:",
      "",
      "   * факты, события и объяснения;",
      "   * имена, названия и географические объекты;",
      "   * даты, годы, числа, проценты и статистику;",
      "   * термины и определения;",
      "   * аргументы, контраргументы и причинно-следственные связи;",
      "   * примеры, сравнения и аналогии;",
      "   * гипотезы, версии, оговорки и степень уверенности;",
      "   * оценки, рассуждения и выводы автора.",
      "",
      "3. **Не сворачивай длинное рассуждение в короткий вывод.** Если автор подробно раскрывает мысль, сохрани ход его аргументации и существенные промежуточные рассуждения.",
      "",
      "4. Исправь ошибки автоматической транскрибации: неверно распознанные имена, фамилии, термины, названия, даты и числа — но только если правильный вариант можно уверенно определить из контекста.",
      "",
      "5. Удали только то, что не несёт самостоятельного смысла:",
      "",
      "   * слова-паразиты;",
      "   * оговорки и сбивки;",
      "   * ложные начала фраз;",
      "   * механические повторы;",
      "   * технические реплики;",
      "   * просьбы подписаться, поставить лайк и рекламные вставки, не относящиеся к теме.",
      "",
      "   Если повтор содержит уточнение, новый аргумент или дополнительную деталь — сохрани его содержание.",
      "",
      "6. Преобразуй устную речь в нормальный письменный русский язык:",
      "",
      "   * исправь синтаксис;",
      "   * убери тавтологию;",
      "   * объедини связанные фразы;",
      "   * разбей слишком длинные предложения;",
      "   * сделай естественные переходы между мыслями.",
      "",
      "7. Раздели текст на логичные **разделы и подзаголовки**. При необходимости можешь объединять разрозненные фрагменты видео, относящиеся к одной теме, но не меняй смысл, причинно-следственные связи и хронологию.",
      "",
      "8. **Не добавляй факты и знания от себя.** Не дополняй материал сведениями из Википедии, других источников или собственных знаний. Задача — максимально точно передать именно содержание видео.",
      "",
      "9. Не превращай мнение автора в установленный факт. Сохраняй формулировки вроде «вероятно», «возможно», «по мнению автора», «существует версия», если они присутствуют по смыслу.",
      "",
      "10. Используй естественный литературный русский язык без канцелярита, лишнего пафоса и типичных шаблонных «нейросетевых» оборотов.",
      "",
      "## Проверка полноты",
      "",
      "Перед финальным ответом мысленно сопоставь статью с транскрипцией **от начала до конца** и проверь, что не потеряны:",
      "",
      "* смысловые блоки;",
      "* аргументы и примеры;",
      "* имена и названия;",
      "* даты и числа;",
      "* важные детали и уточнения;",
      "* выводы автора.",
      "",
      "Если обнаружен пропуск — восстанови его.",
      "",
      "**Не ограничивай объём статьи.** Её длина должна определяться только объёмом и содержанием исходного видео.",
      "",
      "При конфликте требований приоритет такой:",
      "",
      "**полнота и точность → сохранение смысла и нюансов → литературное качество → краткость.**",
      "",
      "Выведи **только готовую статью**, без комментариев о процессе работы. Сразу начинай с заголовка."
    ].join("\n")
  },
  {
    id: YOUTUBE_TEMPLATE_IDS.summary,
    title: "Краткое резюме YouTube-видео",
    enabled: true,
    serviceId: "sendToGemini",
    template: [
      "{youtubeUrl}",
      "",
      "Ты — профессиональный аналитик видео-транскрипций.",
      "",
      "Подготовь краткое, но содержательное резюме этого видео на русском языке.",
      "",
      "Требования:",
      "- перечисли основные факты и выводы;",
      "- сохрани важные имена, даты, числа, термины и названия;",
      "- не добавляй факты от себя;",
      "- если есть несколько тем, сгруппируй их;",
      "- не превращай ответ в длинную статью;",
      "- начни сразу с результата."
    ].join("\n")
  },
  {
    id: YOUTUBE_TEMPLATE_IDS.facts,
    title: "Список фактов из YouTube-видео",
    enabled: true,
    serviceId: "sendToGemini",
    template: [
      "{youtubeUrl}",
      "",
      "Извлеки из транскрипции этого видео все содержательные факты на русском языке.",
      "",
      "Верни результат в виде структурированного списка:",
      "1. Факт.",
      "2. Контекст или пояснение.",
      "3. Имена, даты, числа и термины, если они есть.",
      "",
      "Не добавляй внешние сведения. Если факт звучит сомнительно или требует проверки, пометь это отдельно."
    ].join("\n")
  },
  {
    id: YOUTUBE_TEMPLATE_IDS.telegram,
    title: "Telegram-пост по YouTube-видео",
    enabled: true,
    serviceId: "sendToGemini",
    template: [
      "{youtubeUrl}",
      "",
      "На основе транскрипции этого видео подготовь Telegram-пост на русском языке.",
      "",
      "Требования:",
      "- сделай сильный заголовок;",
      "- кратко объясни, о чём видео;",
      "- выдели главные факты и выводы;",
      "- сохрани точность;",
      "- не добавляй факты, которых нет в видео;",
      "- стиль: живой, понятный, без кликбейта;",
      "- в конце добавь 3–5 коротких тезисов для быстрого чтения."
    ].join("\n")
  },
  {
    id: YOUTUBE_TEMPLATE_IDS.research,
    title: "Тезисы для исследования по YouTube-видео",
    enabled: true,
    serviceId: "sendToGemini",
    template: [
      "{youtubeUrl}",
      "",
      "Проанализируй транскрипцию этого видео как исследовательский материал.",
      "",
      "Сделай:",
      "- главную тему видео;",
      "- ключевые тезисы;",
      "- факты, даты, имена, места и термины;",
      "- спорные утверждения, которые стоит проверить;",
      "- возможные источники ошибок или преувеличений;",
      "- список вопросов для дальнейшего исследования.",
      "",
      "Не добавляй новые факты от себя. Чётко отделяй содержание видео от собственных выводов."
    ].join("\n")
  }
];

const DEFAULT_YOUTUBE_TEMPLATES_BY_ID = Object.fromEntries(
  DEFAULT_YOUTUBE_TEMPLATES.map((template) => [template.id, template])
);

function normalizeYouTubeTemplates(rawTemplates) {
  const sourceById = new Map();

  if (Array.isArray(rawTemplates)) {
    for (const rawTemplate of rawTemplates) {
      if (!rawTemplate || typeof rawTemplate !== "object" || typeof rawTemplate.id !== "string") {
        continue;
      }

      sourceById.set(rawTemplate.id, rawTemplate);
    }
  }

  return DEFAULT_YOUTUBE_TEMPLATES.map((defaultTemplate) => {
    const rawTemplate = sourceById.get(defaultTemplate.id) || {};
    const title = typeof rawTemplate.title === "string" && rawTemplate.title.trim()
      ? rawTemplate.title.trim()
      : defaultTemplate.title;
    const template = typeof rawTemplate.template === "string" && rawTemplate.template.trim()
      ? rawTemplate.template.trim()
      : defaultTemplate.template;
    const serviceId = typeof rawTemplate.serviceId === "string" && rawTemplate.serviceId.trim()
      ? rawTemplate.serviceId.trim()
      : defaultTemplate.serviceId;

    return {
      id: defaultTemplate.id,
      title,
      enabled: rawTemplate.enabled !== false,
      serviceId,
      template
    };
  });
}

function getYouTubeTemplateById(rawTemplates, templateId) {
  const templates = normalizeYouTubeTemplates(rawTemplates);
  return templates.find((template) => template.id === templateId) || templates[0];
}

function renderYouTubeTemplate(template, context = {}) {
  const youtubeUrl = context.youtubeUrl || context.url || "";
  return String(template?.template || "").replace(/\{youtubeUrl\}|\{url\}/g, youtubeUrl).trim();
}

// === menus.js ===
const PRIORITY_SERVICE_IDS = ["sendToChatGPT", "sendToQwen", "sendToGrok"];

function isServiceEnabled(settings, serviceId) {
  return settings.enabledServices[serviceId] !== false;
}

function getOrderedServiceIds(serviceOrder = []) {
  const remaining = serviceOrder.filter((serviceId) => !PRIORITY_SERVICE_IDS.includes(serviceId));

  return [
    ...PRIORITY_SERVICE_IDS.filter((serviceId) => serviceOrder.includes(serviceId)),
    ...remaining
  ];
}

function buildCustomCommandDescriptors(settings) {
  const visibleCommands = (settings.customCommands || []).filter((command) =>
    isCustomCommandVisible(command, settings)
    && isCommandVisibleForProfiles(command, settings.activeProfileIds)
  );

  if (visibleCommands.length === 0) {
    return [];
  }

  const descriptors = [
    {
      id: CUSTOM_COMMANDS_MENU_ID,
      title: CUSTOM_COMMANDS_MENU_TITLE,
      contexts: ["selection", "page", "link"]
    }
  ];

  for (const command of visibleCommands) {
    descriptors.push({
      id: command.id,
      parentId: CUSTOM_COMMANDS_MENU_ID,
      title: command.title,
      contexts: getContextMenuContextsForCommand(command)
    });
  }

  return descriptors;
}

function buildYouTubeTemplateDescriptors(settings) {
  return normalizeYouTubeTemplates(settings.youtubeTemplates)
    .filter((template) => template.enabled !== false && isServiceEnabled(settings, template.serviceId))
    .map((template) => ({
      id: YOUTUBE_MENU_IDS[template.id] || `openYouTubeTemplate:${template.id}`,
      title: `${template.title} в ${SERVICES_BY_ID[template.serviceId]?.title || "AI"}`,
      contexts: ["link"],
      targetUrlPatterns: [
        "*://*.youtube.com/*",
        "*://youtube.com/*",
        "*://youtu.be/*"
      ]
    }));
}

function getVisibleSpecialActionsByService(settings) {
  if (!settings.showSpecialActions) {
    return new Map();
  }

  const enabledSpecialActions = settings.enabledSpecialActions || {};
  const groupedActions = new Map();

  for (const action of SPECIAL_ACTIONS) {
    if (!isServiceEnabled(settings, action.serviceId) || enabledSpecialActions[action.id] === false) {
      continue;
    }

    const actions = groupedActions.get(action.serviceId) || [];
    actions.push(action);
    groupedActions.set(action.serviceId, actions);
  }

  return groupedActions;
}

function buildServiceMenuDescriptors(settings) {
  const descriptors = [];
  const specialActionsByService = getVisibleSpecialActionsByService(settings);
  const orderedServiceIds = getOrderedServiceIds(settings.serviceOrder);

  for (const serviceId of orderedServiceIds) {
    if (!isServiceEnabled(settings, serviceId)) {
      continue;
    }

    const service = SERVICES_BY_ID[serviceId];
    if (!service) {
      continue;
    }

    const serviceActions = specialActionsByService.get(serviceId) || [];

    if (serviceActions.length === 0) {
      descriptors.push({
        id: service.id,
        title: service.title,
        contexts: ["selection"]
      });
      continue;
    }

    const serviceMenuId = `${service.id}Menu`;
    descriptors.push({
      id: serviceMenuId,
      title: service.title,
      contexts: ["selection"]
    });

    descriptors.push({
      id: service.id,
      parentId: serviceMenuId,
      title: "Отправить выделенное",
      contexts: ["selection"]
    });

    for (const action of serviceActions) {
      descriptors.push({
        id: action.id,
        parentId: serviceMenuId,
        title: getCompactSpecialActionTitle(action),
        contexts: ["selection"]
      });
    }
  }

  return descriptors;
}

function buildMenuDescriptors(settings) {
  const descriptors = [];

  descriptors.push(...buildServiceMenuDescriptors(settings));

  descriptors.push({
    id: CONTEXT_ACTIONS_MENU_ID,
    title: CONTEXT_ACTIONS_MENU_TITLE,
    contexts: ["page", "link"]
  });

  for (const action of CONTEXT_ACTIONS) {
    descriptors.push({
      id: action.id,
      parentId: CONTEXT_ACTIONS_MENU_ID,
      title: action.title,
      contexts: [action.contextType]
    });
  }

  if (settings.showContextActionsQwen) {
    const enabledContextActionsQwen = settings.enabledContextActionsQwen || {};
    const visibleContextQwen = CONTEXT_ACTIONS_QWEN.filter((action) =>
      isServiceEnabled(settings, action.serviceId) && enabledContextActionsQwen[action.id] !== false
    );

    if (visibleContextQwen.length > 0) {
      descriptors.push({
        id: CONTEXT_ACTIONS_QWEN_MENU_ID,
        title: CONTEXT_ACTIONS_QWEN_MENU_TITLE,
        contexts: ["page", "link"]
      });

      for (const action of visibleContextQwen) {
        descriptors.push({
          id: action.id,
          parentId: CONTEXT_ACTIONS_QWEN_MENU_ID,
          title: action.title,
          contexts: [action.contextType]
        });
      }
    }
  }

  if (settings.showContextActionsGrok) {
    const enabledContextActionsGrok = settings.enabledContextActionsGrok || {};
    const visibleContextGrok = CONTEXT_ACTIONS_GROK.filter((action) =>
      isServiceEnabled(settings, action.serviceId) && enabledContextActionsGrok[action.id] !== false
    );

    if (visibleContextGrok.length > 0) {
      descriptors.push({
        id: CONTEXT_ACTIONS_GROK_MENU_ID,
        title: CONTEXT_ACTIONS_GROK_MENU_TITLE,
        contexts: ["page", "link"]
      });

      for (const action of visibleContextGrok) {
        descriptors.push({
          id: action.id,
          parentId: CONTEXT_ACTIONS_GROK_MENU_ID,
          title: action.title,
          contexts: [action.contextType]
        });
      }
    }
  }

  descriptors.push(...buildCustomCommandDescriptors(settings));
  descriptors.push(...buildYouTubeTemplateDescriptors(settings));

  return descriptors;
}

function listServiceOptions() {
  return SERVICE_CONFIGS.map(({ id, title }) => ({ id, title }));
}

// === settings.js ===
const SETTINGS_STORAGE_KEYS = [
  "serviceOrder",
  "enabledServices",
  "defaultServiceId",
  "showSpecialActions",
  "enabledSpecialActions",
  "showContextActionsQwen",
  "enabledContextActionsQwen",
  "showContextActionsGrok",
  "enabledContextActionsGrok",
  "customCommands",
  "activeProfileIds",
  "youtubeTemplates"
];

const SPECIAL_ACTION_IDS = SPECIAL_ACTIONS.map((action) => action.id);

function buildDefaultSpecialActions() {
  return Object.fromEntries(SPECIAL_ACTION_IDS.map((actionId) => [actionId, true]));
}

function buildDefaultContextActionsQwen() {
  return Object.fromEntries(ALL_CONTEXT_ACTION_QWEN_IDS.map((actionId) => [actionId, true]));
}

function buildDefaultContextActionsGrok() {
  return Object.fromEntries(ALL_CONTEXT_ACTION_GROK_IDS.map((actionId) => [actionId, true]));
}

function buildDefaultSettings(allServiceIds = ALL_SERVICE_IDS) {
  const enabledServices = Object.fromEntries(allServiceIds.map((serviceId) => [serviceId, true]));

  return {
    serviceOrder: [...allServiceIds],
    enabledServices,
    defaultServiceId: allServiceIds[0] || null,
    showSpecialActions: true,
    enabledSpecialActions: buildDefaultSpecialActions(),
    showContextActionsQwen: true,
    enabledContextActionsQwen: buildDefaultContextActionsQwen(),
    showContextActionsGrok: true,
    enabledContextActionsGrok: buildDefaultContextActionsGrok(),
    customCommands: [],
    activeProfileIds: [ALL_PROFILES_ID],
    youtubeTemplates: normalizeYouTubeTemplates()
  };
}

const DEFAULT_SETTINGS = buildDefaultSettings();

function normalizeSettings(rawSettings, allServiceIds = ALL_SERVICE_IDS) {
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

  const enabledSpecialFromStorage = source.enabledSpecialActions && typeof source.enabledSpecialActions === "object"
    ? source.enabledSpecialActions
    : {};

  const normalizedSpecialActions = {};
  for (const actionId of SPECIAL_ACTION_IDS) {
    normalizedSpecialActions[actionId] = typeof enabledSpecialFromStorage[actionId] === "boolean"
      ? enabledSpecialFromStorage[actionId]
      : true;
  }

  const enabledContextQwenFromStorage = source.enabledContextActionsQwen && typeof source.enabledContextActionsQwen === "object"
    ? source.enabledContextActionsQwen
    : {};

  const normalizedContextActionsQwen = {};
  for (const actionId of ALL_CONTEXT_ACTION_QWEN_IDS) {
    normalizedContextActionsQwen[actionId] = typeof enabledContextQwenFromStorage[actionId] === "boolean"
      ? enabledContextQwenFromStorage[actionId]
      : true;
  }

  const enabledContextGrokFromStorage = source.enabledContextActionsGrok && typeof source.enabledContextActionsGrok === "object"
    ? source.enabledContextActionsGrok
    : {};

  const normalizedContextActionsGrok = {};
  for (const actionId of ALL_CONTEXT_ACTION_GROK_IDS) {
    normalizedContextActionsGrok[actionId] = typeof enabledContextGrokFromStorage[actionId] === "boolean"
      ? enabledContextGrokFromStorage[actionId]
      : true;
  }

  return {
    serviceOrder: normalizedOrder,
    enabledServices: normalizedEnabled,
    defaultServiceId: hasValidDefault ? source.defaultServiceId : fallbackDefaultId,
    showSpecialActions: source.showSpecialActions !== false,
    enabledSpecialActions: normalizedSpecialActions,
    showContextActionsQwen: source.showContextActionsQwen !== false,
    enabledContextActionsQwen: normalizedContextActionsQwen,
    showContextActionsGrok: source.showContextActionsGrok !== false,
    enabledContextActionsGrok: normalizedContextActionsGrok,
    customCommands: normalizeCustomCommands(source.customCommands, allServiceIds),
    activeProfileIds: normalizeActiveProfileIds(source.activeProfileIds),
    youtubeTemplates: normalizeYouTubeTemplates(source.youtubeTemplates)
  };
}

// === youtube.js ===
const ALLOWED_YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);

function normalizeYouTubeUrl(linkUrl) {
  let url;

  try {
    url = new URL(linkUrl);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();

  if (host === "youtu.be") {
    const videoId = url.pathname.split("/").filter(Boolean)[0];
    if (!videoId) {
      return null;
    }

    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  if (!ALLOWED_YOUTUBE_HOSTS.has(host)) {
    return null;
  }

  if (url.pathname === "/watch") {
    const videoId = url.searchParams.get("v");
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
  }

  const keepParams = ["v", "list", "index"];
  const filteredParams = new URLSearchParams();
  for (const param of keepParams) {
    const value = url.searchParams.get(param);
    if (value) {
      filteredParams.set(param, value);
    }
  }

  const normalizedBase = `https://www.youtube.com${url.pathname}`;
  const normalizedQuery = filteredParams.toString();
  return normalizedQuery ? `${normalizedBase}?${normalizedQuery}` : normalizedBase;
}

function buildYouTubePrompt(cleanUrl) {
  return (
    cleanUrl +
    "\n\nТы — профессиональный редактор, литературный обработчик и специалист по восстановлению текста из автоматических транскрипций." +
    "\n\nТвоя задача — взять сырую транскрипцию видеоролика и превратить её в полноценную, грамотную, удобную для чтения статью на русском языке." +
    "\n\n## Ключевой принцип" +
    "\n\nТекст нельзя сокращать по смыслу." +
    "\n\nТвоя задача — не сделать краткий пересказ, не выжать суть и не подготовить саммари, а максимально полно перенести содержание исходной транскрипции в литературно обработанную статью." +
    "\n\nНужно сохранить и извлечь из исходного текста:" +
    "\n- все факты;" +
    "\n- все объяснения;" +
    "\n- все аргументы;" +
    "\n- все примеры;" +
    "\n- все причинно-следственные связи;" +
    "\n- все важные уточнения;" +
    "\n- все имена, даты, числа, термины и названия;" +
    "\n- все смысловые переходы;" +
    "\n- все выводы автора;" +
    "\n- все дополнительные замечания, если они несут смысловую нагрузку." +
    "\n\nДопускается убирать только явный речевой мусор: повторы, сбивки, слова-паразиты, незавершённые дублирующиеся фразы и ошибки автоматической транскрибации. Но нельзя удалять содержательные фрагменты только потому, что они кажутся второстепенными." +
    "\n\n## Входные данные" +
    "\n\nЯ дам тебе текст, полученный из автоматической транскрибации видеоролика. В нём могут быть:" +
    "\n- ошибки распознавания речи;" +
    "\n- неправильные слова;" +
    "\n- пропущенные знаки препинания;" +
    "\n- повторы;" +
    "\n- разговорные сбивки;" +
    "\n- паразитные слова;" +
    "\n- обрывки фраз;" +
    "\n- неправильное деление на предложения;" +
    "\n- отсутствие абзацев;" +
    "\n- неверные имена, термины или названия;" +
    "\n- путаница из-за плохого качества звука." +
    "\n\n## Твоя задача" +
    "\n\nПреобразуй транскрипцию в полноценный литературно обработанный текст на русском языке." +
    "\n\nСделай следующее:" +
    "\n1. Исправь ошибки автоматической транскрибации." +
    "\n2. Восстанови правильную пунктуацию." +
    "\n3. Разбей текст на логичные абзацы." +
    "\n4. Удали явные повторы, речевые сбивки и паразитные конструкции." +
    "\n5. Сохрани исходный смысл, факты, аргументы и последовательность мысли автора." +
    "\n6. Не добавляй новых фактов от себя, если их нет в исходном тексте." +
    "\n7. Если какое-то место неясно, аккуратно переформулируй его по смыслу, не искажая содержание." +
    "\n8. Оформи итоговый текст как удобную читаемую статью." +
    "\n9. Добавь информативный заголовок." +
    "\n10. Добавь подзаголовки по смысловым блокам." +
    "\n11. Сделай текст плавным, связным и литературным." +
    "\n12. Сохрани естественный стиль автора, но убери небрежность устной речи." +
    "\n13. Не сокращай важные объяснения." +
    "\n14. Не превращай текст в краткое саммари — нужна именно полноценная статья на основе транскрипции." +
    "\n15. Если в тексте есть термины, имена, даты, названия или числа — сохрани их максимально точно." +
    "\n16. Если есть очевидная ошибка распознавания термина, исправь её." +
    "\n17. Если исправление неочевидно, оставь нейтральную формулировку без выдумывания." +
    "\n18. Убери фразы вроде: «в этом видео», «как вы видите», «сейчас мы поговорим», если они мешают статье, но сохрани их смысл, если они важны для структуры." +
    "\n19. Не добавляй вступление от себя." +
    "\n20. Не пиши комментарии о проделанной работе — выдай только готовый обработанный текст." +
    "\n21. Перед финальной выдачей проверь, что ни один содержательный тезис исходной транскрипции не был потерян." +
    "\n22. Если в исходном тексте есть несколько близких по смыслу повторов, объедини их аккуратно, но сохрани всю уникальную информацию из каждого повтора." +
    "\n23. Если автор несколько раз возвращается к одной мысли с новыми деталями, не удаляй эти детали — встрои их в соответствующий раздел статьи." +
    "\n24. Если в тексте есть длинные рассуждения, сохрани их логику полностью, а не заменяй одним коротким выводом." +
    "\n25. Если в транскрипции есть перечисления, сохрани все пункты перечисления." +
    "\n26. Если в транскрипции есть оговорки, сомнения, уточнения или противопоставления, сохрани их, если они влияют на смысл." +
    "\n\n## Стиль результата" +
    "\n\nТекст должен быть:" +
    "\n- грамотным;" +
    "\n- связным;" +
    "\n- литературно обработанным;" +
    "\n- понятным широкой аудитории;" +
    "\n- структурированным;" +
    "\n- удобным для публикации в блоге, статье, Дзене, Telegram-канале или на сайте." +
    "\n\n## Формат вывода" +
    "\n\nВыведи результат в следующем виде:" +
    "\n\n# Заголовок статьи" +
    "\n\nКраткое вступление на 1–2 абзаца, если оно логично вытекает из исходного текста." +
    "\n\n## Первый подзаголовок" +
    "\n\nТекст раздела." +
    "\n\n## Второй подзаголовок" +
    "\n\nТекст раздела." +
    "\n\n## Третий подзаголовок" +
    "\n\nТекст раздела." +
    "\n\nИ так далее, пока весь материал не будет обработан." +
    "\n\n## Важные ограничения" +
    "\n\n- Не искажай смысл автора." +
    "\n- Не добавляй факты, которых нет в исходной транскрипции." +
    "\n- Не делай пересказ вместо полноценной обработки." +
    "\n- Не сокращай текст по смыслу." +
    "\n- Не удаляй факты, примеры, уточнения и второстепенные, но содержательные детали." +
    "\n- Не заменяй длинное объяснение коротким выводом." +
    "\n- Не оставляй текст в виде сырой расшифровки." +
    "\n- Не используй маркированные списки без необходимости." +
    "\n- Не пиши: «Вот исправленный текст» или «Конечно, я помогу»." +
    "\n- Сразу начинай с готовой статьи." +
    "\n\n## Самопроверка перед ответом" +
    "\n\nПеред тем как выдать финальный результат, мысленно проверь:" +
    "\n1. Все ли факты из транскрипции перенесены в статью?" +
    "\n2. Не исчезли ли примеры, уточнения и оговорки?" +
    "\n3. Не превратился ли текст в краткий пересказ?" +
    "\n4. Не были ли удалены смысловые блоки только ради компактности?" +
    "\n5. Сохранилась ли логика автора от начала до конца?" +
    "\n6. Исправлены ли ошибки транскрибации без выдумывания новых фактов?" +
    "\n7. Получился ли текст полноценной статьёй, а не набором исправленных фраз?"
  );
}

function buildYouTubeSummaryPrompt(cleanUrl) {
  return (
    cleanUrl +
    "\n\nТы — профессиональный редактор и аналитик видео-транскрипций." +
    "\n\nТвоя задача — подготовить краткое резюме видеоролика на русском языке по его транскрипции." +
    "\n\nСделай следующее:" +
    "\n1. Кратко перечисли все основные факты и смысловые выводы из видео." +
    "\n2. Сохрани все важные имена, даты, числа, термины и названия." +
    "\n3. Не добавляй новых фактов от себя." +
    "\n4. Не пиши полноценную статью и не растягивай текст." +
    "\n5. Сфокусируйся на сути, чтобы результат можно было быстро прочитать и понять." +
    "\n6. Если в транскрипции есть причины, следствия, выводы или оговорки, обязательно включи их в резюме." +
    "\n7. Убери речевой мусор, повторы и лишние вступления." +
    "\n8. Оформи результат в виде компактного, но содержательного резюме." +
    "\n\nФормат вывода:" +
    "\n- Короткий заголовок." +
    "\n- Далее 5-10 кратких абзацев или маркированных пунктов с основными фактами." +
    "\n- Если видео содержит несколько тем, сгруппируй факты по темам." +
    "\n\nВажно:" +
    "\n- Не превращай резюме в статью." +
    "\n- Не выдумывай детали, которых нет в исходной транскрипции." +
    "\n- Не теряй ключевые факты и выводы." +
    "\n- Сразу начинай с готового результата."
  );
}

// === background.js ===
const ACTION_DEFAULT_TITLE = "Send to AI";
const STATUS_CLEAR_DELAY_MS = 5000;
const PAGE_TEXT_MAX_LENGTH = 30000;

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

function queryTabs(queryInfo) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(tabs || []);
    });
  });
}

function updateWindow(windowId, updateInfo) {
  return new Promise((resolve, reject) => {
    chrome.windows.update(windowId, updateInfo, (window) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(window);
    });
  });
}

function updateTab(tabId, updateProperties) {
  return new Promise((resolve, reject) => {
    chrome.tabs.update(tabId, updateProperties, (tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(tab);
    });
  });
}

function createWindow(createData) {
  return new Promise((resolve, reject) => {
    chrome.windows.create(createData, (window) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(window);
    });
  });
}

function removeAllMenus() {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.removeAll(() => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

function executeScript(tabId, text, profile) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: insertTextIntoPage,
        args: [text, profile || {}]
      },
      (results) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve(results?.[0]?.result || { status: "unknown" });
      }
    );
  });
}

function executePageExtraction(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: extractVisiblePageText,
        args: [{ maxTextLength: PAGE_TEXT_MAX_LENGTH }]
      },
      (results) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve(results?.[0]?.result || { status: "empty", text: "" });
      }
    );
  });
}

async function loadSettings() {
  try {
    const storedSettings = await storageGet(SETTINGS_STORAGE_KEYS);
    return normalizeSettings(storedSettings);
  } catch (error) {
    console.warn("storage.sync.get error:", error.message);
    return DEFAULT_SETTINGS;
  }
}

function safeCreateContextMenu(options) {
  chrome.contextMenus.create(options, () => {
    if (chrome.runtime.lastError) {
      console.warn(`contextMenus.create error for ${options.id}:`, chrome.runtime.lastError.message);
    }
  });
}

async function rebuildContextMenus() {
  const settings = await loadSettings();

  try {
    await removeAllMenus();
  } catch (error) {
    console.warn("contextMenus.removeAll error:", error.message);
  }

  for (const descriptor of buildMenuDescriptors(settings)) {
    safeCreateContextMenu(descriptor);
  }
}

function pickMostRecentTab(tabs) {
  return [...tabs].sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
}

function clearActionStatus() {
  chrome.action.setBadgeText({ text: "" });
  chrome.action.setTitle({ title: ACTION_DEFAULT_TITLE });
}

function getActionStatusTitle(result) {
  if (result.status === "success") {
    return "Текст успешно вставлен";
  }

  if (result.status === "unsupported_link") {
    return "Команда доступна только для ссылок YouTube";
  }

  if (result.status === "page_text_empty") {
    return "Не удалось извлечь текст страницы";
  }

  if (result.status === "input_not_found") {
    return "Страница открылась, но поле ввода не найдено";
  }

  if (result.status === "insert_failed") {
    return "Поле найдено, но вставка не удалась";
  }

  return getDiagnosticStatusTitle(result.status);
}

function showActionStatus(result) {
  const isSuccess = result.status === "success";
  const badgeText = isSuccess ? "OK" : "ERR";
  const badgeColor = isSuccess ? "#166534" : "#b91c1c";
  const title = getActionStatusTitle(result);

  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setTitle({ title });

  setTimeout(clearActionStatus, STATUS_CLEAR_DELAY_MS);
}

async function logDiagnosticIfNeeded(result, context = {}) {
  if (!result || result.status === "success") {
    return;
  }

  try {
    await appendDiagnosticsLog({
      status: result.status || "unknown",
      serviceId: context.service?.id || context.serviceId || "",
      serviceTitle: context.service?.title || context.serviceTitle || "",
      actionId: context.actionId || "",
      actionTitle: context.actionTitle || "",
      selector: result.selector || "",
      tagName: result.tagName || "",
      url: result.url || context.url || "",
      message: context.message || getActionStatusTitle(result),
      details: {
        method: result.method || "",
        elapsedMs: result.elapsedMs || 0,
        expectedLength: result.expectedLength || 0,
        actualLength: result.actualLength || 0,
        attemptedSelectors: result.attemptedSelectors || [],
        timeoutMs: result.timeoutMs || 0
      }
    });
  } catch (error) {
    console.warn("Diagnostics log failed:", error.message);
  }
}

async function focusTabAndInsert(tab, text, profile) {
  if (!tab?.id || !tab.windowId) {
    return { status: "tab_unavailable" };
  }

  await updateWindow(tab.windowId, { focused: true });
  await updateTab(tab.id, { active: true });
  return executeScript(tab.id, text, profile);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForTabComplete(tabId, timeoutMs = 15000) {
  return new Promise((resolve) => {
    let finished = false;

    const finish = () => {
      if (finished) {
        return;
      }

      finished = true;
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    };

    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId !== tabId || changeInfo.status !== "complete") {
        return;
      }

      finish();
    };

    chrome.tabs.onUpdated.addListener(listener);

    // Tab may already have reached "complete" before the listener was attached
    // (e.g. fast/cached load). Check its current status to avoid the full timeout.
    chrome.tabs.get(tabId, (tab) => {
      if (finished) {
        return;
      }

      if (chrome.runtime.lastError) {
        finish();
        return;
      }

      if (tab && tab.status === "complete") {
        finish();
      }
    });

    setTimeout(finish, timeoutMs);
  });
}

async function openAndInsertText(service, text) {
  const tabs = await queryTabs({ url: service.urlPattern });

  if (tabs.length > 0) {
    const targetTab = pickMostRecentTab(tabs);
    return focusTabAndInsert(targetTab, text, service.profile);
  }

  const newWindow = await createWindow({
    url: service.newUrl,
    type: "popup",
    width: 1200,
    height: 800
  });

  const newTab = newWindow?.tabs?.[0];
  if (!newTab?.id) {
    return { status: "tab_unavailable" };
  }

  await waitForTabComplete(newTab.id);

  const delayMs = Number(service.profile?.delayMs) > 0 ? Number(service.profile.delayMs) : 0;
  if (delayMs > 0) {
    await delay(delayMs);
  }

  return executeScript(newTab.id, text, service.profile);
}

async function runServiceAction(service, text, context = {}) {
  try {
    const result = await openAndInsertText(service, text);
    showActionStatus(result);
    await logDiagnosticIfNeeded(result, { ...context, service });
    return result;
  } catch (error) {
    console.warn("Service action failed:", error.message);
    const result = { status: "error", message: error.message };
    showActionStatus(result);
    await logDiagnosticIfNeeded(result, { ...context, service, message: error.message });
    return result;
  }
}

function resolveYouTubeTemplateId(menuItemId) {
  if (menuItemId === YOUTUBE_MENU_IDS.article) {
    return "article";
  }

  if (menuItemId === YOUTUBE_MENU_IDS.summary) {
    return "summary";
  }

  if (typeof menuItemId === "string" && menuItemId.startsWith(YOUTUBE_MENU_ID_PREFIX)) {
    return menuItemId.slice(YOUTUBE_MENU_ID_PREFIX.length);
  }

  return null;
}

async function handleYouTubeTemplateAction(linkUrl, templateId, settings) {
  const cleanUrl = normalizeYouTubeUrl(linkUrl);
  if (!cleanUrl) {
    const result = { status: "unsupported_link" };
    showActionStatus(result);
    await logDiagnosticIfNeeded(result, {
      actionId: `youtube:${templateId}`,
      actionTitle: "YouTube command",
      url: linkUrl
    });
    return;
  }

  const template = getYouTubeTemplateById(settings.youtubeTemplates, templateId);
  if (!template || template.enabled === false) {
    const result = { status: "command_invalid" };
    showActionStatus(result);
    await logDiagnosticIfNeeded(result, {
      actionId: `youtube:${templateId}`,
      actionTitle: "YouTube command",
      url: cleanUrl
    });
    return;
  }

  const targetService = SERVICES_BY_ID[template.serviceId];
  if (!targetService || settings.enabledServices[targetService.id] === false) {
    const result = { status: targetService ? "service_disabled" : "service_not_found" };
    showActionStatus(result);
    await logDiagnosticIfNeeded(result, {
      actionId: `youtube:${template.id}`,
      actionTitle: template.title,
      serviceId: template.serviceId,
      serviceTitle: targetService?.title || "",
      url: cleanUrl
    });
    return;
  }

  const textToInsert = renderYouTubeTemplate(template, { youtubeUrl: cleanUrl });
  if (!textToInsert) {
    const result = { status: "command_invalid" };
    showActionStatus(result);
    await logDiagnosticIfNeeded(result, {
      actionId: `youtube:${template.id}`,
      actionTitle: template.title,
      service: targetService,
      url: cleanUrl
    });
    return;
  }

  await runServiceAction(targetService, textToInsert, {
    actionId: `youtube:${template.id}`,
    actionTitle: template.title,
    url: cleanUrl
  });
}

async function handleContextAction(action, info, tab) {
  const sourceUrl = action.contextType === "page"
    ? info.pageUrl || tab?.url || ""
    : info.linkUrl || tab?.url || "";

  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
    const result = { status: "unsupported_link" };
    showActionStatus(result);
    await logDiagnosticIfNeeded(result, {
      actionId: action.id,
      actionTitle: action.title,
      url: sourceUrl
    });
    return;
  }

  const targetService = SERVICES_BY_ID[action.serviceId];
  if (!targetService) {
    const result = { status: "service_not_found" };
    showActionStatus(result);
    await logDiagnosticIfNeeded(result, {
      actionId: action.id,
      actionTitle: action.title,
      serviceId: action.serviceId,
      url: sourceUrl
    });
    return;
  }

  const textToInsert = buildPageOrLinkPrompt(action.contextType, action.actionType, sourceUrl, tab?.title || "");
  if (!textToInsert) {
    const result = { status: "command_invalid" };
    showActionStatus(result);
    await logDiagnosticIfNeeded(result, {
      actionId: action.id,
      actionTitle: action.title,
      service: targetService,
      url: sourceUrl
    });
    return;
  }

  await runServiceAction(targetService, textToInsert, {
    actionId: action.id,
    actionTitle: action.title,
    url: sourceUrl
  });
}

async function buildExtraCustomCommandContext(command, tab) {
  if (command.contextType !== "page_text") {
    return {};
  }

  if (!tab?.id) {
    return { pageText: "" };
  }

  try {
    const result = await executePageExtraction(tab.id);
    if (!result.text) {
      showActionStatus({ status: "page_text_empty" });
      return null;
    }

    return {
      pageText: result.text,
      selection: result.selection || "",
      url: result.url || tab.url || "",
      title: result.title || tab.title || "",
      pageDescription: result.description || "",
      pageTextWasTruncated: result.wasTruncated ? "true" : "false"
    };
  } catch (error) {
    console.warn("Page text extraction failed:", error.message);
    showActionStatus({ status: "page_text_empty" });
    return null;
  }
}

async function handleCustomCommand(command, settings, info, tab) {
  const targetService = SERVICES_BY_ID[command.serviceId];
  if (!targetService || settings.enabledServices[targetService.id] === false) {
    const result = { status: targetService ? "service_disabled" : "service_not_found" };
    showActionStatus(result);
    await logDiagnosticIfNeeded(result, {
      actionId: command.id,
      actionTitle: command.title,
      serviceId: command.serviceId,
      serviceTitle: targetService?.title || "",
      url: info.pageUrl || tab?.url || ""
    });
    return;
  }

  const extraContext = await buildExtraCustomCommandContext(command, tab);
  if (extraContext === null) {
    await logDiagnosticIfNeeded({ status: "page_text_empty" }, {
      actionId: command.id,
      actionTitle: command.title,
      service: targetService,
      url: info.pageUrl || tab?.url || ""
    });
    return;
  }

  const sourceContext = getCustomCommandSourceContext(command, info, tab, {
    ...extraContext,
    service: targetService.title
  });
  const textToInsert = buildCustomCommandPrompt(command, sourceContext);

  if (!textToInsert) {
    const result = { status: "command_invalid" };
    showActionStatus(result);
    await logDiagnosticIfNeeded(result, {
      actionId: command.id,
      actionTitle: command.title,
      service: targetService,
      url: sourceContext.url
    });
    return;
  }

  await runServiceAction(targetService, textToInsert, {
    actionId: command.id,
    actionTitle: command.title,
    url: sourceContext.url
  });
}

chrome.runtime.onInstalled.addListener(() => {
  rebuildContextMenus();
  clearActionStatus();
});

chrome.runtime.onStartup.addListener(() => {
  rebuildContextMenus();
  clearActionStatus();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") {
    return;
  }

  const shouldRebuild = SETTINGS_STORAGE_KEYS.some((key) => Object.prototype.hasOwnProperty.call(changes, key));
  if (shouldRebuild) {
    rebuildContextMenus();
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const settings = await loadSettings();
  const customCommand = settings.customCommands.find((command) => command.id === info.menuItemId);
  if (customCommand) {
    await handleCustomCommand(customCommand, settings, info, tab);
    return;
  }

  const contextAction = CONTEXT_ACTIONS_BY_ID[info.menuItemId] || CONTEXT_ACTIONS_QWEN_BY_ID[info.menuItemId] || CONTEXT_ACTIONS_GROK_BY_ID[info.menuItemId];
  if (contextAction) {
    await handleContextAction(contextAction, info, tab);
    return;
  }

  const youtubeTemplateId = resolveYouTubeTemplateId(info.menuItemId);
  if (youtubeTemplateId) {
    await handleYouTubeTemplateAction(info.linkUrl || "", youtubeTemplateId, settings);
    return;
  }

  if (!info.selectionText) {
    return;
  }

  if (info.menuItemId === QUICK_DEFAULT_MENU_ID) {
    if (!settings.defaultServiceId) {
      return;
    }

    const defaultService = SERVICES_BY_ID[settings.defaultServiceId];
    if (!defaultService || settings.enabledServices[defaultService.id] === false) {
      return;
    }

    await runServiceAction(defaultService, info.selectionText, {
      actionId: QUICK_DEFAULT_MENU_ID,
      actionTitle: "Отправить в сервис по умолчанию",
      url: info.pageUrl || tab?.url || ""
    });
    return;
  }

  const directService = SERVICES_BY_ID[info.menuItemId];
  if (directService) {
    if (settings.enabledServices[directService.id] === false) {
      return;
    }

    await runServiceAction(directService, info.selectionText, {
      actionId: directService.id,
      actionTitle: directService.title,
      url: info.pageUrl || tab?.url || ""
    });
    return;
  }

  const specialAction = SPECIAL_ACTIONS_BY_ID[info.menuItemId];
  if (!specialAction) {
    return;
  }

  const targetService = SERVICES_BY_ID[specialAction.serviceId];
  if (!targetService || settings.enabledServices[targetService.id] === false) {
    const result = { status: targetService ? "service_disabled" : "service_not_found" };
    showActionStatus(result);
    await logDiagnosticIfNeeded(result, {
      actionId: specialAction.id,
      actionTitle: specialAction.title,
      serviceId: specialAction.serviceId,
      serviceTitle: targetService?.title || "",
      url: info.pageUrl || tab?.url || ""
    });
    return;
  }

  await runServiceAction(targetService, specialAction.transformText(info.selectionText), {
    actionId: specialAction.id,
    actionTitle: specialAction.title,
    url: info.pageUrl || tab?.url || ""
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "runServiceAction") {
    return false;
  }

  const service = SERVICES_BY_ID[message.serviceId];
  if (!service || typeof message.text !== "string" || message.text.trim().length === 0) {
    sendResponse({ status: "error" });
    return false;
  }

  runServiceAction(service, message.text, {
    actionId: "popup",
    actionTitle: "Popup quick send",
    url: sender?.tab?.url || ""
  })
    .then((result) => sendResponse(result))
    .catch((error) => {
      console.warn("Popup service action failed:", error.message);
      sendResponse({ status: "error" });
    });

  return true;
});
