import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Prioritized sources: official first, then high-quality community content
const SOURCES = [
  // === OFFICIAL GITHUB DOCS (raw markdown — clean text) ===
  { url: "https://raw.githubusercontent.com/openclaw/openclaw/main/README.md", title: "OpenClaw README", channel: "OpenClaw GitHub", priority: 1 },
  { url: "https://raw.githubusercontent.com/openclaw/openclaw/main/AGENTS.md", title: "OpenClaw AGENTS.md - Multi-Agent Setup", channel: "OpenClaw GitHub", priority: 1 },
  { url: "https://raw.githubusercontent.com/openclaw/openclaw/main/docs/index.md", title: "OpenClaw Docs Index", channel: "OpenClaw GitHub", priority: 1 },
  { url: "https://raw.githubusercontent.com/openclaw/openclaw/main/docs/tools/skills.md", title: "OpenClaw Skills Documentation", channel: "OpenClaw GitHub", priority: 1 },
  { url: "https://raw.githubusercontent.com/openclaw/openclaw/main/docs/automation/cron-jobs.md", title: "OpenClaw Cron Jobs Documentation", channel: "OpenClaw GitHub", priority: 1 },

  // === OFFICIAL DOCS SITE ===
  { url: "https://docs.openclaw.ai/start/getting-started", title: "OpenClaw Getting Started (Official)", channel: "OpenClaw Official", priority: 1 },
  { url: "https://docs.openclaw.ai/vps", title: "OpenClaw Linux Server/VPS Guide", channel: "OpenClaw Official", priority: 1 },
  { url: "https://docs.openclaw.ai/channels/discord", title: "OpenClaw Discord Integration", channel: "OpenClaw Official", priority: 1 },
  { url: "https://docs.openclaw.ai/tools/skills", title: "OpenClaw Skills Guide (Official)", channel: "OpenClaw Official", priority: 1 },
  { url: "https://docs.openclaw.ai/concepts/memory", title: "OpenClaw Memory System (Official)", channel: "OpenClaw Official", priority: 1 },
  { url: "https://docs.openclaw.ai/concepts/multi-agent", title: "OpenClaw Multi-Agent Routing (Official)", channel: "OpenClaw Official", priority: 1 },
  { url: "https://docs.openclaw.ai/gateway/security", title: "OpenClaw Security Guide (Official)", channel: "OpenClaw Official", priority: 1 },
  { url: "https://docs.openclaw.ai/gateway/troubleshooting", title: "OpenClaw Troubleshooting (Official)", channel: "OpenClaw Official", priority: 1 },
  { url: "https://docs.openclaw.ai/concepts/architecture", title: "OpenClaw Architecture (Official)", channel: "OpenClaw Official", priority: 1 },
  { url: "https://docs.openclaw.ai/automation/cron-jobs", title: "OpenClaw Cron Jobs (Official)", channel: "OpenClaw Official", priority: 1 },

  // === GETOPENCLAW.AI ===
  { url: "https://www.getopenclaw.ai/en/changelog", title: "OpenClaw Changelog (getopenclaw.ai)", channel: "OpenClaw Official", priority: 1 },

  // === CREATOR BLOG ===
  { url: "https://steipete.me/posts/2026/openclaw", title: "Peter Steinberger - OpenClaw Blog Post", channel: "OpenClaw Creator", priority: 1 },
  { url: "https://steipete.me/tags/openclaw", title: "Peter Steinberger - All OpenClaw Posts", channel: "OpenClaw Creator", priority: 1 },

  // === SETUP & INSTALLATION ===
  { url: "https://blog.promptlayer.com/how-to-install-openclaw-step-by-step-guide-formerly-clawdbot-moltbot/", title: "How to Install OpenClaw - Step by Step (PromptLayer)", channel: "Community Tutorials", priority: 2 },
  { url: "https://www.datacamp.com/tutorial/moltbot-clawdbot-tutorial", title: "OpenClaw Full Tutorial (DataCamp)", channel: "Community Tutorials", priority: 2 },
  { url: "https://dev.to/krisvarley/full-setup-guide-clawdbot-moltbot-openclaw-40oj", title: "Full Setup Guide - ClawdBot/MoltBot/OpenClaw (DEV)", channel: "Community Tutorials", priority: 2 },
  { url: "https://amankhan1.substack.com/p/how-to-get-clawdbotmoltbotopenclaw", title: "How to Get OpenClaw Running (Substack)", channel: "Community Tutorials", priority: 2 },

  // === VPS & HOSTING ===
  { url: "https://www.hostinger.com/support/how-to-install-openclaw-on-hostinger-vps/", title: "OpenClaw on Hostinger VPS (Official Hostinger)", channel: "VPS Hosting", priority: 2 },
  { url: "https://www.hostinger.com/support/how-to-secure-and-harden-openclaw-security/", title: "OpenClaw Security Hardening on VPS (Hostinger)", channel: "VPS Hosting", priority: 2 },
  { url: "https://localtonet.com/blog/how-to-self-host-openclaw", title: "How to Self-Host OpenClaw (LocalToNet)", channel: "VPS Hosting", priority: 2 },
  { url: "https://til.simonwillison.net/llms/openclaw-docker", title: "OpenClaw with Docker (Simon Willison)", channel: "VPS Hosting", priority: 2 },
  { url: "https://www.digitalocean.com/resources/articles/what-is-openclaw", title: "What is OpenClaw? (DigitalOcean)", channel: "VPS Hosting", priority: 2 },
  { url: "https://www.digitalocean.com/blog/openclaw-digitalocean-app-platform", title: "OpenClaw on DigitalOcean App Platform", channel: "VPS Hosting", priority: 2 },

  // === SKILLS & PLUGINS ===
  { url: "https://github.com/VoltAgent/awesome-openclaw-skills", title: "Awesome OpenClaw Skills (5400+ skills)", channel: "Skills & Plugins", priority: 2 },
  { url: "https://github.com/vincentkoc/awesome-openclaw", title: "Awesome OpenClaw - Curated List", channel: "Skills & Plugins", priority: 2 },
  { url: "https://lumadock.com/tutorials/openclaw-skills-guide", title: "OpenClaw Skills Guide (LumaDock)", channel: "Skills & Plugins", priority: 2 },

  // === SECURITY ===
  { url: "https://github.com/slowmist/openclaw-security-practice-guide", title: "OpenClaw Security Practice Guide (SlowMist)", channel: "Security", priority: 2 },
  { url: "https://nebius.com/blog/posts/openclaw-security", title: "OpenClaw Security Architecture (Nebius)", channel: "Security", priority: 2 },
  { url: "https://semgrep.dev/blog/2026/openclaw-security-engineers-cheat-sheet/", title: "OpenClaw Security Cheat Sheet (Semgrep)", channel: "Security", priority: 2 },

  // === MEMORY SYSTEMS ===
  { url: "https://velvetshark.com/openclaw-memory-masterclass", title: "OpenClaw Memory Masterclass (VelvetShark)", channel: "Memory Systems", priority: 2 },
  { url: "https://mem0.ai/blog/add-persistent-memory-openclaw", title: "Add Persistent Memory to OpenClaw (Mem0)", channel: "Memory Systems", priority: 2 },
  { url: "https://milvus.io/blog/we-extracted-openclaws-memory-system-and-open-sourced-it-memsearch.md", title: "OpenClaw Memory System Extracted & Open-Sourced (Milvus)", channel: "Memory Systems", priority: 2 },
  { url: "https://milvus.io/blog/openclaw-formerly-clawdbot-moltbot-explained-a-complete-guide-to-the-autonomous-ai-agent.md", title: "OpenClaw Complete Guide (Milvus)", channel: "Memory Systems", priority: 2 },

  // === LOCAL MODELS / OLLAMA ===
  { url: "https://ollama.com/blog/openclaw", title: "OpenClaw with Ollama (Official Ollama Blog)", channel: "Local Models", priority: 2 },
  { url: "https://www.bitdoze.com/openclaw-ollama-local-models/", title: "OpenClaw + Ollama Local Models Guide (BitDoze)", channel: "Local Models", priority: 2 },
  { url: "https://haimaker.ai/blog/best-local-models-for-openclaw/", title: "Best Local Models for OpenClaw (HaiMaker)", channel: "Local Models", priority: 2 },

  // === MULTI-AGENT ===
  { url: "https://zenvanriel.com/ai-engineer-blog/openclaw-multi-agent-orchestration-guide/", title: "OpenClaw Multi-Agent Orchestration Guide (ZenVanRiel)", channel: "Multi-Agent", priority: 2 },
  { url: "https://lumadock.com/tutorials/openclaw-multi-agent-coordination-governance", title: "OpenClaw Multi-Agent Coordination (LumaDock)", channel: "Multi-Agent", priority: 2 },
  { url: "https://dev.to/ggondim/how-i-built-a-deterministic-multi-agent-dev-pipeline-inside-openclaw-and-contributed-a-missing-4ool", title: "Multi-Agent Dev Pipeline Inside OpenClaw (DEV)", channel: "Multi-Agent", priority: 2 },

  // === MONETIZATION & USE CASES ===
  { url: "https://medium.com/@rentierdigital/33-openclaw-automations-you-can-set-up-in-30-minutes-that-start-making-you-money-tonight-f8c3b8a402f1", title: "33 OpenClaw Automations That Make Money (Medium)", channel: "Monetization", priority: 2 },
  { url: "https://forwardfuture.ai/p/what-people-are-actually-doing-with-openclaw-25-use-cases", title: "25 Real OpenClaw Use Cases (Forward Future)", channel: "Monetization", priority: 2 },
  { url: "https://superframeworks.com/articles/openclaw-business-ideas-indie-hackers", title: "OpenClaw Business Ideas for Indie Hackers", channel: "Monetization", priority: 2 },
  { url: "https://github.com/hesamsheikh/awesome-openclaw-usecases", title: "Awesome OpenClaw Use Cases (GitHub)", channel: "Monetization", priority: 2 },
  { url: "https://medium.com/@alexrozdolskiy/10-wild-things-people-actually-built-with-openclaw-e18f487cb3e0", title: "10 Wild Things Built with OpenClaw (Medium)", channel: "Monetization", priority: 2 },
  { url: "https://kanerika.com/blogs/openclaw-usecases/", title: "15 OpenClaw Use Cases for Business (Kanerika)", channel: "Monetization", priority: 2 },
  { url: "https://apidog.com/blog/openclaw-content-creators/", title: "OpenClaw for Content Creators (APIdog)", channel: "Monetization", priority: 2 },

  // === CRON JOBS & AUTOMATION ===
  { url: "https://zenvanriel.com/ai-engineer-blog/openclaw-cron-jobs-proactive-ai-guide/", title: "OpenClaw Cron Jobs Proactive AI Guide", channel: "Automation", priority: 2 },
  { url: "https://lumadock.com/tutorials/openclaw-cron-scheduler-guide", title: "OpenClaw Cron Scheduler Guide (LumaDock)", channel: "Automation", priority: 2 },

  // === INTEGRATIONS ===
  { url: "https://zapier.com/blog/automate-openclaw-zapier-mcp/", title: "Automate OpenClaw with Zapier MCP", channel: "Integrations", priority: 2 },
  { url: "https://lumadock.com/tutorials/openclaw-multi-channel-setup", title: "OpenClaw Multi-Channel Setup (LumaDock)", channel: "Integrations", priority: 2 },
  { url: "https://www.digitalapplied.com/blog/openclaw-whatsapp-integration-messaging-automation-guide", title: "OpenClaw WhatsApp Integration Guide", channel: "Integrations", priority: 2 },

  // === TROUBLESHOOTING ===
  { url: "https://lumadock.com/tutorials/openclaw-troubleshooting-common-errors", title: "OpenClaw Troubleshooting Common Errors (LumaDock)", channel: "Troubleshooting", priority: 2 },
  { url: "https://apidog.com/blog/openclaw-troubleshooting-guide/", title: "OpenClaw Troubleshooting Guide (APIdog)", channel: "Troubleshooting", priority: 2 },
  { url: "https://advenboost.com/en/openclaw-setup-mistakes/", title: "OpenClaw Setup Mistakes to Avoid", channel: "Troubleshooting", priority: 2 },

  // === ARCHITECTURE ===
  { url: "https://medium.com/@dingzhanjun/deep-dive-into-openclaw-architecture-code-ecosystem-e6180f34bd07", title: "Deep Dive into OpenClaw Architecture (Medium)", channel: "Architecture", priority: 2 },
  { url: "https://bibek-poudel.medium.com/how-openclaw-works-understanding-ai-agents-through-a-real-architecture-5d59cc7a4764", title: "How OpenClaw Works - AI Agents Architecture (Medium)", channel: "Architecture", priority: 2 },

  // === NEWS & MEDIA ===
  { url: "https://www.cnbc.com/2026/02/02/openclaw-open-source-ai-agent-rise-controversy-clawdbot-moltbot-moltbook.html", title: "OpenClaw Rise and Controversy (CNBC)", channel: "News & Media", priority: 3 },
  { url: "https://tldv.io/blog/clawdbot/", title: "ClawdBot/OpenClaw Review (TLDV)", channel: "News & Media", priority: 3 },
  { url: "https://news.ycombinator.com/item?id=46838946", title: "OpenClaw Hacker News Discussion", channel: "Community", priority: 3 },

  // === COMPARISONS ===
  { url: "https://clawtank.dev/blog/openclaw-vs-n8n-zapier", title: "OpenClaw vs n8n vs Zapier (ClawTank)", channel: "Comparisons", priority: 3 },
  { url: "https://www.progressiverobot.com/2026/03/23/openclaw-vs-traditional-automation-tools/", title: "OpenClaw vs Traditional Automation Tools", channel: "Comparisons", priority: 3 },
];

