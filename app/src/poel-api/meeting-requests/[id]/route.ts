import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { confirmMeetingRequest, getMeetingRequest } from '@/lib/meeting-scheduling';
import { requireCompanyAdmin, isSuperAdmin } from '@/lib/permissions';
import { formatDateTimeInTimezone, getCurrentDateTimeInTimezone } from '@/lib/timezone';
import { getPaymentContactEmail } from '@/lib/payment-branding';
import {
  getOperationalBrandName,
  getOperationalLogoUrl,
  getOperationalTeamLine,
  getSmtpFromDisplayName,
} from '@/lib/operational-brand';
import { escapeHtml, escapeHtmlAttr, renderPoelLightTransactionalEmailHtml } from '@/lib/poel-theme';
import { sendTransactionalMail } from '@/lib/transactional-mail';

// PATCH - Confirm a meeting request (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const superAdmin = await isSuperAdmin();
    const companyAdmin = await requireCompanyAdmin().catch(() => null);

    if (!superAdmin && !companyAdmin) {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { selectedSlot } = body;

    if (!selectedSlot) {
      return NextResponse.json(
        { error: 'selectedSlot is required' },
        { status: 400 }
      );
    }

    // Confirm the meeting request
    const result = await confirmMeetingRequest(id, selectedSlot, userId);

    // Generate meeting link
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const meetingLink = `${baseUrl}/meetings/${result.meetingId}/join`;
    const brand = getOperationalBrandName();
    const logoUrl = getOperationalLogoUrl(baseUrl, 'full');
    const meetingLinkAttr = escapeHtmlAttr(meetingLink);

    // Send confirmation email to user - format date/time in timezone
    const formattedDateTime = formatDateTimeInTimezone(selectedSlot);
    // Split for separate display in email
    const confirmedDate = new Date(selectedSlot);
    const formattedDate = confirmedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/New_York',
    });
    const formattedTime = confirmedDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
    }) + ' ET';

    const attendeeName = result.meetingRequest.name;
    const contentHtml = `
      <p>Hi ${escapeHtml(attendeeName)},</p>
      <p>Your meeting request has been confirmed.</p>
      <div class="info-row">
        <div class="info-label">Confirmed date and time</div>
        <div class="info-value">${escapeHtml(formattedDate)} at ${escapeHtml(formattedTime)}</div>
      </div>
      <div class="poel-email-meeting-panel">
        <p class="poel-email-lead">Join the meeting</p>
        <a class="poel-email-btn" href="${meetingLinkAttr}">Join meeting</a>
        <p class="poel-email-meeting-hint" style="word-break:break-all;margin-top:12px;"><a href="${meetingLinkAttr}">${escapeHtml(meetingLink)}</a></p>
        <p class="poel-email-meeting-hint">This is a public link. Anyone with the link can join.</p>
      </div>
      <p>We look forward to speaking with you. If you need to reschedule or have questions, reply to this email.</p>
      <p>Best regards,<br>${escapeHtml(getOperationalTeamLine())}</p>`;

    const htmlBody = renderPoelLightTransactionalEmailHtml({
      logoUrl,
      brandName: brand,
      title: 'Meeting confirmed',
      contentHtml,
      footerInnerHtml: `<p style="margin:0;">${escapeHtml(brand)}</p><p style="margin:8px 0 0;">Confirmed at ${escapeHtml(getCurrentDateTimeInTimezone())}</p>`,
    });

    const textBody = `
Meeting Confirmed!

Hi ${result.meetingRequest.name},

Great news! We've confirmed your meeting request.

Confirmed Date & Time: ${formattedDate} at ${formattedTime}

Join the Meeting:
${meetingLink}

This is a public meeting link. Anyone with this link can join.

We're looking forward to speaking with you. If you need to reschedule or have any questions, please don't hesitate to reach out.

Best regards,
${getOperationalTeamLine()}

---
Confirmed at ${getCurrentDateTimeInTimezone()}
    `;

    const zohoEmail = process.env.ZOHO_EMAIL || getPaymentContactEmail();
    const sent = await sendTransactionalMail({
      from: `"${getSmtpFromDisplayName()}" <${zohoEmail}>`,
      to: result.meetingRequest.email,
      subject: `Meeting Confirmed - ${formattedDateTime}`,
      html: htmlBody,
      text: textBody,
      replyTo: zohoEmail,
    });
    if (!sent) {
      console.error('Meeting confirmation email: transport failed');
    }

    return NextResponse.json({ 
      meetingRequest: result.meetingRequest,
      meetingId: result.meetingId,
      meetingLink: meetingLink
    });
  } catch (error) {
    console.error('Error confirming meeting request:', error);
    return NextResponse.json(
      { error: 'Failed to confirm meeting request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a meeting request (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const superAdmin = await isSuperAdmin();
    const companyAdmin = await requireCompanyAdmin().catch(() => null);

    if (!superAdmin && !companyAdmin) {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = (await import('@/lib/supabase')).getServerSupabaseClient();

    // Update status to cancelled
    const { data, error } = await supabase
      .from('meeting_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling meeting request:', error);
      return NextResponse.json(
        { error: 'Failed to cancel meeting request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ meetingRequest: data });
  } catch (error) {
    console.error('Error cancelling meeting request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel meeting request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

