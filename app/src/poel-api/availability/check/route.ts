import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { saveAvailabilityRequest, type AvailabilityRequest } from '@/lib/kv';
import { getCurrentDateTimeInTimezone } from '@/lib/timezone';
import { getOperationalBrandName, getOperationalLogoUrl, getSmtpFromDisplayName } from '@/lib/operational-brand';
import { getPaymentContactEmail } from '@/lib/payment-branding';
import { poelLightNotificationEmailStyles } from '@/lib/poel-theme';
import { sendTransactionalMail } from '@/lib/transactional-mail';
import {
  emailSvgAlertAccent20,
  emailSvgCheckWhite16,
  emailSvgXWhite16,
} from '@/lib/transactional-visuals';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, phone, message } = body;

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const requestId = randomUUID();

    // Save request data to database
    const requestData: AvailabilityRequest = {
      id: requestId,
      name,
      email,
      company,
      phone,
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await saveAvailabilityRequest(requestData);

    // Create admin link
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const brand = getOperationalBrandName();
    const logoUrl = getOperationalLogoUrl(baseUrl, 'full');
    const linkColor = '#1c2d3f';
    const adminLink = `${baseUrl}/admin/availability/${requestId}`;
    const availableLink = `${adminLink}?response=available`;
    const unavailableLink = `${adminLink}?response=unavailable`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    ${poelLightNotificationEmailStyles()}
    .urgent-badge { display: inline-block; background: #1e6b3c; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; margin-top: 10px; }
    .message-box { margin: 20px 0; padding: 15px; background: #f5f6f8; border-left: 3px solid #1e6b3c; border-radius: 6px; border: 1px solid #b8c8d8; }
    .action-buttons { margin: 30px 0; text-align: center; }
    .button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 28px; margin: 8px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
    .title-row { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 10px; }
    .button-available { background: #1e6b3c; color: white !important; }
    .button-unavailable { background: #4a6680; color: white !important; }
    .timestamp { color: #4a6680; font-size: 12px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="${brand} Logo" />
      <h1 class="title-row">${emailSvgAlertAccent20}<span>Urgent: Someone Wants to Talk NOW!</span></h1>
      <div class="urgent-badge">AVAILABILITY CHECK</div>
    </div>

    <div class="content">
      <p style="font-size: 18px; color: #1c2d3f; margin-bottom: 25px;">
        <strong>${name}</strong> is checking if someone is available to talk right now.
      </p>

      <div class="info-row">
        <div class="info-label">Name</div>
        <div class="info-value">${name}</div>
      </div>

      <div class="info-row">
        <div class="info-label">Email</div>
        <div class="info-value"><a href="mailto:${email}" style="color: ${linkColor};">${email}</a></div>
      </div>

      <div class="info-row">
        <div class="info-label">Phone</div>
        <div class="info-value"><a href="tel:${phone}" style="color: ${linkColor};">${phone}</a></div>
      </div>

      ${company ? `
      <div class="info-row">
        <div class="info-label">Company</div>
        <div class="info-value">${company}</div>
      </div>
      ` : ''}

      ${message ? `
      <div class="message-box">
        <div class="info-label">Message</div>
        <div class="info-value" style="white-space: pre-wrap;">${message}</div>
      </div>
      ` : ''}

      <div class="action-buttons">
        <a href="${availableLink}" class="button button-available">${emailSvgCheckWhite16}<span>I'm Available</span></a>
        <a href="${unavailableLink}" class="button button-unavailable">${emailSvgXWhite16}<span>Not Available</span></a>
      </div>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #b8c8d8;">
        <strong>Quick Actions:</strong><br>
        <a href="mailto:${email}" style="color: ${linkColor}; text-decoration: none;">Reply via Email</a> | 
        <a href="tel:${phone}" style="color: ${linkColor}; text-decoration: none;">Call ${name}</a> | 
        <a href="${adminLink}" style="color: ${linkColor}; text-decoration: none;">View Full Details</a>
      </p>

      <div class="timestamp">
        Request made at ${getCurrentDateTimeInTimezone()}
      </div>
    </div>

    <div class="footer">
      <p>This is an urgent availability check request</p>
      <p>Please respond as soon as possible</p>
    </div>
  </div>
</body>
</html>
    `;

    const textBody = `
URGENT: Someone Wants to Talk NOW!

New Availability Check Request from ${brand}

Name: ${name}
Email: ${email}
Company: ${company || 'Not provided'}
Phone: ${phone}

Message:
${message || 'Not provided'}

Click one of these links to respond:

I'm Available: ${availableLink}
Not Available: ${unavailableLink}

View Full Details: ${adminLink}

Quick Actions:
Reply via Email: ${email}
Call: ${phone}

---
Request made at ${getCurrentDateTimeInTimezone()}
    `;

    const zohoEmail = process.env.ZOHO_EMAIL || getPaymentContactEmail();
    const sent = await sendTransactionalMail({
      from: `"${getSmtpFromDisplayName()}" <${zohoEmail}>`,
      to: 'hshloimie@gmail.com',
      subject: `URGENT: ${name} wants to talk NOW!${company ? ` (${company})` : ''}`,
      html: htmlBody,
      text: textBody,
      replyTo: email,
    });

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send notification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, requestId });
  } catch (error) {
    console.error('Error processing availability check:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
