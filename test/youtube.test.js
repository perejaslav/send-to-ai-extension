import test from "node:test";
import assert from "node:assert/strict";

import { buildYouTubePrompt, normalizeYouTubeUrl } from "../youtube.js";

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

test("buildYouTubePrompt embeds the normalized url", () => {
  const prompt = buildYouTubePrompt("https://www.youtube.com/watch?v=abc123");

  assert.match(prompt, /https:\/\/www\.youtube\.com\/watch\?v=abc123/);
  assert.match(prompt, /извлечь всю важную информацию/);
});