function docId(url: string): string {
  return "web:" + url.replace(/https?:\/\//, "").replace(/[^a-z0-9]/gi, "-").slice(0, 80);
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,text/plain,*/*",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return null;
    const raw = await res.text();

    // Markdown — return as-is
    if (url.includes("raw.githubusercontent") || url.endsWith(".md")) return raw;

    // Strip HTML
    return raw
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#\d+;/g, " ")
      .replace(/\s{3,}/g, "\n\n")
      .trim();
  } catch {
    return null;
  }
}

async function main() {
  // Check which are already ingested
  const existing = await pool.query(
    "SELECT youtube_id FROM videos WHERE youtube_id LIKE 'web:%' OR youtube_id LIKE 'doc:%'"
  );
  const existingIds = new Set(existing.rows.map((r: { youtube_id: string }) => r.youtube_id));

  const todo = SOURCES.filter((s) => !existingIds.has(docId(s.url)));
  console.log(`Ingesting ${todo.length} new web sources (${existingIds.size} already exist)...`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < todo.length; i++) {
    const source = todo[i];
    process.stdout.write(`[${i + 1}/${todo.length}] ${source.title}... `);

    const text = await fetchText(source.url);

    if (!text || text.length < 200) {
      console.log(`SKIP (${text?.length ?? 0} chars)`);
      failed++;
    } else {
      await pool.query(
        `INSERT INTO videos (youtube_url, youtube_id, title, channel, raw_text)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (youtube_id) DO UPDATE SET raw_text = $5, title = $3`,
        [source.url, docId(source.url), source.title, source.channel, text]
      );
      console.log(`OK (${Math.round(text.length / 1000)}K chars)`);
      success++;
    }

    // Rate limit between requests
    if (i < todo.length - 1) await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\nDone: ${success} saved, ${failed} skipped out of ${todo.length}`);
  await pool.end();
}

main().catch(console.error);
