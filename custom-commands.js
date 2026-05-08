export const CUSTOM_COMMANDS_MENU_ID = "customCommands";
export const CUSTOM_COMMANDS_MENU_TITLE = "Мои команды";

export const CUSTOM_COMMAND_CONTEXTS = new Set(["selection", "page", "link", "youtube", "page_text"]);

const DEFAULT_COMMAND = Object.freeze({
  id: "",
  title: "",
  description: "",
  enabled: true,
  serviceId: "",
  contextType: "selection",
  template: "",
  menuGroup: "custom",
  order: 100
});

function toSafeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function slugifyCommandId(value, fallback = "custom-command") {
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

export function normalizeCustomCommands(rawCommands, availableServiceIds = []) {
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

export function renderCustomCommandTemplate(template, context = {}) {
  const variables = buildVariables(context);

  return String(template || "").replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(variables, key)) {
      return match;
    }

    return variables[key];
  });
}

export function buildCustomCommandPrompt(command, context = {}) {
  if (!command || typeof command.template !== "string") {
    return null;
  }

  const prompt = renderCustomCommandTemplate(command.template, context).trim();
  return prompt || null;
}

export function isCustomCommandVisible(command, settings) {
  if (!command || command.enabled === false) {
    return false;
  }

  if (!settings || !settings.enabledServices) {
    return true;
  }

  return settings.enabledServices[command.serviceId] !== false;
}

export function getContextMenuContextsForCommand(command) {
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

export function getCustomCommandSourceContext(command, info = {}, tab = {}, extra = {}) {
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
