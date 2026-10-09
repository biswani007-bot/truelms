export const STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
  PENDING: "PENDING",
} as const;

export type StatusType = typeof STATUS[keyof typeof STATUS];
