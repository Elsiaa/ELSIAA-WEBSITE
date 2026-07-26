import { getServerSupabaseClient } from '@/lib/supabase';

export type SupportAgentCompanyGrantRow = {
  id: string;
  user_id: string;
  company_id: string;
  support_allowed: boolean;
  authorizations_allowed: boolean;
  program_logs_allowed: boolean;
  files_allowed: boolean;
  created_at: string;
};

export type SupportAgentGrantInput = {
  company_id: string;
  support_allowed: boolean;
  authorizations_allowed: boolean;
  program_logs_allowed: boolean;
  files_allowed: boolean;
};

export async function getGrantsForUser(userId: string): Promise<SupportAgentCompanyGrantRow[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('support_agent_company_grants')
    .select('*')
    .eq('user_id', userId)
    .order('company_id');

  if (error) {
    console.error('getGrantsForUser', error);
    return [];
  }
  return (data || []).map((r) => {
    const row = r as SupportAgentCompanyGrantRow;
    return {
      ...row,
      program_logs_allowed: Boolean(row.program_logs_allowed),
      files_allowed: Boolean(row.files_allowed),
    };
  });
}

/** Platform support agents who may open this company's support desk (`support_allowed`). */
export async function listSupportDeskAgentUserIdsForCompany(companyId: string): Promise<string[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('support_agent_company_grants')
    .select('user_id')
    .eq('company_id', companyId)
    .eq('support_allowed', true);

  if (error || !data?.length) return [];
  return [...new Set(data.map((r) => (r as { user_id: string }).user_id))];
}

/** Invitation emails embed a company id; support agents have no `users.company_id`, so sign-up checks grants instead. */
export async function supportAgentHasGrantRowForCompany(userId: string, companyId: string): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('support_agent_company_grants')
    .select('id')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function supportAgentHasCompanyGrant(
  userId: string,
  companyId: string,
  kind: 'support' | 'authorizations' | 'program_logs' | 'files'
): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const col =
    kind === 'support'
      ? 'support_allowed'
      : kind === 'authorizations'
        ? 'authorizations_allowed'
        : kind === 'program_logs'
          ? 'program_logs_allowed'
          : 'files_allowed';
  const { data, error } = await supabase
    .from('support_agent_company_grants')
    .select('id')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq(col, true)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

/** Replace all grants for a user (super-admin UI). Rows must have at least one flag true each. */
export async function replaceGrantsForUser(userId: string, grants: SupportAgentGrantInput[]): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error: delErr } = await supabase.from('support_agent_company_grants').delete().eq('user_id', userId);
  if (delErr) {
    throw new Error(delErr.message);
  }

  const rows = grants
    .filter(
      (g) =>
        g.support_allowed ||
        g.authorizations_allowed ||
        g.program_logs_allowed ||
        g.files_allowed
    )
    .map((g) => ({
      user_id: userId,
      company_id: g.company_id,
      support_allowed: g.support_allowed,
      authorizations_allowed: g.authorizations_allowed,
      program_logs_allowed: g.program_logs_allowed,
      files_allowed: g.files_allowed,
    }));

  if (rows.length === 0) return;

  const { error: insErr } = await supabase.from('support_agent_company_grants').insert(rows);
  if (insErr) {
    throw new Error(insErr.message);
  }
}

export function summarizeGrants(rows: SupportAgentCompanyGrantRow[]) {
  const supportCompanyIds = [...new Set(rows.filter((r) => r.support_allowed).map((r) => r.company_id))];
  const authorizationsCompanyIds = [
    ...new Set(rows.filter((r) => r.authorizations_allowed).map((r) => r.company_id)),
  ];
  const programLogsCompanyIds = [
    ...new Set(rows.filter((r) => r.program_logs_allowed).map((r) => r.company_id)),
  ];
  const filesCompanyIds = [...new Set(rows.filter((r) => r.files_allowed).map((r) => r.company_id))];
  return {
    supportCompanyIds,
    authorizationsCompanyIds,
    programLogsCompanyIds,
    filesCompanyIds,
    canSupport: supportCompanyIds.length > 0,
    canAuthorizations: authorizationsCompanyIds.length > 0,
    canProgramLogs: programLogsCompanyIds.length > 0,
    canFiles: filesCompanyIds.length > 0,
  };
}
