import { NextRequest, NextResponse } from "next/server";
import {
  getPdfSignatureRequestByToken,
  getPdfKeyFromUrl,
  getSignaturesForRequest,
} from "@/lib/pdf-signatures";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2";
import {
  getOperationalBrandName,
  getOperationalLogoUrl,
  getOperationalTeamLine,
  getSmtpFromDisplayName,
  getTransactionalSenderEmail,
} from "@/lib/operational-brand";
import { getPaymentContactEmail } from "@/lib/payment-branding";
import { escapeHtml, renderPoelLightTransactionalEmailHtml } from "@/lib/poel-theme";
import { sendTransactionalMail } from "@/lib/transactional-mail";

async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as any) {
    if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk));
    } else {
      chunks.push(Buffer.from(chunk));
    }
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email : undefined;

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Get the PDF signature request
    const request = await getPdfSignatureRequestByToken(token);
    if (!request || !request.pdf_file_url) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    // Check if the document is fully signed (all fields completed)
    // Only use signed PDF if the request status is 'completed' (meaning ALL fields are filled)
    const isSigned = request.status === "completed";

    // Get signed PDF URL if document is fully signed
    let pdfUrl = request.pdf_file_url;
    if (isSigned) {
      const signatures = await getSignaturesForRequest(request.id);
      const signedPdfUrl =
        signatures.length > 0 && signatures[0].signed_pdf_url ? signatures[0].signed_pdf_url : null;
      if (signedPdfUrl) {
        pdfUrl = signedPdfUrl;
      }
    }

    const key = getPdfKeyFromUrl(pdfUrl);

    // Fetch PDF from R2
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const object = await r2Client.send(command);
    if (!object.Body) {
      return NextResponse.json({ error: "Failed to load PDF" }, { status: 500 });
    }

    const pdfBuffer = await streamToBuffer(object.Body);

    const subject = isSigned
      ? `Your signed document: ${request.title}`
      : `Your document: ${request.title}`;

    const team = getOperationalTeamLine();
    const docBrand = getOperationalBrandName();
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const logoUrl = getOperationalLogoUrl(baseUrl, "full");
    const docLabel = isSigned ? "signed document" : "document";

    const contentHtml = `
      <p>Hello,</p>
      <p>Please find attached your ${docLabel}: <strong>${escapeHtml(request.title)}</strong></p>
      <p>If you have any questions, contact us anytime.</p>
      <p>Best regards,<br>${escapeHtml(team)}</p>`;

    const htmlBody = renderPoelLightTransactionalEmailHtml({
      logoUrl,
      brandName: docBrand,
      title: "Your document",
      contentHtml,
      footerInnerHtml:
        '<p style="margin:0;">This is an automated email. Please do not reply to this message.</p>',
    });

    const textBody = `
Document from ${docBrand}

Hello,

Please find attached your ${isSigned ? "signed" : ""} document: ${request.title}

If you have any questions, please don't hesitate to contact us.

Best regards,
The ${team}

---
This is an automated email. Please do not reply to this message.
    `;

    const sent = await sendTransactionalMail({
      from: `"${getSmtpFromDisplayName()}" <${getTransactionalSenderEmail()}>`,
      to: email,
      subject,
      html: htmlBody,
      text: textBody,
      attachments: [
        {
          filename: `${request.title.replace(/[^a-z0-9]/gi, "_")}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    if (!sent) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error sending PDF via email:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    );
  }
}
