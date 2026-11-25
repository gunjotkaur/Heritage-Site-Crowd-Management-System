
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed.");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#101C2C] px-5 py-12">

      {/* India Gate Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://upload.wikimedia.org/wikipedia/commons/1/12/India_Gate_New_Delhi.jpg')",
        }}
      />

      {/* Navy Overlay */}
      <div className="fixed inset-0 bg-[#101C2C]/80" />

      {/* Teal Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0F766E]/35 via-[#101C2C]/60 to-[#101C2C]/90" />

      <div className="relative z-10 w-full max-w-lg">

        {/* Branding */}
        <Link href="/" className="mb-8 flex flex-col items-center">
          <span className="text-5xl">🏛️</span>

          <h1 className="mt-2 text-3xl font-bold tracking-wide text-white">
            HeritageFlow
          </h1>

          <p className="mt-1 text-xs tracking-[0.3em] text-[#5EEAD4]">
            DISCOVER. EXPLORE. PRESERVE.
          </p>
        </Link>

        {/* Registration Card */}
        <div className="rounded-3xl border border-[#5EEAD4]/30 bg-[#14283A]/95 p-7 shadow-2xl backdrop-blur-xl sm:p-9">

          <div className="mb-7 text-center">
            <h2 className="text-3xl font-bold text-white">
              Create Account
            </h2>

            <p className="mt-2 text-sm text-[#D6E4E8]/70">
              Begin your heritage exploration journey
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="mb-2 block text-sm text-[#E2E8F0]">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-[#5EEAD4]/20 bg-[#0D1B2A] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-[#5EEAD4]"
                required
                minLength={2}
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm text-[#E2E8F0]">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-[#5EEAD4]/20 bg-[#0D1B2A] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-[#5EEAD4]"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm text-[#E2E8F0]">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full rounded-xl border border-[#5EEAD4]/20 bg-[#0D1B2A] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-[#5EEAD4]"
                required
                minLength={8}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-2 block text-sm text-[#E2E8F0]">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full rounded-xl border border-[#5EEAD4]/20 bg-[#0D1B2A] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-[#5EEAD4]"
                required
                minLength={8}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#2DD4BF] py-3 font-bold text-[#102A32] transition hover:bg-[#F59E0B] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#D6E4E8]/80">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#5EEAD4] hover:text-[#F59E0B] hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-white/60">
          Preserving India's heritage for future generations.
        </p>

        <p className="mt-2 text-center text-[10px] text-white/50">
          India Gate photograph by{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:India_Gate_New_Delhi.jpg"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Shajankumar, Wikimedia Commons (CC BY-SA 3.0)
          </a>
        </p>
      </div>
    </main>
  );
}
