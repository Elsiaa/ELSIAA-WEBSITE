/**
 * Server-side invitation system
 * Sends invitation emails to new users
 * This file should ONLY be imported in server components or API routes
 */

import { generateInvitationToken } from './invitations';
import {
    getOperationalBrandName,
    getOperationalLogoUrl,
    getOperationalPlatformName,
    getOperationalTeamLine,
    getSmtpFromDisplayName,
    getTransactionalSenderEmail,
} from '@/lib/operational-brand';
import { sendTransactionalMail } from '@/lib/transactional-mail';
import { escapeHtml, escapeHtmlAttr, renderPoelLightTransactionalEmailHtml } from '@/lib/poel-theme';

interface SendInvitationParams {
    email: string;
    firstName?: string;
    lastName?: string;
    companyName: string;
    companyId: string;
    inviterName?: string;
    projectName?: string;
}

/**
 * Send invitation email to a new user
 */
export async function sendInvitationEmail(params: SendInvitationParams): Promise<boolean> {
    const { email, firstName, lastName, companyName, companyId, inviterName } = params;

    // Generate invitation token
    const token = generateInvitationToken(email, companyId);

    const baseUrl = (
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.AUTH_URL ||
        process.env.VITE_SITE_URL ||
        'http://localhost:3000'
    ).replace(/\/$/, '');
    const signupUrl = `${baseUrl}/sign-up?invitation=${encodeURIComponent(token)}`;
    const brand = getOperationalBrandName();
    const platform = getOperationalPlatformName();
    const logoUrl = getOperationalLogoUrl(baseUrl, 'full');

    const userName = firstName && lastName
        ? `${firstName} ${lastName}`
        : firstName || lastName || email.split('@')[0];

    const subject = `You've been invited to join ${companyName}`;

    const inviteLead = inviterName
        ? `${escapeHtml(inviterName)} has`
        : 'You have been';
    const safeSignupAttr = escapeHtmlAttr(signupUrl);

    const contentHtml = `
      <p>Hi ${escapeHtml(userName)},</p>
      <p>${inviteLead} invited to collaborate on <strong>${escapeHtml(companyName)}</strong> projects on the ${escapeHtml(platform)}.</p>
      <p>To begin, open the link below and <strong>choose a password</strong> for this email. You will then sign in with that password (or with Google or Microsoft if you prefer).</p>
      <div class="poel-email-cta-wrap">
        <a href="${safeSignupAttr}" class="poel-email-btn">Create account</a>
      </div>
      <p class="poel-email-link-fallback" style="margin-top:4px;">Or paste this link into your browser:</p>
      <div class="poel-email-raw-link"><a href="${safeSignupAttr}">${escapeHtml(signupUrl)}</a></div>
      <p>Once you sign up with <strong>${escapeHtml(email)}</strong>, you will have access to ${escapeHtml(companyName)}&rsquo;s projects, files, and collaboration tools on the ${escapeHtml(platform)}.</p>
      <p>If you have any questions, contact your administrator.</p>
      <p>Best regards,<br>${escapeHtml(getOperationalTeamLine())}</p>`;

    const htmlBody = renderPoelLightTransactionalEmailHtml({
        logoUrl,
        brandName: brand,
        title: `Welcome to ${brand}`,
        contentHtml,
        footerInnerHtml: `<p style="margin:0;">This invitation was sent to ${escapeHtml(email)}</p><p style="margin:8px 0 0;">If you did not expect this email, you can ignore it.</p>`,
    });

    const textBody = `
Hi ${userName},

${inviterName ? `${inviterName} has` : 'You have been'} invited to collaborate on ${companyName} projects on the ${platform}.

Open this link to choose your password and activate your account: ${signupUrl}

Or paste this link: ${signupUrl}

Once you sign up with the email ${email}, you'll gain access to ${companyName}'s projects, files, and collaboration tools on the ${platform}.

If you have any questions, feel free to reach out to your administrator.

Best regards,
${getOperationalTeamLine()}

---
This invitation was sent to ${email}
If you didn't expect this email, you can safely ignore it.
`;

    return sendTransactionalMail({
        to: email,
        subject,
        html: htmlBody,
        text: textBody,
        from: `"${getSmtpFromDisplayName()}" <${getTransactionalSenderEmail()}>`,
    });
}
