import test from "node:test";
import assert from "node:assert/strict";

import { buildLinkSummaryPrompt } from "../link-prompts.js";

test("buildLinkSummaryPrompt includes url and summary instructions", () => {
  const prompt = buildLinkSummaryPrompt("https://example.com/article");

  assert.match(prompt, /https:\/\/example\.com\/article/);
  assert.match(prompt, /сделай подробное саммари/i);
  assert.match(prompt, /если страница недоступна/i);
});
