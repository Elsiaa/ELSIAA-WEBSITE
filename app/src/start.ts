import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

/**
 * HTML error page only for document navigations.
 * Server functions / API POSTs must rethrow so clients get real errors (not HTML).
 */
const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    const accept = request.headers.get("accept") ?? "";
    const isDocumentGet =
      request.method === "GET" &&
      accept.includes("text/html") &&
      !accept.includes("application/json");
    if (!isDocumentGet) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
