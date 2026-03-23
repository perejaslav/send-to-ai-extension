import test from "node:test";
import assert from "node:assert/strict";

import { buildCurrentPageSummaryPrompt, buildLinkSummaryPrompt } from "../link-prompts.js";

test("buildLinkSummaryPrompt includes url and summary instructions", () => {
  const prompt = buildLinkSummaryPrompt("https://example.com/article");

  assert.match(prompt, /https:\/\/example\.com\/article/);
  assert.match(prompt, /сделай подробное саммари/i);
  assert.match(prompt, /если страница недоступна/i);
});

test("buildCurrentPageSummaryPrompt includes current page url and summary instructions", () => {
  const prompt = buildCurrentPageSummaryPrompt("https://example.com/current-page");

  assert.match(prompt, /https:\/\/example\.com\/current-page/);
  assert.match(prompt, /текущую страницу/i);
  assert.match(prompt, /практические шаги и рекомендации/i);
});
