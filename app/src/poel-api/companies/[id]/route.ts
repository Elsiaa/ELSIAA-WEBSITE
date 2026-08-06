/**
 * Company API Routes
 * GET /api/companies/[id] - Get company details
 * PATCH /api/companies/[id] - Update company
 * DELETE /api/companies/[id] - Delete company
 */

import { NextRequest, NextResponse } from "next/server";
import { getCompanyById, updateCompany, deleteCompany, getCompanyStats } from "@/lib/companies";
import {
  requireSuperAdmin,
  requireCompanyAccess,
  isSuperAdmin,
  requireCompanyAdmin,
} from "@/lib/permissions";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireCompanyAccess(id);

    const company = await getCompanyById(id);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const stats = await getCompanyStats(id);

    return NextResponse.json({ ...company, stats });
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch company" },
      { status: error instanceof Error && error.message.includes("Forbidden") ? 403 : 500 },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const hasName = body.name !== undefined;
    const hasFilesFlag = body.support_agent_company_files_allowed !== undefined;

    if (hasName && typeof body.name !== "string") {
      return NextResponse.json({ error: "Invalid company name" }, { status: 400 });
    }
    if (hasFilesFlag && typeof body.support_agent_company_files_allowed !== "boolean") {
      return NextResponse.json(
        { error: "support_agent_company_files_allowed must be a boolean" },
        { status: 400 },
      );
    }

    const superAdmin = await isSuperAdmin();

    if (superAdmin) {
      const updates: { name?: string; support_agent_company_files_allowed?: boolean } = {};
      if (hasName && body.name) updates.name = body.name;
      if (hasFilesFlag)
        updates.support_agent_company_files_allowed = body.support_agent_company_files_allowed;
      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
      }
      const company = await updateCompany(id, updates);
      return NextResponse.json(company);
    }

    await requireCompanyAdmin(id);

    if (hasName) {
      return NextResponse.json(
        { error: "Only super admins can rename a company" },
        { status: 403 },
      );
    }
    if (!hasFilesFlag) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const company = await updateCompany(id, {
      support_agent_company_files_allowed: body.support_agent_company_files_allowed,
    });
    return NextResponse.json(company);
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update company" },
      { status: error instanceof Error && error.message.includes("Forbidden") ? 403 : 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireSuperAdmin();

    await deleteCompany(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete company" },
      { status: error instanceof Error && error.message.includes("Forbidden") ? 403 : 500 },
    );
  }
}
