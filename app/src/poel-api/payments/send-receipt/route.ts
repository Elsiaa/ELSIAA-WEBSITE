import { NextRequest, NextResponse } from "next/server";
import { sendPaymentReceiptEmail } from "@/lib/payment-receipt-email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      public_token,
      paymentIntentId,
      amount,
      fee,
      total,
      paymentMethod,
      recipientEmail,
      recipientName,
      invoiceNumber,
      chargeName,
    } = body;

    if (!recipientEmail) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    const sent = await sendPaymentReceiptEmail({
      publicToken: public_token,
      paymentIntentId,
      amount: Number(amount),
      fee: fee != null ? Number(fee) : 0,
      total: Number(total),
      paymentMethod: paymentMethod || "card",
      recipientEmail,
      recipientName: recipientName || "Customer",
      invoiceNumber,
      chargeName,
    });

    if (!sent) {
      return NextResponse.json({ error: "Failed to send receipt email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, invoiceNumber: invoiceNumber ?? null });
  } catch (error) {
    console.error("Error sending receipt:", error);
    return NextResponse.json(
      {
        error: "Failed to send receipt",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
