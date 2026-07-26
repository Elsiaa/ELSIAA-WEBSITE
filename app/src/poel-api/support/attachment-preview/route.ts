import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAllowedPublicR2AssetUrl } from '@/lib/attachment-preview';

const MAX_BYTES = 40 * 1024 * 1024;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw = req.nextUrl.searchParams.get('url');
    if (!raw?.trim()) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    let target: URL;
    try {
      target = new URL(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }

    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 });
    }

    if (!isAllowedPublicR2AssetUrl(raw)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const upstream = await fetch(raw, {
      headers: { Accept: 'application/pdf,image/*,*/*' },
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'Upstream failed' }, { status: 502 });
    }

    const len = upstream.headers.get('content-length');
    if (len && Number(len) > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    const upstreamType = upstream.headers.get('content-type') || 'application/octet-stream';
    const isPdf = upstreamType.includes('pdf') || raw.toLowerCase().split('?')[0].endsWith('.pdf');
    const isImage = upstreamType.startsWith('image/');

    const contentType = isPdf ? 'application/pdf' : isImage ? upstreamType : upstreamType;

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=120',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    console.error('attachment-preview', e);
    return NextResponse.json({ error: 'Preview failed' }, { status: 500 });
  }
}
