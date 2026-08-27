export const OVERLAY_HISTORY_KEY = "sendToAiOverlayHistory";
export const MAX_MESSAGES = 30;
export const MAX_CHARS = 50000;

function sessionGet(keys) {
  return new Promise((resolve, reject) => {
    if (!chrome.storage?.session) {
      resolve({});
      return;
    }
    chrome.storage.session.get(keys, (result) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(result || {});
    });
  });
}

function sessionSet(items) {
  return new Promise((resolve, reject) => {
    if (!chrome.storage?.session) {
      resolve();
      return;
    }
    chrome.storage.session.set(items, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

export function trimHistory(messages) {
  if (!Array.isArray(messages)) return [];
  let trimmed = [...messages];
  // Keep max 30 messages (trim oldest)
  if (trimmed.length > MAX_MESSAGES) {
    trimmed = trimmed.slice(trimmed.length - MAX_MESSAGES);
  }
  // Keep total chars ~50k
  let total = trimmed.reduce((sum, m) => sum + String(m.content || "").length, 0);
  while (total > MAX_CHARS && trimmed.length > 2) {
    const removed = trimmed.shift();
    total -= String(removed.content || "").length;
  }
  return trimmed;
}

export async function getOverlayHistory(tabId) {
  if (typeof tabId !== "number") return { messages: [], model: "", updatedAt: 0 };
  try {
    const result = await sessionGet(OVERLAY_HISTORY_KEY);
    const all = result[OVERLAY_HISTORY_KEY] || {};
    const entry = all[String(tabId)];
    if (entry && Array.isArray(entry.messages)) {
      return { messages: entry.messages, model: entry.model || "", updatedAt: entry.updatedAt || 0 };
    }
    return { messages: [], model: "", updatedAt: 0 };
  } catch {
    return { messages: [], model: "", updatedAt: 0 };
  }
}

export async function setOverlayHistory(tabId, history) {
  if (typeof tabId !== "number") return;
  try {
    const result = await sessionGet(OVERLAY_HISTORY_KEY);
    const all = result[OVERLAY_HISTORY_KEY] || {};
    all[String(tabId)] = {
      messages: Array.isArray(history.messages) ? trimHistory(history.messages) : [],
      model: history.model || "",
      updatedAt: Date.now()
    };
    await sessionSet({ [OVERLAY_HISTORY_KEY]: all });
  } catch {}
}

export async function appendOverlayMessage(tabId, role, content, model = "") {
  const history = await getOverlayHistory(tabId);
  const messages = trimHistory([...history.messages, { role, content }]);
  await setOverlayHistory(tabId, { messages, model: model || history.model, updatedAt: Date.now() });
  return messages;
}

export async function clearOverlayHistory(tabId) {
  if (typeof tabId !== "number") return;
  try {
    const result = await sessionGet(OVERLAY_HISTORY_KEY);
    const all = result[OVERLAY_HISTORY_KEY] || {};
    delete all[String(tabId)];
    await sessionSet({ [OVERLAY_HISTORY_KEY]: all });
  } catch {}
}

export async function replaceOverlayHistory(tabId, messages, model = "") {
  await setOverlayHistory(tabId, { messages: trimHistory(messages), model, updatedAt: Date.now() });
}
