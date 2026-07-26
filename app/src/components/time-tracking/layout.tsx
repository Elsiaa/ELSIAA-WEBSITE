import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Time tracking',
  description:
    'Track hours by client and task — timers, statuses, manual entries, and CSV export. Install as an app for quick access.',
  manifest: '/time-tracking.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Time tracking',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function TimeTrackingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="operational-app min-h-screen bg-background text-foreground">{children}</div>
  );
}
