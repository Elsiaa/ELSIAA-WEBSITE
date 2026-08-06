import { NextRequest, NextResponse } from "next/server";
import { uploadCompanyFile } from "@/lib/company-admin-files";
import {
  assertUploadRelativeDirAllowed,
  effectiveMaxBytesForLink,
  getPublicUploadLinkByToken,
  recordPublicUploadSuccess,
  toPublicInfo,
  validatePublicUploadLinkActive,
} from "@/lib/public-upload-links";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const link = await getPublicUploadLinkByToken(token);
    if (!link) {
      return NextResponse.json({ error: "Invalid upload link" }, { status: 404 });
    }

    const active = validatePublicUploadLinkActive(link);
    if (!active.ok) {
      return NextResponse.json({ error: active.reason, active: false }, { status: 410 });
    }

    return NextResponse.json({ active: true, ...(await toPublicInfo(link)) });
  } catch (error) {
    console.error("public-upload GET:", error);
    const msg = error instanceof Error ? error.message : "Failed to load upload link";
    if (msg.includes("public_upload_links") || msg.includes("does not exist")) {
      return NextResponse.json(
        { error: "Upload links are not configured on this server." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const link = await getPublicUploadLinkByToken(token);
    if (!link) {
      return NextResponse.json({ error: "Invalid upload link" }, { status: 404 });
    }

    const active = validatePublicUploadLinkActive(link);
    if (!active.ok) {
      return NextResponse.json({ error: active.reason }, { status: 410 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const relativeDirRaw = formData.get("relativeDir");
    const relativeDir =
      typeof relativeDirRaw === "string" && relativeDirRaw.trim()
        ? relativeDirRaw.trim().replace(/^\/+|\/+$/g, "")
        : link.relative_dir || undefined;

    if (relativeDir !== undefined) {
      assertUploadRelativeDirAllowed(link.relative_dir, relativeDir);
    }

    const maxBytes = effectiveMaxBytesForLink(link);
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File exceeds maximum size of ${maxBytes} bytes` },
        { status: 413 },
      );
    }

    const uploaded = await uploadCompanyFile(link.company_id, file, relativeDir);
    await recordPublicUploadSuccess(token);

    return NextResponse.json({ file: uploaded }, { status: 201 });
  } catch (error) {
    console.error("public-upload POST:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
