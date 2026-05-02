export const ROOT_MENU_ID = "sendToAI";
export const YOUTUBE_MENU_IDS = {
  article: "openYouTubeArticleInGemini",
  summary: "openYouTubeSummaryInGemini"
};
export const CONTEXT_ACTIONS_MENU_ID = "pageAndLinkActions";
export const CONTEXT_ACTIONS_QWEN_MENU_ID = "pageAndLinkActionsQwen";
export const QUICK_DEFAULT_MENU_ID = "sendToAIDefault";

export const ROOT_MENU_TITLE = "Отправить в AI";
export const YOUTUBE_MENU_TITLES = {
  article: "Статья по YouTube-транскрипции в Gemini",
  summary: "Краткое резюме YouTube-видео в Gemini"
};
export const CONTEXT_ACTIONS_MENU_TITLE = "Страницы и ссылки";
export const CONTEXT_ACTIONS_QWEN_MENU_TITLE = "Страницы и ссылки в Qwen";

export const SERVICE_CONFIGS = [
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
        "#prompt-textarea",
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]',
        "textarea"
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
    urlPattern: "https://www.kimi.com/*",
    newUrl: "https://www.kimi.com/",
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
        "textarea"
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
        "textarea"
      ],
      usePasteFirst: true
    }
  }
];

export const SPECIAL_ACTIONS = [
  {
    id: "sendAndTranslateToQwen",
    title: "Отправить и перевести в Qwen",
    serviceId: "sendToQwen",
    transformText: (selectedText) =>
      "Ты - профессиональный переводчик. Переведи на русский язык разбиением на абзацы и минимальной литературной обработкой там, где это необходимо:\n\n" + selectedText
  },
  {
    id: "sendAndTranslateToChatGPT",
    title: "Отправить и перевести в ChatGPT",
    serviceId: "sendToChatGPT",
    transformText: (selectedText) =>
      "Ты - профессиональный переводчик. Переведи на русский язык разбиением на абзацы и минимальной литературной обработкой там, где это необходимо:\n\n" + selectedText
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
      "Проведи фактчекинг утверждений только из текста ниже. Верни результат в таблице: Утверждение | Статус (верно/частично верно/неверно/недостаточно данных) | Краткое обоснование | Что уточнить. Не выдумывай источники и явно помечай случаи, где данных недостаточно.\n\n" + selectedText
  }
];

export const CONTEXT_ACTIONS = [
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

export const SERVICES_BY_ID = Object.fromEntries(SERVICE_CONFIGS.map((service) => [service.id, service]));
export const SPECIAL_ACTIONS_BY_ID = Object.fromEntries(SPECIAL_ACTIONS.map((action) => [action.id, action]));
export const CONTEXT_ACTIONS_QWEN = [
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

export const CONTEXT_ACTIONS_BY_ID = Object.fromEntries(CONTEXT_ACTIONS.map((action) => [action.id, action]));
export const CONTEXT_ACTIONS_QWEN_BY_ID = Object.fromEntries(CONTEXT_ACTIONS_QWEN.map((action) => [action.id, action]));
export const ALL_SERVICE_IDS = SERVICE_CONFIGS.map((service) => service.id);
export const ALL_CONTEXT_ACTION_QWEN_IDS = CONTEXT_ACTIONS_QWEN.map((action) => action.id);
