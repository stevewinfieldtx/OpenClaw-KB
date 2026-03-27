import { NextRequest } from "next/server";
import { ragStream } from "@/lib/rag";

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message || typeof message !== "string") {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  const { stream, sources } = await ragStream(message);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      // Send sources first
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "sources", sources })}\n\n`
        )
      );

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "content", content })}\n\n`
            )
          );
        }
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
