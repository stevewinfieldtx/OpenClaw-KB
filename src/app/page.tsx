import Hero from "@/components/Hero";
import BestPractices from "@/components/BestPractices";
import ChatWidget from "@/components/ChatWidget";
import VoiceWidget from "@/components/VoiceWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950">
      <Hero />
      <BestPractices />
      <ChatWidget />
      <VoiceWidget />
      <footer className="text-center py-8 text-gray-600 text-sm border-t border-gray-800">
        <p>
          OpenClaw Knowledge Base — Built from 65+ expert YouTube tutorials.
          Not affiliated with OpenClaw.
        </p>
      </footer>
    </main>
  );
}
