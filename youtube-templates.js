export const YOUTUBE_TEMPLATE_IDS = {
  article: "article",
  summary: "summary",
  facts: "facts",
  telegram: "telegram",
  research: "research"
};

export const DEFAULT_YOUTUBE_TEMPLATES = [
  {
    id: YOUTUBE_TEMPLATE_IDS.article,
    title: "Статья по YouTube-транскрипции",
    enabled: true,
    serviceId: "sendToGemini",
    template: [
      "{youtubeUrl}",
      "",
      "Ты — профессиональный редактор и литературный обработчик YouTube-транскрипций.",
      "",
      "Преобразуй транскрипцию этого видео в полноценную статью на русском языке.",
      "",
      "Требования:",
      "- не сокращай материал по смыслу;",
      "- сохрани факты, имена, даты, числа, термины, аргументы и выводы;",
      "- исправь ошибки автоматической транскрибации;",
      "- убери речевой мусор, повторы и сбивки;",
      "- раздели текст на логичные разделы с подзаголовками;",
      "- не добавляй факты от себя;",
      "- не пиши вступительных комментариев о проделанной работе;",
      "- сразу выдай готовую статью."
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

export const DEFAULT_YOUTUBE_TEMPLATES_BY_ID = Object.fromEntries(
  DEFAULT_YOUTUBE_TEMPLATES.map((template) => [template.id, template])
);

export function normalizeYouTubeTemplates(rawTemplates) {
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

export function getYouTubeTemplateById(rawTemplates, templateId) {
  const templates = normalizeYouTubeTemplates(rawTemplates);
  return templates.find((template) => template.id === templateId) || templates[0];
}

export function renderYouTubeTemplate(template, context = {}) {
  const youtubeUrl = context.youtubeUrl || context.url || "";
  return String(template?.template || "").replace(/\{youtubeUrl\}|\{url\}/g, youtubeUrl).trim();
}
