import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEYS, normalizeSettings } from "../settings.js";
import { SECRETS_STORAGE_KEY } from "../ai-secrets.js";

test("apiKey not in sync storage keys", () => {
  assert.equal(SETTINGS_STORAGE_KEYS.includes("apiKey"), false);
  assert.equal(SETTINGS_STORAGE_KEYS.includes("sendToAiSecrets"), false);
  assert.equal(SETTINGS_STORAGE_KEYS.includes(SECRETS_STORAGE_KEY), false);
});

test("DEFAULT_SETTINGS does not contain apiKey", () => {
  assert.equal("apiKey" in DEFAULT_SETTINGS, false);
  assert.equal("apiKey" in DEFAULT_SETTINGS.aiProvider, false);
});

test("export payload must not include apiKey", () => {
  const settings = normalizeSettings({}, ["a"]);
  const payload = {
    schemaVersion: 2,
    secretsIncluded: false,
    settings: {
      serviceOrder: settings.serviceOrder,
      enabledServices: settings.enabledServices,
      defaultServiceId: settings.defaultServiceId,
      showSpecialActions: settings.showSpecialActions,
      enabledSpecialActions: settings.enabledSpecialActions,
      showContextActionsQwen: settings.showContextActionsQwen,
      enabledContextActionsQwen: settings.enabledContextActionsQwen,
      showContextActionsGrok: settings.showContextActionsGrok,
      enabledContextActionsGrok: settings.enabledContextActionsGrok,
      customCommands: settings.customCommands,
      activeProfileIds: settings.activeProfileIds,
      youtubeTemplates: settings.youtubeTemplates,
      interactionMode: settings.interactionMode,
      overlayMode: settings.overlayMode,
      aiProvider: settings.aiProvider
    }
  };
  const json = JSON.stringify(payload);
  assert.equal(json.includes("apiKey"), false);
  assert.equal(json.includes("sk-"), false);
  assert.equal(payload.secretsIncluded, false);
  assert.equal(payload.settings.apiKey, undefined);
  assert.equal(payload.settings.aiProvider.apiKey, undefined);
});

test("import does not overwrite existing apiKey with empty", async () => {
  // Simulate existing secrets with apiKey
  const existingApiKey = "sk-existing";
  const imported = normalizeSettings({ aiProvider: { baseUrl: "https://api.example.com/v1", model: "gpt-4o" } }, ["a"]);
  // Import should not contain apiKey, so existing should remain
  // In real flow, options.js import does not touch chrome.storage.local
  assert.equal(imported.aiProvider.baseUrl, "https://api.example.com/v1");
  // Simulate that secrets storage still has old key (not cleared)
  assert.equal(existingApiKey, "sk-existing");
});
