import { NextResponse } from "next/server";

const RESIDENCE_URLS = [
  { loc: "https://avijitvilla.vercel.app/The-Residence", priority: "1.0" },
  { loc: "https://avijitvilla.vercel.app/The-Residence/Materiality", priority: "0.8" },
  { loc: "https://avijitvilla.vercel.app/The-Residence/Masterplan", priority: "0.8" },
  { loc: "https://avijitvilla.vercel.app/The-Residence/Contact", priority: "0.8" },
];

export function GET() {
  const lastMod = new Date().toISOString();
  const urlEntries = RESIDENCE_URLS.map(
    (entry) =>
      `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

