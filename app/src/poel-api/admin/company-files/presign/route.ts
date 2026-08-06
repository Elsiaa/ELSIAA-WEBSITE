import { NextRequest, NextResponse } from "next/server";
import { guardAdminCompanyFilesAccess } from "@/lib/admin-company-files-guard";
import { presignCompanyFileUpload } from "@/lib/company-admin-files";

/**
 * Returns a short-lived presigned PUT URL for direct browser → R2 upload.
 *
 * R2 bucket CORS must allow PUT from your site origin, e.g.:
 * - AllowedOrigins: https://your-app.vercel.app, http://localhost:3000
 * - AllowedMethods: GET, PUT, HEAD
 * - AllowedHeaders: *
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      companyId?: string;
      fileName?: string;
      contentType?: string;
      contentLength?: number;
      relativeDir?: string;
    };

    const guard = await guardAdminCompanyFilesAccess(body.companyId ?? null);
    if (!guard.ok) return guard.response;

    if (!body.fileName?.trim()) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }
    if (typeof body.contentLength !== "number" || !Number.isFinite(body.contentLength)) {
      return NextResponse.json({ error: "contentLength is required" }, { status: 400 });
    }

    const result = await presignCompanyFileUpload(
      guard.data.companyId,
      body.relativeDir,
      body.fileName.trim(),
      body.contentType ?? "application/octet-stream",
      body.contentLength,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("company-files presign:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Presign failed" },
      { status: 500 },
    );
  }
}
