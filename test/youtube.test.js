import test from "node:test";
import assert from "node:assert/strict";

import { buildYouTubePrompt, buildYouTubeSummaryPrompt, normalizeYouTubeUrl } from "../youtube.js";

test("normalizeYouTubeUrl normalizes short urls", () => {
  assert.equal(
    normalizeYouTubeUrl("https://youtu.be/abc123?t=4"),
    "https://www.youtube.com/watch?v=abc123"
  );
});

test("normalizeYouTubeUrl strips unrelated params from watch links", () => {
  assert.equal(
    normalizeYouTubeUrl("https://www.youtube.com/watch?v=abc123&list=list42&index=7&t=9"),
    "https://www.youtube.com/watch?v=abc123"
  );
});

test("normalizeYouTubeUrl rejects non-youtube hosts", () => {
  assert.equal(normalizeYouTubeUrl("https://example.com/watch?v=abc123"), null);
});

test("buildYouTubePrompt embeds the normalized url and transcript article prompt", () => {
  const prompt = buildYouTubePrompt("https://www.youtube.com/watch?v=abc123");

  assert.match(prompt, /https:\/\/www\.youtube\.com\/watch\?v=abc123/);
  assert.match(prompt, /профессиональный редактор, литературный обработчик/);
  assert.match(prompt, /Текст нельзя сокращать по смыслу/);
  assert.match(prompt, /превратить её в полноценную, грамотную, удобную для чтения статью/);
  assert.match(prompt, /Не превращай текст в краткое саммари/);
  assert.match(prompt, /Самопроверка перед ответом/);
});

test("buildYouTubeSummaryPrompt embeds the normalized url and summary prompt", () => {
  const prompt = buildYouTubeSummaryPrompt("https://www.youtube.com/watch?v=abc123");

  assert.match(prompt, /https:\/\/www\.youtube\.com\/watch\?v=abc123/);
  assert.match(prompt, /краткое резюме видеоролика/);
  assert.match(prompt, /Кратко перечисли все основные факты/);
  assert.match(prompt, /Не превращай резюме в статью/);
  assert.match(prompt, /5-10 кратких абзацев или маркированных пунктов/);
});
