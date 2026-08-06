import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createMeetingRequest, getMeetingRequests } from "@/lib/meeting-scheduling";
import { requireCompanyAdmin, isSuperAdmin } from "@/lib/permissions";
import {
  formatTimeSlotsForEmail,
  formatTimeSlotsForTextEmail,
  getCurrentDateTimeInTimezone,
} from "@/lib/timezone";
import {
  getOperationalBrandName,
  getOperationalLogoUrl,
  getSmtpFromDisplayName,
} from "@/lib/operational-brand";
import { getPaymentContactEmail } from "@/lib/payment-branding";
import { sendTransactionalMail } from "@/lib/transactional-mail";
import {
  poelLightNotificationEmailStyles,
  poelLightTransactionalEmailUtilityStyles,
} from "@/lib/poel-theme";

// POST - Create a meeting request (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, phone, message, selectedTimeSlots } = body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !phone ||
      !selectedTimeSlots ||
      !Array.isArray(selectedTimeSlots) ||
      selectedTimeSlots.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, email, phone, and at least one time slot are required",
        },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Create the meeting request
    let meetingRequest;
    try {
      meetingRequest = await createMeetingRequest({
        name,
        email,
        company,
        phone,
        message,
        selectedTimeSlots,
      });
    } catch (error) {
      console.error("Error creating meeting request in database:", error);
      return NextResponse.json(
        {
          error: "Failed to create meeting request",
          details: error instanceof Error ? error.message : "Database error occurred",
        },
        { status: 500 },
      );
    }

    // Send email notification to admin (don't fail the request if email fails)
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(
        /\/$/,
        "",
      );
      const calendarUrl = `${baseUrl}/admin/calendar`;
      const brand = getOperationalBrandName();
      const logoUrl = getOperationalLogoUrl(baseUrl, "full");
      const linkColor = "#1c2d3f";

      // Format selected time slots for display using timezone utilities
      const formattedSlots = formatTimeSlotsForEmail(selectedTimeSlots);

      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    ${poelLightNotificationEmailStyles()}
    ${poelLightTransactionalEmailUtilityStyles()}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="${brand} Logo" />
      <h1>New Meeting Request</h1>
    </div>

    <div class="content">
      <p>You have received a new meeting request from the ${brand} website.</p>

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

      ${
        company
          ? `
      <div class="info-row">
        <div class="info-label">Company</div>
        <div class="info-value">${company}</div>
      </div>
      `
          : ""
      }

      <div class="info-row">
        <div class="info-label">Selected Time Slots (${selectedTimeSlots.length})</div>
        <div class="info-value">${formattedSlots}</div>
      </div>

      ${
        message
          ? `
      <div class="info-row">
        <div class="info-label">Message</div>
        <div class="info-value" style="white-space: pre-wrap;">${message}</div>
      </div>
      `
          : ""
      }

      <div class="poel-email-cta-wrap" style="margin: 30px 0;">
        <a href="${calendarUrl}" class="poel-email-btn">View &amp; confirm on calendar</a>
      </div>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #b8c8d8;">
        <strong>Quick Actions:</strong><br>
        <a href="mailto:${email}" style="color: ${linkColor}; text-decoration: none;">Reply via Email</a> | 
        <a href="tel:${phone}" style="color: ${linkColor}; text-decoration: none;">Call ${name}</a>
      </p>
    </div>

    <div class="footer">
      <p>This email was sent from the ${brand} meeting request system</p>
      <p>Request submitted at ${getCurrentDateTimeInTimezone()}</p>
    </div>
  </div>
</body>
</html>
      `;

      const textBody = `
New Meeting Request from ${brand}

Name: ${name}
Email: ${email}
Phone: ${phone}
${company ? `Company: ${company}` : ""}

Selected Time Slots (${selectedTimeSlots.length}):
${formatTimeSlotsForTextEmail(selectedTimeSlots)}

${message ? `Message: ${message}` : ""}

View & Confirm Time: ${calendarUrl}

---
Request submitted at ${getCurrentDateTimeInTimezone()}
Reply to: ${email}
      `;

      const zohoEmail = process.env.ZOHO_EMAIL || getPaymentContactEmail();
      const sent = await sendTransactionalMail({
        from: `"${getSmtpFromDisplayName()}" <${zohoEmail}>`,
        to: "hshloimie@gmail.com",
        subject: `New Meeting Request from ${name}${company ? ` (${company})` : ""} - ${selectedTimeSlots.length} time slot${selectedTimeSlots.length !== 1 ? "s" : ""}`,
        html: htmlBody,
        text: textBody,
        replyTo: email,
      });
      if (!sent) {
        console.error("Meeting request notification email: transport failed");
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Error sending meeting request notification email:", emailError);
    }

    return NextResponse.json({ meetingRequest }, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting request:", error);
    return NextResponse.json(
      {
        error: "Failed to create meeting request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET - Get all meeting requests (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const superAdmin = await isSuperAdmin();
    const companyAdmin = await requireCompanyAdmin().catch(() => null);

    if (!superAdmin && !companyAdmin) {
      return NextResponse.json({ error: "Forbidden - admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "pending" | "confirmed" | "cancelled" | undefined;

    const requests = await getMeetingRequests(status);

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error getting meeting requests:", error);
    return NextResponse.json(
      {
        error: "Failed to get meeting requests",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
