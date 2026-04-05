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
    "- верни результат в таблице: Утверждение | Статус (верно/частично верно/неверно/недостаточно данных) | Краткое обоснование | Что уточнить;",
    "- не выдумывай источники и явно помечай случаи, где данных недостаточно;"
  ],
  translate: [
    "- переведи весь доступный содержательный текст;",
    "- сохрани структуру и абзацы, если это возможно;"
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

export function buildPageOrLinkPrompt(contextType, actionType, sourceUrl, sourceTitle = "") {
  return buildContextPrompt(contextType, actionType, sourceUrl, sourceTitle);
}
