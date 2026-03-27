import { hybridSearch } from "./search";
import { chatCompletionStream } from "./openrouter";
import type { SearchResult } from "./types";

function buildContext(results: SearchResult[]): string {
  return results
    .map(
      (r, i) =>
        `[Source ${i + 1}: "${r.video_title}" - ${r.youtube_url}]\n${r.content}`
    )
    .join("\n\n---\n\n");
}

const SYSTEM_PROMPT = `You are the OpenClaw Knowledge Base assistant. You answer questions about OpenClaw (formerly Clawdbot/Moltbot), an open-source autonomous AI agent framework.

Your answers are grounded in transcripts from expert YouTube tutorials. Always cite your sources using the format [Source N] when referencing specific information.

Guidelines:
- Be concise and practical
- Include specific commands, configurations, or steps when relevant
- If the sources don't cover the question, say so honestly
- Focus on best practices, security, and real-world usage patterns`;

export async function ragStream(userQuery: string) {
  const results = await hybridSearch(userQuery, 6);
  const context = buildContext(results);

  const messages: { role: "system" | "user"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Context from OpenClaw video transcripts:\n\n${context}\n\n---\n\nQuestion: ${userQuery}`,
    },
  ];

  const stream = await chatCompletionStream(messages);
  return { stream, sources: results };
}

export async function ragComplete(userQuery: string) {
  const results = await hybridSearch(userQuery, 6);
  const context = buildContext(results);

  const messages: { role: "system" | "user"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Context from OpenClaw video transcripts:\n\n${context}\n\n---\n\nQuestion: ${userQuery}`,
    },
  ];

  const { chatCompletion } = await import("./openrouter");
  const response = await chatCompletion(messages);
  if ("choices" in response) {
    return {
      answer: response.choices[0]?.message?.content ?? "",
      sources: results,
    };
  }
  return { answer: "", sources: results };
}
