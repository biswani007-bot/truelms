/* eslint-disable @typescript-eslint/no-explicit-any */

export async function submitPublicLead(payload: any) {
  const res = await fetch("/api/public/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lead submission failed");
  return data;
}

export async function subscribePublicNewsletter(payload: { email: string; firstName?: string; source?: string }) {
  const res = await fetch("/api/public/newsletter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Newsletter subscription failed");
  return data;
}
