import { createFileRoute } from "@tanstack/react-router";
import {
  deliverApplication,
  ALLOWED_RESUME_TYPES,
  MAX_RESUME_BYTES,
  type ApplicationPayload,
} from "../../lib/forms/deliver.server";

/**
 * Careers application intake.
 *
 * Replaces a direct browser POST to formsubmit.co, which sent applicant
 * names, phone numbers, emails and résumé files to a third party with
 * captcha disabled. Everything now stays same-origin.
 *
 * This route validates and size-checks; it does not decide where the data
 * lands. That is `deliverApplication` in lib/forms/deliver.server.ts, which
 * is the single file the backend needs to implement.
 */

const str = (v: FormDataEntryValue | null): string => (typeof v === "string" ? v.trim() : "");

export const Route = createFileRoute("/api/apply")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ ok: false, error: "Malformed submission." }, { status: 400 });
        }

        const payload: ApplicationPayload = {
          firstName: str(form.get("firstName")),
          lastName: str(form.get("lastName")),
          phone: str(form.get("phone")),
          email: str(form.get("email")),
          positions: str(form.get("positions"))
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          country: str(form.get("country")),
          arrangement: str(form.get("arrangement")),
          commitment: str(form.get("commitment")),
          statement: str(form.get("statement")),
          aiSuspected: str(form.get("aiSuspected")) === "true",
          resume: null,
        };

        /* Server-side validation. The client validates too, but a client
           check is a courtesy to the user, not a control. */
        const missing = (["firstName", "lastName", "email", "statement"] as const).filter(
          (k) => !payload[k],
        );
        if (missing.length) {
          return Response.json(
            { ok: false, error: `Missing required field: ${missing.join(", ")}` },
            { status: 400 },
          );
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) {
          return Response.json({ ok: false, error: "Invalid email address." }, { status: 400 });
        }
        /* Bound the free-text field so a single POST cannot be used to push
           megabytes of text through the mail path. */
        if (payload.statement.length > 20_000) {
          return Response.json({ ok: false, error: "Statement is too long." }, { status: 413 });
        }

        const file = form.get("resume");
        if (file && typeof file !== "string") {
          if (file.size > MAX_RESUME_BYTES) {
            return Response.json(
              { ok: false, error: "Résumé must be 8 MB or smaller." },
              { status: 413 },
            );
          }
          /* Trust the declared type only as a first filter — it is client
             supplied. Anything durable should re-check server-side. */
          if (file.type && !ALLOWED_RESUME_TYPES.includes(file.type)) {
            return Response.json(
              { ok: false, error: "Résumé must be a PDF or Word document." },
              { status: 415 },
            );
          }
          payload.resume = {
            name: file.name,
            type: file.type,
            size: file.size,
            bytes: new Uint8Array(await file.arrayBuffer()),
          };
        }

        const result = await deliverApplication(payload);

        if (!result.configured) {
          /* 503, not a silent 200. The form shows the applicant an email
             address to use instead, so nobody's application disappears. */
          return Response.json(
            { ok: false, error: "not_configured", detail: result.detail },
            { status: 503 },
          );
        }
        if (!result.ok) {
          return Response.json({ ok: false, error: "delivery_failed" }, { status: 502 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
