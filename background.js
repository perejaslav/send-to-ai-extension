const ROOT_MENU_ID = "sendToAI";
const YOUTUBE_MENU_ID = "openYouTubeInGemini";

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
        'textarea',
        'input[type="text"]'
      ],
      timeoutMs: 20000,
      intervalMs: 200,
      usePasteFirst: false
    }
  },
  {
    id: "sendToChatGPT",
    title: "ChatGPT",
    urlPattern: "https://chatgpt.com/*",
    newUrl: "https://chatgpt.com/",
    profile: {
      selectors: [
        '#prompt-textarea',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]',
        'textarea'
      ]
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
        'textarea'
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
        'textarea',
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
        'textarea'
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
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="Type"]',
        'textarea',
        'div[contenteditable="true"]',
        '[aria-label*="prompt"]',
        '[aria-label*="message"]'
      ]
    }
  },
  {
    id: "sendToZai",
    title: "Z.ai",
    urlPattern: "https://chat.z.ai/*",
    newUrl: "https://chat.z.ai/",
    profile: {
      selectors: ['#chat-input', 'textarea', 'div[contenteditable="true"]'],
      intervalMs: 100,
      timeoutMs: 10000
    }
  },
  {
    id: "sendToKimi",
    title: "Kimi AI",
    urlPattern: "https://www.kimi.com/*",
    newUrl: "https://www.kimi.com/",
    profile: {
      selectors: [
        '.chat-input-editor',
        'div[contenteditable="true"]',
        'textarea',
        'input[type="text"]'
      ]
    }
  },
  {
    id: "sendToQwen",
    title: "Qwen AI",
    urlPattern: "https://chat.qwen.ai/*",
    newUrl: "https://chat.qwen.ai/",
    profile: {
      selectors: ['textarea', 'div[contenteditable="true"]'],
      intervalMs: 100,
      timeoutMs: 10000
    }
  },
  {
    id: "sendToErnie",
    title: "Ernie",
    urlPattern: "https://ernie.baidu.com/*",
    newUrl: "https://ernie.baidu.com/chat",
    profile: {
      selectors: [
        '[data-slate-editor="true"]',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]'
      ],
      usePasteFirst: true,
      timeoutMs: 20000
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
        'textarea'
      ],
      usePasteFirst: true,
      timeoutMs: 20000
    }
  },
  {
    id: "sendToStepFun",
    title: "StepFun",
    urlPattern: "https://stepfun.ai/*",
    newUrl: "https://stepfun.ai/chats/new",
    profile: {
      selectors: [
        '[data-slate-editor="true"]',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="plaintext-only"]',
        'div[contenteditable="true"]',
        '[aria-label*="prompt"]',
        '[aria-label*="message"]',
        'textarea'
      ],
      usePasteFirst: true
    }
  }
];

const SPECIAL_ACTIONS = [
  {
    id: "sendAndTranslateToQwen",
    title: "Send and translate to Qwen",
    serviceId: "sendToQwen",
    transformText: (selectedText) =>
      "Ты - профессиональный переводчик. Переведи на русский язык разбиением на абзацы и минимальной литературной обработкой там, где это необходимо:\n\n" + selectedText
  },
  {
    id: "sendAndTranslateToChatGPT",
    title: "Send and translate to ChatGPT",
    serviceId: "sendToChatGPT",
    transformText: (selectedText) =>
      "Ты - профессиональный переводчик. Переведи на русский язык разбиением на абзацы и минимальной литературной обработкой там, где это необходимо:\n\n" + selectedText
  },
  {
    id: "summarizeInChatGPT",
    title: "Summarize in ChatGPT",
    serviceId: "sendToChatGPT",
    transformText: (selectedText) =>
      "Без вступительного текста. Сделай краткое саммари --- \n\n" + selectedText
  }
];

