/**
 * Send invitation email to a user
 * POST /api/users/[id]/invite
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser } from "@/lib/users";
import { getCompanyById } from "@/lib/companies";
import { sendInvitationEmail } from "@/lib/invitations-server";
import { canManageUser, getCurrentUser } from "@/lib/permissions";
import { getNextAuthUserIdForEmail } from "@/lib/next-auth-user-lookup";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!(await canManageUser(id))) {
      return NextResponse.json({ error: "Forbidden - cannot invite this user" }, { status: 403 });
    }

    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingAuthId = await getNextAuthUserIdForEmail(user.email);
    if (existingAuthId) {
      await updateUser(user.id, {
        auth_user_id: existingAuthId,
        status: "active",
      });
      return NextResponse.json({
        success: true,
        message: "User already has an Auth.js account and was linked successfully",
        linked: true,
      });
    }

    if (user.auth_user_id) {
      return NextResponse.json({ error: "User already has an account linked" }, { status: 400 });
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "User has no company membership" }, { status: 400 });
    }

    const company = await getCompanyById(user.company_id);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const currentUser = await getCurrentUser();
    const inviterName = currentUser
      ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim()
      : undefined;

    const sent = await sendInvitationEmail({
      email: user.email,
      firstName: user.first_name || undefined,
      lastName: user.last_name || undefined,
      companyName: company.name,
      companyId: company.id,
      inviterName,
    });

    if (!sent) {
      return NextResponse.json({ error: "Failed to send invitation email" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${user.email}`,
      linked: false,
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send invitation" },
      { status: 500 },
    );
  }
}
