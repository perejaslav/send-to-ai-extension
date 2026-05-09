export const OPTIONS_TAB_GROUPS = [
  {
    id: "basic",
    title: "Основное",
    headings: ["Оформление настроек", "Сервисы"]
  },
  {
    id: "commands",
    title: "Команды",
    headings: ["Профили команд", "Мои команды", "YouTube-шаблоны", "Команды сервисов", "Qwen для страниц и ссылок"]
  },
  {
    id: "diagnostics",
    title: "Диагностика",
    headings: ["Диагностика"]
  },
  {
    id: "data",
    title: "Данные",
    headings: ["Импорт и экспорт"]
  }
];

export const DEFAULT_OPTIONS_TAB_ID = OPTIONS_TAB_GROUPS[0].id;

const HEADING_TO_GROUP = new Map(
  OPTIONS_TAB_GROUPS.flatMap((group) => group.headings.map((heading) => [heading, group.id]))
);

export function getOptionsTabByHeading(headingText) {
  return HEADING_TO_GROUP.get(String(headingText || "").trim()) || DEFAULT_OPTIONS_TAB_ID;
}

export function getOptionsTabTitle(tabId) {
  return OPTIONS_TAB_GROUPS.find((group) => group.id === tabId)?.title || tabId;
}

export function normalizeSearchQuery(query) {
  return String(query || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function doesTextMatchSearch(text, query) {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) {
    return true;
  }

  return String(text || "").toLowerCase().includes(normalizedQuery);
}

export function isPanelVisibleForState({ panelTabId, activeTabId, panelText, searchQuery }) {
  const hasSearch = normalizeSearchQuery(searchQuery).length > 0;
  const tabMatches = hasSearch || panelTabId === activeTabId;
  return tabMatches && doesTextMatchSearch(panelText, searchQuery);
}
