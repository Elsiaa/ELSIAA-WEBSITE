import Stripe from "stripe";

let cached: Stripe | null = null;

/** Lazy Stripe client — avoids crashing SSR when STRIPE_SECRET_KEY is unset. */
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  cached = new Stripe(key);
  return cached;
}

/** Placeholder for module-level `const stripe = …` rewrites during gradual migration. */
export const stripeProxy: Stripe = new Proxy({} as Stripe, {
  get(_t, prop, receiver) {
    const client = getStripe();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
