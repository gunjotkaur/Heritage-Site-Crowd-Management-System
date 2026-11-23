export const ROLES = {
  VISITOR: "VISITOR",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

// Where each role goes after login
export const ROLE_HOME_PATH: Record<RoleType, string> = {
  VISITOR: "/visitor",
  ADMIN: "/admin",
  STAFF: "/staff",
};

// Crowd level limits in % of site capacity
// 0-39 LOW, 40-69 MEDIUM, 70-89 HIGH, 90+ CRITICAL
export const CROWD_THRESHOLDS = {
  MEDIUM: 40,
  HIGH: 70,
  CRITICAL: 90,
} as const;