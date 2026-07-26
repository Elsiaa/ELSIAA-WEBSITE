import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Bill } from "./types";

/** Resolve a public invoice token → bill. Empty until DB is wired. */
export const resolveBillByToken = createServerFn({ method: "GET" })
  .inputValidator(z.object({ token: z.string().min(1) }))
  .handler(async ({ data }): Promise<Bill | null> => {
    void data.token;
    return null;
  });