const SERVICES_BY_ID = Object.fromEntries(SERVICE_CONFIGS.map((service) => [service.id, service]));
const SPECIAL_ACTIONS_BY_ID = Object.fromEntries(SPECIAL_ACTIONS.map((action) => [action.id, action]));

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.warn("contextMenus.removeAll error:", chrome.runtime.lastError.message);
    }

    safeCreateContextMenu({
      id: ROOT_MENU_ID,
      title: "Отправить в AI",
      contexts: ["selection"]
    });

    for (const service of SERVICE_CONFIGS) {
      safeCreateContextMenu({
        id: service.id,
        parentId: ROOT_MENU_ID,
        title: service.title,
        contexts: ["selection"]
      });
    }

    for (const action of SPECIAL_ACTIONS) {
      safeCreateContextMenu({
        id: action.id,
        parentId: ROOT_MENU_ID,
        title: action.title,
        contexts: ["selection"]
      });
    }

    // Отдельный пункт только для ссылок.
    safeCreateContextMenu({
      id: YOUTUBE_MENU_ID,
      title: "Open in Gemini",
      contexts: ["link"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === YOUTUBE_MENU_ID) {
    handleYouTubeLinkAction(info.linkUrl || "");
    return;
  }

  if (!info.selectionText) {
    return;
  }

  const selectedText = info.selectionText;

  const directService = SERVICES_BY_ID[info.menuItemId];
  if (directService) {
    openAndInsertText(directService, selectedText);
    return;
  }

  const specialAction = SPECIAL_ACTIONS_BY_ID[info.menuItemId];
  if (!specialAction) {
    return;
  }

  const targetService = SERVICES_BY_ID[specialAction.serviceId];
  if (!targetService) {
    return;
  }

  openAndInsertText(targetService, specialAction.transformText(selectedText));
});

function safeCreateContextMenu(options) {
  chrome.contextMenus.create(options, () => {
    if (chrome.runtime.lastError) {
      console.warn(`contextMenus.create error for ${options.id}:`, chrome.runtime.lastError.message);
    }
  });
}

function handleYouTubeLinkAction(linkUrl) {
  const cleanUrl = normalizeYouTubeUrl(linkUrl);
  if (!cleanUrl) {
    return;
  }

  const geminiService = SERVICES_BY_ID.sendToGemini;
  const textToInsert = buildYouTubePrompt(cleanUrl);
  openAndInsertText(geminiService, textToInsert);
}

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

  const allowedYouTubeHosts = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);
  if (!allowedYouTubeHosts.has(host)) {
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
    "\n\nТвоя задача — обработать предоставленный ролик: извлечь всю важную информацию и удалить \"воду\"." +
    "\n\nЧто обязательно извлечь:" +
    "\n- Все факты, цифры, статистику, даты, имена, названия и конкретные данные" +
    "\n- Ключевые идеи, тезисы и выводы автора, включая неочевидные и косвенно высказанные" +
    "\n- Причинно-следственные связи и логику аргументации автора" +
    "\n- Практические действия, задачи, рекомендации и решения" +
    "\n- Примеры, кейсы и истории, которые иллюстрируют главные мысли" +
    "\n- Противоречия, оговорки или нюансы, которые автор намеренно подчёркивает" +
    "\n\nПринципы обработки:" +
    "\nУдаляй только явную \"воду\": повторы одной и той же мысли, приветствия, благодарности аудитории, слова-паразиты и риторические конструкции без смысловой нагрузки. Всё остальное сохраняй." +
    "\n\nЕсли удаление фрагмента создаёт риск потери смысла или контекста, оставь его. Точность важнее краткости." +
    "\n\nСохраняй авторскую логику и последовательность изложения. Не переставляй блоки информации и не переформулируй идеи так, чтобы изменился их оттенок или акцент." +
    "\n\nЕсли в ролике есть несколько смысловых блоков или тем, раздели результат на соответствующие разделы с понятными заголовками." +
    "\n\nРезультат должен быть настолько полным, чтобы человек, не смотревший ролик, получил исчерпывающее представление о его содержании, не потеряв ни одной важной детали."
  );
}

function openAndInsertText(service, text) {
  chrome.tabs.query({ url: service.urlPattern }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.warn("tabs.query error:", chrome.runtime.lastError.message);
      return;
    }

    if (tabs && tabs.length > 0) {
      const targetTab = pickMostRecentTab(tabs);
      focusTabAndInsert(targetTab, text, service.profile);
      return;
    }

    chrome.windows.create(
      {
        url: service.newUrl,
        type: "popup",
        width: 1200,
        height: 800,
        left: 100,
        top: 100
      },
      (newWindow) => {
        if (chrome.runtime.lastError) {
          console.warn("windows.create error:", chrome.runtime.lastError.message);
          return;
        }

        const newTab = newWindow?.tabs?.[0];
        if (!newTab?.id) {
          return;
        }

        waitForTabAndInsert(newTab.id, text, service.profile);
      }
    );
  });
}

function pickMostRecentTab(tabs) {
  return [...tabs].sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
}

