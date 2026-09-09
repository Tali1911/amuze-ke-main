// CI check: public/sitemap.xml must list exactly the public routes declared in
// src/App.tsx, and every URL must return HTTP 200.
//
// Run locally:   bun run check:sitemap
// Against prod:  SITEMAP_BASE_URL=https://amusekenya.co.ke bun run check:sitemap
//
// When SITEMAP_BASE_URL is unset the HTTP phase targets a local server
// (default http://localhost:8080) so CI can check a built preview.

import { readFileSync } from "fs";
import { resolve } from "path";

import {
  EXCLUDED_ROUTE_PREFIXES,
  PARAM_ROUTE_EXPANSIONS,
  entries,
} from "./sitemap-routes";

const HTTP_BASE_URL = (process.env.SITEMAP_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const SKIP_HTTP = process.env.SITEMAP_SKIP_HTTP === "1";
const CONCURRENCY = 6;

const errors: string[] = [];

/* ---------------------------------------------------------------- route map */

const appSource = readFileSync(resolve("src/App.tsx"), "utf8");

// Capture every <Route path="..."> plus enough of the element to tell whether
// it is a redirect (<Navigate .../>), which must never appear in the sitemap.
const routeRegex = /<Route\s+path="([^"]+)"([^>]*)>/g;

const routePatterns: string[] = [];
for (const match of appSource.matchAll(routeRegex)) {
  const [, path, rest] = match;
  if (path === "*") continue;
  if (/Navigate/.test(rest)) continue; // redirect route
  routePatterns.push(path);
}

if (routePatterns.length === 0) {
  errors.push("Could not parse any routes from src/App.tsx — check the <Route> syntax.");
}

const isExcluded = (pattern: string) =>
  EXCLUDED_ROUTE_PREFIXES.some((p) => pattern === p || pattern.startsWith(`${p}/`));

// Expected public URLs derived from the route map.
const expected = new Set<string>();
for (const pattern of routePatterns) {
  if (isExcluded(pattern)) continue;

  if (pattern.includes(":")) {
    const expansions = PARAM_ROUTE_EXPANSIONS[pattern];
    if (!expansions) {
      errors.push(
        `Route "${pattern}" is parameterised but has no entry in PARAM_ROUTE_EXPANSIONS ` +
          `(scripts/sitemap-routes.ts). Add its fixed public URLs, or exclude it via ` +
          `EXCLUDED_ROUTE_PREFIXES.`,
      );
      continue;
    }
    expansions.forEach((p) => expected.add(p));
    continue;
  }

  expected.add(pattern);
}

/* ------------------------------------------------------------- sitemap file */

const sitemapPath = resolve("public/sitemap.xml");
const sitemapXml = readFileSync(sitemapPath, "utf8");

if (/<sitemapindex/.test(sitemapXml)) {
  errors.push(
    "public/sitemap.xml is a sitemap index; this check only supports a single urlset. " +
      "Extend check-sitemap.ts to follow the index before shipping split sitemaps.",
  );
}

const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

if (locs.length === 0) errors.push("public/sitemap.xml contains no <loc> entries.");

const duplicates = locs.filter((loc, i) => locs.indexOf(loc) !== i);
if (duplicates.length) {
  errors.push(`Duplicate URLs in sitemap.xml: ${[...new Set(duplicates)].join(", ")}`);
}

const sitemapPaths = new Set<string>();
for (const loc of locs) {
  let parsed: URL;
  try {
    parsed = new URL(loc);
  } catch {
    errors.push(`Sitemap <loc> is not an absolute URL: ${loc}`);
    continue;
  }
  sitemapPaths.add(parsed.pathname);
}

// The sitemap file must also match the generator's own entry list, so a stale
// checked-in sitemap.xml (generator not re-run) fails CI too.
const generatorPaths = new Set(entries.map((e) => e.path));
const staleAgainstGenerator = [
  ...[...generatorPaths].filter((p) => !sitemapPaths.has(p)).map((p) => `missing ${p}`),
  ...[...sitemapPaths].filter((p) => !generatorPaths.has(p)).map((p) => `unexpected ${p}`),
];
if (staleAgainstGenerator.length) {
  errors.push(
    `public/sitemap.xml is out of date with scripts/sitemap-routes.ts (${staleAgainstGenerator.join(", ")}). ` +
      `Run: bunx tsx scripts/generate-sitemap.ts`,
  );
}

const missing = [...expected].filter((p) => !sitemapPaths.has(p)).sort();
const extra = [...sitemapPaths].filter((p) => !expected.has(p)).sort();

if (missing.length) {
  errors.push(
    `Routes in src/App.tsx are missing from sitemap.xml:\n  ${missing.join("\n  ")}\n` +
      `  → add them to routes in scripts/sitemap-routes.ts (or exclude them there).`,
  );
}
if (extra.length) {
  errors.push(
    `sitemap.xml lists URLs with no matching public route in src/App.tsx:\n  ${extra.join("\n  ")}`,
  );
}

/* ------------------------------------------------------------- HTTP 200 check */

async function checkHttp() {
  const paths = [...sitemapPaths].sort();
  let index = 0;

  async function worker() {
    while (index < paths.length) {
      const path = paths[index++];
      const url = `${HTTP_BASE_URL}${path}`;
      try {
        let res = await fetch(url, { method: "HEAD", redirect: "manual" });
        // Some static hosts and dev servers do not implement HEAD.
        if (res.status === 405 || res.status === 501) {
          res = await fetch(url, { method: "GET", redirect: "manual" });
        }
        if (res.status !== 200) {
          errors.push(`${url} returned HTTP ${res.status} (expected 200).`);
        }
      } catch (error) {
        errors.push(`${url} request failed: ${(error as Error).message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Checked ${paths.length} URLs against ${HTTP_BASE_URL}`);
}

async function main() {
  if (SKIP_HTTP) {
    console.log("SITEMAP_SKIP_HTTP=1 — skipping HTTP 200 checks.");
  } else if (errors.length === 0) {
    await checkHttp();
  } else {
    console.log("Skipping HTTP checks because the sitemap/route comparison already failed.");
  }

  if (errors.length) {
    console.error(`\n✖ sitemap check failed (${errors.length} problem(s)):\n`);
    errors.forEach((e) => console.error(`- ${e}`));
    process.exit(1);
  }

  console.log(`✔ sitemap.xml matches the route map (${sitemapPaths.size} URLs) and all return 200.`);
}

main();
