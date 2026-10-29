import Groq from "groq-sdk";

// Model priority list — using models available on this account
const MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "allam-2-7b",
];

let _client: Groq | null = null;

export function getGroqClient(): Groq | null {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  if (!_client) _client = new Groq({ apiKey: key });
  return _client;
}

export function isAIEnabled(): boolean {
  return !!process.env.GROQ_API_KEY;
}

export async function generateText(prompt: string): Promise<string | null> {
  const client = getGroqClient();
  if (!client) return null;

  for (const model of MODELS) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 800,
      });
      const text = completion.choices[0]?.message?.content ?? null;
      if (text) {
        console.log(`[Groq] success with model: ${model}`);
        return text;
      }
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 404 || status === 400) {
        console.warn(`[Groq] model ${model} unavailable, trying next...`);
        continue;
      }
      console.error("[Groq] generation error:", err);
      return null;
    }
  }

  console.error("[Groq] All models exhausted.");
  return null;
}

export async function streamText(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const client = getGroqClient();
  if (!client) {
    onChunk("AI insights unavailable — add GROQ_API_KEY to .env to enable.");
    return;
  }

  for (const model of MODELS) {
    try {
      const stream = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 800,
        stream: true,
      });
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) onChunk(text);
      }
      return;
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 404 || status === 400) {
        console.warn(`[Groq] stream model ${model} unavailable, trying next...`);
        continue;
      }
      console.error("[Groq] stream error:", err);
      onChunk("An error occurred generating AI insights.");
      return;
    }
  }
  onChunk("No Groq models available on this account — check your API key at console.groq.com.");
}
