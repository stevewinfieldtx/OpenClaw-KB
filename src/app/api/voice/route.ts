import { NextRequest } from "next/server";
import { ragComplete } from "@/lib/rag";

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message || typeof message !== "string") {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  const { answer, sources } = await ragComplete(message);

  return Response.json({ answer, sources });
}
