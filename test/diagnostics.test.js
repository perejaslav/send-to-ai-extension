import test from "node:test";
import assert from "node:assert/strict";

import {
  DIAGNOSTICS_MAX_ENTRIES,
  getDiagnosticStatusTitle,
  normalizeDiagnosticEntry
} from "../diagnostics.js";

test("getDiagnosticStatusTitle returns friendly titles", () => {
  assert.equal(getDiagnosticStatusTitle("success"), "Успешно");
  assert.equal(getDiagnosticStatusTitle("input_not_found"), "Поле ввода не найдено");
  assert.equal(getDiagnosticStatusTitle("missing"), "Неизвестный статус");
});

test("normalizeDiagnosticEntry repairs missing fields", () => {
  const entry = normalizeDiagnosticEntry({
    status: "insert_failed",
    serviceId: "sendToChatGPT",
    details: {
      elapsedMs: 1200
    }
  });

  assert.equal(entry.status, "insert_failed");
  assert.equal(entry.serviceId, "sendToChatGPT");
  assert.equal(entry.serviceTitle, "");
  assert.equal(entry.message, "Вставка не удалась");
  assert.equal(entry.details.elapsedMs, 1200);
  assert.ok(entry.id);
  assert.ok(entry.timestamp);
});

test("diagnostics max entries is conservative", () => {
  assert.equal(DIAGNOSTICS_MAX_ENTRIES, 20);
});
