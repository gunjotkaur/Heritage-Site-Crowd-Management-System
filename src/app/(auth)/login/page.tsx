
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ROLE_HOME_PATH } from "@/config/constants";

type Role = "ADMIN" | "STAFF" | "VISITOR";

export default function LoginPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleDetails = [
    {
      role: "ADMIN" as Role,
      title: "Administrator",
      description: "Manage heritage sites and operations",
      icon: "👑",
    },
    {
      role: "STAFF" as Role,
      title: "Staff",
      description: "Manage assigned site activities",
      icon: "🛡️",
    },
    {
      role: "VISITOR" as Role,
      title: "Visitor",
      description: "Book tickets and explore heritage sites",
      icon: "👤",
    },
  ];

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedRole) return;

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        role: selectedRole,
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials or account not active.");
        return;
      }

      router.push(ROLE_HOME_PATH[selectedRole]);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleRoleChange(role: Role) {
    setSelectedRole(role);
    setIdentifier("");
    setPassword("");
    setError("");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#160F20] px-5 py-12">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://humbo.s3.eu-north-1.amazonaws.com/place-photo/658cf43ec3ba98be53212c68/ZEQRHYuO3t.jpeg')",
        }}
      />

      <div className="fixed inset-0 bg-[#160F20]/75" />
      <div className="fixed inset-0 bg-gradient-to-r from-[#160F20]/80 via-[#160F20]/55 to-[#160F20]/70" />

      <div className="relative z-10 w-full max-w-lg">
        <Link href="/" className="mb-10 flex flex-col items-center">
          <span className="text-5xl">🏛️</span>
          <h1 className="mt-2 text-3xl font-bold tracking-wide text-white">
            HeritageFlow
          </h1>
          <p className="mt-1 text-xs tracking-[0.3em] text-[#FCD34D]">
            PRESERVE OUR LEGACY
          </p>
        </Link>

        <div className="rounded-3xl border border-white/20 bg-[#24152D]/90 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Choose your account type to continue
            </p>
          </div>

          <div className="space-y-4">
            {roleDetails.map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => handleRoleChange(item.role)}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition duration-300 ${
                  selectedRole === item.role
                    ? "border-[#FBBF24] bg-[#FBBF24]/10"
                    : "border-white/10 bg-[#160F20]/70 hover:border-[#FBBF24]/60"
                }`}
              >
                <span className="text-3xl">{item.icon}</span>

                <span className="flex-1">
                  <span className="block font-semibold text-white">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs text-white/60">
                    {item.description}
                  </span>
                </span>

                <span className="text-xl text-[#FBBF24]">›</span>
              </button>
            ))}
          </div>

          {selectedRole && (
            <div className="mt-8 border-t border-white/10 pt-7">
              <h3 className="mb-5 text-xl font-semibold text-white">
                {selectedRole === "ADMIN"
                  ? "Administrator Login"
                  : selectedRole === "STAFF"
                    ? "Staff Login"
                    : "Visitor Login"}
              </h3>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-white/80">
                    {selectedRole === "VISITOR"
                      ? "Email Address"
                      : selectedRole === "ADMIN"
                        ? "Admin ID"
                        : "Employee ID"}
                  </label>

                  <input
                    type={selectedRole === "VISITOR" ? "email" : "text"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      selectedRole === "VISITOR"
                        ? "Enter your email"
                        : "Enter your ID"
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#160F20] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-[#FBBF24]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/80">
                    Password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-white/15 bg-[#160F20] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-[#FBBF24]"
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#FBBF24] py-3 font-bold text-[#211426] transition hover:bg-[#FCD34D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>

              {selectedRole === "VISITOR" && (
                <p className="mt-6 text-center text-sm text-white/70">
                  Don't have an account?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-[#FCD34D] hover:underline"
                  >
                    Sign Up
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>

        <p className="mt-7 text-center text-xs text-white/70">
          Preserving yesterday. Managing today. Protecting tomorrow.
        </p>
      </div>
    </main>
  );
}
