import test from "node:test";
import assert from "node:assert/strict";

import { SPECIAL_ACTIONS } from "../services.js";
import { buildDefaultSettings, normalizeSettings } from "../settings.js";

test("buildDefaultSettings enables all services and special actions", () => {
  const settings = buildDefaultSettings(["a", "b"]);

  assert.deepEqual(settings.serviceOrder, ["a", "b"]);
  assert.deepEqual(settings.enabledServices, { a: true, b: true });
  assert.equal(settings.defaultServiceId, "a");
  assert.equal(settings.showSpecialActions, true);
  assert.deepEqual(Object.keys(settings.enabledSpecialActions).sort(), SPECIAL_ACTIONS.map((action) => action.id).sort());
  assert.ok(Object.values(settings.enabledSpecialActions).every(Boolean));
});

test("normalizeSettings removes duplicates, invalid ids, and repairs default service", () => {
  const settings = normalizeSettings({
    serviceOrder: ["b", "missing", "a", "b"],
    enabledServices: { a: false, b: true },
    defaultServiceId: "a",
    showSpecialActions: false,
    enabledSpecialActions: {
      sendAndTranslateToQwen: false,
      factCheckInChatGPT: false
    }
  }, ["a", "b", "c"]);

  assert.deepEqual(settings.serviceOrder, ["b", "a", "c"]);
  assert.deepEqual(settings.enabledServices, { a: false, b: true, c: true });
  assert.equal(settings.defaultServiceId, "b");
  assert.equal(settings.showSpecialActions, false);
  assert.equal(settings.enabledSpecialActions.sendAndTranslateToQwen, false);
  assert.equal(settings.enabledSpecialActions.factCheckInChatGPT, false);
  assert.ok(settings.enabledSpecialActions.summarizeInChatGPT);
});

test("normalizeSettings keeps special actions enabled when settings are missing", () => {
  const settings = normalizeSettings({
    serviceOrder: ["a"],
    enabledServices: { a: true },
    defaultServiceId: "a"
  }, ["a"]);

  assert.ok(Object.values(settings.enabledSpecialActions).every(Boolean));
});
