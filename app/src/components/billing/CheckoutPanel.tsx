import { Link } from "@tanstack/react-router";
import { ops, opsFonts } from "../../lib/billing/ops-theme";
import { formatUsd, type Bill } from "../../lib/billing/types";

type Props = {
  bill: Bill | null;
  token: string;
};

/** Public invoice checkout shell — Stripe Elements wire in later. */
export function CheckoutPanel({ bill, token }: Props) {
  const { sans } = opsFonts;

  if (!bill) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-6"
        style={{ background: ops.offWhite, ...sans }}
      >
        <div
          className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-sm"
          style={{ borderColor: ops.mist }}
        >
          <p className="text-sm font-semibold" style={{ color: ops.navy }}>
            Invoice not found
          </p>
          <p className="mt-2 text-sm" style={{ color: ops.slate }}>
            This payment link is invalid or expired. Token: {token.slice(0, 8)}…
          </p>
          <Link
            to="/"
            className="mt-6 inline-block text-sm font-semibold"
            style={{ color: ops.flame }}
          >
            Back to ELSIAA
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6 py-12"
      style={{ background: ops.offWhite, ...sans }}
    >
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <img src="/assets/elsiaa-lion-192.png" alt="" className="h-8 w-8 object-contain" />
          <span className="text-sm font-bold tracking-wide" style={{ color: ops.navy }}>
            ELSIAA
          </span>
        </div>

        <div
          className="overflow-hidden rounded-lg border bg-white shadow-sm"
          style={{ borderColor: ops.mist }}
        >
          <div className="border-b px-6 py-5" style={{ borderColor: ops.mist }}>
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: ops.slate }}
            >
              Invoice
            </p>
            <h1 className="mt-1 text-xl font-semibold" style={{ color: ops.navy }}>
              {bill.description}
            </h1>
            <p className="mt-1 text-sm" style={{ color: ops.slate }}>
              Billed to {bill.recipientName} · {bill.recipientEmail}
            </p>
          </div>

          <div className="px-6 py-5">
            <ul className="space-y-2">
              {bill.lineItems.map((line, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span style={{ color: ops.navy }}>{line.description}</span>
                  <span className="font-medium" style={{ color: ops.navy }}>
                    {formatUsd(line.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
            <div
              className="mt-4 flex justify-between border-t pt-4 text-base font-semibold"
              style={{ borderColor: ops.mist, color: ops.navy }}
            >
              <span>Total</span>
              <span>{formatUsd(bill.amountCents)}</span>
            </div>

            <div
              className="mt-6 rounded-lg px-4 py-3 text-sm"
              style={{ background: `${ops.mist}55`, color: ops.slate }}
            >
              Card payment will appear here once Stripe keys are set. Collection mode:{" "}
              {bill.collectionMode === "auto_charge" ? "auto-charge" : "invoice link"}.
            </div>

            <button
              type="button"
              disabled
              className="mt-5 w-full rounded-lg py-3.5 text-sm font-bold text-white opacity-50"
              style={{ background: ops.flame }}
            >
              Pay {formatUsd(bill.amountCents)}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
