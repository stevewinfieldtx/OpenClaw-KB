'use client';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-white py-20 px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-indigo-300">Powered by 79 expert video transcripts</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
          OpenClaw
          <span className="block text-3xl md:text-4xl mt-2 font-normal text-gray-300">
            Knowledge Base
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          Best practices, troubleshooting, and expert guidance for the open-source
          AI agent framework — extracted from the top tutorial videos and searchable
          via hybrid AI-powered retrieval.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="#best-practices"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
          >
            Read Best Practices
          </a>
          <a
            href="#chat"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-medium transition-colors"
          >
            Ask a Question
          </a>
          <a
            href="#voice"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Voice Mode
          </a>
        </div>
      </div>
    </section>
  );
}
