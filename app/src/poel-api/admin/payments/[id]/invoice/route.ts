import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin as checkSuperAdmin, getCurrentUser } from "@/lib/permissions";
import { getPaymentRequestById, getRequestDisplayInfo } from "@/lib/payments";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";
import type { InvoiceLineItem } from "@/lib/invoice-line-items";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function invoiceStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "invoiced":
      return "Invoiced";
    case "completed":
      return "Paid";
    default:
      return status;
  }
}

async function assertCanViewPaymentRequest(paymentRequest: { user_id?: string | null }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (isSuperAdmin) return true;

  const dbUser = await getCurrentUser();
  if (!dbUser || dbUser.role !== "admin") return false;

  // Company admins may view invoices for payment requests tied to users in their company.
  if (paymentRequest.user_id && dbUser.company_id) {
    const { getServerSupabaseClient } = await import("@/lib/supabase");
    const supabase = getServerSupabaseClient();
    const { data } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", paymentRequest.user_id)
      .maybeSingle();
    if (data?.company_id === dbUser.company_id) return true;
  }

  // Admins who can view receipts can view invoices (same as receipt route).
  return true;
}

/** GET invoice details / PDF for a payment request (any sent status: pending, invoiced, completed). */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    const dbUser = await getCurrentUser();
    if (!isSuperAdmin && !(dbUser && dbUser.role === "admin")) {
      return NextResponse.json({ error: "Only admins can view invoices" }, { status: 403 });
    }

    const { id } = await context.params;
    const paymentRequest = await getPaymentRequestById(id);
    if (!paymentRequest) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    if (!(await assertCanViewPaymentRequest(paymentRequest))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name: recipientName, email: recipientEmail } = getRequestDisplayInfo(paymentRequest);
    const lineItems: InvoiceLineItem[] =
      paymentRequest.invoice_line_items && paymentRequest.invoice_line_items.length > 0
        ? paymentRequest.invoice_line_items
        : [];

    const invoiceNumber =
      paymentRequest.invoice_number?.toString() ??
      `INV-${paymentRequest.id.slice(0, 8).toUpperCase()}`;
    const invoiceDate = new Date(
      paymentRequest.updated_at || paymentRequest.created_at,
    ).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const statusLabel = invoiceStatusLabel(paymentRequest.status);
    const publicBase = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const payUrl = `${publicBase}/payments?public_token=${paymentRequest.public_token}`;

    const { searchParams } = new URL(request.url);
    if (searchParams.get("format") === "pdf") {
      const pdfBuffer = await generateInvoicePdfBuffer({
        invoiceNumber,
        invoiceDate,
        recipientName,
        recipientEmail,
        amount: paymentRequest.amount,
        lineItems,
        payUrl,
        statusLabel,
      });
      const filename = `Invoice_${invoiceNumber}.pdf`;
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      invoice: {
        invoiceNumber: paymentRequest.invoice_number,
        amount: paymentRequest.amount,
        lineItems,
        recipientName,
        recipientEmail,
        status: paymentRequest.status,
        statusLabel,
        date: paymentRequest.updated_at || paymentRequest.created_at,
        paymentType: paymentRequest.payment_type,
        publicToken: paymentRequest.public_token,
      },
    });
  } catch (error: unknown) {
    console.error("[payments invoice] GET", error);
    const message = error instanceof Error ? error.message : "Failed to fetch invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
