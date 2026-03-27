"use client";

import { useState, useRef } from "react";

export default function VoiceWidget() {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function startListening() {
    setError("");
    setResponse("");
    setTranscript("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setError("Speech recognition is not supported in this browser. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(text);
    };

    recognition.onend = async () => {
      setListening(false);
      const finalText = transcript;
      if (!finalText) return;

      setProcessing(true);
      try {
        // Get RAG response
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: finalText }),
        });
        const data = await res.json();
        setResponse(data.answer);

        // Send to ElevenLabs TTS
        setSpeaking(true);
        const ttsRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: data.answer }),
        });

        if (ttsRes.ok) {
          const audioBlob = await ttsRes.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.onended = () => {
            setSpeaking(false);
            URL.revokeObjectURL(audioUrl);
          };
          audio.play();
        } else {
          setSpeaking(false);
          setError("TTS failed — check ElevenLabs API key");
        }
      } catch (err) {
        setError("Voice processing failed. Please try again.");
      } finally {
        setProcessing(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setListening(false);
      setError(`Speech error: ${event.error}`);
    };

    recognition.start();
  }

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }

  const isActive = listening || processing || speaking;

  return (
    <section id="voice" className="max-w-3xl mx-auto py-16 px-6">
      <h2 className="text-3xl font-bold text-white mb-2">Voice Mode</h2>
      <p className="text-gray-400 mb-8">
        Speak your question — get an AI-voiced answer powered by ElevenLabs.
      </p>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
        <button
          onClick={isActive ? stopAudio : startListening}
          disabled={processing}
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all ${
            listening
              ? "bg-red-500 animate-pulse scale-110"
              : speaking
              ? "bg-green-500 animate-pulse"
              : processing
              ? "bg-yellow-500 animate-spin"
              : "bg-indigo-600 hover:bg-indigo-500 hover:scale-105"
          }`}
        >
          {listening ? (
            <MicIcon className="w-10 h-10 text-white" />
          ) : speaking ? (
            <SpeakerIcon className="w-10 h-10 text-white" />
          ) : processing ? (
            <SpinnerIcon className="w-10 h-10 text-white" />
          ) : (
            <MicIcon className="w-10 h-10 text-white" />
          )}
        </button>

        <p className="mt-4 text-gray-400 text-sm">
          {listening
            ? "Listening... speak now"
            : speaking
            ? "Speaking response..."
            : processing
            ? "Processing..."
            : "Click to start"}
        </p>

        {transcript && (
          <div className="mt-6 text-left">
            <p className="text-xs text-gray-500 mb-1">You said:</p>
            <p className="text-gray-300 text-sm bg-gray-800 rounded-lg p-3">{transcript}</p>
          </div>
        )}

        {response && (
          <div className="mt-4 text-left">
            <p className="text-xs text-gray-500 mb-1">Answer:</p>
            <p className="text-gray-300 text-sm bg-gray-800 rounded-lg p-3 whitespace-pre-wrap">
              {response}
            </p>
          </div>
        )}

        {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
      </div>
    </section>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 019.95 9" strokeLinecap="round" />
    </svg>
  );
}
