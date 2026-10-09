"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce"; // assuming standard hook, or I will inline debounce

export function AdminUserFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [role, setRole] = useState(searchParams.get("role") || "");
  
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (role) params.set("role", role);
    
    router.push(`?${params.toString()}`);
  }, [debouncedSearch, role, router]);

  return (
    <div className="px-6 py-3 border-b border-gray-100 flex gap-4">
      <input 
        type="text" 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, email or phone..." 
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md w-64 text-gray-800 outline-none focus:border-indigo-500"
      />
      <select 
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 bg-white outline-none focus:border-indigo-500"
      >
        <option value="">All Roles</option>
        <option value="Admin">Admin</option>
        <option value="Super Admin">Super Admin</option>
        <option value="Teacher">Teacher</option>
        <option value="Student">Student</option>
        <option value="Parent">Parent</option>
        <option value="Academic Manager">Academic Manager</option>
        <option value="Counsellor">Counsellor</option>
      </select>
    </div>
  );
}
