'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceRecorderProps {
  appId: string;
  sessionId: string;
  onTranscript?: (text: string) => void;
  locale?: 'es' | 'en';
}

type RecordingState = 'idle' | 'recording' | 'processing';

export default function VoiceRecorder({ appId, sessionId, onTranscript, locale = 'en' }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const labels = locale === 'es'
    ? { tap: 'toca para hablar', recording: 'grabando...', processing: 'procesando...', error: 'sin acceso al micrófono' }
    : { tap: 'tap to speak', recording: 'recording...', processing: 'processing...', error: 'microphone access denied' };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) {
          // Too short — ignore
          setState('idle');
          setDuration(0);
          return;
        }

        setState('processing');
        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          formData.append('appId', appId);
          formData.append('sessionId', sessionId);

          const res = await fetch('/api/voice', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();

          if (res.ok && data.transcript) {
            onTranscript?.(data.transcript);
          } else {
            setError(data.error || 'transcription failed');
          }
        } catch (err) {
          setError('network error');
        }
        setState('idle');
        setDuration(0);
      };

      mediaRecorder.start(250); // collect in 250ms chunks
      setState('recording');
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch {
      setError(labels.error);
      setState('idle');
    }
  }, [appId, sessionId, onTranscript, labels.error]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={state === 'recording' ? stopRecording : startRecording}
        disabled={state === 'processing'}
        className={`
          relative w-16 h-16 rounded-full flex items-center justify-center transition-all
          ${state === 'recording'
            ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-200'
            : state === 'processing'
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gray-900 hover:bg-gray-800 hover:scale-105 active:scale-95 shadow-lg'
          }
        `}
        aria-label={state === 'recording' ? 'stop recording' : 'start recording'}
      >
        {state === 'recording' ? (
          <>
            {/* pulsing ring */}
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
            {/* stop icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </>
        ) : state === 'processing' ? (
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          /* mic icon */
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        )}
      </button>

      <p className="text-xs text-gray-400">
        {state === 'recording'
          ? `${labels.recording} ${formatTime(duration)}`
          : state === 'processing'
            ? labels.processing
            : labels.tap}
      </p>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
