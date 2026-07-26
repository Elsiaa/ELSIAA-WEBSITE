import { NextRequest, NextResponse } from 'next/server';
import { guardAdminCompanyFilesAccess } from '@/lib/admin-company-files-guard';
import { createCompanyFolder } from '@/lib/company-admin-files';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      companyId?: string;
      /** Current folder path under company root, no trailing slash */
      parentPrefix?: string;
      name: string;
    };

    const guard = await guardAdminCompanyFilesAccess(body.companyId ?? null);
    if (!guard.ok) return guard.response;

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const { path } = await createCompanyFolder(
      guard.data.companyId,
      body.parentPrefix ?? '',
      body.name
    );

    return NextResponse.json({ path }, { status: 201 });
  } catch (error) {
    console.error('company-files folder POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create folder' },
      { status: 500 }
    );
  }
}
