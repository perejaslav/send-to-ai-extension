import { callOpenAiCompatible } from "./ai-provider-openai-compatible.js";

export async function sendChatRequest({ provider, apiKey, messages, signal }) {
  if (!provider || typeof provider.type !== "string") {
    throw new Error("provider required");
  }

  if (provider.type === "openai-compatible") {
    return callOpenAiCompatible({
      baseUrl: provider.baseUrl,
      model: provider.model,
      temperature: provider.temperature,
      apiKey,
      messages,
      signal
    });
  }

  throw new Error(`Unsupported provider type: ${provider.type}`);
}
