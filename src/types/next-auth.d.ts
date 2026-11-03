import type { DefaultSession } from "next-auth";
import type { RoleType } from "@/config/constants";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: RoleType;
    } & DefaultSession["user"];
  }

  interface User {
    role: RoleType;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: RoleType;
  }
}