"use client";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 py-24 px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Powered by 65+ expert video transcripts
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">
          OpenClaw
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            {" "}Knowledge Base
          </span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Best practices, troubleshooting, and deep knowledge from the top OpenClaw
          tutorials — searchable via AI-powered text and voice chat.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#chat"
            className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Ask a Question
          </a>
          <a
            href="#best-practices"
            className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-colors"
          >
            Browse Best Practices
          </a>
        </div>
      </div>
    </section>
  );
}
