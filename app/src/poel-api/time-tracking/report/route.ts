import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { listEntriesInRange } from "@/lib/time-tracking";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) {
      return NextResponse.json({ error: "from and to are required" }, { status: 400 });
    }

    const entries = await listEntriesInRange(userId, from, to);
    return NextResponse.json({ entries });
  } catch (e) {
    console.error("time-tracking report", e);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}
