export const BUILT_IN_PROFILES = [
  {
    id: "basic",
    title: "Базовый",
    description: "Общие команды: отправка, саммари, перевод и фактчекинг."
  },
  {
    id: "marketing",
    title: "Маркетинг",
    description: "Офферы, аудитории, рекламные тексты, посты и лендинги."
  },
  {
    id: "editing",
    title: "Редактура",
    description: "Исправление, сокращение, расширение и литературная обработка текста."
  },
  {
    id: "translation",
    title: "Перевод",
    description: "Перевод, адаптация и сохранение терминологии."
  },
  {
    id: "research",
    title: "Исследование",
    description: "Тезисы, факты, имена, даты и критика аргументов."
  },
  {
    id: "youtube",
    title: "YouTube",
    description: "Команды для обработки YouTube-ссылок и материалов по видео."
  },
  {
    id: "hermes",
    title: "Hermes Agent",
    description: "ТЗ, задачи, prompt'ы и сценарии для Hermes Agent."
  }
];

export const BUILT_IN_PROFILE_IDS = BUILT_IN_PROFILES.map((profile) => profile.id);
export const ALL_PROFILES_ID = "all";

export function normalizeActiveProfileIds(rawProfileIds) {
  if (!Array.isArray(rawProfileIds)) {
    return [ALL_PROFILES_ID];
  }

  const allowedIds = new Set([ALL_PROFILES_ID, ...BUILT_IN_PROFILE_IDS]);
  const result = [];

  for (const profileId of rawProfileIds) {
    if (typeof profileId !== "string" || !allowedIds.has(profileId) || result.includes(profileId)) {
      continue;
    }

    result.push(profileId);
  }

  return result.length > 0 ? result : [ALL_PROFILES_ID];
}

export function normalizeCommandProfileIds(rawProfileIds) {
  if (!Array.isArray(rawProfileIds)) {
    return [];
  }

  const allowedIds = new Set(BUILT_IN_PROFILE_IDS);
  const result = [];

  for (const profileId of rawProfileIds) {
    if (typeof profileId !== "string" || !allowedIds.has(profileId) || result.includes(profileId)) {
      continue;
    }

    result.push(profileId);
  }

  return result;
}

export function isProfileFilterActive(activeProfileIds) {
  return Array.isArray(activeProfileIds)
    && activeProfileIds.length > 0
    && !activeProfileIds.includes(ALL_PROFILES_ID);
}

export function isCommandVisibleForProfiles(command, activeProfileIds) {
  if (!isProfileFilterActive(activeProfileIds)) {
    return true;
  }

  const commandProfileIds = normalizeCommandProfileIds(command?.profileIds);
  if (commandProfileIds.length === 0) {
    return true;
  }

  return commandProfileIds.some((profileId) => activeProfileIds.includes(profileId));
}

export function getProfileTitle(profileId) {
  if (profileId === ALL_PROFILES_ID) {
    return "Все профили";
  }

  return BUILT_IN_PROFILES.find((profile) => profile.id === profileId)?.title || profileId;
}
