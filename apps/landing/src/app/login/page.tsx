'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// ─────────────────────────────────────────────────────────────────────────────
// Steps: phone → otp (new users) → pin-setup (new users) → pin-login (existing)
// ─────────────────────────────────────────────────────────────────────────────
type Step = 'phone' | 'otp' | 'pin-setup' | 'pin-login';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const supabase = createClient();

  // ── Countdown timer for resend ────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Phone submit ──────────────────────────────────────────────────
  const handlePhoneSubmit = async () => {
    setError(null);
    const cleaned = phone.trim();

    if (!/^\+[1-9]\d{6,14}$/.test(cleaned)) {
      setError('ingresa tu teléfono con código de país (ej. +521234567890)');
      return;
    }

    setLoading(true);

    // Try signing in with a dummy PIN to check if the user exists.
    // Supabase returns "Invalid login credentials" if user exists but wrong pw.
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      phone: cleaned,
      password: '______', // dummy — will always fail
    });

    const errMsg = signInErr?.message?.toLowerCase() || '';

    if (errMsg.includes('invalid') && errMsg.includes('credentials')) {
      // User exists — ask for their PIN
      setStep('pin-login');
      setLoading(false);
      return;
    }

    // User doesn't exist — send OTP for registration
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'no se pudo enviar el código');
      return;
    }

    setCountdown(60);
    setStep('otp');
  };

  // ── OTP verify ────────────────────────────────────────────────────
  const handleOtpVerify = async () => {
    setError(null);
    if (otp.length !== 6) {
      setError('ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim(), code: otp }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'código inválido');
      return;
    }

    setVerificationToken(data.token);
    setStep('pin-setup');
  };

  // ── PIN setup (new user registration) ─────────────────────────────
  const handlePinSetup = async () => {
    setError(null);

    if (!/^\d{6}$/.test(pin)) {
      setError('el nip debe ser exactamente 6 dígitos');
      return;
    }
    if (pin !== pinConfirm) {
      setError('los nips no coinciden');
      return;
    }

    setLoading(true);

    // 1. Register user on the server
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone.trim(),
        pin,
        verificationToken,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || 'no se pudo crear la cuenta');
      return;
    }

    // 2. Sign in immediately
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      phone: phone.trim(),
      password: pin,
    });

    setLoading(false);

    if (signInErr) {
      setError(signInErr.message);
      return;
    }

    // Redirect
    const params = new URLSearchParams(window.location.search);
    window.location.href = params.get('next') || '/';
  };

  // ── PIN login (existing user) ─────────────────────────────────────
  const handlePinLogin = async () => {
    setError(null);

    if (!/^\d{6}$/.test(pin)) {
      setError('ingresa tu nip de 6 dígitos');
      return;
    }

    setLoading(true);

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      phone: phone.trim(),
      password: pin,
    });

    setLoading(false);

    if (signInErr) {
      setError('nip incorrecto');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    window.location.href = params.get('next') || '/';
  };

  // ── Resend OTP ────────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;
    setError(null);
    setLoading(true);

    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim() }),
    });

    setLoading(false);

    if (res.ok) {
      setCountdown(60);
      setOtp('');
    } else {
      const data = await res.json();
      setError(data.error || 'no se pudo reenviar');
    }
  };

  // ── Forgot PIN → re-verify phone ─────────────────────────────────
  const handleForgotPin = async () => {
    setError(null);
    setLoading(true);

    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim() }),
    });

    setLoading(false);

    if (res.ok) {
      setCountdown(60);
      setOtp('');
      setPin('');
      setStep('otp');
    } else {
      const data = await res.json();
      setError(data.error || 'no se pudo enviar el código');
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-block">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-white">a.</span>
            </div>
          </a>
        </div>

        {/* ─── Step: Phone Number ─── */}
        {step === 'phone' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              bienvenido a apphouse
            </h1>
            <p className="text-gray-500 text-center text-sm mb-8">
              ingresa tu teléfono para entrar o crear tu cuenta
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1.5">teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+521234567890"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-lg tracking-wide"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handlePhoneSubmit()}
            />

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <button
              onClick={handlePhoneSubmit}
              disabled={loading}
              className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'verificando...' : 'continuar'}
            </button>
          </div>
        )}

        {/* ─── Step: OTP Verification ─── */}
        {step === 'otp' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              verifica tu teléfono
            </h1>
            <p className="text-gray-500 text-center text-sm mb-8">
              enviamos un código de 6 dígitos a{' '}
              <span className="text-gray-900 font-medium">{phone}</span>
            </p>

            <CodeInput value={otp} onChange={setOtp} length={6} autoFocus />

            {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}

            <button
              onClick={handleOtpVerify}
              disabled={loading || otp.length !== 6}
              className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'verificando...' : 'verificar'}
            </button>

            <div className="mt-4 text-center">
              {countdown > 0 ? (
                <p className="text-sm text-gray-400">reenviar en {countdown}s</p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2"
                >
                  reenviar código
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError(null);
              }}
              className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600"
            >
              ← cambiar número
            </button>
          </div>
        )}

        {/* ─── Step: PIN Setup (new users) ─── */}
        {step === 'pin-setup' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              crea tu nip
            </h1>
            <p className="text-gray-500 text-center text-sm mb-8">
              elige un nip de 6 dígitos para entrar la próxima vez — sin sms
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1.5">nip</label>
            <CodeInput value={pin} onChange={setPin} length={6} masked />

            <label className="block text-sm font-medium text-gray-700 mb-1.5 mt-5">
              confirmar nip
            </label>
            <CodeInput value={pinConfirm} onChange={setPinConfirm} length={6} masked />

            {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}

            <button
              onClick={handlePinSetup}
              disabled={loading || pin.length !== 6 || pinConfirm.length !== 6}
              className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'creando cuenta...' : 'crear cuenta'}
            </button>
          </div>
        )}

        {/* ─── Step: PIN Login (existing users) ─── */}
        {step === 'pin-login' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              hola de nuevo
            </h1>
            <p className="text-gray-500 text-center text-sm mb-8">
              ingresa tu nip para{' '}
              <span className="text-gray-900 font-medium">{phone}</span>
            </p>

            <CodeInput value={pin} onChange={setPin} length={6} masked autoFocus />

            {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}

            <button
              onClick={handlePinLogin}
              disabled={loading || pin.length !== 6}
              className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'entrando...' : 'entrar'}
            </button>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setStep('phone');
                  setPin('');
                  setError(null);
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                ← cambiar número
              </button>
              <button
                onClick={handleForgotPin}
                disabled={loading}
                className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2"
              >
                olvidé mi nip
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CodeInput — 6-box digit input for OTP and PIN
// ─────────────────────────────────────────────────────────────────────────────
function CodeInput({
  value,
  onChange,
  length = 6,
  masked = false,
  autoFocus = false,
}: {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  masked?: boolean;
  autoFocus?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && refs.current[0]) {
      refs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = useCallback(
    (idx: number, char: string) => {
      if (!/^\d?$/.test(char)) return;
      const arr = value.split('');
      arr[idx] = char;
      const next = arr.join('').slice(0, length);
      onChange(next);
      if (char && idx < length - 1) {
        refs.current[idx + 1]?.focus();
      }
    },
    [value, onChange, length]
  );

  const handleKeyDown = useCallback(
    (idx: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !value[idx] && idx > 0) {
        refs.current[idx - 1]?.focus();
        const arr = value.split('');
        arr[idx - 1] = '';
        onChange(arr.join(''));
      }
    },
    [value, onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      onChange(pasted);
      const focusIdx = Math.min(pasted.length, length - 1);
      refs.current[focusIdx]?.focus();
    },
    [onChange, length]
  );

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type={masked ? 'password' : 'text'}
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-14 text-center text-xl font-bold border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      ))}
    </div>
  );
}
