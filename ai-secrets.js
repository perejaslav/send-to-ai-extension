export const SECRETS_STORAGE_KEY = "sendToAiSecrets";

function localGet(keys) {
  return new Promise((resolve, reject) => {
    if (!chrome.storage?.local) {
      resolve({});
      return;
    }
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result || {});
    });
  });
}

function localSet(items) {
  return new Promise((resolve, reject) => {
    if (!chrome.storage?.local) {
      resolve();
      return;
    }
    chrome.storage.local.set(items, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

function localRemove(keys) {
  return new Promise((resolve, reject) => {
    if (!chrome.storage?.local) {
      resolve();
      return;
    }
    chrome.storage.local.remove(keys, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

export async function getSecrets() {
  try {
    const result = await localGet(SECRETS_STORAGE_KEY);
    const data = result[SECRETS_STORAGE_KEY];
    if (data && typeof data === "object" && typeof data.apiKey === "string") {
      return { apiKey: data.apiKey };
    }
    return { apiKey: "" };
  } catch {
    return { apiKey: "" };
  }
}

export async function getApiKey() {
  const secrets = await getSecrets();
  return secrets.apiKey || "";
}

export async function setApiKey(apiKey) {
  const value = typeof apiKey === "string" ? apiKey.trim() : "";
  await localSet({ [SECRETS_STORAGE_KEY]: { apiKey: value } });
}

export async function clearSecrets() {
  try {
    await localRemove(SECRETS_STORAGE_KEY);
  } catch {
    // ignore
  }
}
