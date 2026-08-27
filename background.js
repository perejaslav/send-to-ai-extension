import {
  buildCustomCommandPrompt,
  getCustomCommandSourceContext
} from "./custom-commands.js";
import { appendDiagnosticsLog, getDiagnosticStatusTitle } from "./diagnostics.js";
import { insertTextIntoPage } from "./insertion.js";
import { extractVisiblePageText } from "./page-extractor.js";
import { buildPageOrLinkPrompt } from "./context-prompts.js";
import { buildMenuDescriptors } from "./menus.js";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEYS, normalizeSettings } from "./settings.js";
import {
  QUICK_DEFAULT_MENU_ID,
  CONTEXT_ACTIONS_BY_ID,
  CONTEXT_ACTIONS_QWEN_BY_ID,
  CONTEXT_ACTIONS_GROK_BY_ID,
  SERVICES_BY_ID,
  SPECIAL_ACTIONS_BY_ID,
  YOUTUBE_MENU_ID_PREFIX,
  YOUTUBE_MENU_IDS
} from "./services.js";
import { normalizeYouTubeUrl } from "./youtube.js";
import { getYouTubeTemplateById, renderYouTubeTemplate } from "./youtube-templates.js";
import { getApiKey } from "./ai-secrets.js";
import { sendChatRequest } from "./ai-transport.js";
import { getOverlayHistory, appendOverlayMessage, clearOverlayHistory, trimHistory } from "./overlay-state.js";

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

function isInjectableUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

async function injectFloatingOverlay(tabId, prompt) {
  if (!tabId) {
    return { status: "tab_unavailable" };
  }

  let tab;
  try {
    tab = await new Promise((resolve, reject) => {
      chrome.tabs.get(tabId, (t) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(t);
      });
    });
  } catch {
    return { status: "tab_unavailable" };
  }

  if (!tab || !isInjectableUrl(tab.url)) {
    return { status: "unsupported_page", message: "Мини-чат нельзя открыть на системной странице браузера." };
  }

  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["floating-overlay.js"] });
  } catch (error) {
    // File injection may fail if already injected or permission issue; try to continue
    if (!error.message.includes("already") && !error.message.includes("Cannot access")) {
      // still attempt func injection
    }
  }

  try {
    const results = await new Promise((resolve, reject) => {
      chrome.scripting.executeScript(
        {
          target: { tabId },
          func: (p) => {
            try {
              const api = globalThis.__sendToAiOverlay || window.__sendToAiOverlay;
              if (api && api.ensureFloatingOverlay) {
                api.ensureFloatingOverlay(p);
                return { ok: true };
              }
              return { ok: false, error: "overlay api not found" };
            } catch (e) {
              return { ok: false, error: e.message };
            }
          },
          args: [prompt || ""]
        },
        (res) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve(res);
        }
      );
    });
    const ok = results?.[0]?.result?.ok;
    if (ok) return { status: "success" };
    return { status: "injection_failed", message: results?.[0]?.result?.error || "overlay injection failed" };
  } catch (error) {
    return { status: "injection_failed", message: error.message };
  }
}

