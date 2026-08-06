import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByAuthUserId } from "@/lib/users";

/**
 * Legacy path: checks whether the signed-in Auth.js user is linked to `public.users`.
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getUserByAuthUserId(authUserId);

    if (dbUser) {
      return NextResponse.json({
        success: true,
        message: "User found in database",
        user: dbUser,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "User not found in database. Please contact your administrator.",
      },
      { status: 404 },
    );
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}
