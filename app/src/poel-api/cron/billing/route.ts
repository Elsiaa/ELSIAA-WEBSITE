import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { processAllDueBillings, sendOverdueWarningEmails } from '@/lib/billing-cron';

/** Read CRON_SECRET and INTERNAL_API_KEY from process.env or .env.local (fallback when Next doesn't inject them). */
function getCronAuth(): { cronSecret: string; internalKey: string } {
  let cronSecret = (process.env.CRON_SECRET ?? '').trim();
  let internalKey = (process.env.INTERNAL_API_KEY ?? '').trim();
  if (cronSecret.length > 0 && internalKey.length > 0) return { cronSecret, internalKey }
  try {
    const envPath = join(process.cwd(), '.env.local');
    if (!existsSync(envPath)) return { cronSecret, internalKey };
    const content = readFileSync(envPath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      const cronMatch = line.match(/^CRON_SECRET\s*=\s*(.+)$/);
      if (cronMatch) cronSecret = cronMatch[1].replace(/^['"]|['"]$/g, '').trim();
      const internalMatch = line.match(/^INTERNAL_API_KEY\s*=\s*(.+)$/);
      if (internalMatch) internalKey = internalMatch[1].replace(/^['"]|['"]$/g, '').trim();
    }
  } catch {
    // ignore
  }
  return { cronSecret, internalKey };
}

/**
 * Single cron endpoint for the entire system: run all billing (project subscriptions
 * and payment_requests) that are due, then send overdue warning emails for companies
 * within the 3-day grace period. Call this once per day from your cron scheduler.
 *
 * Auth: Authorization: Bearer <CRON_SECRET> or x-api-key: <INTERNAL_API_KEY>
 * Optional: ?asOf=YYYY-MM-DD to run as if "today" is that date (for testing).
 */
export async function GET(request: NextRequest) {
  try {
    const { cronSecret, internalKey } = getCronAuth();
    if (cronSecret.length === 0 && internalKey.length === 0) {
      return NextResponse.json(
        { error: 'Cron auth not configured. Set CRON_SECRET or INTERNAL_API_KEY in .env.local and restart the dev server.' },
        { status: 503 }
      );
    }
    const apiKey = request.headers.get('x-api-key')?.trim();
    const isSystemCall = internalKey.length > 0 && apiKey != null && apiKey === internalKey;

    if (!isSystemCall) {
      const authHeader = request.headers.get('authorization')?.trim();
      const expectedBearer = cronSecret.length > 0 ? `Bearer ${cronSecret}` : null;
      if (expectedBearer == null || authHeader !== expectedBearer) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const url = new URL(request.url, 'http://localhost');
    let asOfDate: Date | undefined;
    try {
      const asOf = url.searchParams.get('asOf');
      if (asOf) {
        const date = new Date(asOf + 'T00:00:00.000Z');
        if (!isNaN(date.getTime())) {
          // Use end of day (23:59:59.999) so any next_billing_date on that calendar day is included
          date.setUTCHours(23, 59, 59, 999);
          asOfDate = date;
        }
      }
    } catch {
      // ignore
    }

    const debug = url.searchParams.get('debug') === '1';
    const billingResult = await processAllDueBillings(asOfDate, debug ? { debug: true } : undefined);
    const warningResult = await sendOverdueWarningEmails(asOfDate || new Date());

    return NextResponse.json({
      ...billingResult,
      warnings: warningResult,
    });
  } catch (error) {
    console.error('Cron billing error:', error);
    return NextResponse.json(
      { error: 'Failed to process billing' },
      { status: 500 }
    );
  }
}
