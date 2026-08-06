/**
 * ELSIAA — design tokens for operational surfaces (emails, PDFs, non-marketing UI).
 */

export const poelColors = {
  /** ELSIAA green */
  flame: "#1e6b3c",
  coral: "#2e9e58",
  ember: "#155a32",
  navy: "#111111",
  abyss: "#0c0c0c",
  steel: "#2a2a2a",
  slate: "#4a4a4a",
  mist: "#F5F5F3",
  offWhite: "#F5F5F3",
  white: "#ffffff",
} as const;

export const poelSemantic = {
  primary: poelColors.flame,
  primaryHover: poelColors.coral,
  primaryActive: poelColors.ember,
  textOnLight: poelColors.navy,
  textMuted: poelColors.slate,
  border: poelColors.mist,
  surface: poelColors.offWhite,
  pageBg: poelColors.offWhite,
} as const;

/** Public paths (served from /public) — ELSIAA lion mark */
export const brandLogoFiles = {
  full: "/assets/elsiaa-lion.png",
  icon: "/assets/elsiaa-lion.png",
} as const;

/** @deprecated Use brandLogoFiles */
export const poelLogoFiles = brandLogoFiles;

/** Inline <style> block for light-mode invoice / payment emails */
export function poelLightInvoiceEmailStyles(): string {
  const c = poelSemantic;
  return `
    body { font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: ${c.textOnLight}; background: ${poelColors.offWhite}; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: ${poelColors.white}; padding: 24px; }
    .header { text-align: center; padding: 24px 0; border-bottom: 2px solid ${c.primary}; }
    .header img { max-width: 220px; height: auto; margin-bottom: 8px; }
    .breakdown { margin: 20px 0; }
    .breakdown table { width: 100%; border-collapse: collapse; }
    .breakdown th, .breakdown td { padding: 10px; text-align: left; border-bottom: 1px solid ${c.border}; }
    .breakdown th { background: ${poelColors.offWhite}; }
    .total { font-weight: bold; font-size: 1.1em; }
    .pay-button { display: inline-block; padding: 16px 36px; background: ${c.primary}; color: ${poelColors.white} !important; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 24px 0; text-align: center; }
    a.pay-button, a.pay-button:link, a.pay-button:visited, a.pay-button:hover, a.pay-button:active { color: ${poelColors.white} !important; }
    a.pay-button:hover { background: ${c.primaryHover} !important; }
    .button-container { text-align: center; margin: 28px 0; }
    .footer { text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid ${c.border}; color: ${c.textMuted}; font-size: 0.9em; }
  `.trim();
}

/** Extra styles for paid receipt emails (send-receipt): banner + watermark + lead copy */
export function poelPaidReceiptEmailStyles(): string {
  const c = poelSemantic;
  return `
    .receipt-paid-banner {
      margin: 0 0 20px 0;
      padding: 18px 16px;
      text-align: center;
      background: linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%);
      border: 3px solid #22c55e;
      border-radius: 10px;
    }
    .receipt-paid-banner-title {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      color: #14532d;
      letter-spacing: 0.04em;
      line-height: 1.2;
    }
    .receipt-paid-banner-sub {
      margin: 10px 0 0 0;
      font-size: 14px;
      font-weight: 600;
      color: #166534;
      line-height: 1.45;
    }
    .receipt-watermark {
      margin: 8px 0 16px 0;
      text-align: center;
      font-size: 56px;
      font-weight: 900;
      line-height: 1;
      letter-spacing: 10px;
      color: #bbf7d0;
      text-transform: uppercase;
      user-select: none;
    }
    .receipt-lead {
      margin: 0 0 20px 0;
      padding: 14px 16px;
      font-size: 15px;
      line-height: 1.55;
      color: ${c.textOnLight};
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid ${c.border};
      border-left: 4px solid #22c55e;
    }
    .receipt-lead strong { color: #14532d; }
    .receipt-ref-note {
      font-size: 12px;
      color: ${c.textMuted};
      margin-top: 6px;
      line-height: 1.4;
    }
  `.trim();
}

