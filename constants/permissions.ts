export const PERMISSIONS = {
  MANAGE_COURSES: "manage:courses",
  VIEW_COURSES: "view:courses",
  MANAGE_USERS: "manage:users",
  MANAGE_BATCHES: "manage:batches",
  MANAGE_SETTINGS: "manage:settings",
} as const;

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];
