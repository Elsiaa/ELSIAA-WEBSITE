import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { createTask } from "@/lib/time-tracking";
import type { TimeTrackingTaskStatus } from "@/lib/time-tracking";

const STATUSES: TimeTrackingTaskStatus[] = ["todo", "in_progress", "review", "done"];

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      clientId?: string;
      title?: string;
      status?: TimeTrackingTaskStatus;
      billable?: boolean;
      notes?: string | null;
    };

    if (!body.clientId || typeof body.clientId !== "string") {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }
    const title = typeof body.title === "string" ? body.title : "";
    if (!title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const status = body.status && STATUSES.includes(body.status) ? body.status : undefined;

    const task = await createTask(userId, {
      clientId: body.clientId,
      title,
      status,
      billable: body.billable,
      notes: body.notes,
    });
    return NextResponse.json({ task });
  } catch (e) {
    console.error("time-tracking tasks POST", e);
    const msg = e instanceof Error ? e.message : "Failed to create task";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