async function dispatchPrompt({ tab, prompt, service, settings, context }) {
  const mode = settings.interactionMode || "legacy";
  if (mode === "overlay") {
    const tabId = tab?.id;
    if (!tabId) {
      const result = { status: "tab_unavailable" };
      showActionStatus(result);
      await logDiagnosticIfNeeded(result, { ...context, service });
      return result;
    }
    const result = await injectFloatingOverlay(tabId, prompt);
    if (result.status === "success") {
      showActionStatus(result);
      // Phase 4+ will handle autoSend via AI transport; for now just show prompt in composer
      if (settings.overlayMode?.autoSend) {
        // placeholder for future autoSend trigger
      }
    } else if (result.status === "unsupported_page") {
      chrome.action.setBadgeBackgroundColor({ color: "#b91c1c" });
      chrome.action.setBadgeText({ text: "ERR" });
      chrome.action.setTitle({ title: result.message });
      setTimeout(clearActionStatus, STATUS_CLEAR_DELAY_MS);
      await logDiagnosticIfNeeded(result, { ...context, service });
    } else {
      showActionStatus(result);
      await logDiagnosticIfNeeded(result, { ...context, service });
    }
    return result;
  }

  // Legacy flow
  return runServiceAction(service, prompt, context, settings);
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

async function handleYouTubeTemplateAction(linkUrl, templateId, settings, tab) {
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

  const context = {
    actionId: `youtube:${template.id}`,
    actionTitle: template.title,
    url: cleanUrl
  };

  if (settings.interactionMode === "overlay") {
    await dispatchPrompt({ tab, prompt: textToInsert, service: targetService, settings, context });
    return;
  }

  await runServiceAction(targetService, textToInsert, context);
}

async function handleContextAction(action, info, tab, settings) {
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

  const context = {
    actionId: action.id,
    actionTitle: action.title,
    url: sourceUrl
  };

  if (settings && settings.interactionMode === "overlay") {
    await dispatchPrompt({ tab, prompt: textToInsert, service: targetService, settings, context });
    return;
  }

  await runServiceAction(targetService, textToInsert, context);
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

  const context = {
    actionId: command.id,
    actionTitle: command.title,
    url: sourceContext.url
  };

  if (settings.interactionMode === "overlay") {
    await dispatchPrompt({ tab, prompt: textToInsert, service: targetService, settings, context });
    return;
  }

  await runServiceAction(targetService, textToInsert, context);
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
    await handleContextAction(contextAction, info, tab, settings);
    return;
  }

  const youtubeTemplateId = resolveYouTubeTemplateId(info.menuItemId);
  if (youtubeTemplateId) {
    await handleYouTubeTemplateAction(info.linkUrl || "", youtubeTemplateId, settings, tab);
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

    const quickContext = {
      actionId: QUICK_DEFAULT_MENU_ID,
      actionTitle: "Отправить в сервис по умолчанию",
      url: info.pageUrl || tab?.url || ""
    };

    if (settings.interactionMode === "overlay") {
      await dispatchPrompt({ tab, prompt: info.selectionText, service: defaultService, settings, context: quickContext });
      return;
    }

    await runServiceAction(defaultService, info.selectionText, quickContext);
    return;
  }

  const directService = SERVICES_BY_ID[info.menuItemId];
  if (directService) {
    if (settings.enabledServices[directService.id] === false) {
      return;
    }

    const directContext = {
      actionId: directService.id,
      actionTitle: directService.title,
      url: info.pageUrl || tab?.url || ""
    };

    if (settings.interactionMode === "overlay") {
      await dispatchPrompt({ tab, prompt: info.selectionText, service: directService, settings, context: directContext });
      return;
    }

    await runServiceAction(directService, info.selectionText, directContext);
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

  const specialPrompt = specialAction.transformText(info.selectionText);
  const specialContext = {
    actionId: specialAction.id,
    actionTitle: specialAction.title,
    url: info.pageUrl || tab?.url || ""
  };

  if (settings.interactionMode === "overlay") {
    await dispatchPrompt({ tab, prompt: specialPrompt, service: targetService, settings, context: specialContext });
    return;
  }

  await runServiceAction(targetService, specialPrompt, specialContext);
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

  (async () => {
    try {
      const settings = await loadSettings();
      if (settings.interactionMode === "overlay" && sender?.tab?.id) {
        const result = await dispatchPrompt({
          tab: sender.tab,
          prompt: message.text,
          service,
          settings,
          context: {
            actionId: "popup",
            actionTitle: "Popup quick send",
            url: sender?.tab?.url || ""
          }
        });
        sendResponse(result);
        return;
      }

      const result = await runServiceAction(service, message.text, {
        actionId: "popup",
        actionTitle: "Popup quick send",
        url: sender?.tab?.url || ""
      });
      sendResponse(result);
    } catch (error) {
      console.warn("Popup service action failed:", error.message);
      sendResponse({ status: "error" });
    }
  })();

  return true;
});

const overlayAbortControllers = new Map();

