import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin
        const today = new Date().toISOString().split('T')[0]
        const PAGES: Array<[string, string]> = [
          ['/', '1.0'],
          ['/designs', '0.9'],
          ['/automate', '0.9'],
          ['/services', '0.9'],
          ['/social', '0.8'],
          ['/consultation', '0.8'],
          ['/contact', '0.8'],
          ['/quote', '0.8'],
          ['/why-elsiaa', '0.8'],
          ['/team', '0.7'],
          ['/locations', '0.7'],
          ['/clients', '0.7'],
          ['/careers', '0.6'],
          ['/insights', '0.6'],
          ['/store', '0.6'],
          ['/overview', '0.5'],
          ['/legal/privacy', '0.3'],
          ['/legal/terms', '0.3'],
        ]
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...PAGES.flatMap(([path, priority]) => [
            '  <url>',
            `    <loc>${origin}${path}</loc>`,
            `    <lastmod>${today}</lastmod>`,
            '    <changefreq>weekly</changefreq>',
            `    <priority>${priority}</priority>`,
            '  </url>',
          ]),
          '</urlset>',
        ].join('\n')
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
