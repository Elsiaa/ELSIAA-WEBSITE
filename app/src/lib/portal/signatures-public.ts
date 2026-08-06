import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServiceClient, supabaseSecretConfigured } from "./supabase";

export type PublicSignatureRequest = {
  id: string;
  title: string;
  status: string;
  publicToken: string;
};

export const getSignatureByToken = createServerFn({ method: "GET" })
  .inputValidator(z.object({ token: z.string().min(8).max(128) }))
  .handler(async ({ data }): Promise<PublicSignatureRequest | null> => {
    const client = getSupabaseServiceClient();
    if (!client || !supabaseSecretConfigured()) {
      throw new Error("Signing is not configured (missing SUPABASE_SECRET_KEY)");
    }
    const { data: row, error } = await client
      .from("pdf_signature_requests")
      .select("id, title, status, public_token")
      .eq("public_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return {
      id: row.id as string,
      title: row.title as string,
      status: row.status as string,
      publicToken: row.public_token as string,
    };
  });

export const submitPublicSignature = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(8).max(128),
      signerName: z.string().min(1).max(120),
      signerEmail: z.string().email().optional(),
      signatureData: z.string().min(1).max(500_000),
    }),
  )
  .handler(async ({ data }) => {
    const client = getSupabaseServiceClient();
    if (!client || !supabaseSecretConfigured()) {
      throw new Error("Signing is not configured");
    }
    const { data: req, error } = await client
      .from("pdf_signature_requests")
      .select("id, status")
      .eq("public_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!req) throw new Error("Signature request not found");
    if (req.status === "cancelled" || req.status === "completed") {
      throw new Error(`Request is already ${req.status}`);
    }
    const { error: sigErr } = await client.from("pdf_signatures").insert({
      request_id: req.id,
      signer_name: data.signerName.trim(),
      signer_email: data.signerEmail?.trim().toLowerCase() || null,
      signature_data: data.signatureData,
    });
    if (sigErr) throw new Error(sigErr.message);
    await client.from("pdf_signature_requests").update({ status: "completed" }).eq("id", req.id);
    return { ok: true as const };
  });
