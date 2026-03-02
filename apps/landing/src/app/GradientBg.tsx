'use client';

import { useEffect, useRef, useCallback } from 'react';

/*
  Deep space background — astronomically inspired, lightweight.

  Layers (all cheap compositing, no per-pixel work):
    1. Star field — pre-rendered once to offscreen canvas.
       Stars have realistic colors: blue-white (hot O/B), white (A),
       yellow (G/K like our Sun), orange-red (M dwarfs).
    2. Nebula clouds — soft radial gradient blobs in Hubble palette
       (Pillars of Creation, Carina, Orion).
    3. Cosmic dust motes — tiny luminous particles drifting on
       imperceptible currents.
    4. Shooting stars — rare bright streaks.
    5. Pointer = gravitational lens — light bends toward it,
       nebulae get pulled, motes orbit, a warm glow radiates.
*/

interface Star {
  x: number; y: number; size: number;
  r: number; g: number; b: number; alpha: number;
  twinkleSpeed: number; twinklePhase: number;
}

interface Mote {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; phase: number;
  r: number; g: number; b: number;
}

interface Streak {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number;
}

// Realistic star color by temperature class
function starColor(): [number, number, number] {
  const roll = Math.random();
  if (roll < 0.08) return [155, 176, 255];     // O/B — hot blue
  if (roll < 0.25) return [200, 215, 255];     // A — blue-white
  if (roll < 0.55) return [255, 244, 232];     // F/G — white/yellow-white
  if (roll < 0.80) return [255, 220, 180];     // K — warm yellow
  return [255, 190, 150];                       // M — orange-red dwarf
}

