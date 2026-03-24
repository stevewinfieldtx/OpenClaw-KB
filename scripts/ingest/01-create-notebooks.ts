/**
 * Step 1: Create NotebookLM notebooks and add all YouTube URLs as sources.
 *
 * NotebookLM has a practical limit of ~50 sources per notebook.
 * We split 79 videos across 2 notebooks: 40 + 39.
 *
 * Output: saves source mapping to ./source-mapping.json
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const URLS: string[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'urls.json'), 'utf-8')
);

const BATCH_SIZE = 40; // sources per notebook
const MAPPING_FILE = path.join(__dirname, 'source-mapping.json');
const DELAY_MS = 3000; // delay between source additions

interface SourceMapping {
  youtubeUrl: string;
  youtubeId: string;
  notebookId: string;
  sourceId: string | null;
  status: 'added' | 'failed';
  error?: string;
}

function extractVideoId(url: string): string {
  const match = url.match(/[?&]v=([A-Za-z0-9_-]+)/);
  return match ? match[1] : url;
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
  // Load existing mapping if resuming
  let mapping: SourceMapping[] = [];
  if (fs.existsSync(MAPPING_FILE)) {
    mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
    console.log(`Resuming: ${mapping.filter((m) => m.status === 'added').length}/${URLS.length} already added`);
  }

  const alreadyAdded = new Set(mapping.filter((m) => m.status === 'added').map((m) => m.youtubeUrl));
  const remaining = URLS.filter((u) => !alreadyAdded.has(u));

  if (remaining.length === 0) {
    console.log('All URLs already added. Done.');
    return;
  }

  // Split into batches for separate notebooks
  const batches: string[][] = [];
  for (let i = 0; i < URLS.length; i += BATCH_SIZE) {
    batches.push(URLS.slice(i, i + BATCH_SIZE));
  }

  console.log(`Total URLs: ${URLS.length}, Batches: ${batches.length} (${BATCH_SIZE} per notebook)`);

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const notebookName = `OpenClaw KB Part ${batchIdx + 1}`;

    // Check if notebook already exists for this batch
    let notebookId: string | null = null;
    const existingNotebooks = JSON.parse(runCmd('notebooklm list --json'));
    const existing = existingNotebooks.notebooks?.find(
      (n: { title: string }) => n.title === notebookName
    );

    if (existing) {
      notebookId = existing.id;
      console.log(`Using existing notebook: ${notebookName} (${notebookId})`);
    } else {
      console.log(`Creating notebook: ${notebookName}`);
      const result = JSON.parse(runCmd(`notebooklm create "${notebookName}" --json`));
      notebookId = result.notebook_id || result.id;
      console.log(`Created: ${notebookId}`);
    }

    // Set as current notebook
    runCmd(`notebooklm use ${notebookId}`);

    // Add each URL in this batch
    for (let i = 0; i < batch.length; i++) {
      const url = batch[i];
      if (alreadyAdded.has(url)) continue;

      const videoId = extractVideoId(url);
      console.log(`[${batchIdx + 1}/${batches.length}] Adding ${i + 1}/${batch.length}: ${videoId}`);

      try {
        const result = runCmd(`notebooklm source add "${url}" --json`);
        const parsed = JSON.parse(result);
        const sourceId = parsed.source_id || parsed.id || null;

        mapping.push({
          youtubeUrl: url,
          youtubeId: videoId,
          notebookId: notebookId!,
          sourceId,
          status: 'added',
        });

        console.log(`  Added: ${sourceId}`);
      } catch (err) {
        console.error(`  Failed to add ${url}`);
        mapping.push({
          youtubeUrl: url,
          youtubeId: videoId,
          notebookId: notebookId!,
          sourceId: null,
          status: 'failed',
          error: String(err),
        });
      }

      // Save progress after each URL
      fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));

      // Delay to avoid rate limiting
      if (i < batch.length - 1) {
        await sleep(DELAY_MS);
      }
    }

    console.log(`Notebook ${batchIdx + 1} complete.`);
  }

  const added = mapping.filter((m) => m.status === 'added').length;
  const failed = mapping.filter((m) => m.status === 'failed').length;
  console.log(`\nDone! Added: ${added}, Failed: ${failed}`);
  console.log(`Mapping saved to: ${MAPPING_FILE}`);
}

main().catch(console.error);
