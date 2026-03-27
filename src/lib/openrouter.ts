import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function embed(texts: string[]): Promise<number[][]> {
  const response = await client.embeddings.create({
    model: "openai/text-embedding-3-small",
    input: texts,
  });
  return response.data.map((d) => d.embedding);
}

export async function embedSingle(text: string): Promise<number[]> {
  const [embedding] = await embed([text]);
  return embedding;
}

export async function chatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options?: { stream?: boolean }
) {
  return client.chat.completions.create({
    model: "anthropic/claude-sonnet-4",
    messages,
    max_tokens: 2048,
    stream: options?.stream ?? false,
  });
}

export async function chatCompletionStream(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
) {
  return client.chat.completions.create({
    model: "anthropic/claude-sonnet-4",
    messages,
    max_tokens: 2048,
    stream: true,
  });
}

export default client;
