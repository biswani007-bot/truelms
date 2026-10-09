import React from "react";
import { connectDB } from "../../../../config/db";
import { roleRepository } from "../../../../repositories/role.repository";
import RolesMatrix from "../../../../components/RolesMatrix";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { ShieldCheck } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Role & Permission Management | TrueLern",
  description: "Enterprise RBAC Configuration",
};

export default async function RolesPage() {
  await connectDB();
  const rawRoles = await roleRepository.findMany({});
  
  // Serialize for client component
  const roles = JSON.parse(JSON.stringify(rawRoles));

  return (
    <div className="flex flex-col gap-8">
      {/* Workspace Header */}
      <WorkspaceHeader
        entityName="Permission Matrix"
        description="Configure Enterprise RBAC (Role-Based Access Control) policies across modules."
        moduleIcon={<ShieldCheck className="size-5" />}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Roles & Permissions" },
        ]}
      />

      <RolesMatrix initialRoles={roles} />
    </div>
  );
}
