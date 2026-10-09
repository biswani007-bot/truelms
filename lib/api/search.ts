export async function executeGlobalSearch(q: string) {
  if (!q || q.trim().length === 0) return { courses: [], programs: [], teachers: [], events: [], faqs: [] };
  const res = await fetch(`/api/public/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Search request failed");
  const data = await res.json();
  return data.data || { courses: [], programs: [], teachers: [], events: [], faqs: [] };
}