function focusTabAndInsert(tab, text, profile) {
  if (!tab?.id || !tab.windowId) {
    return;
  }

  chrome.windows.update(tab.windowId, { focused: true }, () => {
    if (chrome.runtime.lastError) {
      console.warn("windows.update error:", chrome.runtime.lastError.message);
      return;
    }

    chrome.tabs.update(tab.id, { active: true }, () => {
      if (chrome.runtime.lastError) {
        console.warn("tabs.update error:", chrome.runtime.lastError.message);
        return;
      }

      executeInsert(tab.id, text, profile);
    });
  });
}

function waitForTabAndInsert(tabId, text, profile) {
  let completed = false;

  const listener = (updatedTabId, changeInfo) => {
    if (updatedTabId !== tabId || changeInfo.status !== "complete" || completed) {
      return;
    }

    completed = true;
    chrome.tabs.onUpdated.removeListener(listener);
    executeInsert(tabId, text, profile);
  };

  chrome.tabs.onUpdated.addListener(listener);

  setTimeout(() => {
    if (completed) {
      return;
    }

    chrome.tabs.onUpdated.removeListener(listener);
    executeInsert(tabId, text, profile);
  }, 15000);
}

function executeInsert(tabId, text, profile) {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      func: insertTextIntoPage,
      args: [text, profile || {}]
    },
    () => {
      if (chrome.runtime.lastError) {
        console.warn("executeScript error:", chrome.runtime.lastError.message);
      }
    }
  );
}

function insertTextIntoPage(text, profile) {
  const selectors = Array.isArray(profile?.selectors) && profile.selectors.length > 0
    ? profile.selectors
    : ["textarea", "div[contenteditable=\"true\"]"];

  const intervalMs = Number(profile?.intervalMs) > 0 ? Number(profile.intervalMs) : 200;
  const timeoutMs = Number(profile?.timeoutMs) > 0 ? Number(profile.timeoutMs) : 15000;
  const usePasteFirst = Boolean(profile?.usePasteFirst);

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
      const candidate = document.querySelector(selector);
      if (!candidate) {
        continue;
      }

      if (isEditableElement(candidate)) {
        return candidate;
      }

      const nestedEditable = candidate.querySelector(
        'textarea, input[type="text"], input:not([type]), [contenteditable="true"], [contenteditable="plaintext-only"]'
      );
      if (nestedEditable && isEditableElement(nestedEditable)) {
        return nestedEditable;
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
        inputType: "insertText",
        data: text
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

  const isMeaningfullyInserted = (element, expectedValue) => {
    const actual = normalizeForCompare(element.textContent);
    const expected = normalizeForCompare(expectedValue);

    if (!actual || !expected) {
      return false;
    }

    if (actual === expected) {
      return true;
    }

    // Некоторые редакторы схлопывают переносы строк, поэтому сравниваем по префиксу/суффиксу.
    const head = expected.slice(0, Math.min(80, expected.length));
    const tail = expected.slice(Math.max(0, expected.length - 80));
    const longEnough = actual.length >= Math.floor(expected.length * 0.75);

    return longEnough && actual.includes(head) && (tail.length < 20 || actual.includes(tail));
  };

  const setContentEditableValue = (element, value) => {
    element.focus();
    element.click();
    clearEditableContent(element);

    let inserted = false;

    if (usePasteFirst) {
      inserted = tryPasteEvent(element, value);
    }

    if (!inserted) {
      try {
        inserted = document.execCommand("insertText", false, value);
      } catch {
        inserted = false;
      }
    }

    if (!inserted || !isMeaningfullyInserted(element, value)) {
      element.textContent = value;
    }

    dispatchStandardEvents(element);
    placeCursorAtEnd(element);
  };

  const tryInsert = (element, value) => {
    if (!element) {
      return false;
    }

    const isTextInput = element.tagName === "TEXTAREA" || element.tagName === "INPUT";

    if (isTextInput) {
      element.focus();
      setNativeInputValue(element, value);
      dispatchStandardEvents(element);
      return true;
    }

    if (isEditableElement(element)) {
      setContentEditableValue(element, value);
      return true;
    }

    return false;
  };

  const waitForInput = setInterval(() => {
    const inputElement = findInputElement();
    if (!inputElement) {
      return;
    }

    const inserted = tryInsert(inputElement, text);
    if (!inserted) {
      return;
    }

    clearInterval(waitForInput);
    inputElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }, intervalMs);

  setTimeout(() => clearInterval(waitForInput), timeoutMs);
}
