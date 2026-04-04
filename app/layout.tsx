import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { Toaster } from '@/components/ui/sonner';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'Week Planner',
    template: '%s — Week Planner',
  },
  description: 'Drag-and-drop weekly time planner with AI scheduling, goals, and analytics',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Week Planner',
    startupImage: [
      { url: '/icons/icon-512.png' },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Week Planner',
    description: 'Drag-and-drop weekly time planner with AI scheduling',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0f1117' },
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('dark font-sans', inter.variable)}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Week Planner" />
        <meta name="application-name" content="Week Planner" />
        <meta name="msapplication-TileColor" content="#0f1117" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="antialiased bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
        <InstallPrompt />
        <Toaster />
      </body>
    </html>
  );
}
