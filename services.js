export const ROOT_MENU_ID = "sendToAI";
export const YOUTUBE_MENU_ID_PREFIX = "openYouTubeTemplate:";
export const YOUTUBE_MENU_IDS = {
  article: "openYouTubeArticleInGemini",
  summary: "openYouTubeSummaryInGemini",
  facts: `${YOUTUBE_MENU_ID_PREFIX}facts`,
  telegram: `${YOUTUBE_MENU_ID_PREFIX}telegram`,
  research: `${YOUTUBE_MENU_ID_PREFIX}research`
};
export const CONTEXT_ACTIONS_MENU_ID = "pageAndLinkActions";
export const CONTEXT_ACTIONS_QWEN_MENU_ID = "pageAndLinkActionsQwen";
export const CONTEXT_ACTIONS_GROK_MENU_ID = "pageAndLinkActionsGrok";
export const QUICK_DEFAULT_MENU_ID = "sendToAIDefault";

export const ROOT_MENU_TITLE = "Отправить в AI";
export const YOUTUBE_MENU_TITLES = {
  article: "Статья по YouTube-транскрипции в Gemini",
  summary: "Краткое резюме YouTube-видео в Gemini",
  facts: "Список фактов из YouTube-видео в Gemini",
  telegram: "Telegram-пост по YouTube-видео в Gemini",
  research: "Тезисы для исследования по YouTube-видео в Gemini"
};
export const CONTEXT_ACTIONS_MENU_TITLE = "Страницы и ссылки";
export const CONTEXT_ACTIONS_QWEN_MENU_TITLE = "Страницы и ссылки в Qwen";
export const CONTEXT_ACTIONS_GROK_MENU_TITLE = "Страницы и ссылки в Grok";

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
      "Ты - профессиональный переводчик. Переведи на русский язык с сохранением структуры абзацев и минимальной литературной обработкой.\n\nСохрани термины, числовые данные, имена и форматирование. Адаптируй идиомы и культурные отсылки. Не добавляй пояснений и комментариев от себя.\n\n" + selectedText
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

export const CONTEXT_ACTIONS_GROK = [
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

export const CONTEXT_ACTIONS_BY_ID = Object.fromEntries(CONTEXT_ACTIONS.map((action) => [action.id, action]));
export const CONTEXT_ACTIONS_QWEN_BY_ID = Object.fromEntries(CONTEXT_ACTIONS_QWEN.map((action) => [action.id, action]));
export const CONTEXT_ACTIONS_GROK_BY_ID = Object.fromEntries(CONTEXT_ACTIONS_GROK.map((action) => [action.id, action]));
export const ALL_SERVICE_IDS = SERVICE_CONFIGS.map((service) => service.id);
export const ALL_CONTEXT_ACTION_QWEN_IDS = CONTEXT_ACTIONS_QWEN.map((action) => action.id);
export const ALL_CONTEXT_ACTION_GROK_IDS = CONTEXT_ACTIONS_GROK.map((action) => action.id);
