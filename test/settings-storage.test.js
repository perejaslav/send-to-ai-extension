import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_SETTINGS, normalizeSettings } from "../settings.js";
import {
  LOCAL_SETTINGS_KEYS,
  SYNC_SETTINGS_KEYS,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  splitSettingsForStorage
} from "../settings-storage.js";
import { normalizeYouTubeTemplates } from "../youtube-templates.js";

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function createStorageArea(initialValues = {}) {
  const values = clone(initialValues);

  return {
    values,
    get(keys, callback) {
      const result = {};

      for (const key of keys) {
        if (values[key] !== undefined) {
          result[key] = clone(values[key]);
        }
      }

      callback(result);
    },
    set(newValues, callback) {
      Object.assign(values, clone(newValues));
      callback();
    },
    remove(keys, callback) {
      for (const key of keys) {
        delete values[key];
      }

      callback();
    }
  };
}

function createAreas({ sync = {}, local = {} } = {}) {
  return {
    sync: createStorageArea(sync),
    local: createStorageArea(local)
  };
}

function buildLargeTemplates() {
  return normalizeYouTubeTemplates().map((template) => ({
    ...template,
    template: `${template.template}\n${"x".repeat(4000)}`
  }));
}

test("SYNC_SETTINGS_KEYS keeps large settings out of sync", () => {
  for (const key of LOCAL_SETTINGS_KEYS) {
    assert.ok(!SYNC_SETTINGS_KEYS.includes(key), `${key} must not be a sync key`);
  }

  assert.deepEqual(LOCAL_SETTINGS_KEYS, ["customCommands", "youtubeTemplates"]);
});

test("templates larger than the 8 KB sync quota are saved to local", async () => {
  const areas = createAreas();
  const templates = buildLargeTemplates();
  const size = Buffer.byteLength(JSON.stringify(templates));

  assert.ok(size > 8192, `expected templates larger than 8 KB, got ${size}`);

  await saveSettingsToStorage({ youtubeTemplates: templates }, areas);

  assert.equal(areas.sync.values.youtubeTemplates, undefined);
  assert.equal(areas.local.values.youtubeTemplates.length, templates.length);
  assert.equal(areas.local.values.youtubeTemplates[0].template, templates[0].template);

  const loaded = await loadSettingsFromStorage(areas);
  assert.equal(loaded.youtubeTemplates[0].template, templates[0].template);
});

test("custom commands larger than the 8 KB sync quota are saved to local", async () => {
  const areas = createAreas();
  const commands = [
    {
      id: "big",
      title: "Большая команда",
      template: "y".repeat(9000),
      serviceId: "sendToChatGPT",
      contextType: "selection"
    }
  ];

  await saveSettingsToStorage({ customCommands: commands }, areas);

  assert.equal(areas.sync.values.customCommands, undefined);
  assert.ok(JSON.stringify(areas.local.values.customCommands).length > 8192);

  const loaded = await loadSettingsFromStorage(areas);
  assert.equal(loaded.customCommands[0].template.length, 9000);
});

test("sync settings still go to sync", async () => {
  const areas = createAreas();
  const settings = { ...DEFAULT_SETTINGS, defaultServiceId: "sendToGrok" };

  await saveSettingsToStorage(settings, areas);

  assert.equal(areas.sync.values.defaultServiceId, "sendToGrok");
  assert.ok(Array.isArray(areas.sync.values.serviceOrder));
  assert.equal(areas.sync.values.youtubeTemplates, undefined);
  assert.equal(areas.sync.values.customCommands, undefined);
});

test("load merges sync and local values", async () => {
  const areas = createAreas({
    sync: { defaultServiceId: "sendToGrok", serviceOrder: ["sendToGrok", "sendToChatGPT"] },
    local: { youtubeTemplates: buildLargeTemplates() }
  });

  const loaded = await loadSettingsFromStorage(areas);

  assert.equal(loaded.defaultServiceId, "sendToGrok");
  assert.deepEqual(loaded.serviceOrder.slice(0, 2), ["sendToGrok", "sendToChatGPT"]);
  assert.equal(loaded.youtubeTemplates.length, buildLargeTemplates().length);
});

