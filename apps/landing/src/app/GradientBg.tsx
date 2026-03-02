'use client';

import { useEffect, useRef, useCallback } from 'react';

/*
  Fluid interactive background — water, air, waves, light.
  Layers:
    1. Deep flowing color currents (slow sine waves of color)
    2. Caustic light mesh (the dancing diamond-light you see through water)
    3. Ripples that radiate from pointer contact
    4. Drifting light particles (like dust motes in a sunbeam)
*/

interface Ripple {
  x: number; y: number; birth: number; strength: number;
}

interface Mote {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; drift: number; phase: number;
}

export default function GradientBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const tRef = useRef(0);
  const ptrRef = useRef({ x: 0.5, y: 0.5, px: 0.5, py: 0.5, active: false, str: 0 });
  const ripplesRef = useRef<Ripple[]>([]);
  const motesRef = useRef<Mote[]>([]);

  const onMove = useCallback((e: MouseEvent | TouchEvent) => {
    const p = ptrRef.current;
    const cx = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    p.px = p.x; p.py = p.y;
    p.x = cx / window.innerWidth;
    p.y = cy / window.innerHeight;
    p.active = true;
    p.str = Math.min(p.str + 0.06, 1);

    // Spawn ripple on movement
    const now = tRef.current;
    const ripples = ripplesRef.current;
    if (ripples.length === 0 || now - ripples[ripples.length - 1].birth > 12) {
      ripples.push({ x: p.x, y: p.y, birth: now, strength: 0.6 + p.str * 0.4 });
      if (ripples.length > 20) ripples.shift();
    }
  }, []);

  const onLeave = useCallback(() => { ptrRef.current.active = false; }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchend', onLeave);

    // Seed light motes
    const motes = motesRef.current;
    if (motes.length === 0) {
      for (let i = 0; i < 60; i++) {
        motes.push({
          x: Math.random(), y: Math.random(),
          vx: (Math.random() - 0.5) * 0.0003,
          vy: (Math.random() - 0.5) * 0.0003,
          size: 1 + Math.random() * 2.5,
          alpha: 0.15 + Math.random() * 0.35,
          drift: Math.random() * Math.PI * 2,
          phase: Math.random() * 100,
        });
      }
    }

    const animate = () => {
      tRef.current += 1;
      const t = tRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const ptr = ptrRef.current;
      const ripples = ripplesRef.current;

      if (!ptr.active) ptr.str = Math.max(ptr.str - 0.008, 0);

      // --- Layer 0: deep dark base ---
      ctx.fillStyle = '#060610';
      ctx.fillRect(0, 0, w, h);

      // --- Layer 1: flowing color currents (large sine wave bands) ---
      const imgData = ctx.createImageData(w, h);
      const d = imgData.data;
      const invW = 1 / w;
      const invH = 1 / h;
      const tSlow = t * 0.008;
      const tMed = t * 0.012;

      // Sample every 3px for performance, fill neighbors
      const step = 3;
      for (let y = 0; y < h; y += step) {
        const ny = y * invH;
        for (let x = 0; x < w; x += step) {
          const nx = x * invW;

          // Layered waves
          const wave1 = Math.sin(nx * 3.5 + tSlow + Math.sin(ny * 2.1 + tSlow * 0.7) * 1.5);
          const wave2 = Math.sin(ny * 4.0 - tMed + Math.cos(nx * 1.8 + tMed * 0.5) * 1.2);
          const wave3 = Math.sin((nx + ny) * 2.5 + tSlow * 0.6);

          // Pointer disturbance — waves bend around the cursor
          let disturb = 0;
          if (ptr.str > 0.01) {
            const ddx = nx - ptr.x;
            const ddy = ny - ptr.y;
            const dd = Math.sqrt(ddx * ddx + ddy * ddy);
            disturb = ptr.str * 0.7 * Math.exp(-dd * dd * 8);
          }

          // Ripple displacement
          let rippleVal = 0;
          for (let i = ripples.length - 1; i >= 0; i--) {
            const rp = ripples[i];
            const age = (t - rp.birth) * 0.02;
            if (age > 3) { ripples.splice(i, 1); continue; }
            const rdx = nx - rp.x;
            const rdy = ny - rp.y;
            const rd = Math.sqrt(rdx * rdx + rdy * rdy);
            const ring = Math.sin((rd - age * 0.3) * 35) * Math.exp(-rd * 6) * Math.exp(-age * 1.2) * rp.strength;
            rippleVal += ring;
          }

          const combined = wave1 * 0.35 + wave2 * 0.3 + wave3 * 0.2 + disturb + rippleVal * 0.6;

          // Color palette: deep ocean blues → violet → teal → soft white light
          const r = Math.max(0, Math.min(255,
            20 + (combined + 1) * 25 + Math.max(0, combined - 0.3) * 80 + rippleVal * 120
          ));
          const g = Math.max(0, Math.min(255,
            12 + (combined + 1) * 20 + Math.max(0, combined) * 50 + rippleVal * 80
          ));
          const b = Math.max(0, Math.min(255,
            40 + (combined + 1) * 55 + Math.max(0, combined - 0.1) * 60 + rippleVal * 100
          ));

          // Fill the step×step block
          for (let dy = 0; dy < step && y + dy < h; dy++) {
            for (let dx = 0; dx < step && x + dx < w; dx++) {
              const idx = ((y + dy) * w + (x + dx)) * 4;
              d[idx] = r;
              d[idx + 1] = g;
              d[idx + 2] = b;
              d[idx + 3] = 255;
            }
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // --- Layer 2: caustic light mesh ---
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.12 + ptr.str * 0.06;
      const causticT = t * 0.006;
      const cellSize = 90;
      for (let cy = -cellSize; cy < h + cellSize; cy += cellSize) {
        for (let cx = -cellSize; cx < w + cellSize; cx += cellSize) {
          const offX = Math.sin(causticT + cy * 0.008 + cx * 0.003) * 30;
          const offY = Math.cos(causticT * 0.8 + cx * 0.006) * 25;
          const px = cx + offX;
          const py = cy + offY;

          // Pointer warps caustics
          if (ptr.str > 0.01) {
            const ddx = (px / w) - ptr.x;
            const ddy = (py / h) - ptr.y;
            const dd = ddx * ddx + ddy * ddy;
            const warp = ptr.str * 25 * Math.exp(-dd * 12);
            const angle = Math.atan2(ddy, ddx);
            ctx.beginPath();
            ctx.arc(px + Math.cos(angle) * warp, py + Math.sin(angle) * warp, 2 + warp * 0.2, 0, Math.PI * 2);
          } else {
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
          }
          ctx.fillStyle = `rgba(160, 200, 255, ${0.3 + Math.sin(causticT + cx * 0.01 + cy * 0.01) * 0.2})`;
          ctx.fill();
        }
      }

      // Caustic connecting lines (like light refracting through water)
      ctx.globalAlpha = 0.04 + ptr.str * 0.03;
      ctx.strokeStyle = 'rgba(140, 180, 255, 0.5)';
      ctx.lineWidth = 0.5;
      for (let cy = 0; cy < h; cy += cellSize) {
        ctx.beginPath();
        for (let cx = 0; cx <= w; cx += 20) {
          const yOff = Math.sin(causticT + cx * 0.005 + cy * 0.003) * 20
                     + Math.sin(causticT * 1.3 + cx * 0.008) * 12;
          if (cx === 0) ctx.moveTo(cx, cy + yOff);
          else ctx.lineTo(cx, cy + yOff);
        }
        ctx.stroke();
      }

      // --- Layer 3: drifting light motes ---
      ctx.globalCompositeOperation = 'screen';
      for (const m of motes) {
        // Drift with subtle current
        const current = Math.sin(tSlow * 0.5 + m.phase) * 0.0002;
        m.x += m.vx + current;
        m.y += m.vy + Math.cos(tSlow * 0.3 + m.drift) * 0.0001;

        // Pointer pushes motes gently
        if (ptr.str > 0.01) {
          const ddx = m.x - ptr.x;
          const ddy = m.y - ptr.y;
          const dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < 0.2) {
            const push = ptr.str * 0.002 * (1 - dd / 0.2);
            m.x += ddx / dd * push;
            m.y += ddy / dd * push;
          }
        }

        // Wrap around
        if (m.x < -0.02) m.x = 1.02;
        if (m.x > 1.02) m.x = -0.02;
        if (m.y < -0.02) m.y = 1.02;
        if (m.y > 1.02) m.y = -0.02;

        const flicker = 0.7 + Math.sin(t * 0.03 + m.phase) * 0.3;
        ctx.globalAlpha = m.alpha * flicker;
        const glow = ctx.createRadialGradient(m.x * w, m.y * h, 0, m.x * w, m.y * h, m.size * 3);
        glow.addColorStop(0, 'rgba(200, 220, 255, 1)');
        glow.addColorStop(0.5, 'rgba(140, 170, 255, 0.4)');
        glow.addColorStop(1, 'rgba(80, 100, 200, 0)');
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * h, m.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // --- Layer 4: pointer light — soft warm glow trailing the finger ---
      if (ptr.str > 0.01) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = ptr.str * 0.4;
        const gx = ptr.x * w;
        const gy = ptr.y * h;
        const gr = 120 + ptr.str * 80;
        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        glow.addColorStop(0, 'rgba(180, 200, 255, 0.35)');
        glow.addColorStop(0.3, 'rgba(100, 140, 240, 0.15)');
        glow.addColorStop(0.7, 'rgba(60, 80, 180, 0.05)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Reset composite
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
