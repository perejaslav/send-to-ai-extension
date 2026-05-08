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
  assert.ok(ids.includes("openYouTubeArticleInGemini"));
  assert.ok(ids.includes("openYouTubeSummaryInGemini"));
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

test("buildMenuDescriptors creates Qwen context actions submenu", () => {
  const descriptors = buildMenuDescriptors({
    serviceOrder: ["sendToQwen"],
    enabledServices: { sendToQwen: true },
    defaultServiceId: "sendToQwen",
    showSpecialActions: false,
    showContextActionsQwen: true
  });

  const ids = descriptors.map((item) => item.id);
  assert.ok(ids.includes("pageAndLinkActionsQwen"));
  assert.ok(ids.includes("pageSummaryInQwen"));
  assert.ok(ids.includes("pageFactCheckInQwen"));
  assert.ok(ids.includes("pageTranslateInQwen"));
  assert.ok(ids.includes("pageKeyPointsInQwen"));
  assert.ok(ids.includes("linkSummaryInQwen"));
  assert.ok(ids.includes("linkFactCheckInQwen"));
  assert.ok(ids.includes("linkTranslateInQwen"));
  assert.ok(ids.includes("linkKeyPointsInQwen"));

  const qwenMenu = descriptors.find((item) => item.id === "pageAndLinkActionsQwen");
  assert.deepEqual(qwenMenu.contexts, ["page", "link"]);

  const pageSummaryQwen = descriptors.find((item) => item.id === "pageSummaryInQwen");
  assert.equal(pageSummaryQwen.parentId, "pageAndLinkActionsQwen");
  assert.deepEqual(pageSummaryQwen.contexts, ["page"]);
});

test("buildMenuDescriptors omits Qwen context actions when disabled", () => {
  const descriptors = buildMenuDescriptors({
    serviceOrder: ["sendToQwen"],
    enabledServices: { sendToQwen: true },
    defaultServiceId: "sendToQwen",
    showSpecialActions: false,
    showContextActionsQwen: false
  });

  const ids = descriptors.map((item) => item.id);
  assert.ok(!ids.includes("pageAndLinkActionsQwen"));
  assert.ok(!ids.includes("pageSummaryInQwen"));
});

test("buildMenuDescriptors respects individual Qwen context action toggles", () => {
  const descriptors = buildMenuDescriptors({
    serviceOrder: ["sendToQwen"],
    enabledServices: { sendToQwen: true },
    defaultServiceId: "sendToQwen",
    showSpecialActions: false,
    showContextActionsQwen: true,
    enabledContextActionsQwen: {
      pageSummaryInQwen: true,
      pageFactCheckInQwen: false,
      pageTranslateInQwen: false,
      pageKeyPointsInQwen: false,
      linkSummaryInQwen: false,
      linkFactCheckInQwen: false,
      linkTranslateInQwen: false,
      linkKeyPointsInQwen: false
    }
  });

  const ids = descriptors.map((item) => item.id);
  assert.ok(ids.includes("pageSummaryInQwen"));
  assert.ok(!ids.includes("pageFactCheckInQwen"));
  assert.ok(!ids.includes("linkSummaryInQwen"));
});

test("buildMenuDescriptors creates custom commands submenu", () => {
  const descriptors = buildMenuDescriptors({
    serviceOrder: ["sendToChatGPT", "sendToQwen"],
    enabledServices: { sendToChatGPT: true, sendToQwen: false },
    defaultServiceId: "sendToChatGPT",
    showSpecialActions: false,
    showContextActionsQwen: false,
    activeProfileIds: ["all"],
    customCommands: [
      {
        id: "custom-selection",
        title: "Custom selection",
        enabled: true,
        serviceId: "sendToChatGPT",
        contextType: "selection",
        template: "Process {selection}",
        order: 1
      },
      {
        id: "custom-disabled-service",
        title: "Custom disabled service",
        enabled: true,
        serviceId: "sendToQwen",
        contextType: "link",
        template: "Process {url}",
        order: 2
      }
    ]
  });

  const ids = descriptors.map((item) => item.id);
  assert.ok(ids.includes("customCommands"));
  assert.ok(ids.includes("custom-selection"));
  assert.ok(!ids.includes("custom-disabled-service"));

  const customSelection = descriptors.find((item) => item.id === "custom-selection");
  assert.equal(customSelection.parentId, "customCommands");
  assert.deepEqual(customSelection.contexts, ["selection"]);
});

test("buildMenuDescriptors filters custom commands by active profiles", () => {
  const descriptors = buildMenuDescriptors({
    serviceOrder: ["sendToChatGPT"],
    enabledServices: { sendToChatGPT: true },
    defaultServiceId: "sendToChatGPT",
    showSpecialActions: false,
    showContextActionsQwen: false,
    activeProfileIds: ["marketing"],
    customCommands: [
      {
        id: "marketing-command",
        title: "Marketing command",
        enabled: true,
        serviceId: "sendToChatGPT",
        contextType: "selection",
        template: "Marketing {selection}",
        profileIds: ["marketing"],
        order: 1
      },
      {
        id: "research-command",
        title: "Research command",
        enabled: true,
        serviceId: "sendToChatGPT",
        contextType: "selection",
        template: "Research {selection}",
        profileIds: ["research"],
        order: 2
      },
      {
        id: "unprofiled-command",
        title: "Unprofiled command",
        enabled: true,
        serviceId: "sendToChatGPT",
        contextType: "selection",
        template: "Any {selection}",
        profileIds: [],
        order: 3
      }
    ]
  });

  const ids = descriptors.map((item) => item.id);
  assert.ok(ids.includes("marketing-command"));
  assert.ok(ids.includes("unprofiled-command"));
  assert.ok(!ids.includes("research-command"));
});
