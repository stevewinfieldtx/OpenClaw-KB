import Hero from '@/components/Hero';
import BestPractices from '@/components/BestPractices';
import ChatWidget from '@/components/ChatWidget';
import VoiceWidget from '@/components/VoiceWidget';

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <BestPractices />
      <ChatWidget />
      <VoiceWidget />

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-8 px-6 text-center text-sm">
        <p>
          OpenClaw Knowledge Base &mdash; Built from 79 expert tutorial videos.
          <br />
          Powered by hybrid vector + keyword search with RAG.
        </p>
      </footer>
    </main>
  );
}
