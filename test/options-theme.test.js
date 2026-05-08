import test from "node:test";
import assert from "node:assert/strict";

import {
  DARK_THEME,
  LIGHT_THEME,
  applyTheme,
  normalizeTheme
} from "../options-theme.js";

test("normalizeTheme accepts only supported values", () => {
  const normalizedLight = normalizeTheme(LIGHT_THEME);
  const normalizedDark = normalizeTheme(DARK_THEME);

  assert.equal(normalizedLight, LIGHT_THEME);
  assert.equal(normalizedDark, DARK_THEME);
  assert.ok([LIGHT_THEME, DARK_THEME].includes(normalizeTheme("unknown")));
});

test("applyTheme writes normalized theme to document element", () => {
  const previousDocument = globalThis.document;

  try {
    globalThis.document = {
      documentElement: {
        dataset: {},
        style: {}
      }
    };

    assert.equal(applyTheme(DARK_THEME), DARK_THEME);
    assert.equal(globalThis.document.documentElement.dataset.optionsTheme, DARK_THEME);
    assert.equal(globalThis.document.documentElement.style.colorScheme, DARK_THEME);

    assert.equal(applyTheme(LIGHT_THEME), LIGHT_THEME);
    assert.equal(globalThis.document.documentElement.dataset.optionsTheme, LIGHT_THEME);
    assert.equal(globalThis.document.documentElement.style.colorScheme, LIGHT_THEME);
  } finally {
    globalThis.document = previousDocument;
  }
});
