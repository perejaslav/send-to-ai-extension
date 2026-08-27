import { normalizeInteractionMode, normalizeOverlayMode } from "./settings.js";

export function buildOverlayConfig(settings, service) {
  const overlayMode = normalizeOverlayMode(settings?.overlayMode);
  return {
    overlayMode,
    model: settings?.aiProvider?.model || service?.title || "AI Chat",
    autoSend: !!overlayMode.autoSend
  };
}

export function decideInteractionRoute({ interactionMode, tabId, tabUrl, prompt }) {
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return { action: "invalid_prompt" };
  }

  if (typeof tabId !== "number") {
    return { action: "tab_unavailable" };
  }

  const mode = normalizeInteractionMode(interactionMode);
  if (mode !== "overlay") {
    return { action: "legacy" };
  }

  if (!tabUrl || typeof tabUrl !== "string" || !/^https?:\/\//i.test(tabUrl)) {
    return { action: "unsupported_page" };
  }

  return { action: "overlay" };
}
