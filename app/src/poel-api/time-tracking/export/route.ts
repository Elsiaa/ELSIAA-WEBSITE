import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { listEntriesInRange } from "@/lib/time-tracking";

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

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
      return NextResponse.json(
        { error: "from and to query params (ISO dates) are required" },
        { status: 400 },
      );
    }

    const rows = await listEntriesInRange(userId, from, to);
    const header = ["Client", "Task", "Start", "End", "Duration (hours)", "Billable", "Note"];
    const lines = [header.join(",")];

    for (const r of rows) {
      const start = new Date(r.startedAt).getTime();
      const end = r.endedAt ? new Date(r.endedAt).getTime() : start;
      const hours = ((end - start) / 3_600_000).toFixed(2);
      lines.push(
        [
          csvEscape(r.clientName),
          csvEscape(r.taskTitle),
          csvEscape(r.startedAt),
          csvEscape(r.endedAt ?? ""),
          hours,
          r.billable ? "yes" : "no",
          csvEscape(r.note ?? ""),
        ].join(","),
      );
    }

    const csv = lines.join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="time-tracking-${from.slice(0, 10)}_to_${to.slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    console.error("time-tracking export", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
