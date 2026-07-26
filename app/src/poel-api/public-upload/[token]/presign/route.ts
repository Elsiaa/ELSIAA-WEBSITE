import { NextRequest, NextResponse } from 'next/server';
import { presignCompanyFileUpload } from '@/lib/company-admin-files';
import {
  assertUploadRelativeDirAllowed,
  effectiveMaxBytesForLink,
  getPublicUploadLinkByToken,
  validatePublicUploadLinkActive,
} from '@/lib/public-upload-links';

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
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

    const body = (await req.json()) as {
      fileName?: string;
      contentType?: string;
      contentLength?: number;
      relativeDir?: string;
    };

    if (!body.fileName?.trim()) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }
    if (typeof body.contentLength !== 'number' || !Number.isFinite(body.contentLength)) {
      return NextResponse.json({ error: 'contentLength is required' }, { status: 400 });
    }

    const maxBytes = effectiveMaxBytesForLink(link);
    if (body.contentLength > maxBytes) {
      return NextResponse.json(
        { error: `File exceeds maximum size of ${maxBytes} bytes` },
        { status: 413 }
      );
    }

    const relativeDir =
      typeof body.relativeDir === 'string' && body.relativeDir.trim()
        ? body.relativeDir.trim().replace(/^\/+|\/+$/g, '')
        : link.relative_dir || undefined;

    if (relativeDir !== undefined) {
      assertUploadRelativeDirAllowed(link.relative_dir, relativeDir);
    }

    const result = await presignCompanyFileUpload(
      link.company_id,
      relativeDir,
      body.fileName.trim(),
      body.contentType ?? 'application/octet-stream',
      body.contentLength
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('public-upload presign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Presign failed' },
      { status: 500 }
    );
  }
}
