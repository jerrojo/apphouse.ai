'use client';

import { useState, useMemo } from 'react';
import { detectLocale } from '@/lib/i18n';
import ChatBar from '../../ChatBar';
import TapToEdit from '../../TapToEdit';

interface AppData {
  id: string;
  slug: string;
  name: string;
  status: string;
  published_status: string | null;
  published_url: string | null;
  vercel_deployment_id: string | null;
  icon_url: string | null;
  description: string | null;
}

interface PreviewClientProps {
  app: AppData;
}

export default function PreviewClient({ app }: PreviewClientProps) {
  const [editMode, setEditMode] = useState(false);
  const [editTarget, setEditTarget] = useState<{ x: number; y: number } | null>(null);
  const locale = useMemo(() => detectLocale(), []);

  const isPublished = app.published_status === 'published';
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    cooking: 'bg-yellow-100 text-yellow-700',
    live: 'bg-green-100 text-green-700',
    paused: 'bg-orange-100 text-orange-700',
    archived: 'bg-red-100 text-red-600',
  };

  const labels = locale === 'es'
    ? { edit: 'editar', editing: 'editando', back: '← atrás', publish: 'publicar →', viewLive: 'ver en vivo ↗', preview: 'preview' }
    : { edit: 'edit', editing: 'editing', back: '← back', publish: 'publish →', viewLive: 'view live ↗', preview: 'preview' };

  const handleTap = (pos: { x: number; y: number }) => {
    setEditTarget(pos);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-yellow-900 px-4 py-2 flex items-center justify-between text-sm font-medium">
        <div className="flex items-center gap-3">
          <span className="bg-yellow-500 text-yellow-100 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
            {labels.preview}
          </span>
          <span className="font-semibold">{app.name}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status] || 'bg-gray-100 text-gray-600'}`}>
            {app.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Edit mode toggle */}
          <button
            onClick={() => { setEditMode(!editMode); if (editMode) setEditTarget(null); }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              editMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-yellow-500 text-yellow-900 hover:bg-yellow-600'
            }`}
          >
            {editMode ? `✏️ ${labels.editing}` : `✏️ ${labels.edit}`}
          </button>

          {isPublished && app.published_url && (
            <a
              href={app.published_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
            >
              {labels.viewLive}
            </a>
          )}
          {!isPublished && app.status === 'live' && (
            <form action="/api/publish" method="POST">
              <input type="hidden" name="appId" value={app.id} />
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                {labels.publish}
              </button>
            </form>
          )}
          <a
            href="/"
            className="px-3 py-1 bg-yellow-500 text-yellow-900 rounded-md text-xs font-medium hover:bg-yellow-600 transition-colors"
          >
            {labels.back}
          </a>
        </div>
      </div>

      {/* App preview area */}
      <div className="pt-10" style={{ paddingBottom: '80px' }}>
        {app.vercel_deployment_id ? (
          <div className="relative" style={{ height: 'calc(100vh - 120px)' }}>
            <iframe
              src={app.published_url || `https://${app.slug}-apphouse.vercel.app`}
              className="w-full h-full border-none"
              title={`Preview: ${app.name}`}
              allow="camera; microphone; geolocation; fullscreen"
              style={{ pointerEvents: editMode ? 'none' : 'auto' }}
            />
            {/* Tap-to-edit overlay */}
            <TapToEdit active={editMode} onTap={handleTap} locale={locale} />
          </div>
        ) : (
          /* No deployment yet — show status card */
          <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 120px)' }}>
            <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center">
              <div className="text-4xl mb-4">{app.icon_url || '🚀'}</div>
              <h2 className="text-xl font-bold text-gray-900">{app.name}</h2>
              {app.description && (
                <p className="mt-2 text-gray-500 text-sm">{app.description}</p>
              )}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">status</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status] || 'bg-gray-100'}`}>
                    {app.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">publish</span>
                  <span className="text-gray-400">
                    {isPublished ? `${app.slug}.apphouse.ai` : 'not published'}
                  </span>
                </div>
              </div>
              {app.status === 'draft' && (
                <p className="mt-6 text-xs text-gray-400">
                  {locale === 'es'
                    ? 'tu pipeline de app aún no ha empezado. el preview estará disponible cuando los agentes empiecen a cocinar.'
                    : "your app pipeline hasn't started yet. preview will be available once the agents begin cooking."}
                </p>
              )}
              {app.status === 'cooking' && (
                <p className="mt-6 text-xs text-gray-400">
                  {locale === 'es'
                    ? 'los agentes están trabajando en tu app. el preview se actualizará cuando terminen.'
                    : 'agents are working on your app. preview will update as they complete.'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat bar — always visible at bottom */}
      <ChatBar
        appId={app.id}
        appSlug={app.slug}
        locale={locale}
        editTarget={editTarget}
        onClearEditTarget={() => setEditTarget(null)}
      />
    </div>
  );
}