test("legacy sync values are moved to local and removed from sync", async () => {
  const templates = buildLargeTemplates();
  const commands = [{ id: "c1", title: "Команда", template: "текст", serviceId: "sendToChatGPT", contextType: "selection" }];
  const areas = createAreas({
    sync: { youtubeTemplates: templates, customCommands: commands, defaultServiceId: "sendToGrok" }
  });

  await loadSettingsFromStorage(areas);

  assert.equal(areas.sync.values.youtubeTemplates, undefined);
  assert.equal(areas.sync.values.customCommands, undefined);
  assert.equal(areas.sync.values.defaultServiceId, "sendToGrok");
  assert.equal(areas.local.values.youtubeTemplates.length, templates.length);
  assert.equal(areas.local.values.customCommands.length, 1);
});

test("repeated migration does not change stored values", async () => {
  const areas = createAreas({
    sync: { youtubeTemplates: buildLargeTemplates() }
  });

  await loadSettingsFromStorage(areas);
  const afterFirstRun = clone(areas.local.values.youtubeTemplates);

  await loadSettingsFromStorage(areas);
  await loadSettingsFromStorage(areas);

  assert.deepEqual(areas.local.values.youtubeTemplates, afterFirstRun);
  assert.equal(areas.sync.values.youtubeTemplates, undefined);
});

test("local values win over leftover sync values", async () => {
  const [defaultTemplate] = normalizeYouTubeTemplates();
  const syncTemplate = { ...defaultTemplate, title: "Старый заголовок" };
  const localTemplate = { ...defaultTemplate, title: "Новый заголовок" };
  const areas = createAreas({
    sync: { youtubeTemplates: [syncTemplate] },
    local: { youtubeTemplates: [localTemplate] }
  });

  const loaded = await loadSettingsFromStorage(areas);

  assert.equal(loaded.youtubeTemplates[0].title, "Новый заголовок");
  assert.equal(areas.sync.values.youtubeTemplates, undefined);
});

test("saving one area does not touch the other", async () => {
  const areas = createAreas({
    local: { youtubeTemplates: buildLargeTemplates() }
  });
  const templatesBefore = clone(areas.local.values.youtubeTemplates);

  await saveSettingsToStorage({ defaultServiceId: "sendToGrok" }, areas);

  assert.deepEqual(areas.local.values.youtubeTemplates, templatesBefore);
});

test("a full reset writes default settings to both areas", async () => {
  const areas = createAreas({
    sync: { defaultServiceId: "sendToGrok", serviceOrder: ["sendToGrok"] },
    local: { youtubeTemplates: [{ id: "custom", title: "Свой", template: "свой текст", serviceId: "sendToChatGPT", enabled: true }] }
  });

  await saveSettingsToStorage(DEFAULT_SETTINGS, areas);

  const loaded = await loadSettingsFromStorage(areas);
  assert.deepEqual(loaded.youtubeTemplates, normalizeYouTubeTemplates());
  assert.deepEqual(loaded.serviceOrder, DEFAULT_SETTINGS.serviceOrder);
});

test("splitSettingsForStorage keeps only the keys it was given", () => {
  const { syncPayload, localPayload } = splitSettingsForStorage({ defaultServiceId: "sendToGrok" });

  assert.deepEqual(Object.keys(syncPayload), ["defaultServiceId"]);
  assert.deepEqual(Object.keys(localPayload), []);
});

test("split output stays inside the sync payload limit", () => {
  const settings = normalizeSettings({
    youtubeTemplates: buildLargeTemplates(),
    customCommands: [{ id: "c1", title: "Т", template: "t".repeat(5000), serviceId: "sendToChatGPT", contextType: "selection" }]
  });
  const { syncPayload } = splitSettingsForStorage(settings);

  assert.ok(Buffer.byteLength(JSON.stringify(syncPayload)) < 8192);
});

