import { SETTINGS_STORAGE_KEYS, normalizeSettings } from "./settings.js";

// chrome.storage.sync allows only 8192 bytes per item. YouTube templates take
// about 40 KB, so they (and custom commands) live in chrome.storage.local.
export const LOCAL_SETTINGS_KEYS = ["customCommands", "youtubeTemplates"];

export const SYNC_SETTINGS_KEYS = SETTINGS_STORAGE_KEYS.filter(
  (key) => !LOCAL_SETTINGS_KEYS.includes(key)
);

function getAreas(areas) {
  if (areas) {
    return areas;
  }

  return { sync: chrome.storage.sync, local: chrome.storage.local };
}

function getLastErrorMessage() {
  return globalThis.chrome?.runtime?.lastError?.message || null;
}

function readArea(area, keys) {
  return new Promise((resolve, reject) => {
    area.get(keys, (result) => {
      const errorMessage = getLastErrorMessage();
      if (errorMessage) {
        reject(new Error(errorMessage));
        return;
      }

      resolve(result || {});
    });
  });
}

function writeArea(area, values) {
  return new Promise((resolve, reject) => {
    area.set(values, () => {
      const errorMessage = getLastErrorMessage();
      if (errorMessage) {
        reject(new Error(errorMessage));
        return;
      }

      resolve();
    });
  });
}

function removeArea(area, keys) {
  return new Promise((resolve, reject) => {
    area.remove(keys, () => {
      const errorMessage = getLastErrorMessage();
      if (errorMessage) {
        reject(new Error(errorMessage));
        return;
      }

      resolve();
    });
  });
}

function pickKeys(source, keys) {
  const result = {};

  for (const key of keys) {
    result[key] = source[key];
  }

  return result;
}

// Splits settings into the parts stored in each area. Only keys that are
// present in the input are returned, so a page that does not manage some
// setting cannot overwrite it.
export function splitSettingsForStorage(settings) {
  const syncPayload = {};
  const localPayload = {};

  for (const key of SYNC_SETTINGS_KEYS) {
    if (key in settings) {
      syncPayload[key] = settings[key];
    }
  }

  for (const key of LOCAL_SETTINGS_KEYS) {
    if (key in settings) {
      localPayload[key] = settings[key];
    }
  }

  return { syncPayload, localPayload };
}

// One-time move of settings that used to live in chrome.storage.sync. Local
// values win; a second call finds nothing to move and changes nothing.
export async function migrateSettingsToLocal(areas) {
  const { sync, local } = getAreas(areas);
  const [syncValues, localValues] = await Promise.all([
    readArea(sync, LOCAL_SETTINGS_KEYS),
    readArea(local, LOCAL_SETTINGS_KEYS)
  ]);

  const valuesToMove = {};
  const legacySyncKeys = [];

  for (const key of LOCAL_SETTINGS_KEYS) {
    const hasLocalValue = localValues[key] !== undefined;
    const hasSyncValue = syncValues[key] !== undefined;

    if (!hasSyncValue) {
      continue;
    }

    legacySyncKeys.push(key);

    if (!hasLocalValue) {
      valuesToMove[key] = syncValues[key];
    }
  }

  if (Object.keys(valuesToMove).length > 0) {
    await writeArea(local, valuesToMove);
  }

  if (legacySyncKeys.length > 0) {
    await removeArea(sync, legacySyncKeys);
  }
}

export async function loadSettingsFromStorage(areas) {
  const { sync, local } = getAreas(areas);

  try {
    await migrateSettingsToLocal({ sync, local });
  } catch (error) {
    console.warn("settings migration to local failed:", error.message);
  }

  const [syncValues, localValues] = await Promise.all([
    readArea(sync, SYNC_SETTINGS_KEYS),
    readArea(local, LOCAL_SETTINGS_KEYS)
  ]);

  return normalizeSettings({ ...syncValues, ...localValues });
}

export async function saveSettingsToStorage(settings, areas) {
  const { sync, local } = getAreas(areas);
  const normalized = normalizeSettings(settings);
  const { syncPayload, localPayload } = splitSettingsForStorage(settings);

  const writes = [];

  if (Object.keys(syncPayload).length > 0) {
    writes.push(writeArea(sync, pickKeys(normalized, Object.keys(syncPayload))));
  }

  if (Object.keys(localPayload).length > 0) {
    writes.push(writeArea(local, pickKeys(normalized, Object.keys(localPayload))));
  }

  await Promise.all(writes);
}
