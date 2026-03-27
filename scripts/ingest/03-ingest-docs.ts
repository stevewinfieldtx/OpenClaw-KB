import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SOURCES = [
  { url: "https://docs.openclaw.ai", title: "OpenClaw Official Documentation", channel: "OpenClaw Official" },
  { url: "https://www.getopenclaw.ai/en/docs", title: "OpenClaw Docs (getopenclaw.ai)", channel: "OpenClaw Official" },
  { url: "https://www.getopenclaw.ai/en/changelog", title: "OpenClaw Changelog", channel: "OpenClaw Official" },
  { url: "https://raw.githubusercontent.com/openclaw/openclaw/main/docs/start/getting-started.md", title: "OpenClaw Getting Started Guide", channel: "OpenClaw GitHub" },
  { url: "https://raw.githubusercontent.com/openclaw/openclaw/main/CHANGELOG.md", title: "OpenClaw CHANGELOG (GitHub)", channel: "OpenClaw GitHub" },
  { url: "https://openclaw.ai", title: "OpenClaw Homepage", channel: "OpenClaw Official" },
];

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OpenClawKB/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`  HTTP ${res.status} for ${url}`);
      return null;
    }
    const text = await res.text();
    // Strip HTML tags if needed
    if (text.trim().startsWith("<")) {
      return text
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{2,}/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
    }
    return text;
  } catch (err) {
    console.warn(`  Error fetching ${url}:`, (err as Error).message);
    return null;
  }
}

// Use a fake "doc:" prefix for youtube_id to distinguish docs from videos
function docId(url: string): string {
  return "doc:" + url.replace(/https?:\/\//, "").replace(/[^a-z0-9]/gi, "-").slice(0, 60);
}

async function main() {
  console.log(`Ingesting ${SOURCES.length} official OpenClaw doc sources...`);

  for (const source of SOURCES) {
    console.log(`\nFetching: ${source.url}`);
    const text = await fetchText(source.url);

    if (!text || text.length < 100) {
      console.log(`  Skipped — empty or too short`);
      continue;
    }

    const id = docId(source.url);
    await pool.query(
      `INSERT INTO videos (youtube_url, youtube_id, title, channel, raw_text)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (youtube_id) DO UPDATE SET raw_text = $5, title = $3`,
      [source.url, id, source.title, source.channel, text]
    );
    console.log(`  Saved: "${source.title}" (${text.length} chars)`);
  }

  console.log("\nDone. Now run 02-chunk-and-embed.ts to embed the new sources.");
  await pool.end();
}

main().catch(console.error);
