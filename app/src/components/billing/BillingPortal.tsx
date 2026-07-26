import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  History,
  ShieldAlert,
} from "lucide-react";
import { ops, opsFonts } from "../../lib/billing/ops-theme";
import {
  BILLING_GRACE_DAYS,
  formatUsd,
  type Bill,
  type BillCharge,
  type BillingAccountStatus,
  type SavedPaymentMethod,
} from "../../lib/billing/types";

type Props = {
  status: BillingAccountStatus;
  openBills: Bill[];
  methods: SavedPaymentMethod[];
  history: BillCharge[];
  stripeReady: boolean;
  /** When true, show admin-oriented empty copy */
  admin?: boolean;
};

export function BillingPortal({
  status,
  openBills,
  methods,
  history,
  stripeReady,
  admin = false,
}: Props) {
  const { sans } = opsFonts;
  const isSuspended =
    !status.allUpToDate && status.maxDaysOverdue > BILLING_GRACE_DAYS;
  const isWarning =
    !status.allUpToDate && status.maxDaysOverdue <= BILLING_GRACE_DAYS;
  const daysLeft = isWarning ? BILLING_GRACE_DAYS - status.maxDaysOverdue : 0;

  return (
    <div className="space-y-6" style={sans}>
      {/* Status */}
      {status.allUpToDate ? (
        <div
          className="flex items-start gap-3 rounded-lg border-2 p-4"
          style={{
            borderColor: `${ops.flame}59`,
            background: `${ops.flame}0d`,
          }}
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" style={{ color: ops.flame }} />
          <div>
            <p className="font-semibold" style={{ color: ops.navy }}>
              Billing up to date
            </p>
            <p className="mt-0.5 text-sm" style={{ color: ops.slate }}>
              All payments are current. Access is in good standing.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="flex items-start gap-3 rounded-lg border-2 p-4"
          style={{ borderColor: "#dc2626e6", background: ops.dangerBg }}
          role="alert"
        >
          {isSuspended ? (
            <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
          ) : (
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
          )}
          <div>
            <p className="font-semibold text-red-900">
              {isSuspended
                ? "Access suspended"
                : `Payment overdue — ${daysLeft} day(s) until suspension`}
            </p>
            <p className="mt-1 text-sm text-red-800">
              {status.overdueBills} overdue bill(s). Pay below to restore access.
            </p>
          </div>
        </div>
      )}

      {!stripeReady && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            borderColor: ops.mist,
            background: ops.white,
            color: ops.slate,
          }}
        >
          Stripe is not connected yet. Add{" "}
          <code className="rounded px-1" style={{ background: ops.offWhite }}>
            STRIPE_SECRET_KEY
          </code>{" "}
          and{" "}
          <code className="rounded px-1" style={{ background: ops.offWhite }}>
            VITE_STRIPE_PUBLISHABLE_KEY
          </code>{" "}
          when you&apos;re ready to take payments.
        </div>
      )}

      {/* Open bills */}
      <section
        className="overflow-hidden rounded-lg border"
        style={{ borderColor: ops.mist, background: ops.white }}
      >
        <header className="border-b px-5 py-4" style={{ borderColor: ops.mist }}>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" style={{ color: ops.flame }} />
            <h2 className="text-lg font-semibold" style={{ color: ops.navy }}>
              Bills
            </h2>
          </div>
          <p className="mt-1 text-sm" style={{ color: ops.slate }}>
            One-time invoices and recurring subscriptions. Pay with a saved method or an
            invoice link — no account required for link payments.
          </p>
        </header>
        <div className="p-5">
          {openBills.length === 0 ? (
            <p className="text-sm" style={{ color: ops.slate }}>
              {admin
                ? "No bills yet. Create one-time or recurring bills once the database is connected."
                : "No open bills. You’re all clear."}
            </p>
          ) : (
            <ul className="space-y-3">
              {openBills.map((bill) => (
                <BillRow key={bill.id} bill={bill} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Payment methods */}
      <section
        className="overflow-hidden rounded-lg border"
        style={{ borderColor: ops.mist, background: ops.white }}
      >
        <header className="border-b px-5 py-4" style={{ borderColor: ops.mist }}>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" style={{ color: ops.flame }} />
            <h2 className="text-lg font-semibold" style={{ color: ops.navy }}>
              Payment methods
            </h2>
          </div>
          <p className="mt-1 text-sm" style={{ color: ops.slate }}>
            Cards and bank accounts for auto-charge subscriptions.
          </p>
        </header>
        <div className="p-5">
          {methods.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm" style={{ color: ops.slate }}>
                No payment methods on file.
              </p>
              <button
                type="button"
                disabled
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white opacity-50"
                style={{ background: ops.flame }}
              >
                Add method (Stripe next)
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {methods.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                  style={{ borderColor: ops.mist }}
                >
                  <span className="text-sm font-medium" style={{ color: ops.navy }}>
                    {m.brand} ···· {m.last4}
                    {m.isDefault ? " · Default" : ""}
                  </span>
                  <span className="text-xs" style={{ color: ops.slate }}>
                    Exp {m.expMonth}/{m.expYear}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* History */}
      <section
        className="overflow-hidden rounded-lg border"
        style={{ borderColor: ops.mist, background: ops.white }}
      >
        <header className="border-b px-5 py-4" style={{ borderColor: ops.mist }}>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" style={{ color: ops.flame }} />
            <h2 className="text-lg font-semibold" style={{ color: ops.navy }}>
              Payment history
            </h2>
          </div>
          <p className="mt-1 text-sm" style={{ color: ops.slate }}>
            Receipts for paid and pending charges.
          </p>
        </header>
        <div className="p-5">
          {history.length === 0 ? (
            <p className="text-sm" style={{ color: ops.slate }}>
              No payments yet.
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: ops.mist }}>
              {history.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: ops.navy }}>
                      {c.description}
                    </p>
                    <p className="text-xs" style={{ color: ops.slate }}>
                      {c.paidAt
                        ? new Date(c.paidAt).toLocaleDateString()
                        : new Date(c.createdAt).toLocaleDateString()}{" "}
                      · {c.status}
                    </p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: ops.navy }}>
                    {formatUsd(c.amountCents)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function BillRow({ bill }: { bill: Bill }) {
  const payUrl = `/pay/${encodeURIComponent(bill.publicToken)}`;
  return (
    <li
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
      style={{ borderColor: ops.mist }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: ops.navy }}>
          {bill.description}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: ops.slate }}>
          {formatUsd(bill.amountCents)}
          {" · "}
          {bill.schedule === "recurring"
            ? `Subscription (${bill.interval ?? "monthly"})`
            : "One-time"}
          {" · "}
          {bill.collectionMode === "auto_charge" ? "Auto-charge" : "Invoice link"}
          {" · "}
          {bill.status}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={payUrl}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white"
          style={{ background: ops.flame }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Pay
        </a>
      </div>
    </li>
  );
}
