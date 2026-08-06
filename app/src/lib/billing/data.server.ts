/**
 * Billing data access — empty until DATABASE_URL + Stripe are connected.
 * Returns structured empties so the UI can render a clean zero state.
 */
import type { Bill, BillCharge, BillingAccountStatus, SavedPaymentMethod } from "./types";

export type BillingSnapshot = {
  status: BillingAccountStatus;
  openBills: Bill[];
  methods: SavedPaymentMethod[];
  history: BillCharge[];
  stripeReady: boolean;
};

export async function loadBillingSnapshot(_companyId?: string | null): Promise<BillingSnapshot> {
  const stripeReady = Boolean(
    process.env.STRIPE_SECRET_KEY &&
    (process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY),
  );

  return {
    status: {
      allUpToDate: true,
      overdueBills: 0,
      maxDaysOverdue: 0,
    },
    openBills: [],
    methods: [],
    history: [],
    stripeReady,
  };
}
