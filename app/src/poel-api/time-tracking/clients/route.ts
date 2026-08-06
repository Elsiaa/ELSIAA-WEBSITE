import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { createClient, listClientsForUser } from "@/lib/time-tracking";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clients = await listClientsForUser(userId);
    return NextResponse.json({ clients });
  } catch (e) {
    console.error("time-tracking clients GET", e);
    return NextResponse.json({ error: "Failed to list clients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { name?: string; color?: string };
    const name = typeof body.name === "string" ? body.name : "";
    if (!name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const client = await createClient(userId, { name, color: body.color });
    return NextResponse.json({ client });
  } catch (e) {
    console.error("time-tracking clients POST", e);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
