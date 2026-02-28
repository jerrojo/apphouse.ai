import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '{{APP_NAME}}',
  description: '{{APP_NAME}} — powered by apphouse.ai',
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
