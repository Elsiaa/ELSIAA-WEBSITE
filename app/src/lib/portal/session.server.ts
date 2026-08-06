/**
 * Portal session API — aliases of the single app session (Supabase JWT cookie).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionConfig } from "@tanstack/react-start/server";
import {
  appAuthReady,
  appSessionConfig,
  destroyAppSession,
  readAppSessionWithLegacyFallback,
  requireAppSupabase,
  requireAppUser,
  writeAppSession,
  type AppSessionData,
} from "../app-session.server";

export type PortalSessionData = AppSessionData;

export function portalSessionConfig(): SessionConfig | null {
  return appSessionConfig();
}

export async function readPortalSession(): Promise<PortalSessionData | null> {
  return readAppSessionWithLegacyFallback();
}

export async function writePortalSession(input: PortalSessionData): Promise<void> {
  return writeAppSession(input);
}

export async function destroyPortalSession(): Promise<void> {
  return destroyAppSession();
}

export async function requirePortalUser(): Promise<PortalSessionData> {
  return requireAppUser();
}

export async function requirePortalSupabase(): Promise<{
  session: PortalSessionData;
  client: SupabaseClient;
}> {
  return requireAppSupabase();
}

export function portalAuthReady(): boolean {
  return appAuthReady();
}
