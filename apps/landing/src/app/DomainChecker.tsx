'use client';

import { useState, useCallback } from 'react';

interface DomainResult {
  domain: string;
  tld: string;
  available: boolean | null;
  source: 'icann' | 'web3';
}

interface DomainCheckerProps {
  defaultName?: string;
  onSelect?: (domain: string) => void;
  locale?: 'es' | 'en';
}

export default function DomainChecker({ defaultName = '', onSelect, locale = 'en' }: DomainCheckerProps) {
  const [name, setName] = useState(defaultName);
  const [results, setResults] = useState<DomainResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const labels = locale === 'es'
    ? {
        placeholder: 'nombre de dominio',
        search: 'buscar',
        searching: 'buscando...',
        available: 'disponible',
        taken: 'no disponible',
        unknown: 'sin datos',
        noResults: 'no se encontraron resultados',
        icann: 'ICANN',
        web3: 'Web3',
      }
    : {
        placeholder: 'domain name',
        search: 'check availability',
        searching: 'checking...',
        available: 'available',
        taken: 'taken',
        unknown: 'unknown',
        noResults: 'no results found',
        icann: 'ICANN',
        web3: 'Web3',
      };

  const handleSearch = useCallback(async () => {
    const clean = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!clean || clean.length < 2) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setSearched(true);

    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clean }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'check failed');
        return;
      }

      setResults(data.results || []);
    } catch {
      setError('network error');
    } finally {
      setLoading(false);
    }
  }, [name]);

  return (
    <div className="w-full">
      {/* search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={labels.placeholder}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading || name.trim().length < 2}
          className="px-5 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
        >
          {loading ? labels.searching : labels.search}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      {/* results */}
      {searched && results.length > 0 && (
        <div className="mt-4 max-h-64 overflow-y-auto space-y-1.5">
          {results.map((r) => (
            <button
              key={r.domain}
              onClick={() => r.available && onSelect?.(r.domain)}
              disabled={!r.available}
              className={`
                w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors
                ${r.available
                  ? 'bg-green-50 hover:bg-green-100 cursor-pointer text-green-800 border border-green-200'
                  : r.available === false
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'
                    : 'bg-yellow-50 text-yellow-700 cursor-not-allowed border border-yellow-100'
                }
              `}
            >
              <span className="font-mono font-medium">{r.domain}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs opacity-60">{r.source === 'web3' ? labels.web3 : labels.icann}</span>
                <span className={`
                  inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                  ${r.available ? 'bg-green-200 text-green-800' : r.available === false ? 'bg-gray-200 text-gray-500' : 'bg-yellow-200 text-yellow-700'}
                `}>
                  {r.available ? labels.available : r.available === false ? labels.taken : labels.unknown}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {searched && !loading && results.length === 0 && !error && (
        <p className="mt-4 text-sm text-gray-400 text-center">{labels.noResults}</p>
      )}
    </div>
  );
}
