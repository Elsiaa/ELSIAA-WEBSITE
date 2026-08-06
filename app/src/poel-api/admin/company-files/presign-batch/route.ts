import { NextRequest, NextResponse } from "next/server";
import { guardAdminCompanyFilesAccess } from "@/lib/admin-company-files-guard";
import { presignCompanyFileUpload } from "@/lib/company-admin-files";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      companyId?: string;
      files: Array<{
        id: string; // client-provided id to match responses
        fileName: string;
        contentType?: string;
        contentLength: number;
        relativeDir?: string;
      }>;
    };

    const guard = await guardAdminCompanyFilesAccess(body.companyId ?? null);
    if (!guard.ok) return guard.response;

    if (!body.files || !Array.isArray(body.files)) {
      return NextResponse.json({ error: "files array is required" }, { status: 400 });
    }

    const results = [];
    // getSignedUrl computes hashes locally without external IO, so Promise.all is very fast.
    const promises = body.files.map(async (fileReq) => {
      try {
        if (!fileReq.fileName?.trim()) throw new Error("fileName is required");
        if (typeof fileReq.contentLength !== "number" || !Number.isFinite(fileReq.contentLength)) {
          throw new Error("contentLength is required");
        }

        const result = await presignCompanyFileUpload(
          guard.data.companyId,
          fileReq.relativeDir,
          fileReq.fileName.trim(),
          fileReq.contentType ?? "application/octet-stream",
          fileReq.contentLength,
        );
        return { id: fileReq.id, ...result };
      } catch (err) {
        return {
          id: fileReq.id,
          error: err instanceof Error ? err.message : "Presign failed",
        };
      }
    });

    const settled = await Promise.all(promises);
    return NextResponse.json({ results: settled });
  } catch (error) {
    console.error("company-files presign-batch:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Presign batch failed" },
      { status: 500 },
    );
  }
}
