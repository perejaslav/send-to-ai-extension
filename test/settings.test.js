import test from "node:test";
import assert from "node:assert/strict";

import { ALL_CONTEXT_ACTION_QWEN_IDS, SPECIAL_ACTIONS } from "../services.js";
import { buildDefaultSettings, normalizeSettings } from "../settings.js";

test("buildDefaultSettings enables all services and special actions", () => {
  const settings = buildDefaultSettings(["a", "b"]);

  assert.deepEqual(settings.serviceOrder, ["a", "b"]);
  assert.deepEqual(settings.enabledServices, { a: true, b: true });
  assert.equal(settings.defaultServiceId, "a");
  assert.equal(settings.showSpecialActions, true);
  assert.deepEqual(Object.keys(settings.enabledSpecialActions).sort(), SPECIAL_ACTIONS.map((action) => action.id).sort());
  assert.ok(Object.values(settings.enabledSpecialActions).every(Boolean));
  assert.equal(settings.showContextActionsQwen, true);
  assert.deepEqual(Object.keys(settings.enabledContextActionsQwen).sort(), ALL_CONTEXT_ACTION_QWEN_IDS.sort());
  assert.ok(Object.values(settings.enabledContextActionsQwen).every(Boolean));
  assert.deepEqual(settings.customCommands, []);
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
    },
    showContextActionsQwen: false,
    enabledContextActionsQwen: {
      pageSummaryInQwen: false
    }
  }, ["a", "b", "c"]);

  assert.deepEqual(settings.serviceOrder, ["b", "a", "c"]);
  assert.deepEqual(settings.enabledServices, { a: false, b: true, c: true });
  assert.equal(settings.defaultServiceId, "b");
  assert.equal(settings.showSpecialActions, false);
  assert.equal(settings.enabledSpecialActions.sendAndTranslateToQwen, false);
  assert.equal(settings.enabledSpecialActions.factCheckInChatGPT, false);
  assert.ok(settings.enabledSpecialActions.summarizeInChatGPT);
  assert.equal(settings.showContextActionsQwen, false);
  assert.equal(settings.enabledContextActionsQwen.pageSummaryInQwen, false);
  assert.ok(settings.enabledContextActionsQwen.pageFactCheckInQwen);
});

test("normalizeSettings keeps special actions enabled when settings are missing", () => {
  const settings = normalizeSettings({
    serviceOrder: ["a"],
    enabledServices: { a: true },
    defaultServiceId: "a"
  }, ["a"]);

  assert.ok(Object.values(settings.enabledSpecialActions).every(Boolean));
  assert.ok(Object.values(settings.enabledContextActionsQwen).every(Boolean));
});

test("normalizeSettings normalizes custom commands", () => {
  const settings = normalizeSettings({
    serviceOrder: ["a", "b"],
    enabledServices: { a: true, b: true },
    defaultServiceId: "a",
    customCommands: [
      {
        title: "Valid custom command",
        serviceId: "a",
        contextType: "selection",
        template: "Process {selection}",
        order: 2
      },
      {
        title: "Invalid service",
        serviceId: "missing",
        template: "Skip me"
      }
    ]
  }, ["a", "b"]);

  assert.equal(settings.customCommands.length, 1);
  assert.equal(settings.customCommands[0].title, "Valid custom command");
  assert.equal(settings.customCommands[0].serviceId, "a");
});
