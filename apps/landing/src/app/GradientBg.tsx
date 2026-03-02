'use client';

import { useEffect, useRef, useCallback } from 'react';

// Interactive flowing gradient background — reacts to mouse/touch
export default function GradientBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false, strength: 0 });

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    const p = pointerRef.current;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    p.x = clientX / window.innerWidth;
    p.y = clientY / window.innerHeight;
    p.active = true;
    p.strength = Math.min(p.strength + 0.08, 1);
  }, []);

  const handlePointerLeave = useCallback(() => {
    pointerRef.current.active = false;
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
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('touchend', handlePointerLeave);

    // Gradient blobs
    const blobs = [
      { cx: 0.2, cy: 0.3, r: 0.5, color: [99, 102, 241], speed: 0.0004, phase: 0 },
      { cx: 0.8, cy: 0.2, r: 0.45, color: [139, 92, 246], speed: 0.0005, phase: 1.5 },
      { cx: 0.5, cy: 0.7, r: 0.55, color: [59, 130, 246], speed: 0.0003, phase: 3 },
      { cx: 0.3, cy: 0.8, r: 0.4, color: [236, 72, 153], speed: 0.00045, phase: 4.5 },
      { cx: 0.7, cy: 0.5, r: 0.5, color: [14, 165, 233], speed: 0.00035, phase: 2 },
      { cx: 0.1, cy: 0.5, r: 0.35, color: [168, 85, 247], speed: 0.0006, phase: 5.5 },
    ];

    const animate = () => {
      timeRef.current += 1;
      const t = timeRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const ptr = pointerRef.current;

      // Decay pointer strength when not active
      if (!ptr.active) {
        ptr.strength = Math.max(ptr.strength - 0.015, 0);
      }

      // Dark base
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, w, h);

      for (const b of blobs) {
        // Base movement
        let x = (b.cx + Math.sin(t * b.speed + b.phase) * 0.15) * w;
        let y = (b.cy + Math.cos(t * b.speed * 0.8 + b.phase) * 0.12) * h;
        let r = b.r * Math.min(w, h);
        let opacity = 0.3;

        // React to pointer — blobs get attracted and swell
        if (ptr.strength > 0.01) {
          const pxW = ptr.x * w;
          const pyH = ptr.y * h;
          const dx = pxW - x;
          const dy = pyH - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const pull = ptr.strength * 0.3 * Math.max(0, 1 - dist / (r * 2));
          x += dx * pull;
          y += dy * pull;
          r *= 1 + pull * 0.4;
          opacity += pull * 0.25;
        }

        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${b.color[0]}, ${b.color[1]}, ${b.color[2]}, ${opacity})`);
        grad.addColorStop(0.5, `rgba(${b.color[0]}, ${b.color[1]}, ${b.color[2]}, ${opacity * 0.35})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Pointer glow — bright spot that follows the cursor/finger
      if (ptr.strength > 0.01) {
        const gx = ptr.x * w;
        const gy = ptr.y * h;
        const gr = 180 * ptr.strength;
        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        glow.addColorStop(0, `rgba(255, 255, 255, ${0.08 * ptr.strength})`);
        glow.addColorStop(0.4, `rgba(139, 92, 246, ${0.06 * ptr.strength})`);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('touchend', handlePointerLeave);
    };
  }, [handlePointerMove, handlePointerLeave]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
