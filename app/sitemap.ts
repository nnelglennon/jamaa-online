import type { MetadataRoute } from "next";

const siteUrl =
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${siteUrl}/`, lastModified: now },
    { url: `${siteUrl}/search`, lastModified: now },
    { url: `${siteUrl}/promotions`, lastModified: now },
    { url: `${siteUrl}/cart`, lastModified: now },
    { url: `${siteUrl}/login`, lastModified: now },
    { url: `${siteUrl}/signup`, lastModified: now },
  ];
}