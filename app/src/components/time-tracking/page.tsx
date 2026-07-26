import { auth } from '@/auth';
import { isPoelClockHost } from '@/lib/poel-demo-host-parse';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import TimeTrackingClient from './time-tracking-client';
import { TimeTrackingLightShell } from './time-tracking-light-shell';

export const dynamic = 'force-dynamic';

export default async function TimeTrackingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
    const callback = isPoelClockHost(host) ? '/' : '/time-tracking';
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callback)}`);
  }

  const displayName =
    session.user?.name?.trim() ||
    (session.user?.email ? session.user.email.split('@')[0] : null) ||
    'You';

  return (
    <TimeTrackingLightShell>
      <TimeTrackingClient
        userLabel={displayName}
        userEmail={session.user?.email ?? undefined}
      />
    </TimeTrackingLightShell>
  );
}
