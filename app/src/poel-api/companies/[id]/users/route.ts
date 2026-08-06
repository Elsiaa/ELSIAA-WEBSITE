/**
 * Company Users API Routes
 * GET /api/companies/[id]/users - List users in a company
 * POST /api/companies/[id]/users - Add a user to a company
 */

import { NextRequest, NextResponse } from "next/server";
import { getUsersByCompany, createUser } from "@/lib/users";
import { getCompanyById } from "@/lib/companies";
import { requireCompanyAccess, requireCompanyAdmin, getCurrentUser } from "@/lib/permissions";
import { sendInvitationEmail } from "@/lib/invitations-server";
import { getNextAuthUserIdForEmail } from "@/lib/next-auth-user-lookup";
import {
  defaultCompanyUserModuleFlags,
  parseCompanyUserModuleFlags,
} from "@/lib/company-user-modules";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireCompanyAccess(id);

    const users = await getUsersByCompany(id);
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching company users:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch users" },
      { status: error instanceof Error && error.message.includes("Forbidden") ? 403 : 500 },
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireCompanyAdmin(id);

    const body = await req.json();

    // Validate required fields
    if (!body.email || typeof body.email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!body.role || !["admin", "member"].includes(body.role)) {
      return NextResponse.json(
        { error: "Valid role is required (admin or member)" },
        { status: 400 },
      );
    }

    // Check if user already exists in this company
    const { getUserByEmailAndCompany } = await import("@/lib/users");
    const existingUser = await getUserByEmailAndCompany(body.email, id);

    if (existingUser) {
      return NextResponse.json(
        {
          error: "User with this email already exists in this company",
          user: existingUser,
        },
        { status: 409 }, // 409 Conflict
      );
    }

    const existingAuthId = await getNextAuthUserIdForEmail(body.email);
    const userStatus: "pending" | "active" = existingAuthId ? "active" : "pending";
    const shouldSendInvitation = !existingAuthId;

    if (existingAuthId) {
      console.log(`Found existing Auth.js account for ${body.email}, linking user immediately`);
    }

    const hasExplicitModules =
      body.authorizations_allowed !== undefined ||
      body.program_logs_allowed !== undefined ||
      body.files_allowed !== undefined ||
      body.support_allowed !== undefined;
    const moduleFlags = hasExplicitModules
      ? parseCompanyUserModuleFlags(body)
      : defaultCompanyUserModuleFlags(body.role);

    const user = await createUser({
      company_id: id,
      email: body.email,
      first_name: body.first_name || null,
      last_name: body.last_name || null,
      phone: body.phone || null,
      role: body.role,
      status: userStatus,
      auth_user_id: existingAuthId,
      all_projects_access: true,
      ...moduleFlags,
    });

    let invitationSent = false;
    if (shouldSendInvitation) {
      try {
        const company = await getCompanyById(id);
        const currentUser = await getCurrentUser();
        const inviterName = currentUser
          ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim()
          : undefined;

        if (company) {
          invitationSent = await sendInvitationEmail({
            email: user.email,
            firstName: user.first_name || undefined,
            lastName: user.last_name || undefined,
            companyName: company.name,
            companyId: company.id,
            inviterName,
          });
        }
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail the user creation if email fails
      }
    }

    return NextResponse.json(
      {
        ...user,
        invitationSent,
        message: existingAuthId
          ? "User added successfully and linked to existing account"
          : invitationSent
            ? "User created and invitation email sent"
            : "User created (invitation email not sent — set ELSSIA_MAIL_API_KEY and SMTP_FROM_EMAIL @elsiaa.com)",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create user" },
      { status: error instanceof Error && error.message.includes("Forbidden") ? 403 : 500 },
    );
  }
}
