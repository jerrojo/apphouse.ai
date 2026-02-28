import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'apphouse.ai — ai-powered app factory',
  description: 'describe your app. 9 ai agents design, build, and deploy it to web, ios, and android. from idea to app store in minutes.',
  metadataBase: new URL('https://apphouse.ai'),
  openGraph: {
    title: 'apphouse.ai — ai-powered app factory',
    description: 'describe your app. 9 ai agents design, build, and deploy it to web, ios, and android.',
    url: 'https://apphouse.ai',
    siteName: 'apphouse.ai',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'apphouse.ai — ai-powered app factory',
    description: 'describe your app. 9 ai agents build it. web + ios + android.',
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico' },
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
