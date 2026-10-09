export async function fetchPublicTeachers() {
  const res = await fetch("/api/teachers", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch faculty");
  const data = await res.json();
  return data.data || [];
}
