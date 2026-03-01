import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'apphouse — ai-powered app factory',
  description: 'describe your app. 10 ai agents design, build, and deploy it to web, ios, and android. from idea to app store in minutes.',
  metadataBase: new URL('https://apphouse.ai'),
  openGraph: {
    title: 'apphouse — ai-powered app factory',
    description: 'describe your app. 10 ai agents design, build, and deploy it to web, ios, and android.',
    url: 'https://apphouse.ai',
    siteName: 'apphouse',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'apphouse — ai-powered app factory',
    description: 'describe your app. 10 ai agents build it. web + ios + android.',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
