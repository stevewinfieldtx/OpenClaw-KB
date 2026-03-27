import { execSync } from "child_process";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const urls: string[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "urls.json"), "utf-8")
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("railway")
    ? { rejectUnauthorized: false }
    : undefined,
});

function extractVideoId(url: string): string {
  const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error(`Cannot extract video ID from: ${url}`);
  return match[1];
}

function fetchTranscript(url: string): { title: string; channel: string; text: string } | null {
  const tmpDir = path.join(__dirname, "tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    // Get metadata
    const metaRaw = execSync(
      `yt-dlp --print "%(title)s|||%(channel)s" --no-download "${url}"`,
      { encoding: "utf-8", timeout: 30000 }
    ).trim();
    const [title, channel] = metaRaw.split("|||");

    // Get subtitles
    const videoId = extractVideoId(url);
    const subFile = path.join(tmpDir, `${videoId}.en.vtt`);

    // Clean up old files
    for (const f of fs.readdirSync(tmpDir)) {
      if (f.startsWith(videoId)) fs.unlinkSync(path.join(tmpDir, f));
    }

    execSync(
      `yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format vtt -o "${path.join(tmpDir, videoId)}" "${url}"`,
      { encoding: "utf-8", timeout: 60000 }
    );

    // Find the VTT file (might have different naming)
    const vttFiles = fs.readdirSync(tmpDir).filter(
      (f) => f.startsWith(videoId) && f.endsWith(".vtt")
    );

    if (vttFiles.length === 0) {
      console.warn(`  No subtitles found for ${url}`);
      return null;
    }

    const vttContent = fs.readFileSync(path.join(tmpDir, vttFiles[0]), "utf-8");
    const text = parseVTT(vttContent);

    // Clean up
    for (const f of vttFiles) fs.unlinkSync(path.join(tmpDir, f));

    return { title: title || "Unknown", channel: channel || "Unknown", text };
  } catch (err) {
    console.error(`  Error fetching ${url}:`, (err as Error).message);
    return null;
  }
}

function parseVTT(vtt: string): string {
  const lines = vtt.split("\n");
  const textLines: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip headers, timestamps, and empty lines
    if (
      !trimmed ||
      trimmed === "WEBVTT" ||
      trimmed.startsWith("Kind:") ||
      trimmed.startsWith("Language:") ||
      trimmed.includes("-->") ||
      /^\d+$/.test(trimmed) ||
      trimmed.startsWith("NOTE")
    ) {
      continue;
    }

    // Remove VTT tags like <c> </c> <00:00:01.000>
    const clean = trimmed
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    if (clean && !seen.has(clean)) {
      seen.add(clean);
      textLines.push(clean);
    }
  }

  return textLines.join(" ");
}

async function main() {
  console.log(`Fetching transcripts for ${urls.length} videos...`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const videoId = extractVideoId(url);

    // Check if already in DB
    const existing = await pool.query(
      "SELECT id FROM videos WHERE youtube_id = $1",
      [videoId]
    );
    if (existing.rows.length > 0) {
      console.log(`[${i + 1}/${urls.length}] Already exists: ${videoId}`);
      success++;
      continue;
    }

    console.log(`[${i + 1}/${urls.length}] Fetching: ${url}`);
    const result = fetchTranscript(url);

    if (result) {
      await pool.query(
        `INSERT INTO videos (youtube_url, youtube_id, title, channel, raw_text)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (youtube_id) DO UPDATE SET raw_text = $5, title = $3, channel = $4`,
        [url, videoId, result.title, result.channel, result.text]
      );
      console.log(`  OK: "${result.title}" (${result.text.length} chars)`);
      success++;
    } else {
      failed++;
    }

    // Rate limit
    if (i < urls.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`\nDone: ${success} success, ${failed} failed out of ${urls.length}`);

  // Clean up tmp dir
  const tmpDir = path.join(__dirname, "tmp");
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }

  await pool.end();
}

main().catch(console.error);
