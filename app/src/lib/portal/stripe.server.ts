/**
 * Stripe server + browser helpers — null until keys are configured.
 */
import Stripe from "stripe";
import { portalEnv } from "./env";

let stripe: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (stripe !== undefined) return stripe;
  const { stripeSecretKey } = portalEnv();
  if (!stripeSecretKey) {
    stripe = null;
    return stripe;
  }
  stripe = new Stripe(stripeSecretKey);
  return stripe;
}

export function getStripePublishableKey(): string | null {
  return portalEnv().stripePublishableKey ?? null;
}
