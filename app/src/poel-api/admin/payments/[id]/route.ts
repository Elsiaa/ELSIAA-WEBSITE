import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin as checkSuperAdmin } from "@/lib/permissions";
import { getPaymentRequestById, updatePaymentRequest } from "@/lib/payments";
import { syncProjectSubscriptionFromPaymentRequestUpdate } from "@/lib/project-payments";
import { validateLineItemsForCreate } from "@/lib/invoice-line-items";

/**
 * GET /api/admin/payments/[id] - Get single payment request (super admin only).
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Only super admins can view payment request details" },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Payment request ID required" }, { status: 400 });
    }

    const request = await getPaymentRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    return NextResponse.json({ request });
  } catch (error) {
    console.error("Error fetching payment request:", error);
    return NextResponse.json({ error: "Failed to fetch payment request" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/payments/[id] - Update payment request (super admin only).
 * Body: { amount?, nextBillingDate?, recipientEmail?, recipientName? }
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Only super admins can edit payment requests" },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Payment request ID required" }, { status: 400 });
    }

    const existing = await getPaymentRequestById(id);
    if (!existing) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Parameters<typeof updatePaymentRequest>[1] = {};

    if (body.invoiceLineItems !== undefined) {
      if (body.invoiceLineItems === null) {
        updates.invoice_line_items = null;
        if (body.amount !== undefined) {
          const n = Number(body.amount);
          if (typeof n !== "number" || isNaN(n) || n < 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
          }
          updates.amount = n;
        } else {
          return NextResponse.json(
            { error: "Amount is required when removing line items" },
            { status: 400 },
          );
        }
      } else {
        const validated = validateLineItemsForCreate(body.invoiceLineItems);
        if (!validated.ok) {
          return NextResponse.json({ error: validated.error }, { status: 400 });
        }
        updates.invoice_line_items = validated.items;
      }
    } else if (body.amount !== undefined) {
      const n = Number(body.amount);
      if (typeof n !== "number" || isNaN(n) || n < 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }
      updates.amount = n;
    }

    if (body.nextBillingDate !== undefined) {
      updates.next_billing_date =
        body.nextBillingDate === "" || body.nextBillingDate == null ? null : body.nextBillingDate;
    }
    if (body.recipientEmail !== undefined) updates.recipient_email = body.recipientEmail;
    if (body.recipientName !== undefined) updates.recipient_name = body.recipientName;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await updatePaymentRequest(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update payment request" }, { status: 500 });
    }

    if (updates.amount !== undefined || updates.next_billing_date !== undefined) {
      await syncProjectSubscriptionFromPaymentRequestUpdate(id, {
        amount: updates.amount,
        next_billing_date: updates.next_billing_date,
      });
    }

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("Error updating payment request:", error);
    return NextResponse.json({ error: "Failed to update payment request" }, { status: 500 });
  }
}
