import test from "node:test";
import assert from "node:assert/strict";

import { buildMenuDescriptors } from "../menus.js";

test("buildMenuDescriptors creates quick default and nested special actions", () => {
  const descriptors = buildMenuDescriptors({
    serviceOrder: ["sendToChatGPT", "sendToQwen"],
    enabledServices: { sendToChatGPT: true, sendToQwen: true },
    defaultServiceId: "sendToQwen",
    showSpecialActions: true
  });

  const ids = descriptors.map((item) => item.id);
  assert.ok(ids.includes("sendToAI"));
  assert.ok(ids.includes("sendToAIDefault"));
  assert.ok(ids.includes("sendToAISpecialActions"));
  assert.ok(ids.includes("sendAndTranslateToQwen"));
  assert.ok(ids.includes("summarizeInChatGPT"));
});

test("buildMenuDescriptors omits special actions when disabled in settings", () => {
  const descriptors = buildMenuDescriptors({
    serviceOrder: ["sendToChatGPT"],
    enabledServices: { sendToChatGPT: true },
    defaultServiceId: "sendToChatGPT",
    showSpecialActions: false
  });

  const ids = descriptors.map((item) => item.id);
  assert.ok(!ids.includes("sendToAISpecialActions"));
  assert.ok(!ids.includes("summarizeInChatGPT"));
});
