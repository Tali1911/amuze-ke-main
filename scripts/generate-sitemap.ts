// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
//
// The URL list lives in scripts/sitemap-routes.ts so that the CI check
// (scripts/check-sitemap.ts) validates the same source of truth against the
// real route map in src/App.tsx.

import { readdirSync, rmSync, writeFileSync } from "fs";
import { resolve } from "path";

import { BASE_URL, entries, type SitemapEntry } from "./sitemap-routes";

// Sitemap protocol caps a single file at 50,000 URLs (and 50MB uncompressed).
// We use a safer chunk size and emit a sitemap index once we exceed it.
const MAX_URLS_PER_SITEMAP = 45000;

function renderUrlset(items: SitemapEntry[]) {
  const urls = items.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

function renderIndex(files: string[]) {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...files.map((f) => [`  <sitemap>`, `    <loc>${BASE_URL}/${f}</loc>`, `  </sitemap>`].join("\n")),
    `</sitemapindex>`,
  ].join("\n");
}

// Remove any chunk files from a previous run so stale URLs never linger.
for (const file of readdirSync(resolve("public"))) {
  if (/^sitemap-\d+\.xml$/.test(file)) rmSync(resolve("public", file));
}

if (entries.length <= MAX_URLS_PER_SITEMAP) {
  writeFileSync(resolve("public/sitemap.xml"), renderUrlset(entries) + "\n");
  console.log(`sitemap.xml written (${entries.length} entries)`);
} else {
  const chunks: SitemapEntry[][] = [];
  for (let i = 0; i < entries.length; i += MAX_URLS_PER_SITEMAP) {
    chunks.push(entries.slice(i, i + MAX_URLS_PER_SITEMAP));
  }

  const files = chunks.map((chunk, i) => {
    const name = `sitemap-${i + 1}.xml`;
    writeFileSync(resolve("public", name), renderUrlset(chunk) + "\n");
    return name;
  });

  // sitemap.xml stays the single entry point — now a sitemap index.
  writeFileSync(resolve("public/sitemap.xml"), renderIndex(files) + "\n");
  console.log(
    `sitemap.xml written as sitemap index (${files.length} sitemaps, ${entries.length} entries)`,
  );
}
