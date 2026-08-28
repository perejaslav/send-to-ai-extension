import { DEFAULT_SETTINGS, normalizeSettings } from "./settings.js";
import { normalizeYouTubeTemplates } from "./youtube-templates.js";
import { normalizeCustomCommands } from "./custom-commands.js";

export const SYNC_SETTINGS_KEYS = [
  "serviceOrder",
  "enabledServices",
  "defaultServiceId",
  "showSpecialActions",
  "enabledSpecialActions",
  "showContextActionsQwen",
  "enabledContextActionsQwen",
  "showContextActionsGrok",
  "enabledContextActionsGrok",
  "activeProfileIds",
  "interactionMode",
  "overlayMode",
  "aiProvider"
];

export const LOCAL_SETTINGS_KEYS = [
  "customCommands",
  "youtubeTemplates"
];

export const ALL_SETTINGS_KEYS = [...SYNC_SETTINGS_KEYS, ...LOCAL_SETTINGS_KEYS];

function syncGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(result || {});
    });
  });
}

function localGet(keys) {
  return new Promise((resolve, reject) => {
    if (!chrome.storage?.local) { resolve({}); return; }
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(result || {});
    });
  });
}

function syncSet(items) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(items, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

function localSet(items) {
  return new Promise((resolve, reject) => {
    if (!chrome.storage?.local) { resolve(); return; }
    chrome.storage.local.set(items, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

function syncRemove(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.remove(keys, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

// For testing: split payloads without touching storage
export function splitSettingsForStorage(settings) {
  const syncPayload = {};
  const localPayload = {};
  for (const key of SYNC_SETTINGS_KEYS) {
    if (key in settings) syncPayload[key] = settings[key];
  }
  for (const key of LOCAL_SETTINGS_KEYS) {
    if (key in settings) localPayload[key] = settings[key];
  }
  return { syncPayload, localPayload };
}

export async function loadSettingsFromStorage() {
  try {
    const [syncData, localData] = await Promise.all([
      syncGet([...SYNC_SETTINGS_KEYS, ...LOCAL_SETTINGS_KEYS]), // read all from sync for migration check
      localGet(LOCAL_SETTINGS_KEYS)
    ]);

    // Migration: if local missing but sync has large keys, move them
    const toMigrateSyncToLocal = {};
    let needsMigration = false;
    for (const key of LOCAL_SETTINGS_KEYS) {
      const hasLocal = Object.prototype.hasOwnProperty.call(localData, key);
      const hasSync = Object.prototype.hasOwnProperty.call(syncData, key);
      if (!hasLocal && hasSync) {
        toMigrateSyncToLocal[key] = syncData[key];
        needsMigration = true;
      }
    }

    if (needsMigration) {
      try {
        await localSet(toMigrateSyncToLocal);
        await syncRemove(Object.keys(toMigrateSyncToLocal));
        // Update localData for merge
        for (const [k, v] of Object.entries(toMigrateSyncToLocal)) {
          localData[k] = v;
        }
      } catch {}
    }

    const merged = {
      ...syncData,
      ...localData
    };
    // Remove migrated keys from syncData for merge (already overridden by local)
    return normalizeSettings(merged);
  } catch (error) {
    console.warn("loadSettingsFromStorage error:", error.message);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettingsToStorage(settings) {
  const normalized = normalizeSettings(settings);
  const { syncPayload, localPayload } = splitSettingsForStorage(normalized);

  // Ensure local payload is normalized for size safety (no trimming, just ensure valid)
  // customCommands and youtubeTemplates already normalized via normalizeSettings

  await Promise.all([
    syncSet(syncPayload),
    localSet(localPayload)
  ]);
}

// For export: combined settings already via loadSettingsFromStorage, so export can just use normalized settings
// This helper ensures large payloads are not accidentally considered sync-only
export function isLargeKey(key) {
  return LOCAL_SETTINGS_KEYS.includes(key);
}
