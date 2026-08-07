/*
  Delivery boundary for public form submissions.

  ─────────────────────────────────────────────────────────────────────────
  FOR THE BACKEND: this is the only file you need to touch.

  `deliverApplication` is called by POST /api/apply once the payload has been
  validated and the attachment size-checked. Implement it however you want the
  data to land — the project already has both options wired up:

    • email      → `sendTransactionalMail` in src/lib/transactional-mail.ts
    • database   → the Supabase service client, see src/lib/portal/env.server.ts

  Until it is implemented this returns `configured: false`, the route answers
  503, and the careers form tells the applicant to email us directly instead.
  That is deliberate: a form that silently accepts a résumé and drops it is
  worse than one that admits it is not ready.
  ─────────────────────────────────────────────────────────────────────────

  Why this exists at all: the careers form used to POST applicant names,
  phone numbers, email addresses and résumé files straight to the third-party
  service formsubmit.co, with `_captcha: false`. That is candidate personal
  data leaving ELSIAA's infrastructure to a service ELSIAA does not control,
  on an unprotected endpoint. The front end now posts same-origin instead.
*/

export type ApplicationPayload = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  positions: string[];
  country: string;
  arrangement: string;
  commitment: string;
  statement: string;
  /** flagged by the client-side heuristic; advisory only, never a block */
  aiSuspected: boolean;
  resume: { name: string; type: string; size: number; bytes: Uint8Array } | null;
};

export type DeliveryResult = { configured: boolean; ok: boolean; detail?: string };

/** Largest résumé accepted, in bytes. Enforced by the route before this runs. */
export const MAX_RESUME_BYTES = 8 * 1024 * 1024;

export const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deliverApplication(payload: ApplicationPayload): Promise<DeliveryResult> {
  /* TODO(backend): send `payload` to wherever applications should land.
     Return { configured: true, ok: true } on success. */
  return {
    configured: false,
    ok: false,
    detail: "Application delivery is not configured yet.",
  };
}
