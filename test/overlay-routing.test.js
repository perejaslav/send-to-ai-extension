import test from "node:test";
import assert from "node:assert/strict";

import { buildOverlayConfig, decideInteractionRoute } from "../overlay-routing.js";

test("legacy mode routes to legacy", () => {
  const res = decideInteractionRoute({ interactionMode: "legacy", tabId: 123, tabUrl: "https://example.com", prompt: "hello" });
  assert.equal(res.action, "legacy");
});

test("overlay mode routes to overlay with correct tabId and prompt", () => {
  const res = decideInteractionRoute({ interactionMode: "overlay", tabId: 456, tabUrl: "https://example.com/page", prompt: "Explain this" });
  assert.equal(res.action, "overlay");
});

test("overlay on system page returns unsupported_page", () => {
  const res = decideInteractionRoute({ interactionMode: "overlay", tabId: 1, tabUrl: "chrome://extensions", prompt: "hi" });
  assert.equal(res.action, "unsupported_page");
});

test("overlay without tab returns tab_unavailable", () => {
  const res = decideInteractionRoute({ interactionMode: "overlay", tabId: null, tabUrl: "https://example.com", prompt: "hi" });
  assert.equal(res.action, "tab_unavailable");
});

test("overlay receives final transformed prompt unchanged", () => {
  const res = decideInteractionRoute({ interactionMode: "overlay", tabId: 10, tabUrl: "https://example.com", prompt: "Translate: hello world" });
  assert.equal(res.action, "overlay");
});

test("invalid prompt returns invalid_prompt", () => {
  assert.equal(decideInteractionRoute({ interactionMode: "overlay", tabId: 1, tabUrl: "https://example.com", prompt: "" }).action, "invalid_prompt");
  assert.equal(decideInteractionRoute({ interactionMode: "overlay", tabId: 1, tabUrl: "https://example.com", prompt: "   " }).action, "invalid_prompt");
  assert.equal(decideInteractionRoute({ interactionMode: "legacy", tabId: 1, tabUrl: "https://example.com", prompt: null }).action, "invalid_prompt");
});

test("invalid interactionMode falls back to legacy", () => {
  const res = decideInteractionRoute({ interactionMode: "invalid", tabId: 123, tabUrl: "https://example.com", prompt: "hello" });
  assert.equal(res.action, "legacy");
});

test("production routing helper is used — overlay requires https url", () => {
  const res = decideInteractionRoute({ interactionMode: "overlay", tabId: 123, tabUrl: "http://example.com", prompt: "hi" });
  assert.equal(res.action, "overlay");
  const res2 = decideInteractionRoute({ interactionMode: "overlay", tabId: 123, tabUrl: "ftp://example.com", prompt: "hi" });
  assert.equal(res2.action, "unsupported_page");
});

test("buildOverlayConfig returns normalized width/height and theme", () => {
  const cfg = buildOverlayConfig({ overlayMode: { width: 700, height: 800, theme: "dark", autoSend: true }, aiProvider: { model: "gpt-4o" } }, { title: "ChatGPT" });
  assert.equal(cfg.overlayMode.width, 700);
  assert.equal(cfg.overlayMode.height, 800);
  assert.equal(cfg.overlayMode.theme, "dark");
  assert.equal(cfg.autoSend, true);
  assert.equal(cfg.model, "gpt-4o");
});

test("buildOverlayConfig clamps invalid size and falls back theme", () => {
  const cfg = buildOverlayConfig({ overlayMode: { width: 100, height: 9999, theme: "bad", autoSend: "yes" }, aiProvider: {} }, null);
  assert.equal(cfg.overlayMode.width, 360);
  assert.equal(cfg.overlayMode.height, 900);
  assert.equal(cfg.overlayMode.theme, "system");
  assert.equal(cfg.autoSend, false);
  assert.equal(cfg.model, "AI Chat");
});

test("buildOverlayConfig autoSend false by default", () => {
  const cfg = buildOverlayConfig({ overlayMode: { width: 460 }, aiProvider: {} }, null);
  assert.equal(cfg.autoSend, false);
});

test("buildOverlayConfig light/dark/system themes", () => {
  assert.equal(buildOverlayConfig({ overlayMode: { theme: "light" }, aiProvider: {} }, null).overlayMode.theme, "light");
  assert.equal(buildOverlayConfig({ overlayMode: { theme: "dark" }, aiProvider: {} }, null).overlayMode.theme, "dark");
  assert.equal(buildOverlayConfig({ overlayMode: { theme: "system" }, aiProvider: {} }, null).overlayMode.theme, "system");
});
