import { ALL_SERVICE_IDS } from "./services.js";

export const SETTINGS_STORAGE_KEYS = ["serviceOrder", "enabledServices", "defaultServiceId", "showSpecialActions"];

export function buildDefaultSettings(allServiceIds = ALL_SERVICE_IDS) {
  const enabledServices = Object.fromEntries(allServiceIds.map((serviceId) => [serviceId, true]));

  return {
    serviceOrder: [...allServiceIds],
    enabledServices,
    defaultServiceId: allServiceIds[0] || null,
    showSpecialActions: true
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

  return {
    serviceOrder: normalizedOrder,
    enabledServices: normalizedEnabled,
    defaultServiceId: hasValidDefault ? source.defaultServiceId : fallbackDefaultId,
    showSpecialActions: source.showSpecialActions !== false
  };
}
