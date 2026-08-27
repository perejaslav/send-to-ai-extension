import test from "node:test";
import assert from "node:assert/strict";

import { normalizeSettings } from "../settings.js";

// Pure helper extracted for testability — mirrors background dispatch logic
function shouldUseOverlay(settings) {
  return settings.interactionMode === "overlay";
}

function routePrompt({ settings, tab, prompt }) {
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) return { action: "invalid_prompt" };
  if (!tab || typeof tab.id !== "number") return { action: "tab_unavailable" };
  if (shouldUseOverlay(settings)) {
    // Check injectable URL
    if (!tab.url || !/^https?:\/\//i.test(tab.url)) return { action: "unsupported_page" };
    return { action: "overlay", tabId: tab.id, prompt };
  }
  return { action: "legacy", prompt };
}

test("legacy mode routes to legacy", () => {
  const settings = normalizeSettings({ interactionMode: "legacy" }, ["a"]);
  const res = routePrompt({ settings, tab: { id: 123, url: "https://example.com" }, prompt: "hello" });
  assert.equal(res.action, "legacy");
});

test("overlay mode routes to overlay with correct tabId and prompt", () => {
  const settings = normalizeSettings({ interactionMode: "overlay", overlayMode: { width: 460 }, aiProvider: { baseUrl: "https://api.example.com/v1", model: "gpt-4o" } }, ["a"]);
  const prompt = "Explain this";
  const tab = { id: 456, url: "https://example.com/page" };
  const res = routePrompt({ settings, tab, prompt });
  assert.equal(res.action, "overlay");
  assert.equal(res.tabId, 456);
  assert.equal(res.prompt, prompt);
});

test("overlay on system page returns unsupported_page", () => {
  const settings = normalizeSettings({ interactionMode: "overlay" }, ["a"]);
  const res = routePrompt({ settings, tab: { id: 1, url: "chrome://extensions" }, prompt: "hi" });
  assert.equal(res.action, "unsupported_page");
});

test("overlay without tab returns tab_unavailable", () => {
  const settings = normalizeSettings({ interactionMode: "overlay" }, ["a"]);
  const res = routePrompt({ settings, tab: null, prompt: "hi" });
  assert.equal(res.action, "tab_unavailable");
});

test("overlay receives final transformed prompt unchanged", () => {
  const settings = normalizeSettings({ interactionMode: "overlay" }, ["a"]);
  const transformed = "Translate: hello world";
  const res = routePrompt({ settings, tab: { id: 10, url: "https://example.com" }, prompt: transformed });
  assert.equal(res.prompt, transformed);
});
