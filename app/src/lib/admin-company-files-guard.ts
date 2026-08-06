import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCurrentUser, isSuperAdmin } from "@/lib/permissions";
import { supportAgentHasCompanyGrant } from "@/lib/support-agent-grants";
import { isPlatformSupportAgent } from "@/lib/platform-role";
import { companyUserHasModule } from "@/lib/company-user-modules";

export type AdminCompanyFilesGuardOk = { companyId: string };

export type AdminCompanyFilesGuardResult =
  { ok: true; data: AdminCompanyFilesGuardOk } | { ok: false; response: NextResponse };

/**
 * Super admin must pass companyId; company user with Files module is locked to their company
 * (query param ignored). Support agent: companyId required; needs Files grant for that company.
 */
export async function guardAdminCompanyFilesAccess(
  requestedCompanyId: string | null | undefined,
): Promise<AdminCompanyFilesGuardResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const superAdmin = await isSuperAdmin();
  const currentUser = await getCurrentUser();

  if (superAdmin) {
    const raw = requestedCompanyId?.trim();
    if (!raw) {
      return {
        ok: false,
        response: NextResponse.json({ error: "companyId is required" }, { status: 400 }),
      };
    }
    return { ok: true, data: { companyId: raw } };
  }

  if (
    currentUser &&
    isPlatformSupportAgent(currentUser.platform_role) &&
    requestedCompanyId?.trim()
  ) {
    const companyId = requestedCompanyId.trim();
    const allowedGrant = await supportAgentHasCompanyGrant(currentUser.id, companyId, "files");
    if (!allowedGrant) {
      return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { ok: true, data: { companyId } };
  }

  if (!currentUser || !currentUser.company_id || !companyUserHasModule(currentUser, "files")) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true, data: { companyId: currentUser.company_id } };
}
