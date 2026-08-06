import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireSuperAdmin } from "@/lib/permissions";
import { createPdfSignatureRequest, getAllPdfSignatureRequests } from "@/lib/pdf-signatures";

export async function GET() {
  try {
    await requireSuperAdmin();
    const requests = await getAllPdfSignatureRequests();
    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error("Error fetching PDF signature requests:", error);
    const message = error instanceof Error ? error.message : "Failed to load requests";
    const status = message.includes("Unauthorized")
      ? 401
      : message.includes("Forbidden")
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string | null) || "Signature Request";

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    const requestRecord = await createPdfSignatureRequest({
      title,
      createdByClerkUserId: userId,
      file,
    });

    return NextResponse.json(requestRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating PDF signature request:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create request" },
      { status: 500 },
    );
  }
}
