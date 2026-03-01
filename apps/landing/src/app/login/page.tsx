'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { translations, detectLocale, t } from '@/lib/i18n';

type Step = 'phone' | 'otp' | 'pin-setup' | 'pin-login';
const L = translations.login;

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

  const locale = useMemo(() => detectLocale(), []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── Phone submit ──────────────────────────────────────────────────
  const handlePhoneSubmit = async () => {
    setError(null);
    const cleaned = phone.trim();
    if (!/^\+[1-9]\d{6,14}$/.test(cleaned)) {
      setError(t(L.phoneError, locale));
      return;
    }

    setLoading(true);

    // Check if user exists using admin API (reliable, not a dummy login)
    const checkRes = await fetch('/api/auth/check-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned }),
    });
    const checkData = await checkRes.json();

    if (checkRes.ok && checkData.exists) {
      // User exists — ask for their PIN
      setStep('pin-login');
      setLoading(false);
      return;
    }

    // New user — send OTP for registration
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || t(L.sendFailed, locale));
      return;
    }
    setCountdown(60);
    setStep('otp');
  };

  // ── OTP verify ────────────────────────────────────────────────────
  const handleOtpVerify = async () => {
    setError(null);
    if (otp.length !== 4) { setError(t(L.otpError, locale)); return; }

    setLoading(true);
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim(), code: otp }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || t(L.invalidCode, locale)); return; }
    setVerificationToken(data.token);
    setStep('pin-setup');
  };

  // ── Server-side login helper ──────────────────────────────────────
  const serverLogin = async (phoneNum: string, pinCode: string): Promise<boolean> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneNum, pin: pinCode }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t(L.wrongPin, locale));
      return false;
    }
    return true;
  };

  // ── PIN setup ─────────────────────────────────────────────────────
  const handlePinSetup = async () => {
    setError(null);
    if (!/^\d{4}$/.test(pin)) { setError(t(L.pinDigitsError, locale)); return; }
    if (pin !== pinConfirm) { setError(t(L.pinMismatch, locale)); return; }

    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim(), pin, verificationToken }),
    });
    const data = await res.json();
    if (!res.ok) { setLoading(false); setError(data.error || t(L.registerFailed, locale)); return; }

    // Sign in server-side so cookies are set for SSR
    const ok = await serverLogin(phone.trim(), pin);
    setLoading(false);
    if (!ok) return;

    const params = new URLSearchParams(window.location.search);
    window.location.href = params.get('next') || '/';
  };

  // ── PIN login ─────────────────────────────────────────────────────
  const handlePinLogin = async () => {
    setError(null);
    if (!/^\d{4}$/.test(pin)) { setError(t(L.pinError, locale)); return; }

    setLoading(true);
    const ok = await serverLogin(phone.trim(), pin);
    setLoading(false);
    if (!ok) return;

    const params = new URLSearchParams(window.location.search);
    window.location.href = params.get('next') || '/';
  };

  // ── Resend / Forgot ───────────────────────────────────────────────
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
    if (res.ok) { setCountdown(60); setOtp(''); }
    else { const d = await res.json(); setError(d.error || t(L.resendFailed, locale)); }
  };

  const handleForgotPin = async () => {
    setError(null);
    setLoading(true);
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim() }),
    });
    setLoading(false);
    if (res.ok) { setCountdown(60); setOtp(''); setPin(''); setStep('otp'); }
    else { const d = await res.json(); setError(d.error || t(L.sendFailed, locale)); }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <a href="/" className="inline-block">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-white">a.</span>
            </div>
          </a>
        </div>

        {/* ─── Phone ─── */}
        {step === 'phone' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">{t(L.welcome, locale)}</h1>
            <p className="text-gray-500 text-center text-sm mb-8">{t(L.subtitle, locale)}</p>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t(L.phoneLabel, locale)}</label>
            <input
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder={t(L.phonePlaceholder, locale)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-lg tracking-wide"
              autoFocus onKeyDown={(e) => e.key === 'Enter' && handlePhoneSubmit()}
            />
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button onClick={handlePhoneSubmit} disabled={loading}
              className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? t(L.checking, locale) : t(L.continue, locale)}
            </button>
          </div>
        )}

        {/* ─── OTP ─── */}
        {step === 'otp' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">{t(L.verifyTitle, locale)}</h1>
            <p className="text-gray-500 text-center text-sm mb-8">
              {t(L.verifySent, locale)} <span className="text-gray-900 font-medium">{phone}</span>
            </p>
            <CodeInput value={otp} onChange={setOtp} length={4} autoFocus />
            {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
            <button onClick={handleOtpVerify} disabled={loading || otp.length !== 4}
              className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? t(L.verifying, locale) : t(L.verify, locale)}
            </button>
            <div className="mt-4 text-center">
              {countdown > 0
                ? <p className="text-sm text-gray-400">{t(L.resendIn, locale)} {countdown}s</p>
                : <button onClick={handleResend} disabled={loading}
                    className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2">
                    {t(L.resendCode, locale)}
                  </button>}
            </div>
            <button onClick={() => { setStep('phone'); setOtp(''); setError(null); }}
              className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600">
              {t(L.changeNumber, locale)}
            </button>
          </div>
        )}

        {/* ─── PIN Setup ─── */}
        {step === 'pin-setup' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">{t(L.pinSetupTitle, locale)}</h1>
            <p className="text-gray-500 text-center text-sm mb-8">{t(L.pinSetupSubtitle, locale)}</p>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t(L.pinLabel, locale)}</label>
            <CodeInput value={pin} onChange={setPin} length={4} masked />
            <label className="block text-sm font-medium text-gray-700 mb-1.5 mt-5">{t(L.pinConfirmLabel, locale)}</label>
            <CodeInput value={pinConfirm} onChange={setPinConfirm} length={4} masked />
            {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
            <button onClick={handlePinSetup} disabled={loading || pin.length !== 4 || pinConfirm.length !== 4}
              className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? t(L.creatingAccount, locale) : t(L.createAccount, locale)}
            </button>
          </div>
        )}

        {/* ─── PIN Login ─── */}
        {step === 'pin-login' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">{t(L.welcomeBack, locale)}</h1>
            <p className="text-gray-500 text-center text-sm mb-8">
              {t(L.enterPin, locale)} <span className="text-gray-900 font-medium">{phone}</span>
            </p>
            <CodeInput value={pin} onChange={setPin} length={4} masked autoFocus />
            {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
            <button onClick={handlePinLogin} disabled={loading || pin.length !== 4}
              className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? t(L.signingIn, locale) : t(L.signIn, locale)}
            </button>
            <div className="mt-4 flex items-center justify-between">
              <button onClick={() => { setStep('phone'); setPin(''); setError(null); }}
                className="text-sm text-gray-400 hover:text-gray-600">
                {t(L.changeNumber, locale)}
              </button>
              <button onClick={handleForgotPin} disabled={loading}
                className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2">
                {t(L.forgotPin, locale)}
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
  value, onChange, length = 6, masked = false, autoFocus = false,
}: {
  value: string; onChange: (val: string) => void;
  length?: number; masked?: boolean; autoFocus?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && refs.current[0]) refs.current[0].focus();
  }, [autoFocus]);

  const handleChange = useCallback((idx: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const arr = value.split('');
    arr[idx] = char;
    onChange(arr.join('').slice(0, length));
    if (char && idx < length - 1) refs.current[idx + 1]?.focus();
  }, [value, onChange, length]);

  const handleKeyDown = useCallback((idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
      const arr = value.split('');
      arr[idx - 1] = '';
      onChange(arr.join(''));
    }
  }, [value, onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }, [onChange, length]);

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }}
          type={masked ? 'password' : 'text'} inputMode="numeric" maxLength={1}
          value={value[i] || ''} onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-14 text-center text-xl font-bold border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      ))}
    </div>
  );
}
