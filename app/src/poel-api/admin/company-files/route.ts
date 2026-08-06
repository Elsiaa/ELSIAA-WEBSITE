import { NextRequest, NextResponse } from "next/server";
import { guardAdminCompanyFilesAccess } from "@/lib/admin-company-files-guard";
import {
  deleteCompanyFile,
  deleteCompanyFolderRecursive,
  ensureCompanyFilesRootExists,
  listCompanyBrowse,
  uploadCompanyFile,
} from "@/lib/company-admin-files";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get("companyId");
    const prefix = searchParams.get("prefix") ?? undefined;

    const guard = await guardAdminCompanyFilesAccess(companyIdParam);
    if (!guard.ok) return guard.response;

    await ensureCompanyFilesRootExists(guard.data.companyId);
    const { folders, files } = await listCompanyBrowse(guard.data.companyId, prefix ?? undefined);
    return NextResponse.json({ folders, files });
  } catch (error) {
    console.error("company-files GET:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list files" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const companyIdParam = formData.get("companyId") as string | null;
    const file = formData.get("file") as File | null;
    const relativeDir = (formData.get("relativeDir") as string | null) ?? undefined;

    const guard = await guardAdminCompanyFilesAccess(companyIdParam);
    if (!guard.ok) return guard.response;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const uploaded = await uploadCompanyFile(guard.data.companyId, file, relativeDir);
    return NextResponse.json({ file: uploaded }, { status: 201 });
  } catch (error) {
    console.error("company-files POST:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get("companyId");
    const key = searchParams.get("key");
    const recursive = searchParams.get("recursive") === "1";
    const folderPrefix = searchParams.get("prefix")?.trim();

    const guard = await guardAdminCompanyFilesAccess(companyIdParam);
    if (!guard.ok) return guard.response;

    if (recursive) {
      if (!folderPrefix) {
        return NextResponse.json(
          { error: "prefix is required for recursive folder delete" },
          { status: 400 },
        );
      }
      const { deleted } = await deleteCompanyFolderRecursive(guard.data.companyId, folderPrefix);
      return NextResponse.json({ ok: true, deleted });
    }

    if (!key?.trim()) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    await deleteCompanyFile(guard.data.companyId, key.trim());
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("company-files DELETE:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 },
    );
  }
}
