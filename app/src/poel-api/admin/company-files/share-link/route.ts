import { NextRequest, NextResponse } from 'next/server';
import { guardAdminCompanyFilesAccess } from '@/lib/admin-company-files-guard';
import {
  buildCompanyFilePublicReadUrl,
  companyHasFilesUnderRelativePrefix,
  normalizeRelativePrefix,
} from '@/lib/company-admin-files';
import {
  isCompanyFileShareTokenConfigured,
  sealCompanyFolderSharePayload,
} from '@/lib/company-file-share-token';

function requestOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      companyId?: string;
      key?: string;
      /** Set (including empty string) to share a folder; omit when sharing a single file. */
      folderPrefix?: string | null;
    };

    const guard = await guardAdminCompanyFilesAccess(body.companyId ?? null);
    if (!guard.ok) return guard.response;

    const hasFolder =
      body.folderPrefix !== undefined && body.folderPrefix !== null;
    const keyTrim = body.key?.trim() ?? '';

    if (hasFolder && keyTrim) {
      return NextResponse.json(
        { error: 'Send either key (file) or folderPrefix, not both' },
        { status: 400 }
      );
    }
    if (!hasFolder && !keyTrim) {
      return NextResponse.json(
        { error: 'key is required for a file, or folderPrefix for a folder' },
        { status: 400 }
      );
    }

    if (hasFolder) {
      if (!isCompanyFileShareTokenConfigured()) {
        return NextResponse.json(
          {
            error:
              'Folder links are not configured. Set COMPANY_FILES_SHARE_TOKEN_SECRET (at least 16 characters) on the server.',
          },
          { status: 503 }
        );
      }

      const prefixNorm =
        typeof body.folderPrefix === 'string'
          ? normalizeRelativePrefix(body.folderPrefix)
          : '';
      const prefixStored = prefixNorm.replace(/\/+$/, '');
      const hasFiles = await companyHasFilesUnderRelativePrefix(
        guard.data.companyId,
        prefixStored === '' ? undefined : prefixStored
      );

      const token = sealCompanyFolderSharePayload({
        v: 1,
        kind: 'folder',
        companyId: guard.data.companyId,
        prefix: prefixStored,
      });
      if (!token) {
        return NextResponse.json(
          { error: 'Could not create share token' },
          { status: 500 }
        );
      }

      const origin = requestOrigin(req);
      const qs = new URLSearchParams({ t: token });
      const siteShareUrl = `${origin}/share/files?${qs}`;

      return NextResponse.json({
        siteShareUrl,
        kind: 'folder' as const,
        hasFiles,
        expiresInSeconds: null,
      });
    }

    const publicUrl = buildCompanyFilePublicReadUrl(keyTrim);
    if (!publicUrl) {
      return NextResponse.json(
        {
          error:
            'Set R2_COMPANY_FILES_PUBLIC_URL (e.g. https://files.elsiaa.com) on the server to copy a CDN link.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      publicUrl,
      kind: 'file' as const,
      expiresInSeconds: null,
    });
  } catch (error) {
    console.error('company-files share-link:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create link' },
      { status: 500 }
    );
  }
}
