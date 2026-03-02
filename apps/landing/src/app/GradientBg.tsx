'use client';

import { useEffect, useRef, useCallback } from 'react';

/*
  Fluid simulation background.

  Core: 2D wave equation on a grid.
  The wave field propagates realistically — ripples spread, reflect off edges,
  interfere with each other. Pointer disturbs the surface. Ambient rain and
  breathing currents keep it alive even without interaction.

  Rendering layers:
    1. Base color field — deep ocean palette modulated by wave height
    2. Refraction shift — wave gradient displaces color sampling (caustic effect)
    3. Light caustic mesh — bright spots where waves focus light
    4. Drifting luminous motes — pushed by wave velocity
    5. Pointer glow — warm light follows touch
*/

const G = 180;            // Wave grid resolution
const DAMP = 0.988;       // Energy loss per frame (lower = calmer)
const C2 = 0.42;          // Wave speed squared
const STEP = 3;           // Pixel render step (perf)

interface Mote {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; phase: number;
}

export default function GradientBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const tRef = useRef(0);
  const buf0 = useRef(new Float32Array(G * G)); // current wave
  const buf1 = useRef(new Float32Array(G * G)); // previous wave
  const motesRef = useRef<Mote[]>([]);
  const ptrRef = useRef({
    x: -1, y: -1, px: -1, py: -1,
    active: false, str: 0, vel: 0,
  });

  const onMove = useCallback((e: MouseEvent | TouchEvent) => {
    const p = ptrRef.current;
    const cx = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    p.px = p.x; p.py = p.y;
    p.x = cx / window.innerWidth;
    p.y = cy / window.innerHeight;
    p.active = true;
    const dx = p.x - p.px;
    const dy = p.y - p.py;
    p.vel = Math.min(Math.sqrt(dx * dx + dy * dy), 0.1);
    p.str = Math.min(p.str + 0.06, 1);
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
      for (let i = 0; i < 50; i++) {
        motes.push({
          x: Math.random(), y: Math.random(),
          vx: (Math.random() - 0.5) * 0.0002,
          vy: (Math.random() - 0.5) * 0.0002,
          size: 1.2 + Math.random() * 2,
          alpha: 0.15 + Math.random() * 0.3,
          phase: Math.random() * 200,
        });
      }
    }

    // ---- helpers ----
    // Drop a disturbance into the wave field
    function drop(gx: number, gy: number, radius: number, force: number) {
      const cur = buf0.current;
      const r = Math.ceil(radius);
      for (let dy = -r; dy <= r; dy++) {
        const jj = Math.round(gy) + dy;
        if (jj < 1 || jj >= G - 1) continue;
        for (let dx = -r; dx <= r; dx++) {
          const ii = Math.round(gx) + dx;
          if (ii < 1 || ii >= G - 1) continue;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < radius) {
            // Smooth bell curve
            const s = 1 - d / radius;
            cur[jj * G + ii] += force * s * s;
          }
        }
      }
    }

    // Sample wave height with bilinear interpolation
    function sample(buf: Float32Array, fx: number, fy: number): number {
      const x = fx * (G - 1);
      const y = fy * (G - 1);
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const x1 = Math.min(x0 + 1, G - 1);
      const y1 = Math.min(y0 + 1, G - 1);
      const sx = x - x0;
      const sy = y - y0;
      return (
        buf[y0 * G + x0] * (1 - sx) * (1 - sy) +
        buf[y0 * G + x1] * sx * (1 - sy) +
        buf[y1 * G + x0] * (1 - sx) * sy +
        buf[y1 * G + x1] * sx * sy
      );
    }

    // ---- main loop ----
    const animate = () => {
      tRef.current += 1;
      const t = tRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const ptr = ptrRef.current;

      if (!ptr.active) {
        ptr.str = Math.max(ptr.str - 0.008, 0);
        ptr.vel *= 0.92;
      }

      // -- Ambient life: gentle breathing + occasional rain drops --
      // Slow breathing disturbance
      if (t % 8 === 0) {
        const bx = (0.5 + Math.sin(t * 0.003) * 0.35) * G;
        const by = (0.5 + Math.cos(t * 0.0025) * 0.35) * G;
        drop(bx, by, 8, 0.15 * Math.sin(t * 0.005));
      }
      // A second breathing source, offset
      if (t % 12 === 0) {
        const bx = (0.5 + Math.cos(t * 0.002 + 2) * 0.3) * G;
        const by = (0.5 + Math.sin(t * 0.0018 + 1) * 0.3) * G;
        drop(bx, by, 6, 0.1 * Math.cos(t * 0.004));
      }
      // Random rain drops
      if (Math.random() < 0.03) {
        drop(
          5 + Math.random() * (G - 10),
          5 + Math.random() * (G - 10),
          2 + Math.random() * 3,
          0.2 + Math.random() * 0.3
        );
      }

      // -- Pointer disturbance --
      if (ptr.str > 0.01 && ptr.x >= 0 && ptr.y >= 0) {
        const gx = ptr.x * (G - 1);
        const gy = ptr.y * (G - 1);
        const force = (0.4 + ptr.vel * 15) * ptr.str;
        const rad = 3 + ptr.vel * 25;
        drop(gx, gy, rad, force);
      }

      // -- Wave equation propagation --
      const cur = buf0.current;
      const prev = buf1.current;
      const next = new Float32Array(G * G);
      for (let j = 1; j < G - 1; j++) {
        for (let i = 1; i < G - 1; i++) {
          const idx = j * G + i;
          const lap = cur[idx - 1] + cur[idx + 1]
                    + cur[(j - 1) * G + i] + cur[(j + 1) * G + i]
                    - 4 * cur[idx];
          next[idx] = 2 * cur[idx] - prev[idx] + C2 * lap;
          next[idx] *= DAMP;
        }
      }
      // Reflecting boundaries (copy neighbor)
      for (let i = 0; i < G; i++) {
        next[i] = next[G + i];                       // top
        next[(G - 1) * G + i] = next[(G - 2) * G + i]; // bottom
        next[i * G] = next[i * G + 1];               // left
        next[i * G + G - 1] = next[i * G + G - 2];   // right
      }
      buf1.current = cur;
      buf0.current = next;

      // -- Render pixel field --
      const imgData = ctx.createImageData(w, h);
      const px = imgData.data;
      const invW = 1 / w;
      const invH = 1 / h;
      const tSlow = t * 0.004;

      for (let y = 0; y < h; y += STEP) {
        const ny = y * invH;
        for (let x = 0; x < w; x += STEP) {
          const nx = x * invW;

          // Wave height at this point
          const wh = sample(next, nx, ny);

          // Wave gradient (for refraction / caustic direction)
          const whR = sample(next, Math.min(nx + 0.005, 1), ny);
          const whD = sample(next, nx, Math.min(ny + 0.005, 1));
          const gdx = (whR - wh) * 8;
          const gdy = (whD - wh) * 8;

          // Slow ambient color drift (so it's not static)
          const drift1 = Math.sin(nx * 2.5 + tSlow + ny * 1.5) * 0.5 + 0.5;
          const drift2 = Math.sin(ny * 3.0 - tSlow * 0.7 + nx * 2.0) * 0.5 + 0.5;

          // Base color: deep dark blues/indigos with slow drift
          // Wave height brightens crests, darkens troughs
          const bright = 1 + wh * 2.5; // wave modulation
          const caustic = Math.max(0, (gdx * gdx + gdy * gdy) * 40); // focused light

          const r = Math.max(0, Math.min(255,
            (8 + drift1 * 15 + drift2 * 8) * bright + caustic * 70
          ));
          const g = Math.max(0, Math.min(255,
            (6 + drift1 * 10 + drift2 * 12) * bright + caustic * 90
          ));
          const b = Math.max(0, Math.min(255,
            (25 + drift1 * 35 + drift2 * 25) * bright + caustic * 120
          ));

          // Fill STEP×STEP block
          for (let dy = 0; dy < STEP && y + dy < h; dy++) {
            for (let dx = 0; dx < STEP && x + dx < w; dx++) {
              const idx = ((y + dy) * w + (x + dx)) * 4;
              px[idx] = r;
              px[idx + 1] = g;
              px[idx + 2] = b;
              px[idx + 3] = 255;
            }
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // -- Caustic light lines (wave-driven) --
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = 'rgba(160, 200, 255, 0.6)';
      ctx.lineWidth = 0.7;
      const lineSpacing = 60;
      for (let row = 0; row < h; row += lineSpacing) {
        ctx.beginPath();
        for (let col = 0; col <= w; col += 12) {
          const nx2 = col * invW;
          const ny2 = row * invH;
          const wh2 = sample(next, nx2, ny2);
          const yy = row + wh2 * 40;
          if (col === 0) ctx.moveTo(col, yy);
          else ctx.lineTo(col, yy);
        }
        ctx.stroke();
      }
      // Vertical lines too for a mesh feel
      for (let col = 0; col < w; col += lineSpacing) {
        ctx.beginPath();
        for (let row = 0; row <= h; row += 12) {
          const nx2 = col * invW;
          const ny2 = row * invH;
          const wh2 = sample(next, nx2, ny2);
          const xx = col + wh2 * 40;
          if (row === 0) ctx.moveTo(xx, row);
          else ctx.lineTo(xx, row);
        }
        ctx.stroke();
      }

      // -- Light motes --
      ctx.globalCompositeOperation = 'screen';
      for (const m of motes) {
        // Get wave velocity at mote position to push it
        const wHere = sample(next, m.x, m.y);
        const wRight = sample(next, Math.min(m.x + 0.01, 1), m.y);
        const wDown = sample(next, m.x, Math.min(m.y + 0.01, 1));
        const wdx = (wRight - wHere) * 0.003;
        const wdy = (wDown - wHere) * 0.003;

        m.vx = m.vx * 0.98 + wdx;
        m.vy = m.vy * 0.98 + wdy;
        m.x += m.vx + Math.sin(tSlow * 0.5 + m.phase) * 0.00015;
        m.y += m.vy + Math.cos(tSlow * 0.3 + m.phase * 0.7) * 0.00012;

        // Pointer repels motes softly
        if (ptr.str > 0.01) {
          const ddx = m.x - ptr.x;
          const ddy = m.y - ptr.y;
          const dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < 0.15 && dd > 0.001) {
            const push = ptr.str * 0.0015 * (1 - dd / 0.15);
            m.vx += (ddx / dd) * push;
            m.vy += (ddy / dd) * push;
          }
        }

        // Wrap
        if (m.x < -0.03) m.x = 1.03;
        if (m.x > 1.03) m.x = -0.03;
        if (m.y < -0.03) m.y = 1.03;
        if (m.y > 1.03) m.y = -0.03;

        const flicker = 0.6 + Math.sin(t * 0.025 + m.phase) * 0.4;
        // Motes brighten on wave crests
        const lift = Math.max(0, wHere * 3);
        ctx.globalAlpha = Math.min(1, (m.alpha + lift * 0.3) * flicker);
        const glow = ctx.createRadialGradient(
          m.x * w, m.y * h, 0,
          m.x * w, m.y * h, m.size * (3 + lift * 2)
        );
        glow.addColorStop(0, 'rgba(210, 230, 255, 1)');
        glow.addColorStop(0.4, 'rgba(120, 160, 255, 0.5)');
        glow.addColorStop(1, 'rgba(60, 80, 180, 0)');
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * h, m.size * (3 + lift * 2), 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // -- Pointer glow --
      if (ptr.str > 0.01 && ptr.x >= 0) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = ptr.str * 0.35;
        const gx = ptr.x * w;
        const gy = ptr.y * h;
        const gr = 100 + ptr.vel * 400 + ptr.str * 60;
        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        glow.addColorStop(0, 'rgba(200, 220, 255, 0.4)');
        glow.addColorStop(0.25, 'rgba(100, 150, 250, 0.2)');
        glow.addColorStop(0.6, 'rgba(50, 70, 180, 0.06)');
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
