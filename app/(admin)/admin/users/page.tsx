/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { userRepository } from "../../../../repositories/user.repository";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { Users, UserPlus } from "lucide-react";
import { AdminUserFilter } from "./AdminUserFilter";

export const revalidate = 0;

export const metadata = {
  title: "User Administration | TrueLern",
  description: "Users",
};

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ search?: string, role?: string }> }) {
  await connectDB();
  
  const params = await searchParams;
  const search = params.search || "";
  const roleName = params.role || "";

  const filters: any = {};
  if (search) {
    filters.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }
  
  // Convert Role Name to ID if role is filtered
  if (roleName && roleName !== "") {
    const { roleRepository } = await import("../../../../repositories/role.repository");
    const roleDoc = await roleRepository.findRoleByName(roleName);
    if (roleDoc) {
      filters.role = roleDoc._id;
    } else {
      filters.role = null; // Forces empty result if role not found
    }
  }

  const { data: users, meta } = await userRepository.paginate(
    { page: 1, limit: 100, sort: "createdAt", order: "desc", filters }, 
    [],
    { populate: "role" }
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Workspace Header */}
      <WorkspaceHeader
        entityName="User Administration"
        description="Global directory of all registered system accounts across tenants."
        moduleIcon={<Users className="size-5" />}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Users" },
        ]}
        primaryAction={
          <Link href="/admin/users/create" className="lms-btn lms-btn-primary">
            <UserPlus className="size-4" />
            Provision User
          </Link>
        }
      />

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-900">System Accounts</h2>
          <span className="text-xs text-gray-500 font-medium">{meta.total} registered users</span>
        </div>
        
        <AdminUserFilter />

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider bg-white">
                <th className="px-6 py-4 font-semibold">User Identity</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Assigned Roles</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Last Login</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {users.map((user: any) => (
                <tr key={user._id?.toString()} className="hover:bg-gray-50 transition group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`
                        )}
                      </div>
                      <div>
                        <div className="text-gray-900 font-bold">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{user._id?.toString().slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-700 font-medium">{user.email}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{user.phone || "No phone"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {user.role ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                          {user.role.name || "UNKNOWN"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500 border border-gray-200">
                          UNASSIGNED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${
                      user.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                      user.status === "suspended" ? "bg-rose-50 text-rose-700 border-rose-200" :
                      "bg-gray-100 text-gray-600 border-gray-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === "active" ? "bg-emerald-500" : 
                        user.status === "suspended" ? "bg-rose-500" : "bg-gray-400"
                      }`}></span>
                      {user.status || "active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/users/${user._id?.toString()}`}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs opacity-0 group-hover:opacity-100 transition"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
