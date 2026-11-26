
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  UserRound,
  Palette,
  Bell,
  ShieldCheck,
  Camera,
  Save,
  Loader2,
  Sun,
  Moon,
  Mail,
  Phone,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  createdAt: string;
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    async function loadProfile() {
      try {
        const response = await fetch("/api/visitor/profile");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load profile.");
        }

        setProfile(data.user);
        setName(data.user.name);
        setPhone(data.user.phone || "");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/visitor/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update profile.");
      }

      setProfile(data.user);
      setName(data.user.name);
      setPhone(data.user.phone || "");
      setMessage("Your profile has been updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10";

  const cardClass =
    "rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6";

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-10">
      <div>
        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
          PERSONALISE YOUR EXPERIENCE
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your profile and customise your HeritageFlow experience.
        </p>
      </div>

      {/* Profile */}
      <section className={cardClass}>
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-purple-100 p-3 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
            <UserRound size={21} />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Personal profile</h2>
            <p className="text-sm text-muted-foreground">
              Update your personal account information.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            Loading your profile...
          </div>
        ) : profile ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-purple-100 text-xl font-bold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                {profile.image ? (
                  <img
                    src={profile.image}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  name.charAt(0).toUpperCase() || "V"
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {profile.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  HeritageFlow Visitor
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Full name
                </label>
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={80}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    className={`${inputClass} pl-11 opacity-70`}
                    value={profile.email}
                    readOnly
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email address cannot be changed here.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Phone number
                </label>
                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    className={`${inputClass} pl-11`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    maxLength={20}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck size={17} />
                Your account information is private.
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving || name.trim().length < 2}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your profile could not be loaded.
          </p>
        )}

        {message && (
          <p className="mt-4 flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 size={17} />
            {message}
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-500">{error}</p>
        )}
      </section>

      {/* Appearance */}
      <section className={cardClass}>
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <Palette size={21} />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Appearance</h2>
            <p className="text-sm text-muted-foreground">
              Choose how HeritageFlow looks on your device.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`rounded-2xl border p-4 text-left transition ${
              mounted && theme === "light"
                ? "border-purple-600 bg-purple-50 dark:bg-purple-500/10"
                : "border-border hover:border-purple-300"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <Sun size={22} className="text-amber-500" />
              {mounted && theme === "light" && (
                <CheckCircle2 size={19} className="text-purple-600" />
              )}
            </div>
            <p className="font-semibold text-foreground">Light mode</p>
            <p className="mt-1 text-xs text-muted-foreground">
              A bright, clean interface.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`rounded-2xl border p-4 text-left transition ${
              mounted && theme === "dark"
                ? "border-purple-600 bg-purple-50 dark:bg-purple-500/10"
                : "border-border hover:border-purple-300"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <Moon size={22} className="text-purple-500" />
              {mounted && theme === "dark" && (
                <CheckCircle2 size={19} className="text-purple-600" />
              )}
            </div>
            <p className="font-semibold text-foreground">Dark mode</p>
            <p className="mt-1 text-xs text-muted-foreground">
              A comfortable interface for low-light environments.
            </p>
          </button>
        </div>
      </section>

      {/* Account information */}
      <section className={cardClass}>
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-green-100 p-3 text-green-700 dark:bg-green-500/15 dark:text-green-300">
            <ShieldCheck size={21} />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Account information</h2>
            <p className="text-sm text-muted-foreground">
              Details about your HeritageFlow account.
            </p>
          </div>
        </div>

        {profile && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Account role</p>
              <p className="mt-1 font-semibold text-foreground">Visitor</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays size={14} />
                Member since
              </p>
              <p className="mt-1 font-semibold text-foreground">
                {new Date(profile.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
