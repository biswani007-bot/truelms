/* eslint-disable @typescript-eslint/no-explicit-any */

export async function fetchPublicCourses(params?: { category?: string; level?: string; search?: string }) {
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`/api/courses${query ? `?${query}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch courses");
  const data = await res.json();
  return data.data || [];
}

export async function fetchPublicCourseBySlug(slug: string) {
  const res = await fetch(`/api/courses?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data.data) ? data.data[0] : data.data;
}
