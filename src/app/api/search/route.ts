import { NextRequest } from "next/server";
import { hybridSearch } from "@/lib/search";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");

  if (!q) {
    return Response.json({ error: "q parameter is required" }, { status: 400 });
  }

  const results = await hybridSearch(q, 10);
  return Response.json({ results });
}
