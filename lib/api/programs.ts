export async function fetchPublicCohorts() {
  const res = await fetch("/api/cohorts", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch cohorts/programs");
  const data = await res.json();
  return data.data || [];
}
