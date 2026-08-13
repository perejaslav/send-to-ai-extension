import test from "node:test";
import assert from "node:assert/strict";

import { SERVICE_CONFIGS } from "../services.js";

test("Grok profile contains reliability flags for SPA-safe insertion", () => {
  const grok = SERVICE_CONFIGS.find((s) => s.id === "sendToGrok");
  assert.ok(grok, "sendToGrok service must exist in SERVICE_CONFIGS");

  const profile = grok.profile;
  assert.ok(profile, "Grok must have a profile object");

  assert.equal(
    profile.usePasteFirst,
    true,
    "usePasteFirst should be true — synthetic paste event is more reliable for contenteditable editors"
  );

  assert.equal(
    profile.delayMs,
    1500,
    "delayMs should be 1500 — gives SPA time to mount after 'complete' event"
  );

  assert.equal(
    profile.settleMs,
    300,
    "settleMs should be 300 — re-verify insertion after framework settle window"
  );

  assert.equal(
    profile.retryOnInsertFail,
    true,
    "retryOnInsertFail should be true — keep polling on transient insertion failure"
  );
});
