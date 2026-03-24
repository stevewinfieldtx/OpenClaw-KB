'use client';

import { useState, useEffect } from 'react';
import type { BestPracticeSection } from '@/lib/types';

export default function BestPractices() {
  const [sections, setSections] = useState<BestPracticeSection[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/best-practices')
      .then((r) => r.json())
      .then((data) => {
        setSections(data.sections || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <section id="best-practices" className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Best Practices</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (sections.length === 0) {
    return (
      <section id="best-practices" className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Best Practices</h2>
          <p className="text-gray-500">Best practices content is being generated. Check back soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="best-practices" className="py-16 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Best Practices</h2>
        <p className="text-gray-500 mb-8">
          Curated guidance extracted from 79 expert OpenClaw tutorial videos.
        </p>

        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.key}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => toggle(section.key)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expanded.has(section.key) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expanded.has(section.key) && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <div
                    className="prose prose-gray max-w-none mt-4"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(section.content) }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Simple markdown to HTML (good enough for best practices content)
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc space-y-1 my-2">$&</ul>')
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/\n/g, '<br/>');
}
