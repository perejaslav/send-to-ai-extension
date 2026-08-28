import test from "node:test";
import assert from "node:assert/strict";

import { splitSettingsForStorage, SYNC_SETTINGS_KEYS, LOCAL_SETTINGS_KEYS } from "../settings-storage.js";
import { buildDefaultSettings } from "../settings.js";

function makeLargeString(size) {
  return "a".repeat(size);
}

test("large customCommands >8KB not in sync payload", () => {
  const largeCommands = [{ id: "cmd1", title: makeLargeString(9000), template: "x", serviceId: "a", contextType: "selection" }];
  const settings = { ...buildDefaultSettings(["a"]), customCommands: largeCommands, youtubeTemplates: [] };
  const { syncPayload, localPayload } = splitSettingsForStorage(settings);
  assert.equal("customCommands" in syncPayload, false, "customCommands must not be in sync");
  assert.ok("customCommands" in localPayload);
  assert.equal(JSON.stringify(syncPayload).length < 8192, true, "sync payload must be under quota");
  assert.ok(JSON.stringify(localPayload.customCommands).length > 8000);
});

test("large youtubeTemplates >8KB not in sync payload", () => {
  const largeTemplates = [{ id: "t1", title: makeLargeString(9000), template: "y", serviceId: "a", enabled: true }];
  const settings = { ...buildDefaultSettings(["a"]), youtubeTemplates: largeTemplates, customCommands: [] };
  const { syncPayload, localPayload } = splitSettingsForStorage(settings);
  assert.equal("youtubeTemplates" in syncPayload, false);
  assert.ok("youtubeTemplates" in localPayload);
  assert.ok(JSON.stringify(localPayload.youtubeTemplates).length > 8000);
});

test("split keeps small keys in sync", () => {
  const settings = buildDefaultSettings(["a"]);
  settings.interactionMode = "overlay";
  settings.overlayMode = { width: 700, height: 800, autoSend: true, rememberConversation: false, theme: "dark" };
  const { syncPayload } = splitSettingsForStorage(settings);
  assert.ok("interactionMode" in syncPayload);
  assert.ok("overlayMode" in syncPayload);
  assert.ok("aiProvider" in syncPayload);
  assert.equal(syncPayload.interactionMode, "overlay");
});

test("overlay mode preserved even with large templates", () => {
  const largeTemplates = [{ id: "t1", title: makeLargeString(9000), template: "y", serviceId: "a" }];
  const settings = { ...buildDefaultSettings(["a"]), interactionMode: "overlay", youtubeTemplates: largeTemplates };
  const { syncPayload } = splitSettingsForStorage(settings);
  assert.equal(syncPayload.interactionMode, "overlay");
  assert.ok(syncPayload.youtubeTemplates === undefined);
});

test("SYNC keys do not include large keys", () => {
  assert.equal(SYNC_SETTINGS_KEYS.includes("customCommands"), false);
  assert.equal(SYNC_SETTINGS_KEYS.includes("youtubeTemplates"), false);
  assert.equal(LOCAL_SETTINGS_KEYS.includes("customCommands"), true);
  assert.equal(LOCAL_SETTINGS_KEYS.includes("youtubeTemplates"), true);
});

test("load merges sync+local conceptually", () => {
  const syncData = { serviceOrder: ["a"], interactionMode: "overlay" };
  const localData = { customCommands: [{ id: "c1" }], youtubeTemplates: [{ id: "y1" }] };
  const merged = { ...syncData, ...localData };
  assert.equal(merged.interactionMode, "overlay");
  assert.ok(Array.isArray(merged.customCommands));
  assert.ok(Array.isArray(merged.youtubeTemplates));
});

test("migration sync->local is idempotent conceptually", () => {
  const syncData = { customCommands: [{ id: "c1" }], youtubeTemplates: [{ id: "y1" }], serviceOrder: ["a"] };
  const localData = {};
  // First migration: move
  const toMigrate = {};
  for (const key of ["customCommands", "youtubeTemplates"]) {
    if (!(key in localData) && key in syncData) toMigrate[key] = syncData[key];
  }
  assert.deepEqual(Object.keys(toMigrate), ["customCommands", "youtubeTemplates"]);
  // Second migration after first: local now has keys, no more migration
  const localAfter = { ...localData, ...toMigrate };
  const toMigrate2 = {};
  for (const key of ["customCommands", "youtubeTemplates"]) {
    if (!(key in localAfter) && key in syncData) toMigrate2[key] = syncData[key];
  }
  assert.equal(Object.keys(toMigrate2).length, 0);
});

test("manifest no longer contains default_popup", async () => {
  const { readFileSync } = await import("node:fs");
  const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
  assert.equal("default_popup" in (manifest.action || {}), false, "manifest must not contain default_popup");
});

test("toolbar action on unsupported URL returns error (pure helper)", async () => {
  const { decideInteractionRoute } = await import("../overlay-routing.js");
  const res = decideInteractionRoute({ interactionMode: "overlay", tabId: 123, tabUrl: "chrome://extensions", prompt: "hi" });
  assert.equal(res.action, "unsupported_page");
});

test("toolbar action route overlay on http", async () => {
  const { decideInteractionRoute } = await import("../overlay-routing.js");
  const res = decideInteractionRoute({ interactionMode: "overlay", tabId: 123, tabUrl: "https://example.com", prompt: "hi" });
  assert.equal(res.action, "overlay");
});