/** Light admin / notification email shell (contact form, payments alert, etc.) */
export function poelLightNotificationEmailStyles(): string {
  const c = poelSemantic;
  return `
    body { font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: ${c.textOnLight}; background: ${poelColors.offWhite}; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${poelColors.white}; padding: 28px 20px; text-align: center; border-radius: 12px 12px 0 0; border: 1px solid ${c.border}; border-bottom: none; }
    .header img { max-width: 200px; height: auto; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 22px; color: ${c.textOnLight}; font-weight: 700; }
    .content { background: ${poelColors.white}; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid ${c.border}; border-top: 1px solid ${c.border}; }
    .content p { margin: 0 0 14px 0; }
    .info-row { margin: 14px 0; padding: 12px 14px; background: ${poelColors.offWhite}; border-radius: 8px; border: 1px solid ${c.border}; }
    .info-label { font-weight: bold; color: ${c.textOnLight}; margin-bottom: 4px; }
    .info-value { color: ${c.textMuted}; }
    .footer { text-align: center; margin-top: 20px; color: ${c.textMuted}; font-size: 13px; }
    .footer p { margin: 6px 0; }
  `.trim();
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function escapeHtmlAttr(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** CTAs, fallback links, soft callouts — compose with {@link poelLightNotificationEmailStyles} */
export function poelLightTransactionalEmailUtilityStyles(): string {
  const c = poelSemantic;
  return `
    .poel-email-cta-wrap { text-align: center; margin: 28px 0 8px; }
    .poel-email-btn { display: inline-block; padding: 14px 32px; background: ${c.primary}; color: ${poelColors.white} !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; }
    a.poel-email-btn, a.poel-email-btn:link, a.poel-email-btn:visited, a.poel-email-btn:hover, a.poel-email-btn:active { color: ${poelColors.white} !important; }
    a.poel-email-btn:hover { background: ${c.primaryHover} !important; }
    .poel-email-link-fallback { margin-top: 16px; font-size: 13px; color: ${c.textMuted}; line-height: 1.5; text-align: center; }
    .poel-email-link-fallback a { color: ${c.textOnLight}; word-break: break-all; }
    .poel-email-muted-box { margin-top: 20px; padding: 14px 16px; background: ${poelColors.offWhite}; border-radius: 8px; border: 1px solid ${c.border}; font-size: 14px; color: ${c.textMuted}; line-height: 1.5; }
    .poel-email-raw-link { font-size: 13px; color: ${c.textMuted}; word-break: break-all; text-align: center; margin-top: 8px; line-height: 1.5; }
    .poel-email-raw-link a { color: ${c.textOnLight}; }
    .poel-email-alert { background: #fff5f3; border: 1px solid ${poelColors.ember}; border-radius: 8px; padding: 16px; margin: 0 0 20px 0; }
    .poel-email-alert h2 { color: ${poelColors.ember}; margin: 0 0 8px 0; font-size: 18px; font-weight: 700; }
    .poel-email-meeting-panel { margin: 24px 0; padding: 22px; background: ${poelColors.offWhite}; border: 1px solid ${c.border}; border-radius: 10px; text-align: center; border-left: 4px solid ${c.primary}; }
    .poel-email-meeting-panel .poel-email-lead { margin: 0 0 12px 0; font-weight: 700; color: ${c.textOnLight}; font-size: 15px; }
    .poel-email-meeting-hint { margin: 14px 0 0 0; font-size: 12px; color: ${c.textMuted}; line-height: 1.4; }
  `.trim();
}

export type PoelLightTransactionalEmailOptions = {
  logoUrl: string;
  brandName: string;
  title: string;
  contentHtml: string;
  /** Raw HTML for footer region; escape any user-controlled text before interpolating */
  footerInnerHtml?: string;
  extraHeadStyles?: string;
};

/** Full light-mode transactional document: ELSIAA logo header + themed body + footer */
export function renderPoelLightTransactionalEmailHtml(
  options: PoelLightTransactionalEmailOptions,
): string {
  const { logoUrl, brandName, title, contentHtml, footerInnerHtml, extraHeadStyles = "" } = options;
  const safeBrand = escapeHtml(brandName);
  const safeTitle = escapeHtml(title);
  const safeLogoAttr = escapeHtmlAttr(logoUrl);
  const footer =
    footerInnerHtml ?? `<p style="margin:0;">This is an automated message from ${safeBrand}.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>
    ${poelLightNotificationEmailStyles()}
    ${poelLightTransactionalEmailUtilityStyles()}
    ${extraHeadStyles}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${safeLogoAttr}" alt="${safeBrand} logo" width="200" style="max-width:200px;height:auto;display:block;margin:0 auto 12px;" />
      <h1>${safeTitle}</h1>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      ${footer}
    </div>
  </div>
</body>
</html>`;
}

/** Dark “system” panel (optional: admin confirmation, internal alerts) — uses navy + flame accents */
export function poelDarkPanelEmailStyles(): string {
  return `
    body { font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #e8eef4; background: ${poelColors.abyss}; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${poelColors.navy}; padding: 32px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .header img { width: 72px; height: auto; margin-bottom: 14px; }
    .header h1 { margin: 0; font-size: 24px; color: ${poelColors.white}; font-weight: 700; }
    .content { background: #152433; padding: 28px; border-radius: 0 0 12px 12px; color: #dce6ef; border: 1px solid ${poelColors.steel}; border-top: none; }
    .info-row { margin: 14px 0; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; border-left: 3px solid ${poelColors.flame}; }
    .info-label { font-weight: bold; color: ${poelColors.white}; margin-bottom: 4px; }
    .info-value { color: #c5d4e3; }
    .amount-box { margin: 20px 0; padding: 20px; background: rgba(0,0,0,0.25); border-radius: 8px; text-align: center; border: 1px solid ${poelColors.steel}; }
    .amount-value { font-size: 28px; font-weight: bold; color: #7dffb3; }
    .footer { text-align: center; margin-top: 20px; color: ${poelColors.mist}; font-size: 13px; }
  `.trim();
}
