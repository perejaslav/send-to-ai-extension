export function buildChatCompletionsUrl(baseUrl) {
  if (typeof baseUrl !== "string" || !baseUrl.trim()) {
    return "";
  }
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (trimmed.toLowerCase().endsWith("/chat/completions")) {
    return trimmed;
  }
  return trimmed + "/chat/completions";
}

export async function callOpenAiCompatible({ baseUrl, model, temperature, apiKey, messages, signal }) {
  const url = buildChatCompletionsUrl(baseUrl);
  if (!url) {
    throw new Error("AI endpoint не настроен");
  }
  if (!apiKey) {
    const err = new Error("API key отсутствует");
    err.code = "missing_api_key";
    throw err;
  }
  if (!model) {
    const err = new Error("Model не указан");
    err.code = "missing_model";
    throw err;
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("messages required");
  }

  const body = {
    model,
    messages,
    temperature: typeof temperature === "number" ? temperature : 0.7,
    stream: false
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let details = text.slice(0, 500);
    try {
      const j = JSON.parse(text);
      details = j.error?.message || j.message || details;
    } catch {}
    const err = new Error(`HTTP ${response.status}${details ? ` — ${details}` : ""}`);
    err.status = response.status;
    err.body = text;
    throw err;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("invalid JSON response");
  }

  const text = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? "";

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("missing response text");
  }

  return {
    text: text.trim(),
    usage: data.usage || null,
    model: data.model || model
  };
}
