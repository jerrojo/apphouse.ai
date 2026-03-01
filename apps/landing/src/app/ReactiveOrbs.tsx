'use client';

import { useEffect, useRef, useCallback } from 'react';

// Reactive floating orbs that respond to mouse movement
export default function ReactiveOrbs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const orbsRef = useRef<Orb[]>([]);
  const rafRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    };
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
    window.addEventListener('mousemove', handleMouseMove);

    // Create orbs
    const colors = [
      'rgba(59, 130, 246, 0.15)',   // blue
      'rgba(139, 92, 246, 0.12)',    // purple
      'rgba(236, 72, 153, 0.10)',    // pink
      'rgba(14, 165, 233, 0.12)',    // sky
      'rgba(99, 102, 241, 0.10)',    // indigo
    ];
    orbsRef.current = colors.map((color, i) => new Orb(
      canvas.width, canvas.height, color, i,
    ));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouse = mouseRef.current;
      for (const orb of orbsRef.current) {
        orb.update(mouse, canvas.width, canvas.height);
        orb.draw(ctx);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}

class Orb {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  phase: number;
  speed: number;

  constructor(w: number, h: number, color: string, index: number) {
    this.baseX = (0.2 + Math.random() * 0.6) * w;
    this.baseY = (0.2 + Math.random() * 0.6) * h;
    this.x = this.baseX;
    this.y = this.baseY;
    this.radius = 150 + Math.random() * 200;
    this.color = color;
    this.vx = 0;
    this.vy = 0;
    this.phase = index * 1.3;
    this.speed = 0.003 + Math.random() * 0.004;
  }

  update(mouse: { x: number; y: number }, w: number, h: number) {
    this.phase += this.speed;

    // Gentle autonomous float
    const floatX = Math.sin(this.phase) * 80;
    const floatY = Math.cos(this.phase * 0.7) * 60;

    // React to mouse — subtle push/pull
    const targetX = this.baseX + floatX + (mouse.x - 0.5) * w * 0.08;
    const targetY = this.baseY + floatY + (mouse.y - 0.5) * h * 0.08;

    // Smooth lerp
    this.x += (targetX - this.x) * 0.02;
    this.y += (targetY - this.y) * 0.02;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius,
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}
