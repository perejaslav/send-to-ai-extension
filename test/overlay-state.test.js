import test from "node:test";
import assert from "node:assert/strict";

import { trimHistory, MAX_MESSAGES, MAX_CHARS } from "../overlay-state.js";

test("trimHistory keeps max 30 messages", () => {
  const msgs = Array.from({ length: 40 }, (_, i) => ({ role: "user", content: `msg ${i}` }));
  const trimmed = trimHistory(msgs);
  assert.equal(trimmed.length, MAX_MESSAGES);
  assert.equal(trimmed[0].content, "msg 10");
  assert.equal(trimmed[trimmed.length - 1].content, "msg 39");
});

test("trimHistory keeps total chars under 50k", () => {
  const big = "a".repeat(10000);
  const msgs = Array.from({ length: 10 }, () => ({ role: "user", content: big }));
  const trimmed = trimHistory(msgs);
  const total = trimmed.reduce((s, m) => s + m.content.length, 0);
  assert.ok(total <= MAX_CHARS);
  assert.ok(trimmed.length < 10);
});

test("trimHistory with rememberConversation false should be handled by caller — empty history", () => {
  // Simulate background logic: when remember false, messagesForApi is only current prompt
  const history = [{ role: "user", content: "old" }, { role: "assistant", content: "reply" }];
  const prompt = "new prompt";
  const remember = false;
  const messagesForApi = remember ? trimHistory([...history, { role: "user", content: prompt }]) : [{ role: "user", content: prompt }];
  assert.deepEqual(messagesForApi, [{ role: "user", content: "new prompt" }]);
});

test("trimHistory with rememberConversation true keeps history", () => {
  const history = [{ role: "user", content: "old" }, { role: "assistant", content: "reply" }];
  const prompt = "new prompt";
  const remember = true;
  const messagesForApi = remember ? trimHistory([...history, { role: "user", content: prompt }]) : [{ role: "user", content: prompt }];
  assert.equal(messagesForApi.length, 3);
  assert.equal(messagesForApi[2].content, "new prompt");
});
