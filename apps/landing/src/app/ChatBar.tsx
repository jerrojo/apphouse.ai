'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'pm';
  text: string;
  timestamp: number;
  editTarget?: { x: number; y: number } | null;
}

interface ChatBarProps {
  appId: string;
  appSlug: string;
  locale?: 'es' | 'en';
  editTarget?: { x: number; y: number } | null;
  onClearEditTarget?: () => void;
}

type RecState = 'idle' | 'recording' | 'processing';

export default function ChatBar({ appId, appSlug, locale = 'en', editTarget, onClearEditTarget }: ChatBarProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [recState, setRecState] = useState<RecState>('idle');
  const [recDuration, setRecDuration] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const labels = locale === 'es'
    ? {
        placeholder: 'dile al PM qué cambiar...',
        placeholderEdit: 'describe el cambio en ese punto...',
        send: 'enviar',
        tapHint: 'toca la app donde quieras cambiar algo',
        recording: 'grabando...',
        processing: 'procesando...',
        editAt: 'editar en',
      }
    : {
        placeholder: 'tell the PM what to change...',
        placeholderEdit: 'describe the change at that point...',
        send: 'send',
        tapHint: 'tap the app where you want to make a change',
        recording: 'recording...',
        processing: 'processing...',
        editAt: 'edit at',
      };

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus and expand when edit target is set
  useEffect(() => {
    if (editTarget) {
      setExpanded(true);
      inputRef.current?.focus();
    }
  }, [editTarget]);

  // Cleanup recorder on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
      editTarget: editTarget || null,
    };
    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setSending(true);
    onClearEditTarget?.();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          appSlug,
          message: text.trim(),
          editTarget: editTarget || null,
        }),
      });
      const data = await res.json();

      const pmMsg: ChatMessage = {
        id: `pm-${Date.now()}`,
        role: 'pm',
        text: data.reply || (locale === 'es' ? 'recibido. trabajando en ello.' : 'got it. working on it.'),
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, pmMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: `pm-${Date.now()}`,
        role: 'pm',
        text: locale === 'es' ? 'error de conexión. intenta de nuevo.' : 'connection error. try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
    }
    setSending(false);
  };

  // Voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) { setRecState('idle'); setRecDuration(0); return; }

        setRecState('processing');
        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          formData.append('appId', appId);
          formData.append('sessionId', `chat-${appSlug}`);

          const res = await fetch('/api/voice', { method: 'POST', body: formData });
          const data = await res.json();

          if (res.ok && data.transcript) {
            await sendMessage(data.transcript);
          }
        } catch { /* ignore */ }
        setRecState('idle');
        setRecDuration(0);
      };

      mr.start(250);
      setRecState('recording');
      setRecDuration(0);
      timerRef.current = setInterval(() => setRecDuration(d => d + 1), 1000);
    } catch {
      setRecState('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, appSlug]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(message);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Message history — slides up when expanded */}
      {expanded && messages.length > 0 && (
        <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 max-h-64 overflow-y-auto px-4 py-3">
          <div className="max-w-2xl mx-auto space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}>
                  {msg.editTarget && (
                    <span className="text-xs opacity-60 block mb-1">
                      📍 {labels.editAt} ({msg.editTarget.x}%, {msg.editTarget.y}%)
                    </span>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Edit target indicator */}
      {editTarget && (
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-2">
          <div className="max-w-2xl mx-auto flex items-center gap-2 text-sm text-blue-700">
            <span>📍</span>
            <span>{labels.placeholderEdit}</span>
            <button onClick={onClearEditTarget} className="ml-auto text-blue-400 hover:text-blue-600">✕</button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          {/* Expand/collapse button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mb-1 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
            aria-label={expanded ? 'collapse chat' : 'expand chat'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {expanded
                ? <polyline points="6 15 12 9 18 15" />
                : <polyline points="6 9 12 15 18 9" />
              }
            </svg>
          </button>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setExpanded(true)}
            placeholder={editTarget ? labels.placeholderEdit : labels.placeholder}
            rows={1}
            className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none text-sm text-gray-900 placeholder:text-gray-400 max-h-32"
            style={{ minHeight: '42px' }}
          />

          {/* Voice button */}
          <button
            onClick={recState === 'recording' ? stopRecording : startRecording}
            disabled={recState === 'processing' || sending}
            className={`mb-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
              recState === 'recording'
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 scale-110'
                : recState === 'processing'
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            aria-label={recState === 'recording' ? 'stop recording' : 'start recording'}
          >
            {recState === 'recording' ? (
              <>
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </>
            ) : recState === 'processing' ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="18" x2="12" y2="22" />
              </svg>
            )}
          </button>

          {/* Send button */}
          <button
            onClick={() => sendMessage(message)}
            disabled={sending || !message.trim() || recState !== 'idle'}
            className="mb-1 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center shrink-0 hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={labels.send}
          >
            {sending ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>

        {/* Recording indicator */}
        {recState === 'recording' && (
          <div className="max-w-2xl mx-auto mt-2 text-center">
            <span className="inline-flex items-center gap-2 text-xs text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {labels.recording} {formatTime(recDuration)}
            </span>
          </div>
        )}
        {recState === 'processing' && (
          <div className="max-w-2xl mx-auto mt-2 text-center">
            <span className="text-xs text-gray-400">{labels.processing}</span>
          </div>
        )}
      </div>
    </div>
  );
}
