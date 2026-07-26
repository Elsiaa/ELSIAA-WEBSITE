import { createServerFn } from "@tanstack/react-start";
import { loadBillingSnapshot } from "./data.server";

export const getBillingSnapshot = createServerFn({ method: "GET" }).handler(
  async () => loadBillingSnapshot(),
);
