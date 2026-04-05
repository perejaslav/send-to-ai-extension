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
  assert.ok(ids.includes("pageAndLinkActions"));
  assert.ok(ids.includes("pageSummaryInChatGPT"));
  assert.ok(ids.includes("pageFactCheckInChatGPT"));
  assert.ok(ids.includes("pageTranslateInChatGPT"));
  assert.ok(ids.includes("pageKeyPointsInChatGPT"));
  assert.ok(ids.includes("linkSummaryInChatGPT"));
  assert.ok(ids.includes("linkFactCheckInChatGPT"));
  assert.ok(ids.includes("linkTranslateInChatGPT"));
  assert.ok(ids.includes("linkKeyPointsInChatGPT"));
  assert.ok(ids.includes("openYouTubeInGemini"));
  assert.ok(ids.includes("sendToAISeparator"));
  assert.ok(ids.includes("sendAndTranslateToQwen"));
  assert.ok(ids.includes("summarizeInChatGPT"));
  assert.ok(ids.includes("factCheckInChatGPT"));

  const qwenAction = descriptors.find((item) => item.id === "sendAndTranslateToQwen");
  assert.equal(qwenAction.parentId, "sendToAI");

  const contextMenu = descriptors.find((item) => item.id === "pageAndLinkActions");
  assert.deepEqual(contextMenu.contexts, ["page", "link"]);

  const pageSummaryAction = descriptors.find((item) => item.id === "pageSummaryInChatGPT");
  assert.equal(pageSummaryAction.parentId, "pageAndLinkActions");
  assert.deepEqual(pageSummaryAction.contexts, ["page"]);

  const linkSummaryAction = descriptors.find((item) => item.id === "linkSummaryInChatGPT");
  assert.equal(linkSummaryAction.parentId, "pageAndLinkActions");
  assert.deepEqual(linkSummaryAction.contexts, ["link"]);
});

test("buildMenuDescriptors omits special actions when disabled in settings", () => {
  const descriptors = buildMenuDescriptors({
    serviceOrder: ["sendToChatGPT"],
    enabledServices: { sendToChatGPT: true },
    defaultServiceId: "sendToChatGPT",
    showSpecialActions: false,
    enabledSpecialActions: {
      sendAndTranslateToQwen: true,
      sendAndTranslateToChatGPT: true,
      summarizeInChatGPT: true,
      factCheckInChatGPT: true
    }
  });

  const ids = descriptors.map((item) => item.id);
  assert.ok(!ids.includes("sendToAISeparator"));
  assert.ok(!ids.includes("summarizeInChatGPT"));
  assert.ok(!ids.includes("factCheckInChatGPT"));
});

test("buildMenuDescriptors respects individual special action toggles", () => {
  const descriptors = buildMenuDescriptors({
    serviceOrder: ["sendToChatGPT"],
    enabledServices: { sendToChatGPT: true },
    defaultServiceId: "sendToChatGPT",
    showSpecialActions: true,
    enabledSpecialActions: {
      sendAndTranslateToQwen: false,
      sendAndTranslateToChatGPT: false,
      summarizeInChatGPT: false,
      factCheckInChatGPT: true
    }
  });

  const ids = descriptors.map((item) => item.id);
  assert.ok(ids.includes("factCheckInChatGPT"));
  assert.ok(!ids.includes("summarizeInChatGPT"));
  assert.ok(!ids.includes("sendAndTranslateToChatGPT"));
});
