import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadSupportFile } from "@/lib/chat";
import { getCurrentUser, isSuperAdmin } from "@/lib/permissions";
import { canAccessSupportThread, getSupportThreadById } from "@/lib/support";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: threadId } = await context.params;
    const session = await auth();
    const authUserId = session?.user?.id;
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const superAdmin = await isSuperAdmin();
    const appUser = await getCurrentUser();
    const thread = await getSupportThreadById(threadId);
    if (!thread) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const can = await canAccessSupportThread(thread, {
      isSuperAdmin: superAdmin,
      appUser,
      authUserId,
    });
    if (!can) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const messageId = formData.get("messageId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!messageId) {
      return NextResponse.json({ error: "messageId is required" }, { status: 400 });
    }

    const attachment = await uploadSupportFile(threadId, messageId, file);
    return NextResponse.json(attachment, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 },
    );
  }
}