function getOverlayRequestKey(tabId, requestId) {
  return `${tabId}:${requestId}`;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string" || !message.type.startsWith("overlay.chat.")) {
    return false;
  }

  const tabId = sender?.tab?.id ?? message.tabId ?? null;

  if (message.type === "overlay.chat.history") {
    (async () => {
      try {
        const settings = await loadSettings();
        // If rememberConversation is false, return empty
        if (settings.overlayMode && settings.overlayMode.rememberConversation === false) {
          sendResponse({ messages: [], model: settings.aiProvider?.model || "" });
          return;
        }
        if (typeof tabId !== "number") {
          sendResponse({ messages: [], model: "" });
          return;
        }
        const history = await getOverlayHistory(tabId);
        sendResponse({ messages: history.messages || [], model: history.model || settings.aiProvider?.model || "" });
      } catch (e) {
        sendResponse({ messages: [], model: "" });
      }
    })();
    return true;
  }

  if (message.type === "overlay.chat.clear") {
    (async () => {
      try {
        if (typeof tabId === "number") {
          await clearOverlayHistory(tabId);
        }
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
    })();
    return true;
  }

  if (message.type === "overlay.chat.abort") {
    const key = getOverlayRequestKey(tabId, message.requestId);
    const controller = overlayAbortControllers.get(key);
    if (controller) {
      try { controller.abort(); } catch {}
      overlayAbortControllers.delete(key);
    }
    // Also try generic tab key
    const genericKey = String(tabId);
    const generic = overlayAbortControllers.get(genericKey);
    if (generic) {
      try { generic.abort(); } catch {}
      overlayAbortControllers.delete(genericKey);
    }
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "overlay.chat.send") {
    (async () => {
      const requestId = message.requestId || String(Date.now());
      const prompt = typeof message.prompt === "string" ? message.prompt : "";
      if (!prompt.trim()) {
        sendResponse({ ok: false, error: "Пустой промпт" });
        return;
      }
      if (typeof tabId !== "number") {
        sendResponse({ ok: false, error: "tabId required" });
        return;
      }

      let settings;
      try {
        settings = await loadSettings();
      } catch {
        sendResponse({ ok: false, error: "Не удалось загрузить настройки" });
        return;
      }

      const provider = settings.aiProvider;
      if (!provider || !provider.baseUrl || !provider.model) {
        sendResponse({ ok: false, error: "AI для мини-чата ещё не настроен. Открой настройки и укажи Base URL и Model." });
        return;
      }

      let apiKey = "";
      try {
        apiKey = await getApiKey();
      } catch {}
      if (!apiKey) {
        sendResponse({ ok: false, error: "API key отсутствует. Добавь ключ в настройках AI." });
        return;
      }

      // Check optional host permission for baseUrl origin
      try {
        const origin = new URL(provider.baseUrl).origin + "/*";
        const hasPerm = await new Promise((resolve) => {
          if (!chrome.permissions) { resolve(true); return; }
          chrome.permissions.contains({ origins: [origin] }, (result) => {
            if (chrome.runtime.lastError) resolve(true);
            else resolve(result);
          });
        });
        if (!hasPerm) {
          sendResponse({ ok: false, error: `Нет разрешения для ${origin}. Открой настройки и разреши доступ к API.` });
          return;
        }
      } catch {}

      // Load history and append user prompt
      let history;
      try {
        history = await getOverlayHistory(tabId);
      } catch {
        history = { messages: [] };
      }

      const userMessages = [...(history.messages || []), { role: "user", content: prompt }];
      const messagesForApi = trimHistory(userMessages);

      const controller = new AbortController();
      const key = getOverlayRequestKey(tabId, requestId);
      overlayAbortControllers.set(key, controller);
      overlayAbortControllers.set(String(tabId), controller);

      try {
        const result = await sendChatRequest({ provider, apiKey, messages: messagesForApi, signal: controller.signal });
        // Append assistant response to history
        await appendOverlayMessage(tabId, "user", prompt, provider.model);
        await appendOverlayMessage(tabId, "assistant", result.text, result.model || provider.model);

        overlayAbortControllers.delete(key);
        overlayAbortControllers.delete(String(tabId));

        sendResponse({ ok: true, text: result.text, usage: result.usage, model: result.model });
      } catch (error) {
        overlayAbortControllers.delete(key);
        overlayAbortControllers.delete(String(tabId));
        if (error.name === "AbortError") {
          sendResponse({ ok: false, error: "Stopped", aborted: true });
          return;
        }
        const msg = error.message || "Network error";
        // Do not log prompt or apiKey
        try {
          await appendDiagnosticsLog({
            status: "overlay_error",
            serviceId: "overlay",
            serviceTitle: provider.model || "AI",
            actionId: "overlay.chat.send",
            actionTitle: "Floating overlay chat",
            url: "",
            message: msg.slice(0, 200),
            details: {
              method: "fetch",
              elapsedMs: 0,
              expectedLength: prompt.length,
              actualLength: 0,
              attemptedSelectors: [],
              timeoutMs: 0
            }
          });
        } catch {}
        sendResponse({ ok: false, error: msg });
      }
    })();
    return true;
  }

  return false;
});
