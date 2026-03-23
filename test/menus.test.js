import test from "node:test";
import assert from "node:assert/strict";

import { buildMenuDescriptors } from "../menus.js";

test("buildMenuDescriptors creates quick default and flat special actions", () => {
  const descriptors = buildMenuDescriptors({
    serviceOrder: ["sendToChatGPT", "sendToQwen"],
    enabledServices: { sendToChatGPT: true, sendToQwen: true },
    defaultServiceId: "sendToQwen",
    showSpecialActions: true
  });

  const ids = descriptors.map((item) => item.id);
  assert.ok(ids.includes("sendToAI"));
  assert.ok(ids.includes("sendToAIDefault"));
  assert.ok(ids.includes("summarizeLinkInChatGPT"));
  assert.ok(ids.includes("openYouTubeInGemini"));
  assert.ok(ids.includes("sendToAISeparator"));
  assert.ok(ids.includes("sendAndTranslateToQwen"));
  assert.ok(ids.includes("summarizeInChatGPT"));

  const qwenAction = descriptors.find((item) => item.id === "sendAndTranslateToQwen");
  assert.equal(qwenAction.parentId, "sendToAI");

  const genericLinkAction = descriptors.find((item) => item.id === "summarizeLinkInChatGPT");
  assert.deepEqual(genericLinkAction.contexts, ["link"]);
});

test("buildMenuDescriptors omits special actions when disabled in settings", () => {
  const descriptors = buildMenuDescriptors({
    serviceOrder: ["sendToChatGPT"],
    enabledServices: { sendToChatGPT: true },
    defaultServiceId: "sendToChatGPT",
    showSpecialActions: false
  });

  const ids = descriptors.map((item) => item.id);
  assert.ok(!ids.includes("sendToAISeparator"));
  assert.ok(!ids.includes("summarizeInChatGPT"));
});
