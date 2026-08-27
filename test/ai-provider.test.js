import test from "node:test";
import assert from "node:assert/strict";

import { buildChatCompletionsUrl, callOpenAiCompatible } from "../ai-provider-openai-compatible.js";
import { sendChatRequest } from "../ai-transport.js";

test("buildChatCompletionsUrl appends correctly", () => {
  assert.equal(buildChatCompletionsUrl("https://api.openai.com/v1"), "https://api.openai.com/v1/chat/completions");
  assert.equal(buildChatCompletionsUrl("https://api.openai.com/v1/"), "https://api.openai.com/v1/chat/completions");
  assert.equal(buildChatCompletionsUrl("https://example.ai/v1/chat/completions"), "https://example.ai/v1/chat/completions");
  assert.equal(buildChatCompletionsUrl(""), "");
});

test("callOpenAiCompatible sends correct request", async () => {
  const originalFetch = global.fetch;
  let captured = null;
  global.fetch = async (url, init) => {
    captured = { url, init, body: JSON.parse(init.body) };
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: "hello" } }], usage: { total_tokens: 10 }, model: "gpt-4o" })
    };
  };

  try {
    const result = await callOpenAiCompatible({
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o",
      temperature: 0.7,
      apiKey: "sk-test",
      messages: [{ role: "user", content: "hi" }]
    });
    assert.equal(captured.url, "https://api.openai.com/v1/chat/completions");
    assert.equal(captured.init.headers.Authorization, "Bearer sk-test");
    assert.equal(captured.body.model, "gpt-4o");
    assert.deepEqual(captured.body.messages, [{ role: "user", content: "hi" }]);
    assert.equal(captured.body.temperature, 0.7);
    assert.equal(result.text, "hello");
    assert.equal(result.model, "gpt-4o");
  } finally {
    global.fetch = originalFetch;
  }
});

test("callOpenAiCompatible handles HTTP error", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 401,
    text: async () => JSON.stringify({ error: { message: "Invalid API key" } })
  });
  try {
    await assert.rejects(
      () => callOpenAiCompatible({ baseUrl: "https://api.openai.com/v1", model: "gpt-4o", apiKey: "bad", messages: [{ role: "user", content: "hi" }] }),
      (err) => {
        assert.match(err.message, /401/);
        assert.match(err.message, /Invalid API key/);
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("callOpenAiCompatible handles invalid JSON", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => { throw new Error("bad json"); } });
  try {
    await assert.rejects(() => callOpenAiCompatible({ baseUrl: "https://api.openai.com/v1", model: "gpt-4o", apiKey: "sk", messages: [{ role: "user", content: "hi" }] }), /invalid JSON/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("callOpenAiCompatible handles missing response text", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ choices: [] }) });
  try {
    await assert.rejects(() => callOpenAiCompatible({ baseUrl: "https://api.openai.com/v1", model: "gpt-4o", apiKey: "sk", messages: [{ role: "user", content: "hi" }] }), /missing response text/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("callOpenAiCompatible abort via signal", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, init) => {
    if (init.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    return new Promise((_, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    });
  };
  try {
    const controller = new AbortController();
    const p = callOpenAiCompatible({ baseUrl: "https://api.openai.com/v1", model: "gpt-4o", apiKey: "sk", messages: [{ role: "user", content: "hi" }], signal: controller.signal });
    controller.abort();
    await assert.rejects(() => p, (err) => err.name === "AbortError");
  } finally {
    global.fetch = originalFetch;
  }
});

test("sendChatRequest dispatches to openai-compatible", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: "ok" } }] }) });
  try {
    const res = await sendChatRequest({ provider: { type: "openai-compatible", baseUrl: "https://api.openai.com/v1", model: "gpt-4o", temperature: 0.5 }, apiKey: "sk", messages: [{ role: "user", content: "hi" }] });
    assert.equal(res.text, "ok");
  } finally {
    global.fetch = originalFetch;
  }
});

test("sendChatRequest throws for unsupported provider", async () => {
  await assert.rejects(() => sendChatRequest({ provider: { type: "unknown" }, apiKey: "", messages: [] }), /Unsupported/);
});
