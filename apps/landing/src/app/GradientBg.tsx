'use client';

import { useEffect, useRef, useCallback } from 'react';

/*
  Light-focused ambient background. No heavy wave simulation.
  Just flowing color, drifting motes, and pointer glow.
  Runs smooth on any device.
*/

interface Mote {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; phase: number;
}

export default function GradientBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const tRef = useRef(0);
  const motesRef = useRef<Mote[]>([]);
  const ptrRef = useRef({
    x: 0.5, y: 0.5, active: false, str: 0,
  });

  const onMove = useCallback((e: MouseEvent | TouchEvent) => {
    const p = ptrRef.current;
    const cx = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    p.x = cx / window.innerWidth;
    p.y = cy / window.innerHeight;
    p.active = true;
    p.str = Math.min(p.str + 0.05, 1);
  }, []);

  const onLeave = useCallback(() => {
    ptrRef.current.active = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchend', onLeave);

    // Seed motes
    const motes = motesRef.current;
    if (motes.length === 0) {
      for (let i = 0; i < 45; i++) {
        motes.push({
          x: Math.random(), y: Math.random(),
          vx: (Math.random() - 0.5) * 0.00025,
          vy: (Math.random() - 0.5) * 0.00025,
          size: 1 + Math.random() * 2.5,
          alpha: 0.12 + Math.random() * 0.3,
          phase: Math.random() * 200,
        });
      }
    }

    // Color blobs — large soft radial gradients that drift slowly
    const blobs = [
      { cx: 0.2, cy: 0.3, r: 0.55, color: [60, 70, 180], speed: 0.0003, phase: 0 },
      { cx: 0.8, cy: 0.2, r: 0.5, color: [90, 50, 170], speed: 0.0004, phase: 1.5 },
      { cx: 0.5, cy: 0.7, r: 0.6, color: [30, 80, 180], speed: 0.00025, phase: 3 },
      { cx: 0.3, cy: 0.8, r: 0.45, color: [100, 40, 130], speed: 0.00035, phase: 4.5 },
      { cx: 0.7, cy: 0.5, r: 0.5, color: [20, 100, 170], speed: 0.0003, phase: 2 },
    ];

    const animate = () => {
      tRef.current += 1;
      const t = tRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const ptr = ptrRef.current;

      if (!ptr.active) ptr.str = Math.max(ptr.str - 0.01, 0);

      // --- Dark base ---
      ctx.fillStyle = '#060610';
      ctx.fillRect(0, 0, w, h);

      // --- Flowing color blobs ---
      for (const b of blobs) {
        let x = (b.cx + Math.sin(t * b.speed + b.phase) * 0.18) * w;
        let y = (b.cy + Math.cos(t * b.speed * 0.7 + b.phase) * 0.15) * h;
        let r = b.r * Math.min(w, h);
        let alpha = 0.25;

        // Pointer attracts blobs gently
        if (ptr.str > 0.01) {
          const dx = ptr.x * w - x;
          const dy = ptr.y * h - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const pull = ptr.str * 0.2 * Math.max(0, 1 - dist / (r * 1.8));
          x += dx * pull;
          y += dy * pull;
          r *= 1 + pull * 0.3;
          alpha += pull * 0.15;
        }

        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${b.color[0]}, ${b.color[1]}, ${b.color[2]}, ${alpha})`);
        grad.addColorStop(0.5, `rgba(${b.color[0]}, ${b.color[1]}, ${b.color[2]}, ${alpha * 0.3})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // --- Drifting light motes ---
      ctx.globalCompositeOperation = 'screen';
      const tSlow = t * 0.004;

      for (const m of motes) {
        m.x += m.vx + Math.sin(tSlow * 0.5 + m.phase) * 0.0002;
        m.y += m.vy + Math.cos(tSlow * 0.3 + m.phase * 0.7) * 0.00015;

        // Pointer pushes motes
        if (ptr.str > 0.01) {
          const ddx = m.x - ptr.x;
          const ddy = m.y - ptr.y;
          const dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < 0.18 && dd > 0.001) {
            const push = ptr.str * 0.002 * (1 - dd / 0.18);
            m.vx += (ddx / dd) * push;
            m.vy += (ddy / dd) * push;
          }
        }

        // Gentle drag so they don't fly off
        m.vx *= 0.995;
        m.vy *= 0.995;

        // Wrap
        if (m.x < -0.03) m.x = 1.03;
        if (m.x > 1.03) m.x = -0.03;
        if (m.y < -0.03) m.y = 1.03;
        if (m.y > 1.03) m.y = -0.03;

        const flicker = 0.65 + Math.sin(t * 0.02 + m.phase) * 0.35;
        ctx.globalAlpha = m.alpha * flicker;
        const glow = ctx.createRadialGradient(
          m.x * w, m.y * h, 0,
          m.x * w, m.y * h, m.size * 4
        );
        glow.addColorStop(0, 'rgba(200, 220, 255, 1)');
        glow.addColorStop(0.35, 'rgba(120, 160, 255, 0.45)');
        glow.addColorStop(1, 'rgba(50, 70, 180, 0)');
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * h, m.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // --- Pointer glow ---
      if (ptr.str > 0.01) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = ptr.str * 0.4;
        const gx = ptr.x * w;
        const gy = ptr.y * h;
        const gr = 140 + ptr.str * 60;
        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        glow.addColorStop(0, 'rgba(180, 200, 255, 0.35)');
        glow.addColorStop(0.3, 'rgba(100, 140, 240, 0.15)');
        glow.addColorStop(0.7, 'rgba(50, 70, 170, 0.04)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Reset
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
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
