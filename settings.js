import { normalizeCustomCommands } from "./custom-commands.js";
import { ALL_PROFILES_ID, normalizeActiveProfileIds } from "./profiles.js";
import { ALL_CONTEXT_ACTION_QWEN_IDS, ALL_SERVICE_IDS, SPECIAL_ACTIONS } from "./services.js";

export const SETTINGS_STORAGE_KEYS = [
  "serviceOrder",
  "enabledServices",
  "defaultServiceId",
  "showSpecialActions",
  "enabledSpecialActions",
  "showContextActionsQwen",
  "enabledContextActionsQwen",
  "customCommands",
  "activeProfileIds"
];

const SPECIAL_ACTION_IDS = SPECIAL_ACTIONS.map((action) => action.id);

function buildDefaultSpecialActions() {
  return Object.fromEntries(SPECIAL_ACTION_IDS.map((actionId) => [actionId, true]));
}

function buildDefaultContextActionsQwen() {
  return Object.fromEntries(ALL_CONTEXT_ACTION_QWEN_IDS.map((actionId) => [actionId, true]));
}

export function buildDefaultSettings(allServiceIds = ALL_SERVICE_IDS) {
  const enabledServices = Object.fromEntries(allServiceIds.map((serviceId) => [serviceId, true]));

  return {
    serviceOrder: [...allServiceIds],
    enabledServices,
    defaultServiceId: allServiceIds[0] || null,
    showSpecialActions: true,
    enabledSpecialActions: buildDefaultSpecialActions(),
    showContextActionsQwen: true,
    enabledContextActionsQwen: buildDefaultContextActionsQwen(),
    customCommands: [],
    activeProfileIds: [ALL_PROFILES_ID]
  };
}

export const DEFAULT_SETTINGS = buildDefaultSettings();

export function normalizeSettings(rawSettings, allServiceIds = ALL_SERVICE_IDS) {
  const source = rawSettings && typeof rawSettings === "object" ? rawSettings : {};

  const orderFromStorage = Array.isArray(source.serviceOrder) ? source.serviceOrder : [];
  const normalizedOrder = [];
  const seen = new Set();

  for (const serviceId of orderFromStorage) {
    if (!allServiceIds.includes(serviceId) || seen.has(serviceId)) {
      continue;
    }

    seen.add(serviceId);
    normalizedOrder.push(serviceId);
  }

  for (const serviceId of allServiceIds) {
    if (seen.has(serviceId)) {
      continue;
    }

    seen.add(serviceId);
    normalizedOrder.push(serviceId);
  }

  const enabledFromStorage = source.enabledServices && typeof source.enabledServices === "object"
    ? source.enabledServices
    : {};

  const normalizedEnabled = {};
  for (const serviceId of allServiceIds) {
    normalizedEnabled[serviceId] = typeof enabledFromStorage[serviceId] === "boolean"
      ? enabledFromStorage[serviceId]
      : true;
  }

  const enabledServiceIds = normalizedOrder.filter((serviceId) => normalizedEnabled[serviceId]);
  const hasValidDefault = typeof source.defaultServiceId === "string" && enabledServiceIds.includes(source.defaultServiceId);
  const fallbackDefaultId = enabledServiceIds[0] || normalizedOrder[0] || null;

  const enabledSpecialFromStorage = source.enabledSpecialActions && typeof source.enabledSpecialActions === "object"
    ? source.enabledSpecialActions
    : {};

  const normalizedSpecialActions = {};
  for (const actionId of SPECIAL_ACTION_IDS) {
    normalizedSpecialActions[actionId] = typeof enabledSpecialFromStorage[actionId] === "boolean"
      ? enabledSpecialFromStorage[actionId]
      : true;
  }

  const enabledContextQwenFromStorage = source.enabledContextActionsQwen && typeof source.enabledContextActionsQwen === "object"
    ? source.enabledContextActionsQwen
    : {};

  const normalizedContextActionsQwen = {};
  for (const actionId of ALL_CONTEXT_ACTION_QWEN_IDS) {
    normalizedContextActionsQwen[actionId] = typeof enabledContextQwenFromStorage[actionId] === "boolean"
      ? enabledContextQwenFromStorage[actionId]
      : true;
  }

  return {
    serviceOrder: normalizedOrder,
    enabledServices: normalizedEnabled,
    defaultServiceId: hasValidDefault ? source.defaultServiceId : fallbackDefaultId,
    showSpecialActions: source.showSpecialActions !== false,
    enabledSpecialActions: normalizedSpecialActions,
    showContextActionsQwen: source.showContextActionsQwen !== false,
    enabledContextActionsQwen: normalizedContextActionsQwen,
    customCommands: normalizeCustomCommands(source.customCommands, allServiceIds),
    activeProfileIds: normalizeActiveProfileIds(source.activeProfileIds)
  };
}
