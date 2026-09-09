// Single source of truth shared by scripts/generate-sitemap.ts (writes
// public/sitemap.xml) and scripts/check-sitemap.ts (CI check).
//
// Navbar labels are CMS-managed and never affect URLs, so renaming a nav item
// cannot desync the sitemap. Only canonical, indexable routes belong here:
// redirect routes (/about/team, /services, legacy WordPress paths),
// admin/test/account routes and parameterised routes without a fixed public URL
// are excluded.

export const BASE_URL = "https://amusekenya.co.ke";

export interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

// lastmod values carried over from the previously hand-maintained sitemap.
// Only add a value here when there is a real content-change date for the page.
export const LASTMOD: Record<string, string> = {
  "/": "2026-04-12",
  "/programs": "2026-04-12",
  "/contact": "2026-04-12",
  "/gallery": "2026-04-12",
  "/announcements": "2026-04-12",
  "/about": "2026-04-12",
  "/camps/day-camps": "2026-04-12",
  "/camps/summer": "2026-04-12",
  "/camps/easter": "2026-04-12",
  "/camps/end-year": "2026-04-12",
  "/group-activities/parties": "2026-04-12",
  "/group-activities/team-building": "2026-04-12",
  "/programs/homeschooling": "2026-04-12",
  "/programs/school-experience": "2026-04-12",
  "/experiences/kenyan-experiences": "2026-04-12",
  "/blog": "2026-04-12",
  "/terms-and-conditions": "2026-04-12",
  "/privacy-policy": "2026-04-12",
};

export const routes: SitemapEntry[] = [
  // Core pages
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/programs", changefreq: "weekly", priority: "0.9" },
  { path: "/camp", changefreq: "weekly", priority: "0.9" },
  { path: "/contact", changefreq: "monthly", priority: "0.8" },
  { path: "/gallery", changefreq: "weekly", priority: "0.7" },
  { path: "/announcements", changefreq: "daily", priority: "0.7" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },

  // Camps (/camps/mid-term/:period is expanded to its fixed periods)
  { path: "/camps/day-camps", changefreq: "weekly", priority: "0.9" },
  { path: "/camps/summer", changefreq: "weekly", priority: "0.9" },
  { path: "/camps/easter", changefreq: "weekly", priority: "0.8" },
  { path: "/camps/end-year", changefreq: "weekly", priority: "0.8" },
  { path: "/camps/mid-term/feb-march", changefreq: "weekly", priority: "0.7" },
  { path: "/camps/mid-term/may-june", changefreq: "weekly", priority: "0.7" },
  { path: "/camps/mid-term/october", changefreq: "weekly", priority: "0.7" },

  // Group activities
  { path: "/group-activities/parties", changefreq: "weekly", priority: "0.8" },
  { path: "/group-activities/team-building", changefreq: "weekly", priority: "0.8" },

  // Programmes & experiences (/programs/:programId — published detail pages)
  { path: "/programs/homeschooling", changefreq: "monthly", priority: "0.8" },
  { path: "/programs/school-experience", changefreq: "monthly", priority: "0.8" },
  { path: "/programs/little-forest", changefreq: "monthly", priority: "0.7" },
  { path: "/experiences/kenyan-experiences", changefreq: "monthly", priority: "0.7" },

  // Legal
  { path: "/terms-and-conditions", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
];

export const entries: SitemapEntry[] = routes.map((e) => ({
  ...e,
  lastmod: LASTMOD[e.path],
}));

// Route patterns in src/App.tsx that intentionally have no sitemap entry
// (redirects, private/admin/account/test areas, dynamic content without a
// fixed public URL). Matched as prefixes against the route pattern.
export const EXCLUDED_ROUTE_PREFIXES: string[] = [
  "/admin",
  "/accounts",
  "/marketing",
  "/coach",
  "/portal",
  "/auth",
  "/login",
  "/signup",
  "/reset-password",
  "/my-profile",
  "/my-registrations",
  "/register",
  "/scan",
  "/unsubscribe",
  "/test",
  "/activity",
  "/blog/:slug",
  "/about/team",
  "/about/who-we-are",
  "/about/what-we-do",
  "/about-2",
  "/amuse-camp",
  "/school-holiday-camps",
  "/schools",
  "/services",
  "/book-a-service",
  "/book-now",
  "/summer-camp-2",
  "/activities",
  "/programs/homeschooling-outdoor-experiences",
  "/page-sitemap.xml",
  "/wp-sitemap.xml",
  "/sitemap_index.xml",
  "/sitemap.xml",
];

// Parameterised routes whose public URLs are a fixed, known set. The check
// verifies the sitemap lists exactly these expansions.
export const PARAM_ROUTE_EXPANSIONS: Record<string, string[]> = {
  "/camps/mid-term/:period": [
    "/camps/mid-term/feb-march",
    "/camps/mid-term/may-june",
    "/camps/mid-term/october",
  ],
  "/programs/:programId": [
    "/programs/homeschooling",
    "/programs/school-experience",
    "/programs/little-forest",
  ],
};
