'use client';

import { useEffect, useRef } from 'react';

// Flowing gradient background — smooth animated color blobs
export default function GradientBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const timeRef = useRef(0);

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

    // Gradient blobs
    const blobs = [
      { cx: 0.2, cy: 0.3, r: 0.5, color: [99, 102, 241], speed: 0.0004, phase: 0 },      // indigo
      { cx: 0.8, cy: 0.2, r: 0.45, color: [139, 92, 246], speed: 0.0005, phase: 1.5 },     // purple
      { cx: 0.5, cy: 0.7, r: 0.55, color: [59, 130, 246], speed: 0.0003, phase: 3 },        // blue
      { cx: 0.3, cy: 0.8, r: 0.4, color: [236, 72, 153], speed: 0.00045, phase: 4.5 },     // pink
      { cx: 0.7, cy: 0.5, r: 0.5, color: [14, 165, 233], speed: 0.00035, phase: 2 },       // sky
      { cx: 0.1, cy: 0.5, r: 0.35, color: [168, 85, 247], speed: 0.0006, phase: 5.5 },     // violet
    ];

    const animate = () => {
      timeRef.current += 1;
      const t = timeRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // Dark base
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, w, h);

      for (const b of blobs) {
        const x = (b.cx + Math.sin(t * b.speed + b.phase) * 0.15) * w;
        const y = (b.cy + Math.cos(t * b.speed * 0.8 + b.phase) * 0.12) * h;
        const r = b.r * Math.min(w, h);

        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${b.color[0]}, ${b.color[1]}, ${b.color[2]}, 0.3)`);
        grad.addColorStop(0.5, `rgba(${b.color[0]}, ${b.color[1]}, ${b.color[2]}, 0.1)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
