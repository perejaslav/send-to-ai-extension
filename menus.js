import {
  QUICK_DEFAULT_MENU_ID,
  ROOT_MENU_ID,
  ROOT_MENU_TITLE,
  SERVICE_CONFIGS,
  SERVICES_BY_ID,
  SPECIAL_ACTIONS,
  YOUTUBE_MENU_ID,
  YOUTUBE_MENU_TITLE
} from "./services.js";

function isServiceEnabled(settings, serviceId) {
  return settings.enabledServices[serviceId] !== false;
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

  for (const serviceId of settings.serviceOrder) {
    if (!isServiceEnabled(settings, serviceId)) {
      continue;
    }

    const service = SERVICES_BY_ID[serviceId];
    if (!service) {
      continue;
    }

    descriptors.push({
      id: service.id,
      parentId: ROOT_MENU_ID,
      title: service.title,
      contexts: ["selection"]
    });
  }

  if (settings.showSpecialActions) {
    const visibleSpecialActions = SPECIAL_ACTIONS.filter((action) => isServiceEnabled(settings, action.serviceId));

    if (visibleSpecialActions.length > 0) {
      descriptors.push({
        id: `${ROOT_MENU_ID}Separator`,
        parentId: ROOT_MENU_ID,
        type: "separator",
        contexts: ["selection"]
      });

      for (const action of visibleSpecialActions) {
        descriptors.push({
          id: action.id,
          parentId: ROOT_MENU_ID,
          title: action.title,
          contexts: ["selection"]
        });
      }
    }
  }

  descriptors.push({
    id: YOUTUBE_MENU_ID,
    title: YOUTUBE_MENU_TITLE,
    contexts: ["link"],
    targetUrlPatterns: [
      "*://*.youtube.com/*",
      "*://youtube.com/*",
      "*://youtu.be/*"
    ]
  });

  return descriptors;
}

export function listServiceOptions() {
  return SERVICE_CONFIGS.map(({ id, title }) => ({ id, title }));
}
