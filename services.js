export const ROOT_MENU_ID = "sendToAI";
export const YOUTUBE_MENU_ID = "openYouTubeInGemini";
export const LINK_SUMMARY_MENU_ID = "summarizeLinkInChatGPT";
export const PAGE_SUMMARY_MENU_ID = "summarizeCurrentPageInChatGPT";
export const QUICK_DEFAULT_MENU_ID = "sendToAIDefault";

export const ROOT_MENU_TITLE = "Отправить в AI";
export const YOUTUBE_MENU_TITLE = "Открыть в Gemini";
export const LINK_SUMMARY_MENU_TITLE = "Сделать саммари страницы в ChatGPT";
export const PAGE_SUMMARY_MENU_TITLE = "Сделать саммари текущей страницы в ChatGPT";

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
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="Type"]',
        "textarea",
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
      ]
    }
  },
  {
    id: "sendToQwen",
    title: "Qwen AI",
    urlPattern: "https://chat.qwen.ai/*",
    newUrl: "https://chat.qwen.ai/",
    profile: {
      selectors: ["textarea", 'div[contenteditable="true"]'],
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

export const SERVICES_BY_ID = Object.fromEntries(SERVICE_CONFIGS.map((service) => [service.id, service]));
export const SPECIAL_ACTIONS_BY_ID = Object.fromEntries(SPECIAL_ACTIONS.map((action) => [action.id, action]));
export const ALL_SERVICE_IDS = SERVICE_CONFIGS.map((service) => service.id);
