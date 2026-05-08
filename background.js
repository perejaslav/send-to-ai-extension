import {
  buildCustomCommandPrompt,
  getCustomCommandSourceContext
} from "./custom-commands.js";
import { insertTextIntoPage } from "./insertion.js";
import { buildPageOrLinkPrompt } from "./context-prompts.js";
import { buildMenuDescriptors } from "./menus.js";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEYS, normalizeSettings } from "./settings.js";
import {
  QUICK_DEFAULT_MENU_ID,
  CONTEXT_ACTIONS_BY_ID,
  CONTEXT_ACTIONS_QWEN_BY_ID,
  SERVICES_BY_ID,
  SPECIAL_ACTIONS_BY_ID,
  YOUTUBE_MENU_IDS
} from "./services.js";
import { buildYouTubePrompt, buildYouTubeSummaryPrompt, normalizeYouTubeUrl } from "./youtube.js";

const ACTION_DEFAULT_TITLE = "Send to AI";
const STATUS_CLEAR_DELAY_MS = 5000;

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

function showActionStatus(result) {
  const isSuccess = result.status === "success";
  const badgeText = isSuccess ? "OK" : "ERR";
  const badgeColor = isSuccess ? "#166534" : "#b91c1c";
  const title = isSuccess
    ? "Текст успешно вставлен"
    : result.status === "unsupported_link"
      ? "Команда доступна только для ссылок YouTube"
      : result.status === "input_not_found"
      ? "Страница открылась, но поле ввода не найдено"
      : "Не удалось вставить текст в поле ввода";

  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setTitle({ title });

  setTimeout(clearActionStatus, STATUS_CLEAR_DELAY_MS);
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

async function runServiceAction(service, text) {
  try {
    const result = await openAndInsertText(service, text);
    showActionStatus(result);
  } catch (error) {
    console.warn("Service action failed:", error.message);
    showActionStatus({ status: "error" });
  }
}

async function handleYouTubeLinkAction(linkUrl, variant) {
  const cleanUrl = normalizeYouTubeUrl(linkUrl);
  if (!cleanUrl) {
    showActionStatus({ status: "unsupported_link" });
    return;
  }

  const geminiService = SERVICES_BY_ID.sendToGemini;
  const textToInsert = variant === "summary"
    ? buildYouTubeSummaryPrompt(cleanUrl)
    : buildYouTubePrompt(cleanUrl);
  await runServiceAction(geminiService, textToInsert);
}

async function handleContextAction(action, info, tab) {
  const sourceUrl = action.contextType === "page"
    ? info.pageUrl || tab?.url || ""
    : info.linkUrl || tab?.url || "";

  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
    showActionStatus({ status: "unsupported_link" });
    return;
  }

  const targetService = SERVICES_BY_ID[action.serviceId];
  if (!targetService) {
    showActionStatus({ status: "error" });
    return;
  }

  const textToInsert = buildPageOrLinkPrompt(action.contextType, action.actionType, sourceUrl, tab?.title || "");
  if (!textToInsert) {
    showActionStatus({ status: "error" });
    return;
  }

  await runServiceAction(targetService, textToInsert);
}

async function handleCustomCommand(command, settings, info, tab) {
  const targetService = SERVICES_BY_ID[command.serviceId];
  if (!targetService || settings.enabledServices[targetService.id] === false) {
    showActionStatus({ status: "error" });
    return;
  }

  const sourceContext = getCustomCommandSourceContext(command, info, tab, {
    service: targetService.title
  });
  const textToInsert = buildCustomCommandPrompt(command, sourceContext);

  if (!textToInsert) {
    showActionStatus({ status: "error" });
    return;
  }

  await runServiceAction(targetService, textToInsert);
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

  const contextAction = CONTEXT_ACTIONS_BY_ID[info.menuItemId] || CONTEXT_ACTIONS_QWEN_BY_ID[info.menuItemId];
  if (contextAction) {
    await handleContextAction(contextAction, info, tab);
    return;
  }

  if (info.menuItemId === YOUTUBE_MENU_IDS.article) {
    await handleYouTubeLinkAction(info.linkUrl || "", "article");
    return;
  }

  if (info.menuItemId === YOUTUBE_MENU_IDS.summary) {
    await handleYouTubeLinkAction(info.linkUrl || "", "summary");
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

    await runServiceAction(defaultService, info.selectionText);
    return;
  }

  const directService = SERVICES_BY_ID[info.menuItemId];
  if (directService) {
    if (settings.enabledServices[directService.id] === false) {
      return;
    }

    await runServiceAction(directService, info.selectionText);
    return;
  }

  const specialAction = SPECIAL_ACTIONS_BY_ID[info.menuItemId];
  if (!specialAction) {
    return;
  }

  const targetService = SERVICES_BY_ID[specialAction.serviceId];
  if (!targetService || settings.enabledServices[targetService.id] === false) {
    return;
  }

  await runServiceAction(targetService, specialAction.transformText(info.selectionText));
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

  runServiceAction(service, message.text)
    .then((result) => sendResponse(result))
    .catch((error) => {
      console.warn("Popup service action failed:", error.message);
      sendResponse({ status: "error" });
    });

  return true;
});
