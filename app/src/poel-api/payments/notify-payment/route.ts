import { NextRequest, NextResponse } from "next/server";
import { sendPaymentAdminNotifyEmail } from "@/lib/payment-admin-notify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, amount, paymentMethod, publicToken, invoiceNumber } = body as {
      customerName?: string;
      amount?: number;
      paymentMethod?: string;
      publicToken?: string | null;
      invoiceNumber?: number | null;
    };

    if (!customerName || amount == null || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sent = await sendPaymentAdminNotifyEmail({
      customerName,
      amount: typeof amount === "number" ? amount : parseFloat(String(amount)),
      paymentMethod,
      publicToken,
      invoiceNumber,
    });

    if (!sent) {
      return NextResponse.json({ error: "Failed to send notification email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending payment notification email:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
