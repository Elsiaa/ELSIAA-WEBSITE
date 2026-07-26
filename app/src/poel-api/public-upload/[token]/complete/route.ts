import { NextRequest, NextResponse } from 'next/server';
import {
  getPublicUploadLinkByToken,
  recordPublicUploadSuccess,
  validatePublicUploadLinkActive,
} from '@/lib/public-upload-links';

type RouteContext = { params: Promise<{ token: string }> };

/** Called by the browser after a successful presigned PUT to R2. */
export async function POST(_req: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const link = await getPublicUploadLinkByToken(token);
    if (!link) {
      return NextResponse.json({ error: 'Invalid upload link' }, { status: 404 });
    }

    const active = validatePublicUploadLinkActive(link);
    if (!active.ok) {
      return NextResponse.json({ error: active.reason }, { status: 410 });
    }

    await recordPublicUploadSuccess(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('public-upload complete:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not record upload' },
      { status: 500 }
    );
  }
}
