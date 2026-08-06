import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        /* Everything marketing stays crawlable. The private and
           transactional areas must not be: they are either behind auth,
           single-use, or meaningless out of context, and several expose
           order or token state in the URL. */
        const body = [
          "User-agent: *",
          "Allow: /",
          "",
          "Disallow: /portal/",
          "Disallow: /admin/",
          "Disallow: /cart",
          "Disallow: /checkout",
          "Disallow: /pay/",
          "Disallow: /order-confirmation",
          "Disallow: /sign-up",
          "Disallow: /concept-walk",
          "",
          `Sitemap: ${origin}/sitemap.xml`,
        ].join("\n");
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
