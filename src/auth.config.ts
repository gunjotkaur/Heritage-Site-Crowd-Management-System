import type { NextAuthConfig } from "next-auth";
import { ROLE_HOME_PATH, type RoleType } from "@/config/constants";

// Which URL area belongs to which role
const PROTECTED_AREAS: { prefix: string; role: RoleType }[] = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/staff", role: "STAFF" },
  { prefix: "/visitor", role: "VISITOR" },
];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [], // real providers are added in auth.ts
  callbacks: {
    // Runs on every request to a protected area
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      const area = PROTECTED_AREAS.find(
        (a) => path === a.prefix || path.startsWith(a.prefix + "/")
      );

      if (!area) return true; // public page
      if (!auth?.user) return false; // not logged in -> go to /login

      // Logged in, but wrong area -> send to their own home
      if (auth.user.role !== area.role) {
        return Response.redirect(new URL(ROLE_HOME_PATH[auth.user.role], nextUrl));
      }
      return true;
    },
    // Put id and role into the token at login
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // Copy id and role from the token into the session
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as RoleType;
      return session;
    },
  },
} satisfies NextAuthConfig;