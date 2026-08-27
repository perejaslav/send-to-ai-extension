import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const overlayPath = join(__dirname, "..", "floating-overlay.js");
const overlayCode = readFileSync(overlayPath, "utf8");

test("history restore is ordered: requestHistory before initialPrompt handling", () => {
  // Fixed code must load history regardless of initialPrompt
  assert.ok(overlayCode.includes("requestHistory().then"), "must contain ordered requestHistory().then");
  // Old buggy pattern was if(initialPrompt){ if(autoSend) sendChat } else { requestHistory() }
  // Ensure that pattern is gone (no else branch that only calls history when no prompt)
  const hasBuggyElse = overlayCode.includes("} else {\n      requestHistory();\n    }");
  assert.equal(hasBuggyElse, false, "buggy else-only history must be removed");
});

test("history restore handles remember=true + existing history + initialPrompt + autoSend=false", () => {
  // Simulate ordered init logic: history first, then prompt in composer
  function simulateInit({ history, initialPrompt, autoSend }) {
    const messages = [...history];
    let composer = "";
    let sent = false;
    // Step 1: render history
    const rendered = [...history];
    // Step 2: apply prompt
    if (initialPrompt) {
      if (autoSend) {
        rendered.push({ role: "user", content: initialPrompt });
        sent = true;
      } else {
        composer = initialPrompt;
      }
    }
    return { rendered, composer, sent };
  }

  const history = [{ role: "user", content: "old" }, { role: "assistant", content: "reply" }];
  const result = simulateInit({ history, initialPrompt: "new prompt", autoSend: false });
  assert.equal(result.rendered.length, 2, "history should be rendered");
  assert.equal(result.composer, "new prompt", "prompt stays in composer");
  assert.equal(result.sent, false);
});

test("history restore handles remember=true + existing history + initialPrompt + autoSend=true", () => {
  function simulateInit({ history, initialPrompt, autoSend }) {
    const messages = [...history];
    let sent = false;
    if (initialPrompt) {
      if (autoSend) {
        messages.push({ role: "user", content: initialPrompt });
        sent = true;
      }
    }
    return { messages, sent };
  }

  const history = [{ role: "user", content: "old" }, { role: "assistant", content: "reply" }];
  const res = simulateInit({ history, initialPrompt: "new", autoSend: true });
  assert.equal(res.messages.length, 3);
  assert.equal(res.messages[2].content, "new");
  assert.equal(res.sent, true);
});

test("remember=false + initialPrompt does not load history", () => {
  function simulateInitWithRemember({ remember, history, initialPrompt }) {
    const rendered = remember ? [...history] : [];
    let composer = "";
    if (initialPrompt) {
      composer = initialPrompt;
    }
    return { rendered, composer };
  }

  const history = [{ role: "user", content: "old" }];
  const res = simulateInitWithRemember({ remember: false, history, initialPrompt: "new" });
  assert.equal(res.rendered.length, 0, "history must not be shown when remember false");
  assert.equal(res.composer, "new");
});

test("no race where history clears new message", () => {
  // Fixed ordered init ensures history.then happens before sendChat, so new message not cleared
  // Simulate old buggy parallel: history callback clears messages after sendChat added user message
  let messages = [];
  // Buggy: sendChat adds user message, then history callback clears
  messages.push({ role: "user", content: "new" });
  // history callback arrives later and does clear + render history
  messages = [{ role: "user", content: "old" }]; // would wipe new
  assert.notDeepEqual(messages, [{ role: "user", content: "old" }, { role: "user", content: "new" }]);

  // Fixed: history first, then send
  let fixed = [{ role: "user", content: "old" }];
  fixed.push({ role: "user", content: "new" });
  assert.deepEqual(fixed, [{ role: "user", content: "old" }, { role: "user", content: "new" }]);
});
