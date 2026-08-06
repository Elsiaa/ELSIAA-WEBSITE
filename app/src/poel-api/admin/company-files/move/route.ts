import { NextRequest, NextResponse } from "next/server";
import { guardAdminCompanyFilesAccess } from "@/lib/admin-company-files-guard";
import { moveCompanyFile } from "@/lib/company-admin-files";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      companyId?: string;
      key?: string;
      /** Relative folder path under company root; omit or "" for root. */
      destinationPrefix?: string;
    };

    const guard = await guardAdminCompanyFilesAccess(body.companyId ?? null);
    if (!guard.ok) return guard.response;

    if (!body.key?.trim()) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    const destinationPrefix =
      typeof body.destinationPrefix === "string" ? body.destinationPrefix : "";

    const result = await moveCompanyFile(
      guard.data.companyId,
      body.key.trim(),
      destinationPrefix.trim() === "" ? undefined : destinationPrefix.trim(),
    );

    return NextResponse.json({ ok: true, key: result.key });
  } catch (error) {
    console.error("company-files move:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Move failed" },
      { status: 500 },
    );
  }
}
