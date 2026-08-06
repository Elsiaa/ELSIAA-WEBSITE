import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { getAllUsers } from "@/lib/users";

/**
 * Lists app users for meeting participant pickers (super admin only).
 * Response shape kept compatible with the old Clerk-based modal (`SerializableUser`).
 * `id` is `public.users.id` (UUID), not Auth.js id.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isSuperAdmin())) {
      return NextResponse.json({ error: "Only superusers can list users" }, { status: 403 });
    }

    const rows = await getAllUsers();
    const users = rows.map((u) => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      emailAddresses: [{ emailAddress: u.email }],
      publicMetadata: {} as Record<string, unknown>,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users for meetings:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
