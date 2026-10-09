export async function fetchPublicEvents(params?: { mode?: string; featured?: boolean }) {
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`/api/public/events${query ? `?${query}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch events");
  const data = await res.json();
  return data.data || [];
}

export async function fetchPublicEventBySlug(slug: string) {
  const res = await fetch(`/api/public/events/${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

export async function registerForPublicEvent(slug: string, payload: any) {
  const res = await fetch(`/api/public/events/${encodeURIComponent(slug)}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data;
}
