import test from "node:test";
import assert from "node:assert/strict";

import { buildPageOrLinkPrompt } from "../context-prompts.js";

test("buildPageOrLinkPrompt builds summary prompt for pages", () => {
  const prompt = buildPageOrLinkPrompt("page", "summary", "https://example.com/page", "Example Page");

  assert.match(prompt, /текущую страницу/);
  assert.match(prompt, /сделай подробное саммари/);
  assert.match(prompt, /https:\/\/example\.com\/page/);
  assert.match(prompt, /Заголовок: Example Page/);
});

test("buildPageOrLinkPrompt builds factcheck prompt for links", () => {
  const prompt = buildPageOrLinkPrompt("link", "factcheck", "https://example.com/link");

  assert.match(prompt, /ссылку/);
  assert.match(prompt, /проведи фактчекинг утверждений/);
  assert.match(prompt, /📌 Статус/);
});
