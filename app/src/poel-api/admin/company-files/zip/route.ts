import { NextRequest, NextResponse } from "next/server";
import { guardAdminCompanyFilesAccess } from "@/lib/admin-company-files-guard";
import { createCompanyFilesZipReadable, nodeStreamToWeb } from "@/lib/company-admin-files";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyIdParam = searchParams.get("companyId");
    const prefix = searchParams.get("prefix") ?? undefined;

    const guard = await guardAdminCompanyFilesAccess(companyIdParam);
    if (!guard.ok) return guard.response;

    const archive = await createCompanyFilesZipReadable(guard.data.companyId, prefix ?? undefined);

    // Use the folder name for the zip filename, falling back to the company name slug
    let filename: string;
    const trimmedPrefix = prefix?.trim().replace(/\/+$/, "");
    if (trimmedPrefix) {
      const folderName = trimmedPrefix.split("/").pop() || trimmedPrefix;
      const safeName = folderName.replace(/[^a-zA-Z0-9._\- ]/g, "_").slice(0, 100);
      filename = `${safeName}.zip`;
    } else {
      filename = `company-files.zip`;
    }

    return new NextResponse(nodeStreamToWeb(archive), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zip failed";
    if (message.includes("empty") || message.includes("No files to zip")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error("company-files zip:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
