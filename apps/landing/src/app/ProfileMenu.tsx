'use client';

import { useState, useRef, useEffect } from 'react';

interface ProfileMenuProps {
  phone: string;
  locale?: 'es' | 'en';
}

export default function ProfileMenu({ phone, locale = 'en' }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const labels = locale === 'es'
    ? { account: 'cuenta', phone: 'teléfono', signOut: 'cerrar sesión' }
    : { account: 'account', phone: 'phone', signOut: 'sign out' };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold hover:bg-blue-700 transition-colors"
        aria-label="profile menu"
        aria-expanded={open}
      >
        {phone.slice(-2)}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-64 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider">{labels.account}</p>
            <p className="text-sm font-medium text-gray-900 mt-1 font-mono">{phone}</p>
          </div>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {labels.signOut}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
