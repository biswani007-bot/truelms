/* eslint-disable @typescript-eslint/no-explicit-any */
import { MetadataRoute } from "next";
import { blogRepository } from "../repositories/blog.repository";
import { courseRepository } from "../repositories/course.repository";
import { eventRepository } from "../repositories/event.repository";
import { connectDB } from "../config/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();

  const [blogs, courses, events] = await Promise.all([
    blogRepository.findMany({}).catch(() => []),
    courseRepository.findMany({ status: "published" }).catch(() => []),
    eventRepository.findMany({ status: "published" }).catch(() => []),
  ]);

  const staticRoutes = [
    "",
    "/about",
    "/programs",
    "/courses",
    "/courses/compare",
    "/teachers",
    "/admissions",
    "/admissions/apply",
    "/pricing",
    "/blog",
    "/events",
    "/newsletter",
    "/faq",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/cookie-policy",
    "/refund-policy",
    "/careers",
  ].map((route) => ({
    url: `https://lmsca.com${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : route === "/programs" || route === "/courses" ? 0.9 : 0.8,
  }));

  const blogRoutes = blogs.map((post: any) => ({
    url: `https://lmsca.com/blog/${post.slug}`,
    lastModified: post.updatedAt || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const courseRoutes = courses.map((course: any) => ({
    url: `https://lmsca.com/courses/${course.slug}`,
    lastModified: course.updatedAt || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const eventRoutes = events.map((event: any) => ({
    url: `https://lmsca.com/events/${event.slug}`,
    lastModified: event.updatedAt || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes, ...courseRoutes, ...eventRoutes];
}
