import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updatePaymentRequestStatus } from '@/lib/payments';
import { getCurrentDateTimeInTimezone } from '@/lib/timezone';
import { getPaymentCompanyName, getPaymentContactEmail, getPaymentContactPhone } from '@/lib/payment-branding';
import { readOperationalLogoBase64ForPdf, getOperationalLogoUrl } from '@/lib/operational-brand';
import { poelLightInvoiceEmailStyles, poelDarkPanelEmailStyles } from '@/lib/poel-theme';
import { sendTransactionalMail } from '@/lib/transactional-mail';
import { getPaymentAdminNotifyEmail, getPaymentOperationsBcc, getPaymentTransactionalFrom } from '@/lib/payment-mail';
import {
  PAYMENT_METHOD_LABEL_ACH,
  PAYMENT_METHOD_LABEL_CARD,
} from '@/lib/payment-method-labels';
import { resolvePaymentIntentRail } from '@/lib/stripe-payment-rail';

function initializePdfMake() {
  try {
    const pdfMake = require('pdfmake/build/pdfmake');
    const pdfFonts = require('pdfmake/build/vfs_fonts');
    
    if (pdfFonts?.pdfMake?.vfs) {
      pdfMake.vfs = pdfFonts.pdfMake.vfs;
    } else if (pdfFonts?.vfs) {
      pdfMake.vfs = pdfFonts.vfs;
    } else if (pdfFonts) {
      pdfMake.vfs = pdfFonts;
    }
    
    return pdfMake;
  } catch (error) {
    console.error('Error loading pdfMake fonts:', error);
    throw new Error('Failed to initialize PDF library');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, originalAmount, fee, total, paymentIntentId, public_token } = await request.json();

    console.log('[SEND-INVOICE] Request received', {
      hasName: !!name,
      hasEmail: !!email,
      originalAmount,
      fee,
      total,
      paymentIntentId,
      public_token
    });

    if (!name || !email || originalAmount == null || fee == null || total == null ||
        isNaN(originalAmount) || isNaN(fee) || isNaN(total) ||
        originalAmount <= 0 || fee < 0 || total <= 0) {
      console.error('[SEND-INVOICE] Validation failed', {
        name: !!name,
        email: !!email,
        originalAmount,
        fee,
        total,
        originalAmountValid: originalAmount != null && !isNaN(originalAmount) && originalAmount > 0,
        feeValid: fee != null && !isNaN(fee) && fee >= 0,
        totalValid: total != null && !isNaN(total) && total > 0
      });
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    const isDummy = paymentIntentId.startsWith('DUMMY');
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const invoiceDate = new Date().toLocaleDateString();

    let displayMethod: string;
    if (isDummy) {
      const dummyMethod = paymentIntentId.includes('wire') ? 'Wire' : 'Zelle';
      displayMethod = `${dummyMethod} Transfer`;
    } else {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: ['payment_method'],
        });
        const rail = await resolvePaymentIntentRail(stripe, pi);
        displayMethod =
          rail === 'ach' ? PAYMENT_METHOD_LABEL_ACH : PAYMENT_METHOD_LABEL_CARD;
      } catch (e) {
        console.error('[SEND-INVOICE] Could not resolve payment method from Stripe', e);
        displayMethod = PAYMENT_METHOD_LABEL_CARD;
      }
    }

    // For dummy, ensure fee=0, total=originalAmount
    const effectiveFee = isDummy ? 0 : fee;
    const effectiveTotal = isDummy ? originalAmount : total;

    const publicBase = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const logoFullUrl = getOperationalLogoUrl(publicBase, 'full');

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${poelLightInvoiceEmailStyles()}
          .pay-button { padding: 20px 40px; font-size: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoFullUrl}" alt="${getPaymentCompanyName()} Logo" />
            <h1>Invoice</h1>
          </div>

          <div style="display: flex; justify-content: space-between; margin: 20px 0;">
            <div>
              <p><strong>Bill To:</strong></p>
              <p>${name}</p>
              <p>${email}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
              <p><strong>Date:</strong> ${invoiceDate}</p>
              <p><strong>Payment Method:</strong> ${displayMethod}</p>
            </div>
          </div>

          <div class="breakdown">
            <h3>Payment Details</h3>
            <table>
              <tr>
                <th>Service Amount</th>
                <td>$${originalAmount.toFixed(2)}</td>
              </tr>
              ${effectiveFee > 0 ? `<tr><th>Processing Fee (3%)</th><td>$${effectiveFee.toFixed(2)}</td></tr>` : ''}
              <tr class="total">
                <th>Total Due</th>
                <td>$${effectiveTotal.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          ${public_token ? `
          <div class="button-container">
            <a href="${publicBase}/payments?public_token=${public_token}" class="pay-button">Pay Now - $${effectiveTotal.toFixed(2)}</a>
          </div>
          ` : `
          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f5f6f8; border-radius: 8px; border: 1px solid #b8c8d8;">
            <p style="font-size: 18px; font-weight: bold; margin: 0;">Please complete your payment via ${displayMethod.toLowerCase()} to settle this invoice.</p>
          </div>
          `}

          <div class="footer">
            <p>If you have any questions, please contact us at ${getPaymentContactEmail()} or ${getPaymentContactPhone()}.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
${getPaymentCompanyName()} Invoice

Bill To: ${name}
Email: ${email}

Invoice #: ${invoiceNumber}
Date: ${invoiceDate}
Payment Method: ${displayMethod}

Payment Details:
Service Amount: $${originalAmount.toFixed(2)}
${effectiveFee > 0 ? `Processing Fee (3%): $${effectiveFee.toFixed(2)}` : ''}
Total Due: $${effectiveTotal.toFixed(2)}

${public_token ? `PAY NOW: ${publicBase}/payments?public_token=${public_token}` : `Please complete your payment via ${displayMethod.toLowerCase()} to settle this invoice.`}

If you have any questions, please contact us at ${getPaymentContactEmail()} or ${getPaymentContactPhone()}.
    `;

    // Load logo image and convert to base64 for pdfmake
    // pdfmake accepts base64 strings directly (without data URI prefix)
    const logoImage = readOperationalLogoBase64ForPdf();
    if (logoImage) {
      console.log('[SEND INVOICE] Operational logo loaded for PDF');
    } else {
      console.warn('[SEND INVOICE] No operational logo file found in public/');
    }

    // Generate PDF using pdfmake
    const docDefinition: any = {
      content: [
        // Header with Logo
        ...(logoImage ? [{
          image: 'logo.png', // Reference from vfs
          width: 150,
          alignment: 'center',
          margin: [0, 0, 0, 10],
          fit: [150, 75] // Maintain aspect ratio
        }] : [{
          text: getPaymentCompanyName(),
          style: 'header',
          alignment: 'center'
        }]),
        { text: `${getPaymentContactEmail()} | ${getPaymentContactPhone()}`, style: 'subheader', alignment: 'center' },
        { text: 'INVOICE', style: 'title', alignment: 'center', margin: [0, 20, 0, 20] },
        {
          columns: [
            {
              stack: [
                { text: 'Bill To:', bold: true },
                { text: name },
                { text: email }
              ]
            },
            {
              stack: [
                { text: 'Invoice Details:', bold: true, alignment: 'right' },
                { text: `Invoice #: ${invoiceNumber}`, alignment: 'right' },
                { text: `Date: ${invoiceDate}`, alignment: 'right' },
                { text: `Payment Method: ${displayMethod}`, alignment: 'right' },
                !isDummy && { text: `Payment ID: ${paymentIntentId}`, alignment: 'right' }
              ],
              alignment: 'right'
            }
          ],
          margin: [0, 20, 0, 20]
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              [{ text: 'Payment Breakdown', colSpan: 2, bold: true }, {}],
              ['Service Amount', `$${originalAmount.toFixed(2)}`],
              ...(effectiveFee > 0 ? [['Processing Fee (3%)', `$${effectiveFee.toFixed(2)}`]] : []),
              [{ text: 'Total Due', bold: true }, { text: `$${effectiveTotal.toFixed(2)}`, bold: true, alignment: 'right' }]
            ]
          },
          layout: 'lightHorizontalLines'
        },
        {
          text: [
            `Please complete your payment via ${displayMethod.toLowerCase()} to settle this invoice.`,
            `\nIf you have any questions, please contact us at ${getPaymentContactEmail()} or ${getPaymentContactPhone()}.`
          ],
          style: 'footer',
          alignment: 'center',
          margin: [0, 40, 0, 0]
        }
      ],
      styles: {
        header: { fontSize: 24, bold: true, color: '#1e6b3c', margin: [0, 0, 0, 10] },
        subheader: { fontSize: 10, color: '#666' },
        title: { fontSize: 18, bold: true },
        footer: { fontSize: 10, color: '#666', italics: true }
      },
      defaultStyle: { fontSize: 12 }
    };

    const pdfMake = initializePdfMake();
    
    // Add logo to vfs if available
    if (logoImage) {
      pdfMake.vfs = pdfMake.vfs || {};
      pdfMake.vfs['logo.png'] = logoImage;
      console.log('[SEND INVOICE] Logo added to pdfmake vfs');
    }
    
    const pdfDoc = pdfMake.createPdf(docDefinition);
    // pdfmake's getBuffer requires a callback function
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      pdfDoc.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });
    });

    const customerSent = await sendTransactionalMail({
      from: getPaymentTransactionalFrom(),
      to: email,
      bcc: getPaymentOperationsBcc(),
      subject: `Invoice for Your Payment - ${invoiceNumber} (PDF Attached)`,
      html: htmlBody,
      text: textBody,
      attachments: [
        {
          filename: 'invoice.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    if (!customerSent) {
      return NextResponse.json({ error: 'Failed to send invoice email' }, { status: 500 });
    }

    // Send confirmation email to admin
    const logoIconUrl = getOperationalLogoUrl(publicBase, 'icon');

    const adminHtmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    ${poelDarkPanelEmailStyles()}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoIconUrl}" alt="${getPaymentCompanyName()} Logo" />
      <h1>Invoice Sent Confirmation</h1>
    </div>

    <div class="content">
      <p>An invoice has been sent to a customer.</p>
      
      <div class="info-row">
        <div class="info-label">Customer Name:</div>
        <div class="info-value">${name}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">Customer Email:</div>
        <div class="info-value">${email}</div>
      </div>
      
      <div class="amount-box">
        <div class="info-label" style="margin-bottom: 10px;">Invoice Amount:</div>
        <div class="amount-value">$${effectiveTotal.toFixed(2)}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">Invoice Number:</div>
        <div class="info-value">${invoiceNumber}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">Payment Method:</div>
        <div class="info-value">${displayMethod}</div>
      </div>
      
      ${paymentIntentId && !isDummy ? `
      <div class="info-row">
        <div class="info-label">Payment Intent ID:</div>
        <div class="info-value">${paymentIntentId}</div>
      </div>
      ` : ''}
      
      <div class="footer">
        <p>Invoice sent at ${getCurrentDateTimeInTimezone()}</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const adminTextBody = `
Invoice Sent Confirmation - ${getPaymentCompanyName()}

An invoice has been sent to a customer.

Customer Name: ${name}
Customer Email: ${email}
Invoice Amount: $${effectiveTotal.toFixed(2)}
Invoice Number: ${invoiceNumber}
Payment Method: ${displayMethod}
${paymentIntentId && !isDummy ? `Payment Intent ID: ${paymentIntentId}` : ''}

Invoice sent at ${getCurrentDateTimeInTimezone()}
    `;

    try {
      const adminSent = await sendTransactionalMail({
        from: getPaymentTransactionalFrom(),
        to: getPaymentAdminNotifyEmail(),
        subject: `Invoice Sent: $${effectiveTotal.toFixed(2)} to ${name} (${invoiceNumber})`,
        html: adminHtmlBody,
        text: adminTextBody,
      });
      if (adminSent) {
        console.log('[SEND-INVOICE] Confirmation email sent to admin');
      } else {
        console.error('[SEND-INVOICE] Admin confirmation email transport failed');
      }
    } catch (adminEmailError) {
      console.error('[SEND-INVOICE] Failed to send confirmation email to admin:', adminEmailError);
    }

    // If public_token provided, update status to 'invoiced'
    if (public_token) {
      try {
        await updatePaymentRequestStatus(public_token, 'invoiced');
      } catch (updateError) {
        console.error('Failed to update payment request status:', updateError);
        // Don't fail the whole operation, just log
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 });
  }
}