export default function GradientBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const tRef = useRef(0);
  const starsRef = useRef<Star[]>([]);
  const starCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const motesRef = useRef<Mote[]>([]);
  const streaksRef = useRef<Streak[]>([]);
  const ptrRef = useRef({ x: 0.5, y: 0.5, active: false, str: 0 });

  const onMove = useCallback((e: MouseEvent | TouchEvent) => {
    const p = ptrRef.current;
    const cx = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    p.x = cx / window.innerWidth;
    p.y = cy / window.innerHeight;
    p.active = true;
    p.str = Math.min(p.str + 0.04, 1);
  }, []);

  const onLeave = useCallback(() => {
    ptrRef.current.active = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;

    // --- Build static star field on offscreen canvas ---
    function buildStars() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;

      const area = w * h;
      const count = Math.floor(area / 1800); // ~600 stars on 1080p
      const stars: Star[] = [];

      for (let i = 0; i < count; i++) {
        const [r, g, b] = starColor();
        const sizeRoll = Math.random();
        // Most stars tiny, few bright
        const size = sizeRoll < 0.85 ? 0.4 + Math.random() * 0.8
                   : sizeRoll < 0.97 ? 1.0 + Math.random() * 1.2
                   : 1.8 + Math.random() * 1.5; // rare bright star
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          size, r, g, b,
          alpha: 0.3 + Math.random() * 0.7,
          twinkleSpeed: 0.008 + Math.random() * 0.025,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
      starsRef.current = stars;

      // Pre-render static part (non-twinkling base) to offscreen
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      starCanvasRef.current = offscreen;
    }
    buildStars();

    window.addEventListener('resize', buildStars);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchend', onLeave);

    // Seed cosmic dust motes
    const motes = motesRef.current;
    if (motes.length === 0) {
      for (let i = 0; i < 35; i++) {
        const warm = Math.random() > 0.5;
        motes.push({
          x: Math.random(), y: Math.random(),
          vx: (Math.random() - 0.5) * 0.00015,
          vy: (Math.random() - 0.5) * 0.00015,
          size: 1.5 + Math.random() * 3,
          alpha: 0.08 + Math.random() * 0.2,
          phase: Math.random() * 200,
          r: warm ? 200 + Math.random() * 55 : 140 + Math.random() * 60,
          g: warm ? 160 + Math.random() * 40 : 170 + Math.random() * 50,
          b: warm ? 120 + Math.random() * 40 : 220 + Math.random() * 35,
        });
      }
    }

    // Nebula blobs — Hubble-inspired palette
    const nebulae = [
      // Carina-like: warm amber/salmon glow
      { cx: 0.25, cy: 0.35, r: 0.5, color: [140, 60, 50], speed: 0.00025, phase: 0 },
      // Pillars of Creation: deep teal
      { cx: 0.75, cy: 0.25, r: 0.45, color: [30, 80, 110], speed: 0.0003, phase: 1.5 },
      // Orion-like: magenta/pink
      { cx: 0.5, cy: 0.65, r: 0.55, color: [110, 40, 100], speed: 0.0002, phase: 3 },
      // Eagle Nebula: blue-violet
      { cx: 0.2, cy: 0.75, r: 0.4, color: [50, 40, 120], speed: 0.00028, phase: 4 },
      // Rosette: warm gold dust
      { cx: 0.7, cy: 0.6, r: 0.45, color: [120, 80, 30], speed: 0.00022, phase: 2 },
    ];

    const animate = () => {
      tRef.current += 1;
      const t = tRef.current;
      const ptr = ptrRef.current;

      if (!ptr.active) ptr.str = Math.max(ptr.str - 0.008, 0);

      // --- Deep space black ---
      ctx.fillStyle = '#030308';
      ctx.fillRect(0, 0, w, h);

      // --- Nebula clouds ---
      for (const n of nebulae) {
        let x = (n.cx + Math.sin(t * n.speed + n.phase) * 0.12) * w;
        let y = (n.cy + Math.cos(t * n.speed * 0.6 + n.phase) * 0.1) * h;
        let r = n.r * Math.min(w, h);
        let alpha = 0.18;

        // Gravitational pull toward pointer
        if (ptr.str > 0.01) {
          const dx = ptr.x * w - x;
          const dy = ptr.y * h - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const pull = ptr.str * 0.15 * Math.max(0, 1 - dist / (r * 2));
          x += dx * pull;
          y += dy * pull;
          r *= 1 + pull * 0.2;
          alpha += pull * 0.1;
        }

        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${n.color[0]}, ${n.color[1]}, ${n.color[2]}, ${alpha})`);
        grad.addColorStop(0.4, `rgba(${n.color[0]}, ${n.color[1]}, ${n.color[2]}, ${alpha * 0.4})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // --- Stars with twinkle ---
      const stars = starsRef.current;
      for (const s of stars) {
        const twinkle = 0.5 + Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.5;
        const a = s.alpha * twinkle;
        if (a < 0.05) continue; // skip invisible

        // Gravitational lensing: stars near pointer shift slightly toward it
        let sx = s.x, sy = s.y;
        if (ptr.str > 0.01) {
          const dx = ptr.x * w - sx;
          const dy = ptr.y * h - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const lensRadius = 200 * ptr.str;
          if (dist < lensRadius) {
            const bend = ptr.str * 8 * (1 - dist / lensRadius);
            sx += (dx / dist) * bend;
            sy += (dy / dist) * bend;
          }
        }

        ctx.globalAlpha = a;
        if (s.size > 1.5) {
          // Bright stars get a soft glow
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.size * 4);
          glow.addColorStop(0, `rgba(${s.r}, ${s.g}, ${s.b}, 0.9)`);
          glow.addColorStop(0.3, `rgba(${s.r}, ${s.g}, ${s.b}, 0.2)`);
          glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.beginPath();
          ctx.arc(sx, sy, s.size * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }
        // Core dot
        ctx.beginPath();
        ctx.arc(sx, sy, s.size * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.r}, ${s.g}, ${s.b}, 1)`;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // --- Cosmic dust motes ---
      ctx.globalCompositeOperation = 'screen';
      const tSlow = t * 0.003;

      for (const m of motes) {
        m.x += m.vx + Math.sin(tSlow + m.phase) * 0.00012;
        m.y += m.vy + Math.cos(tSlow * 0.7 + m.phase * 0.6) * 0.0001;

        // Pointer gravity on motes
        if (ptr.str > 0.01) {
          const ddx = ptr.x - m.x;
          const ddy = ptr.y - m.y;
          const dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < 0.25 && dd > 0.01) {
            const pull = ptr.str * 0.0008 * (1 - dd / 0.25);
            m.vx += (ddx / dd) * pull;
            m.vy += (ddy / dd) * pull;
          }
        }

        m.vx *= 0.997;
        m.vy *= 0.997;

        if (m.x < -0.03) m.x = 1.03;
        if (m.x > 1.03) m.x = -0.03;
        if (m.y < -0.03) m.y = 1.03;
        if (m.y > 1.03) m.y = -0.03;

        const flicker = 0.6 + Math.sin(t * 0.015 + m.phase) * 0.4;
        ctx.globalAlpha = m.alpha * flicker;
        const glow = ctx.createRadialGradient(
          m.x * w, m.y * h, 0, m.x * w, m.y * h, m.size * 4
        );
        glow.addColorStop(0, `rgba(${m.r}, ${m.g}, ${m.b}, 0.9)`);
        glow.addColorStop(0.4, `rgba(${m.r}, ${m.g}, ${m.b}, 0.3)`);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * h, m.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // --- Shooting stars ---
      const streaks = streaksRef.current;
      // Spawn rarely
      if (Math.random() < 0.003 && streaks.length < 2) {
        const angle = -0.3 - Math.random() * 0.5; // mostly upper-left to lower-right
        const speed = 3 + Math.random() * 5;
        streaks.push({
          x: Math.random() * w * 0.8,
          y: Math.random() * h * 0.4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 30 + Math.random() * 40,
          size: 1 + Math.random() * 1.5,
        });
      }
      for (let i = streaks.length - 1; i >= 0; i--) {
        const s = streaks[i];
        s.x += s.vx;
        s.y -= s.vy;
        s.life++;
        if (s.life > s.maxLife || s.x > w || s.y < 0 || s.y > h) {
          streaks.splice(i, 1);
          continue;
        }
        const progress = s.life / s.maxLife;
        const fade = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
        ctx.globalAlpha = fade * 0.8;

        // Streak trail
        const tailLen = 30 + s.size * 10;
        const grad = ctx.createLinearGradient(
          s.x, s.y, s.x - s.vx * tailLen / 5, s.y + s.vy * tailLen / 5
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.3, 'rgba(180, 200, 255, 0.4)');
        grad.addColorStop(1, 'rgba(100, 140, 255, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * tailLen / 5, s.y + s.vy * tailLen / 5);
        ctx.stroke();

        // Bright head
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${fade})`;
        ctx.fill();
      }

      // --- Pointer glow — warm gravitational lens light ---
      if (ptr.str > 0.01) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = ptr.str * 0.3;
        const gx = ptr.x * w;
        const gy = ptr.y * h;
        const gr = 120 + ptr.str * 50;
        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        glow.addColorStop(0, 'rgba(200, 180, 255, 0.3)');
        glow.addColorStop(0.3, 'rgba(140, 120, 200, 0.12)');
        glow.addColorStop(0.6, 'rgba(80, 60, 150, 0.04)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', buildStars);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('touchend', onLeave);
    };
  }, [onMove, onLeave]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
