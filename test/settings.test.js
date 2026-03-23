import test from "node:test";
import assert from "node:assert/strict";

import { buildDefaultSettings, normalizeSettings } from "../settings.js";

test("buildDefaultSettings enables all services and special actions", () => {
  const settings = buildDefaultSettings(["a", "b"]);

  assert.deepEqual(settings.serviceOrder, ["a", "b"]);
  assert.deepEqual(settings.enabledServices, { a: true, b: true });
  assert.equal(settings.defaultServiceId, "a");
  assert.equal(settings.showSpecialActions, true);
});

test("normalizeSettings removes duplicates, invalid ids, and repairs default service", () => {
  const settings = normalizeSettings({
    serviceOrder: ["b", "missing", "a", "b"],
    enabledServices: { a: false, b: true },
    defaultServiceId: "a",
    showSpecialActions: false
  }, ["a", "b", "c"]);

  assert.deepEqual(settings.serviceOrder, ["b", "a", "c"]);
  assert.deepEqual(settings.enabledServices, { a: false, b: true, c: true });
  assert.equal(settings.defaultServiceId, "b");
  assert.equal(settings.showSpecialActions, false);
});
