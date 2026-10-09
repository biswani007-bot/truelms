export const ROLES = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MARKETING_MANAGER: "Marketing Manager",
  SALES_COUNSELLOR: "Sales Counsellor",
  FINANCE_MANAGER: "Finance Manager",
  TEACHER: "Teacher",
  STUDENT: "Student",
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];
