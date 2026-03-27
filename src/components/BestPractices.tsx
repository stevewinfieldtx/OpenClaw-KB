"use client";

import { useState, useEffect } from "react";

interface Practice {
  id: number;
  section_key: string;
  title: string;
  content: string;
}

const FALLBACK_PRACTICES: Omit<Practice, "id">[] = [
  {
    section_key: "security",
    title: "Security & Sandboxing",
    content:
      "OpenClaw operates with broad system access. Always run it in a sandboxed environment, use SSH key auth instead of passwords for VPS, restrict tool permissions to only what's needed, and never expose API keys in soul.md or workspace files. Vet all third-party skills before importing.",
  },
  {
    section_key: "memory",
    title: "Memory & RAG Configuration",
    content:
      "Use structured memory files (soul.md, agents.md) to maintain context. For large knowledge bases, integrate Obsidian-style RAG graphs. Keep memory files focused — too much context causes token bloat and higher costs. Regularly prune stale entries.",
  },
  {
    section_key: "deployment",
    title: "VPS & Deployment",
    content:
      "Deploy on a VPS (Hostinger, DigitalOcean, etc.) for 24/7 availability. Use process managers like PM2 or systemd to keep OpenClaw running. Monitor resource usage — local models via Ollama can be memory-intensive. Set up proper logging for debugging.",
  },
  {
    section_key: "skills",
    title: "Skills & Plugins",
    content:
      "Start with a minimal skill set and add as needed. Too many skills cause bloat, confusion, and security risks. Always review skill source code before importing. Use cron jobs for scheduled tasks rather than always-on polling.",
  },
  {
    section_key: "models",
    title: "Model Selection & Cost",
    content:
      "Route different tasks to appropriate models — use cheaper models for simple tasks, powerful ones for complex reasoning. Monitor token usage to avoid surprise bills. Local models via Ollama provide privacy but require adequate hardware.",
  },
  {
    section_key: "multi-agent",
    title: "Multi-Agent & Mission Control",
    content:
      "For complex workflows, use sub-agents with clearly defined roles. Set up mission control for oversight. Define clear boundaries between agents to prevent conflicting actions. Start with a single agent and scale up gradually.",
  },
];

export default function BestPractices() {
  const [practices, setPractices] = useState<Omit<Practice, "id">[]>(FALLBACK_PRACTICES);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/search?q=best+practices")
      .then((r) => r.json())
      .then(() => {
        // If DB has practices, we could fetch them here
        // For now, use fallback
      })
      .catch(() => {});
  }, []);

  return (
    <section id="best-practices" className="max-w-4xl mx-auto py-16 px-6">
      <h2 className="text-3xl font-bold text-white mb-2">Best Practices</h2>
      <p className="text-gray-400 mb-8">
        Curated from 65+ expert tutorials on OpenClaw setup, security, and optimization.
      </p>

      <div className="grid gap-4">
        {practices.map((p) => (
          <div
            key={p.section_key}
            className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden transition-all"
          >
            <button
              onClick={() =>
                setExpanded(expanded === p.section_key ? null : p.section_key)
              }
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <h3 className="text-lg font-semibold text-white">{p.title}</h3>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expanded === p.section_key ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expanded === p.section_key && (
              <div className="px-5 pb-5 pt-0">
                <p className="text-gray-300 leading-relaxed text-sm">{p.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
