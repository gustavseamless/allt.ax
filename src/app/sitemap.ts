import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [businesses, categories, municipalities, events] = await Promise.all([
    prisma.business.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({ where: { active: true }, select: { slug: true } }),
    prisma.municipality.findMany({ select: { slug: true } }),
    prisma.event.findMany({
      where: { active: true, endDate: { gte: new Date() } },
      select: { slug: true },
    }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/foretag`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/kommuner`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/erbjudanden`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/evenemang`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/for-foretag`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/om`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/integritet`, changeFrequency: "monthly", priority: 0.3 },
  ];

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: `${SITE_URL}/foretag/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...municipalities.map((m) => ({
      url: `${SITE_URL}/${m.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...businesses.map((b) => ({
      url: `${SITE_URL}/foretag/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...events.map((e) => ({
      url: `${SITE_URL}/evenemang/${e.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
