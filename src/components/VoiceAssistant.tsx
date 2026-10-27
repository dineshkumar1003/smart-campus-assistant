import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, Square, AlertCircle, Sparkles, Send } from 'lucide-react';
import { sendChatMessage } from '../services/api';

export const VoiceAssistant: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Populate SpeechSynthesis voices
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        if (available.length > 0 && !selectedVoice) {
          const defaultVoice = available.find((v) => v.lang.startsWith('en')) || available[0];
          setSelectedVoice(defaultVoice.name);
        }
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Speech Recognition
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSupported(false);
      setError('Web Speech Recognition API is not supported in this browser. You can still type queries and listen to speech synthesis.');
    } else {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        const text = Array.from(e.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setTranscript(text);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onerror = (e: any) => {
        console.error('Speech error:', e);
        setIsRecording(false);
        if (e.error === 'not-allowed') {
          setError('Microphone access was denied. Please grant microphone permission in your browser bar.');
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleRecording = () => {
    setError(null);
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err: any) {
        setError('Failed to start microphone: ' + err.message);
      }
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const plain = text.replace(/[*#`_~[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(plain);

    if (selectedVoice) {
      const v = voices.find((vox) => vox.name === selectedVoice);
      if (v) utterance.voice = v;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePauseSpeaking = () => {
    if ('speechSynthesis' in window && isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  };

  const handleStopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const handleSendVoiceQuery = async () => {
    if (!transcript.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sendChatMessage({
        messages: [{ id: '1', sender: 'user', content: transcript, timestamp: '' }],
        systemInstruction: 'You are Smart Campus Voice Assistant. Provide concise, clear spoken answers tailored for voice interaction, avoiding markdown heavy tables or long code unless asked.',
      });
      setResponse(res);
      speakText(res);
    } catch (err: any) {
      setError(err.message || 'Failed to query voice assistant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-4xl mx-auto flex flex-col gap-6">
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Mic className="text-sky-600" size={22} /> Voice Assistant
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Hands-free push-to-talk speech recognition and natural academic voice synthesis.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Microphone Interaction Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xs">
        {/* Pulsing indicator */}
        <div className="relative mb-6">
          {isRecording && (
            <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-40 scale-125" />
          )}
          <button
            onClick={toggleRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all shadow-md active:scale-95 z-10 relative ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 ring-4 ring-rose-200 dark:ring-rose-900'
                : 'bg-sky-600 hover:bg-sky-500'
            }`}
            title={isRecording ? 'Click to stop recording' : 'Click to push-to-talk'}
          >
            {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
        </div>

        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
          {isRecording ? 'Listening to speech...' : 'Click microphone to speak'}
        </p>
        <p className="text-xs text-slate-500 max-w-sm">
          {isRecording
            ? 'Speak clearly into your microphone. Click the button again when finished.'
            : 'Push to talk with instant speech-to-text transcript generation.'}
        </p>

        {/* Live Audio Indicator */}
        {isRecording && (
          <div className="flex items-center gap-1.5 mt-4">
            <span className="w-1.5 h-6 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-9 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.4s]" />
            <span className="w-1.5 h-8 bg-rose-500 rounded-full animate-bounce" />
            <span className="w-1.5 h-5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.2s]" />
          </div>
        )}
      </div>

      {/* Editable Speech-to-Text Input Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Speech Transcript (Editable)
          </span>
          {transcript && (
            <button
              onClick={() => setTranscript('')}
              className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Your spoken words will appear here in real-time, or you can type here directly..."
          rows={3}
          className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-sky-500 transition-colors leading-relaxed"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Voice selection */}
            {voices.length > 0 && (
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 outline-none max-w-[200px] truncate"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={handleSendVoiceQuery}
            disabled={loading || !transcript.trim()}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Send size={13} />
            <span>{loading ? 'Synthesizing...' : 'Ask Assistant'}</span>
          </button>
        </div>
      </div>

      {/* Assistant Response with Audio Controls */}
      {response && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <Sparkles size={14} /> Voice Response
            </span>

            {/* Read-Aloud Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => speakText(response)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                title="Play from start"
              >
                <Play size={14} />
              </button>
              <button
                onClick={handlePauseSpeaking}
                disabled={!isSpeaking}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-30"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                <Pause size={14} />
              </button>
              <button
                onClick={handleStopSpeaking}
                disabled={!isSpeaking && !isPaused}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-rose-500 disabled:opacity-30"
                title="Stop audio"
              >
                <Square size={14} className="fill-current" />
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {response}
          </p>
        </div>
      )}
    </div>
  );
};
