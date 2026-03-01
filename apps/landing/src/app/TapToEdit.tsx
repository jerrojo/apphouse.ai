'use client';

import { useState, useCallback, useRef } from 'react';

interface TapToEditProps {
  active: boolean;
  onTap: (position: { x: number; y: number }) => void;
  locale?: 'es' | 'en';
}

interface TapMarker {
  x: number;
  y: number;
  id: number;
}

export default function TapToEdit({ active, onTap, locale = 'en' }: TapToEditProps) {
  const [markers, setMarkers] = useState<TapMarker[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  const labels = locale === 'es'
    ? { hint: 'toca donde quieras hacer un cambio', active: 'modo edición activo' }
    : { hint: 'tap where you want to make a change', active: 'edit mode active' };

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!active || !overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const marker: TapMarker = { x, y, id: Date.now() };
    setMarkers(prev => [...prev.slice(-4), marker]); // keep last 5

    // Fade out after 3 seconds
    setTimeout(() => {
      setMarkers(prev => prev.filter(m => m.id !== marker.id));
    }, 3000);

    onTap({ x, y });
  }, [active, onTap]);

  if (!active) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleClick}
      className="absolute inset-0 z-20 cursor-crosshair"
      style={{ background: 'rgba(59, 130, 246, 0.03)' }}
    >
      {/* Active indicator */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-medium flex items-center gap-2 shadow-lg animate-pulse">
        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
        {labels.hint}
      </div>

      {/* Tap markers */}
      {markers.map((m) => (
        <div
          key={m.id}
          className="absolute pointer-events-none"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Ripple effect */}
          <span className="absolute inset-0 w-12 h-12 -ml-6 -mt-6 rounded-full bg-blue-400 opacity-30 animate-ping" />
          {/* Dot */}
          <span className="relative block w-4 h-4 -ml-2 -mt-2 rounded-full bg-blue-600 border-2 border-white shadow-lg" />
          {/* Coordinates label */}
          <span className="absolute top-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
            {m.x}%, {m.y}%
          </span>
        </div>
      ))}
    </div>
  );
}
