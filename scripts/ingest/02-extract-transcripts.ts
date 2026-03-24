/**
 * Step 2: Extract full text transcripts from NotebookLM sources
 * and insert into the videos table in PostgreSQL.
 *
 * Reads source-mapping.json from step 01.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { query, close } from './utils/db';

const MAPPING_FILE = path.join(__dirname, 'source-mapping.json');
const TRANSCRIPTS_DIR = path.join(__dirname, 'transcripts');

interface SourceMapping {
  youtubeUrl: string;
  youtubeId: string;
  notebookId: string;
  sourceId: string | null;
  status: string;
}

function runCmd(cmd: string): string {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      timeout: 120000,
    }).trim();
  } catch (err: unknown) {
    const e = err as { stderr?: string; stdout?: string };
    console.error(`Command failed: ${cmd}`);
    console.error(e.stderr || e.stdout || '');
    throw err;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!fs.existsSync(MAPPING_FILE)) {
    console.error('source-mapping.json not found. Run 01-create-notebooks.ts first.');
    process.exit(1);
  }

  // Create transcripts directory
  if (!fs.existsSync(TRANSCRIPTS_DIR)) {
    fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
  }

  const mappings: SourceMapping[] = JSON.parse(
    fs.readFileSync(MAPPING_FILE, 'utf-8')
  );
  const successful = mappings.filter((m) => m.status === 'added' && m.sourceId);

  console.log(`Extracting transcripts for ${successful.length} sources...`);

  let extracted = 0;
  let failed = 0;

  for (const mapping of successful) {
    const outFile = path.join(TRANSCRIPTS_DIR, `${mapping.youtubeId}.txt`);

    // Skip if already extracted
    if (fs.existsSync(outFile) && fs.statSync(outFile).size > 100) {
      console.log(`  Skipping ${mapping.youtubeId} (already extracted)`);

      // Still insert into DB if not already there
      const existing = await query(
        'SELECT id FROM videos WHERE youtube_id = $1',
        [mapping.youtubeId]
      );
      if (existing.length === 0) {
        const rawText = fs.readFileSync(outFile, 'utf-8');
        await insertVideo(mapping, rawText);
      }

      extracted++;
      continue;
    }

    console.log(`[${extracted + failed + 1}/${successful.length}] Extracting: ${mapping.youtubeId}`);

    try {
      // Set notebook context
      runCmd(`notebooklm use ${mapping.notebookId}`);

      // Get source info for title
      let title = mapping.youtubeId;
      try {
        const sourceInfo = JSON.parse(
          runCmd(`notebooklm source get ${mapping.sourceId} --json`)
        );
        title = sourceInfo.title || sourceInfo.name || mapping.youtubeId;
      } catch {
        console.log(`  Could not get source title, using video ID`);
      }

      // Extract full text
      runCmd(`notebooklm source fulltext ${mapping.sourceId} -o "${outFile}"`);

      if (fs.existsSync(outFile) && fs.statSync(outFile).size > 0) {
        const rawText = fs.readFileSync(outFile, 'utf-8');
        await insertVideo({ ...mapping, title }, rawText);
        console.log(`  Extracted: ${rawText.length} chars`);
        extracted++;
      } else {
        console.error(`  Empty output for ${mapping.youtubeId}`);
        failed++;
      }
    } catch (err) {
      console.error(`  Failed: ${mapping.youtubeId}`, err);
      failed++;
    }

    await sleep(1000);
  }

  console.log(`\nDone! Extracted: ${extracted}, Failed: ${failed}`);
  await close();
}

async function insertVideo(
  mapping: SourceMapping & { title?: string },
  rawText: string
) {
  await query(
    `INSERT INTO videos (youtube_url, youtube_id, title, notebook_id, source_id, raw_text)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (youtube_id) DO UPDATE SET
       raw_text = EXCLUDED.raw_text,
       title = COALESCE(EXCLUDED.title, videos.title)`,
    [
      mapping.youtubeUrl,
      mapping.youtubeId,
      mapping.title || null,
      mapping.notebookId,
      mapping.sourceId,
      rawText,
    ]
  );
}

main().catch(console.error);
