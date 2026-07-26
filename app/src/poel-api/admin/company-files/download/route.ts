import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { guardAdminCompanyFilesAccess } from '@/lib/admin-company-files-guard';
import {
  companyFileDisplayBasenameFromObjectKey,
  getCompanyFileForDownload,
  nodeStreamToWeb,
} from '@/lib/company-admin-files';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get('companyId');
    const key = searchParams.get('key');

    const guard = await guardAdminCompanyFilesAccess(companyIdParam);
    if (!guard.ok) return guard.response;

    if (!key?.trim()) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }

    const obj = await getCompanyFileForDownload(guard.data.companyId, key.trim());
    const body = obj.Body;
    if (!body) {
      return NextResponse.json({ error: 'Empty object body' }, { status: 404 });
    }

    const filename = companyFileDisplayBasenameFromObjectKey(key.trim());
    const encoded = encodeURIComponent(filename).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

    return new NextResponse(nodeStreamToWeb(body as Readable), {
      headers: {
        'Content-Type': obj.ContentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encoded}`,
        ...(obj.ContentLength != null ? { 'Content-Length': String(obj.ContentLength) } : {}),
      },
    });
  } catch (error) {
    console.error('company-files download:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    );
  }
}
