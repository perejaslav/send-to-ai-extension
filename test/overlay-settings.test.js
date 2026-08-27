import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_AI_PROVIDER,
  DEFAULT_INTERACTION_MODE,
  DEFAULT_OVERLAY_MODE,
  normalizeAiProvider,
  normalizeInteractionMode,
  normalizeOverlayMode,
  normalizeSettings,
  buildDefaultSettings
} from "../settings.js";

test("normalizeInteractionMode falls back to legacy for invalid", () => {
  assert.equal(normalizeInteractionMode("overlay"), "overlay");
  assert.equal(normalizeInteractionMode("legacy"), "legacy");
  assert.equal(normalizeInteractionMode("invalid"), "legacy");
  assert.equal(normalizeInteractionMode(null), "legacy");
  assert.equal(normalizeInteractionMode(undefined), "legacy");
});

test("normalizeOverlayMode clamps width and height", () => {
  assert.equal(normalizeOverlayMode({ width: 100 }).width, 360);
  assert.equal(normalizeOverlayMode({ width: 5000 }).width, 800);
  assert.equal(normalizeOverlayMode({ height: 100 }).height, 400);
  assert.equal(normalizeOverlayMode({ height: 5000 }).height, 900);
  assert.equal(normalizeOverlayMode({ width: 460 }).width, 460);
  assert.equal(normalizeOverlayMode({ height: 620 }).height, 620);
});

test("normalizeOverlayMode handles invalid theme and booleans", () => {
  assert.equal(normalizeOverlayMode({ theme: "dark" }).theme, "dark");
  assert.equal(normalizeOverlayMode({ theme: "light" }).theme, "light");
  assert.equal(normalizeOverlayMode({ theme: "system" }).theme, "system");
  assert.equal(normalizeOverlayMode({ theme: "invalid" }).theme, "system");
  assert.equal(normalizeOverlayMode({ autoSend: true }).autoSend, true);
  assert.equal(normalizeOverlayMode({ autoSend: "yes" }).autoSend, false);
  assert.equal(normalizeOverlayMode({ rememberConversation: false }).rememberConversation, false);
  assert.equal(normalizeOverlayMode({ rememberConversation: 1 }).rememberConversation, true);
});

test("normalizeAiProvider clamps temperature and trims strings", () => {
  assert.equal(normalizeAiProvider({ temperature: -1 }).temperature, 0);
  assert.equal(normalizeAiProvider({ temperature: 5 }).temperature, 2);
  assert.equal(normalizeAiProvider({ temperature: 0.7 }).temperature, 0.7);
  assert.equal(normalizeAiProvider({ baseUrl: " https://example.ai/v1 " }).baseUrl, "https://example.ai/v1");
  assert.equal(normalizeAiProvider({ model: " gpt-4 " }).model, "gpt-4");
  assert.equal(normalizeAiProvider({ type: "openai-compatible" }).type, "openai-compatible");
  assert.equal(normalizeAiProvider({ type: "invalid" }).type, "openai-compatible");
});

test("buildDefaultSettings contains overlay interactionMode and aiProvider", () => {
  const s = buildDefaultSettings(["a"]);
  assert.equal(s.interactionMode, DEFAULT_INTERACTION_MODE);
  assert.deepEqual(s.overlayMode, DEFAULT_OVERLAY_MODE);
  assert.deepEqual(s.aiProvider, DEFAULT_AI_PROVIDER);
});

test("normalizeSettings adds defaults when overlay keys missing", () => {
  const s = normalizeSettings({}, ["a"]);
  assert.deepEqual(s.overlayMode, DEFAULT_OVERLAY_MODE);
  assert.deepEqual(s.aiProvider, DEFAULT_AI_PROVIDER);
  assert.equal(s.interactionMode, "legacy");
});

test("normalizeSettings preserves valid overlay and aiProvider", () => {
  const s = normalizeSettings({
    interactionMode: "overlay",
    overlayMode: { width: 500, height: 700, autoSend: true, rememberConversation: false, theme: "dark" },
    aiProvider: { type: "openai-compatible", baseUrl: "https://api.openai.com/v1", model: "gpt-4o", temperature: 1.2 }
  }, ["a"]);
  assert.equal(s.interactionMode, "overlay");
  assert.equal(s.overlayMode.width, 500);
  assert.equal(s.overlayMode.height, 700);
  assert.equal(s.overlayMode.autoSend, true);
  assert.equal(s.overlayMode.theme, "dark");
  assert.equal(s.aiProvider.baseUrl, "https://api.openai.com/v1");
  assert.equal(s.aiProvider.model, "gpt-4o");
  assert.equal(s.aiProvider.temperature, 1.2);
});

test("normalizeSettings clamps invalid overlayMode and aiProvider", () => {
  const s = normalizeSettings({
    overlayMode: { width: -100, height: 9999, theme: "bad", autoSend: "yes" },
    aiProvider: { temperature: 99, baseUrl: 123, model: 456 }
  }, ["a"]);
  assert.equal(s.overlayMode.width, 360);
  assert.equal(s.overlayMode.height, 900);
  assert.equal(s.overlayMode.theme, "system");
  assert.equal(s.overlayMode.autoSend, false);
  assert.equal(s.aiProvider.temperature, 2);
  assert.equal(s.aiProvider.baseUrl, "");
  assert.equal(s.aiProvider.model, "");
});
