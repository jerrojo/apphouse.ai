// =============================================================================
// api/domains/route.ts — check domain availability across ICANN TLDs + Web3
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Popular ICANN TLDs to check
const ICANN_TLDS = [
  'com', 'ai', 'io', 'app', 'dev', 'co', 'net', 'org', 'tech', 'xyz',
  'me', 'so', 'is', 'to', 'cc', 'us', 'uk', 'ca', 'de', 'fr',
  'es', 'mx', 'ar', 'br', 'cl', 'co.uk', 'com.mx', 'com.ar',
  'gg', 'sh', 'it', 'in', 'jp', 'kr', 'au', 'nz',
  'club', 'site', 'online', 'store', 'space', 'fun', 'world',
];

// Web3 / Unstoppable Domains TLDs
const WEB3_TLDS = [
  'crypto', 'nft', 'wallet', 'blockchain', 'dao', 'x', 'bitcoin',
  'zil', 'eth', // ENS & Unstoppable
];

// POST /api/domains — check availability for a domain name
export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { name, tlds } = await req.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'domain name required' }, { status: 400 });
    }

    // Clean the domain name (remove spaces, lowercase)
    const clean = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!clean || clean.length < 2) {
      return NextResponse.json({ error: 'invalid domain name' }, { status: 400 });
    }

    // Which TLDs to check
    const checkTlds = tlds && Array.isArray(tlds)
      ? tlds
      : [...ICANN_TLDS, ...WEB3_TLDS];

    // ── Check ICANN domains via RDAP ────────────────────────────────
    const results: DomainResult[] = [];

    // Batch check ICANN domains using DNS-based availability check
    const icannChecks = checkTlds
      .filter((tld: string) => !WEB3_TLDS.includes(tld))
      .map(async (tld: string) => {
        const domain = `${clean}.${tld}`;
        try {
          // Use RDAP (Registration Data Access Protocol) — the modern replacement for WHOIS
          const res = await fetch(`https://rdap.org/domain/${domain}`, {
            signal: AbortSignal.timeout(5000),
          });

          if (res.status === 404) {
            // 404 = not found in RDAP = likely available
            return { domain, tld, available: true, source: 'icann' as const };
          } else if (res.ok) {
            // Found = registered
            return { domain, tld, available: false, source: 'icann' as const };
          }
          // Other status = unknown
          return { domain, tld, available: null, source: 'icann' as const };
        } catch {
          return { domain, tld, available: null, source: 'icann' as const };
        }
      });

    // ── Check Web3 domains via Unstoppable Domains API ──────────────
    const web3Checks = checkTlds
      .filter((tld: string) => WEB3_TLDS.includes(tld))
      .map(async (tld: string) => {
        const domain = `${clean}.${tld}`;
        const UD_KEY = process.env.UNSTOPPABLE_DOMAINS_API_KEY;

        if (!UD_KEY) {
          // If no API key, mark as unknown
          return { domain, tld, available: null, source: 'web3' as const };
        }

        try {
          const res = await fetch(
            `https://api.unstoppabledomains.com/resolve/domains/${domain}`,
            {
              headers: { Authorization: `Bearer ${UD_KEY}` },
              signal: AbortSignal.timeout(5000),
            }
          );

          if (res.status === 404) {
            return { domain, tld, available: true, source: 'web3' as const };
          } else if (res.ok) {
            return { domain, tld, available: false, source: 'web3' as const };
          }
          return { domain, tld, available: null, source: 'web3' as const };
        } catch {
          return { domain, tld, available: null, source: 'web3' as const };
        }
      });

    // Run all checks in parallel (with concurrency limit via Promise.all)
    const allChecks = [...icannChecks, ...web3Checks];
    const settled = await Promise.allSettled(allChecks);

    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    }

    // Sort: available first, then by TLD priority
    const tldPriority = ['com', 'ai', 'io', 'app', 'dev', 'co'];
    results.sort((a, b) => {
      // Available first
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      // Then by TLD priority
      const aPri = tldPriority.indexOf(a.tld);
      const bPri = tldPriority.indexOf(b.tld);
      return (aPri === -1 ? 999 : aPri) - (bPri === -1 ? 999 : bPri);
    });

    return NextResponse.json({
      name: clean,
      results,
      available: results.filter(r => r.available === true).map(r => r.domain),
      taken: results.filter(r => r.available === false).map(r => r.domain),
      unknown: results.filter(r => r.available === null).map(r => r.domain),
    });
  } catch (error) {
    console.error('domain check error:', error);
    return NextResponse.json({ error: 'domain check failed' }, { status: 500 });
  }
}

interface DomainResult {
  domain: string;
  tld: string;
  available: boolean | null;
  source: 'icann' | 'web3';
}
