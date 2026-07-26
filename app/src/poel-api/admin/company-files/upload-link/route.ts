import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { guardAdminCompanyFilesAccess } from '@/lib/admin-company-files-guard';
import {
  createPublicUploadLink,
  listPublicUploadLinksForCompany,
  revokePublicUploadLink,
} from '@/lib/public-upload-links';

function requestOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  try {
    const companyIdParam = req.nextUrl.searchParams.get('companyId');
    const folderPrefix = req.nextUrl.searchParams.get('folderPrefix') ?? '';

    const guard = await guardAdminCompanyFilesAccess(companyIdParam);
    if (!guard.ok) return guard.response;

    const links = await listPublicUploadLinksForCompany(guard.data.companyId, folderPrefix);
    const origin = requestOrigin(req);

    return NextResponse.json({
      links: links.map((link) => ({
        token: link.token,
        label: link.label,
        relativeDir: link.relative_dir,
        uploadUrl: `${origin}/u/${link.token}`,
        uploadCount: link.upload_count,
        maxUploads: link.max_uploads,
        maxBytes: link.max_bytes != null ? Number(link.max_bytes) : null,
        expiresAt: link.expires_at,
        createdAt: link.created_at,
        lastUsedAt: link.last_used_at,
      })),
    });
  } catch (error) {
    console.error('upload-link GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list upload links' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id;
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as {
      companyId?: string;
      folderPrefix?: string;
      label?: string;
      expiresInDays?: number | null;
      maxUploads?: number | null;
      maxBytes?: number | null;
    };

    const guard = await guardAdminCompanyFilesAccess(body.companyId ?? null);
    if (!guard.ok) return guard.response;

    let expiresAt: Date | null = null;
    if (typeof body.expiresInDays === 'number' && Number.isFinite(body.expiresInDays)) {
      if (body.expiresInDays <= 0) {
        return NextResponse.json({ error: 'expiresInDays must be positive' }, { status: 400 });
      }
      expiresAt = new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000);
    }

    if (body.maxUploads != null) {
      if (!Number.isInteger(body.maxUploads) || body.maxUploads < 1) {
        return NextResponse.json({ error: 'maxUploads must be a positive integer' }, { status: 400 });
      }
    }

    if (body.maxBytes != null) {
      if (!Number.isFinite(body.maxBytes) || body.maxBytes < 1) {
        return NextResponse.json({ error: 'maxBytes must be a positive number' }, { status: 400 });
      }
    }

    const link = await createPublicUploadLink({
      companyId: guard.data.companyId,
      relativeDir: body.folderPrefix,
      createdByAuthUserId: authUserId,
      label: body.label,
      maxBytes: body.maxBytes,
      maxUploads: body.maxUploads,
      expiresAt,
    });

    const origin = requestOrigin(req);
    const uploadUrl = `${origin}/u/${link.token}`;

    return NextResponse.json(
      {
        token: link.token,
        uploadUrl,
        label: link.label,
        relativeDir: link.relative_dir,
        maxBytes: link.max_bytes != null ? Number(link.max_bytes) : null,
        maxUploads: link.max_uploads,
        expiresAt: link.expires_at,
        createdAt: link.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('upload-link POST:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create upload link';
    if (msg.includes('public_upload_links') || msg.includes('does not exist')) {
      return NextResponse.json(
        {
          error:
            'Upload links table is missing. Apply supabase/migrations/create_public_upload_links.sql to your database.',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as { companyId?: string; token?: string };
    const guard = await guardAdminCompanyFilesAccess(body.companyId ?? null);
    if (!guard.ok) return guard.response;

    const token = body.token?.trim();
    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    const revoked = await revokePublicUploadLink(token, guard.data.companyId);
    if (!revoked) {
      return NextResponse.json({ error: 'Link not found or already revoked' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('upload-link DELETE:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to revoke upload link' },
      { status: 500 }
    );
  }
}
