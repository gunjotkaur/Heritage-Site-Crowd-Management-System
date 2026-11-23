import type { RoleType } from "@/config/constants";

// Standard shape for all our API responses
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// The logged-in user, as we will use it in the app
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: RoleType;
};