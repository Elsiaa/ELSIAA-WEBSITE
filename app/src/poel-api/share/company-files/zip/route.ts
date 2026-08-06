import { NextRequest, NextResponse } from "next/server";
import {
  assertPrefixUnderCompany,
  companyFilesRootPrefix,
  createCompanyFilesZipReadable,
  normalizeRelativePrefix,
  nodeStreamToWeb,
} from "@/lib/company-admin-files";
import { openCompanyFolderShareToken } from "@/lib/company-file-share-token";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const payload = openCompanyFolderShareToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const { companyId, prefix } = payload;
  const root = companyFilesRootPrefix(companyId);
  const dir = normalizeRelativePrefix(prefix === "" ? undefined : prefix);
  const fullPrefix = `${root}${dir}`;

  try {
    assertPrefixUnderCompany(companyId, fullPrefix);
  } catch {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const safeSlug =
    prefix
      .replace(/[/\\]+/g, "-")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .slice(0, 80) || "folder";
  const filename = `shared-${safeSlug}.zip`;

  try {
    const nodeStream = await createCompanyFilesZipReadable(
      companyId,
      prefix === "" ? undefined : prefix,
    );
    return new NextResponse(nodeStreamToWeb(nodeStream), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("empty") || msg.includes("No files")) {
      return NextResponse.json(
        { error: "This folder is empty — there are no files to zip." },
        { status: 404 },
      );
    }
    console.error("share company-files zip:", e);
    return NextResponse.json({ error: "Could not create ZIP" }, { status: 500 });
  }
}
