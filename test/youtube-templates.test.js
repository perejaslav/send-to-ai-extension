import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_YOUTUBE_TEMPLATES,
  YOUTUBE_TEMPLATE_IDS,
  getYouTubeTemplateById,
  isDefaultYouTubeTemplate,
  normalizeYouTubeTemplates,
  renderYouTubeTemplate,
  restoreDefaultYouTubeTemplate
} from "../youtube-templates.js";

test("normalizeYouTubeTemplates returns all default templates when input is missing", () => {
  const templates = normalizeYouTubeTemplates();

  assert.equal(templates.length, DEFAULT_YOUTUBE_TEMPLATES.length);
  assert.ok(templates.some((template) => template.id === YOUTUBE_TEMPLATE_IDS.article));
  assert.ok(templates.some((template) => template.id === YOUTUBE_TEMPLATE_IDS.summary));
  assert.ok(templates.some((template) => template.id === YOUTUBE_TEMPLATE_IDS.facts));
  assert.ok(templates.some((template) => template.id === YOUTUBE_TEMPLATE_IDS.telegram));
  assert.ok(templates.some((template) => template.id === YOUTUBE_TEMPLATE_IDS.research));
});

test("normalizeYouTubeTemplates keeps user edits and fills missing templates", () => {
  const templates = normalizeYouTubeTemplates([
    {
      id: "summary",
      title: "My summary",
      enabled: false,
      serviceId: "sendToChatGPT",
      template: "Open {youtubeUrl}"
    },
    {
      id: "unknown",
      title: "Unknown",
      template: "Skip"
    }
  ]);

  const summary = templates.find((template) => template.id === "summary");
  const article = templates.find((template) => template.id === "article");

  assert.equal(summary.title, "My summary");
  assert.equal(summary.enabled, false);
  assert.equal(summary.serviceId, "sendToChatGPT");
  assert.equal(summary.template, "Open {youtubeUrl}");
  assert.ok(article.template.length > 0);
  assert.equal(templates.some((template) => template.id === "unknown"), false);
});

test("getYouTubeTemplateById returns requested template or fallback", () => {
  const summary = getYouTubeTemplateById(undefined, "summary");
  const missing = getYouTubeTemplateById(undefined, "missing");

  assert.equal(summary.id, "summary");
  assert.equal(missing.id, "article");
});

test("renderYouTubeTemplate replaces youtube url variables", () => {
  const result = renderYouTubeTemplate(
    { template: "URL: {youtubeUrl}\nAgain: {url}" },
    { youtubeUrl: "https://www.youtube.com/watch?v=123" }
  );

  assert.equal(result, "URL: https://www.youtube.com/watch?v=123\nAgain: https://www.youtube.com/watch?v=123");
});

test("isDefaultYouTubeTemplate detects edits but ignores the enabled flag", () => {
  const [article] = normalizeYouTubeTemplates();

  assert.equal(isDefaultYouTubeTemplate(article), true);
  assert.equal(isDefaultYouTubeTemplate({ ...article, enabled: false }), true);
  assert.equal(isDefaultYouTubeTemplate({ ...article, template: "Old prompt {youtubeUrl}" }), false);
  assert.equal(isDefaultYouTubeTemplate({ ...article, title: "My article" }), false);
  assert.equal(isDefaultYouTubeTemplate({ ...article, serviceId: "sendToChatGPT" }), false);
  assert.equal(isDefaultYouTubeTemplate({ id: "unknown", title: "x", template: "y" }), false);
});

test("restoreDefaultYouTubeTemplate restores one template and keeps the rest", () => {
  const edited = normalizeYouTubeTemplates([
    { id: "summary", title: "My summary", enabled: false, serviceId: "sendToChatGPT", template: "Old {youtubeUrl}" },
    { id: "facts", title: "My facts", template: "Facts {youtubeUrl}" }
  ]);

  const restored = restoreDefaultYouTubeTemplate(edited, "summary");
  const summary = restored.find((template) => template.id === "summary");
  const facts = restored.find((template) => template.id === "facts");
  const defaultSummary = DEFAULT_YOUTUBE_TEMPLATES.find((template) => template.id === "summary");

  assert.equal(summary.title, defaultSummary.title);
  assert.equal(summary.serviceId, defaultSummary.serviceId);
  assert.equal(summary.template, defaultSummary.template);
  assert.equal(summary.enabled, false);
  assert.equal(isDefaultYouTubeTemplate(summary), true);
  assert.equal(facts.title, "My facts");
  assert.equal(facts.template, "Facts {youtubeUrl}");
});

test("restoreDefaultYouTubeTemplate ignores unknown template ids", () => {
  const templates = normalizeYouTubeTemplates([{ id: "facts", title: "My facts" }]);

  assert.deepEqual(restoreDefaultYouTubeTemplate(templates, "missing"), templates);
});
