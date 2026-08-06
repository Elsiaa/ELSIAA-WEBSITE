/**
 * Send password reset emails (Auth.js credentials flow).
 * Uses shared transport: Zoho → Gmail (see transactional-mail.ts).
 */

import {
  getOperationalBrandName,
  getOperationalLogoUrl,
  getSmtpFromDisplayName,
  getTransactionalSenderEmail,
} from "@/lib/operational-brand";
import {
  escapeHtml,
  escapeHtmlAttr,
  renderPoelLightTransactionalEmailHtml,
} from "@/lib/poel-theme";
import { sendTransactionalMail } from "@/lib/transactional-mail";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  const brand = getOperationalBrandName();
  const subject = `Set your ${brand} password`;

  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const logoUrl = getOperationalLogoUrl(baseUrl, "full");
  const safeBrand = escapeHtml(brand);
  const safeUrlAttr = escapeHtmlAttr(resetUrl);

  const contentHtml = `
      <p>Hi,</p>
      <p>Use the button below to choose a new password for <strong>${safeBrand}</strong>. This secure link expires in <strong>one hour</strong>.</p>
      <div class="poel-email-cta-wrap">
        <a class="poel-email-btn" href="${safeUrlAttr}">Set your password</a>
      </div>
      <div class="poel-email-link-fallback">
        If the button does not work, copy and paste this link into your browser:<br />
        <a href="${safeUrlAttr}">${escapeHtml(resetUrl)}</a>
      </div>
      <p class="poel-email-muted-box" style="margin-bottom:0;">
        If you did not request a password reset, you can ignore this email. Your password will not be changed.
      </p>`;

  const htmlBody = renderPoelLightTransactionalEmailHtml({
    logoUrl,
    brandName: brand,
    title: "Reset your password",
    contentHtml,
  });

  const textBody = `Set your ${brand} password:\n${resetUrl}\n\nThis link expires in one hour.\n\nIf you did not request this, you can ignore this email.`;

  const ok = await sendTransactionalMail({
    to,
    subject,
    html: htmlBody,
    text: textBody,
    from: `"${getSmtpFromDisplayName()}" <${getTransactionalSenderEmail()}>`,
  });

  if (!ok) {
    console.error(
      "Password reset email not sent: configure ELSSIA_MAIL_API_KEY, or ZOHO_APP_PASSWORD (+ ZOHO_EMAIL), or EMAIL_USER + EMAIL_PASS (Gmail app password).",
    );
  }
  return ok;
}
