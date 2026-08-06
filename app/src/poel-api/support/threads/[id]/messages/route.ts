import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCurrentUser, isSuperAdmin } from "@/lib/permissions";
import type { ChatAttachment } from "@/lib/chat";
import {
  addSupportMessage,
  canAccessSupportThread,
  getSupportThreadById,
  getSupportMessages,
  notifySupportMessageRecipients,
  resolveDisplayNameForSupport,
} from "@/lib/support";
import { getCompanyById } from "@/lib/companies";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const messages = await getSupportMessages(threadId);
    return NextResponse.json(messages, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

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

    const body = await req.json();
    const message = typeof body.message === "string" ? body.message : "";
    const attachments = body.attachments as ChatAttachment[] | undefined;
    const hasMessage = message.trim().length > 0;
    const hasAttachments = attachments && attachments.length > 0;
    if (!hasMessage && !hasAttachments) {
      return NextResponse.json({ error: "Message or attachments required" }, { status: 400 });
    }

    const userName = await resolveDisplayNameForSupport(
      authUserId,
      typeof body.userName === "string" ? body.userName : "User",
      session?.user?.email,
    );

    const saved = await addSupportMessage(threadId, {
      userId: authUserId,
      userName,
      message: message || "",
      ...(hasAttachments ? { attachments } : {}),
    });

    const company = await getCompanyById(thread.company_id);
    void notifySupportMessageRecipients({
      threadId,
      companyId: thread.company_id,
      threadTitle: thread.title,
      companyName: company?.name || "Company",
      message: saved,
      senderAuthUserId: authUserId,
      senderEmail: session?.user?.email,
    }).catch((err) => console.error("notifySupportMessageRecipients", err));

    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send" },
      { status: 500 },
    );
  }
}
