'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import type { ChatResponse, SearchResult } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: SearchResult[];
}

export default function VoiceWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(final || interim);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Try to pick a natural-sounding voice
    const voices = speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith('en') && v.name.includes('Google')
    ) || voices.find((v) => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopAndSend = async () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    setIsListening(false);

    const text = transcript.trim();
    if (!text) return;

    setTranscript('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sessionId }),
      });

      const data: ChatResponse = await res.json();
      if (data.sessionId) setSessionId(data.sessionId);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources },
      ]);

      // Speak the response (strip markdown for cleaner speech)
      const cleanText = data.answer
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/\[Video: .+?\]/g, '')
        .replace(/^- /gm, '')
        .replace(/#{1,3} /g, '');
      speakText(cleanText);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  if (!supported) {
    return (
      <section id="voice" className="py-16 px-6 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Voice Mode</h2>
          <p className="text-gray-400">
            Voice mode requires a browser with Web Speech API support (Chrome or Edge).
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="voice" className="py-16 px-6 bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">Voice Mode</h2>
        <p className="text-gray-400 mb-8">
          Ask questions by speaking — get answers read back to you.
        </p>

        <div className="border border-gray-700 rounded-2xl overflow-hidden">
          {/* Messages */}
          <div className="h-[300px] overflow-y-auto p-4 bg-gray-800/50">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>Press the microphone to start speaking...</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} role={msg.role} content={msg.content} sources={msg.sources} />
            ))}

            {loading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Transcript preview */}
          {transcript && (
            <div className="border-t border-gray-700 px-4 py-2 bg-gray-800/80 text-sm text-gray-300 italic">
              {transcript}
            </div>
          )}

          {/* Controls */}
          <div className="border-t border-gray-700 p-4 bg-gray-800 flex items-center justify-center gap-4">
            {!isListening ? (
              <button
                onClick={startListening}
                disabled={loading}
                className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 flex items-center justify-center transition-colors shadow-lg"
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={stopAndSend}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors shadow-lg animate-pulse"
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            )}

            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                Stop Speaking
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
