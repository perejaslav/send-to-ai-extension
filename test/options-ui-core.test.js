import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_OPTIONS_TAB_ID,
  OPTIONS_TAB_GROUPS,
  doesTextMatchSearch,
  getOptionsTabByHeading,
  getOptionsTabTitle,
  isPanelVisibleForState,
  normalizeSearchQuery
} from "../options-ui-core.js";

test("options tab groups cover expected sections", () => {
  assert.ok(OPTIONS_TAB_GROUPS.length >= 4);
  assert.equal(getOptionsTabByHeading("Сервисы в контекстном меню"), "basic");
  assert.equal(getOptionsTabByHeading("Мои команды"), "commands");
  assert.equal(getOptionsTabByHeading("Диагностика"), "diagnostics");
  assert.equal(getOptionsTabByHeading("Импорт и экспорт"), "data");
});

test("unknown headings fallback to default tab", () => {
  assert.equal(getOptionsTabByHeading("Unknown"), DEFAULT_OPTIONS_TAB_ID);
  assert.equal(getOptionsTabTitle("commands"), "Команды");
});

test("normalizeSearchQuery trims and collapses spaces", () => {
  assert.equal(normalizeSearchQuery("  YouTube   шаблоны  "), "youtube шаблоны");
  assert.equal(normalizeSearchQuery(null), "");
});

test("doesTextMatchSearch performs case-insensitive matching", () => {
  assert.equal(doesTextMatchSearch("Редактируемые YouTube-шаблоны", "youtube"), true);
  assert.equal(doesTextMatchSearch("Диагностика ошибок", "qwen"), false);
  assert.equal(doesTextMatchSearch("Любой текст", ""), true);
});

test("isPanelVisibleForState respects tabs when search is empty", () => {
  assert.equal(isPanelVisibleForState({
    panelTabId: "commands",
    activeTabId: "commands",
    panelText: "Мои команды",
    searchQuery: ""
  }), true);

  assert.equal(isPanelVisibleForState({
    panelTabId: "commands",
    activeTabId: "basic",
    panelText: "Мои команды",
    searchQuery: ""
  }), false);
});

test("isPanelVisibleForState searches across all tabs", () => {
  assert.equal(isPanelVisibleForState({
    panelTabId: "commands",
    activeTabId: "basic",
    panelText: "YouTube-шаблоны",
    searchQuery: "youtube"
  }), true);

  assert.equal(isPanelVisibleForState({
    panelTabId: "commands",
    activeTabId: "basic",
    panelText: "YouTube-шаблоны",
    searchQuery: "диагностика"
  }), false);
});
