import {
  CUSTOM_COMMANDS_MENU_ID,
  CUSTOM_COMMANDS_MENU_TITLE,
  getContextMenuContextsForCommand,
  isCustomCommandVisible
} from "./custom-commands.js";
import { isCommandVisibleForProfiles } from "./profiles.js";
import {
  CONTEXT_ACTIONS,
  CONTEXT_ACTIONS_MENU_ID,
  CONTEXT_ACTIONS_MENU_TITLE,
  CONTEXT_ACTIONS_QWEN,
  CONTEXT_ACTIONS_QWEN_MENU_ID,
  CONTEXT_ACTIONS_QWEN_MENU_TITLE,
  QUICK_DEFAULT_MENU_ID,
  ROOT_MENU_ID,
  ROOT_MENU_TITLE,
  SERVICE_CONFIGS,
  SERVICES_BY_ID,
  SPECIAL_ACTIONS,
  YOUTUBE_MENU_IDS
} from "./services.js";
import { normalizeYouTubeTemplates } from "./youtube-templates.js";

function isServiceEnabled(settings, serviceId) {
  return settings.enabledServices[serviceId] !== false;
}

function buildCustomCommandDescriptors(settings) {
  const visibleCommands = (settings.customCommands || []).filter((command) =>
    isCustomCommandVisible(command, settings)
    && isCommandVisibleForProfiles(command, settings.activeProfileIds)
  );

  if (visibleCommands.length === 0) {
    return [];
  }

  const descriptors = [
    {
      id: CUSTOM_COMMANDS_MENU_ID,
      title: CUSTOM_COMMANDS_MENU_TITLE,
      contexts: ["selection", "page", "link"]
    }
  ];

  for (const command of visibleCommands) {
    descriptors.push({
      id: command.id,
      parentId: CUSTOM_COMMANDS_MENU_ID,
      title: command.title,
      contexts: getContextMenuContextsForCommand(command)
    });
  }

  return descriptors;
}

function buildYouTubeTemplateDescriptors(settings) {
  return normalizeYouTubeTemplates(settings.youtubeTemplates)
    .filter((template) => template.enabled !== false && isServiceEnabled(settings, template.serviceId))
    .map((template) => ({
      id: YOUTUBE_MENU_IDS[template.id] || `openYouTubeTemplate:${template.id}`,
      title: `${template.title} в ${SERVICES_BY_ID[template.serviceId]?.title || "AI"}`,
      contexts: ["link"],
      targetUrlPatterns: [
        "*://*.youtube.com/*",
        "*://youtube.com/*",
        "*://youtu.be/*"
      ]
    }));
}

function getCompactSpecialActionTitle(action) {
  const titles = {
    sendAndTranslateToQwen: "Перевести на русский",
    sendAndTranslateToChatGPT: "Перевести на русский",
    summarizeInChatGPT: "Сделать саммари",
    factCheckInChatGPT: "Провести фактчекинг"
  };

  return titles[action.id] || action.title;
}

function getVisibleSpecialActionsByService(settings) {
  if (!settings.showSpecialActions) {
    return new Map();
  }

  const enabledSpecialActions = settings.enabledSpecialActions || {};
  const groupedActions = new Map();

  for (const action of SPECIAL_ACTIONS) {
    if (!isServiceEnabled(settings, action.serviceId) || enabledSpecialActions[action.id] === false) {
      continue;
    }

    const actions = groupedActions.get(action.serviceId) || [];
    actions.push(action);
    groupedActions.set(action.serviceId, actions);
  }

  return groupedActions;
}

function buildServiceMenuDescriptors(settings) {
  const descriptors = [];
  const specialActionsByService = getVisibleSpecialActionsByService(settings);

  for (const serviceId of settings.serviceOrder) {
    if (!isServiceEnabled(settings, serviceId)) {
      continue;
    }

    const service = SERVICES_BY_ID[serviceId];
    if (!service) {
      continue;
    }

    const serviceActions = specialActionsByService.get(serviceId) || [];

    if (serviceActions.length === 0) {
      descriptors.push({
        id: service.id,
        parentId: ROOT_MENU_ID,
        title: service.title,
        contexts: ["selection"]
      });
      continue;
    }

    const serviceMenuId = `${service.id}Menu`;
    descriptors.push({
      id: serviceMenuId,
      parentId: ROOT_MENU_ID,
      title: service.title,
      contexts: ["selection"]
    });

    descriptors.push({
      id: service.id,
      parentId: serviceMenuId,
      title: "Отправить выделенное",
      contexts: ["selection"]
    });

    for (const action of serviceActions) {
      descriptors.push({
        id: action.id,
        parentId: serviceMenuId,
        title: getCompactSpecialActionTitle(action),
        contexts: ["selection"]
      });
    }
  }

  return descriptors;
}

export function buildMenuDescriptors(settings) {
  const descriptors = [
    {
      id: ROOT_MENU_ID,
      title: ROOT_MENU_TITLE,
      contexts: ["selection"]
    }
  ];

  const defaultService = settings.defaultServiceId ? SERVICES_BY_ID[settings.defaultServiceId] : null;
  if (defaultService && isServiceEnabled(settings, defaultService.id)) {
    descriptors.push({
      id: QUICK_DEFAULT_MENU_ID,
      title: `Отправить в ${defaultService.title} (по умолчанию)`,
      contexts: ["selection"]
    });
  }

  descriptors.push(...buildServiceMenuDescriptors(settings));

  descriptors.push({
    id: CONTEXT_ACTIONS_MENU_ID,
    title: CONTEXT_ACTIONS_MENU_TITLE,
    contexts: ["page", "link"]
  });

  for (const action of CONTEXT_ACTIONS) {
    descriptors.push({
      id: action.id,
      parentId: CONTEXT_ACTIONS_MENU_ID,
      title: action.title,
      contexts: [action.contextType]
    });
  }

  if (settings.showContextActionsQwen) {
    const enabledContextActionsQwen = settings.enabledContextActionsQwen || {};
    const visibleContextQwen = CONTEXT_ACTIONS_QWEN.filter((action) =>
      isServiceEnabled(settings, action.serviceId) && enabledContextActionsQwen[action.id] !== false
    );

    if (visibleContextQwen.length > 0) {
      descriptors.push({
        id: CONTEXT_ACTIONS_QWEN_MENU_ID,
        title: CONTEXT_ACTIONS_QWEN_MENU_TITLE,
        contexts: ["page", "link"]
      });

      for (const action of visibleContextQwen) {
        descriptors.push({
          id: action.id,
          parentId: CONTEXT_ACTIONS_QWEN_MENU_ID,
          title: action.title,
          contexts: [action.contextType]
        });
      }
    }
  }

  descriptors.push(...buildCustomCommandDescriptors(settings));
  descriptors.push(...buildYouTubeTemplateDescriptors(settings));

  return descriptors;
}

export function listServiceOptions() {
  return SERVICE_CONFIGS.map(({ id, title }) => ({ id, title }));
}
