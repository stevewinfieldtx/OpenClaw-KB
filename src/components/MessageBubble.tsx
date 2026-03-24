'use client';

import type { SearchResult } from '@/lib/types';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: SearchResult[];
}

export default function MessageBubble({ role, content, sources }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}
      >
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: simpleMarkdown(content) }}
        />

        {sources && sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200/30">
            <p className="text-xs font-medium mb-1.5 opacity-70">Sources:</p>
            <div className="flex flex-wrap gap-1.5">
              {sources.slice(0, 4).map((s, i) => (
                <a
                  key={i}
                  href={s.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs bg-black/10 hover:bg-black/20 rounded-md px-2 py-1 transition-colors"
                  title={s.videoTitle}
                >
                  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                    <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white" />
                  </svg>
                  <span className="truncate max-w-[120px]">{s.videoTitle}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function simpleMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-black/10 px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/\[Video: (.+?)\]/g, '<em class="text-xs opacity-70">[$1]</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
