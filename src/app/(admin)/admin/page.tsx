
"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Users,
  Ticket,
  UserCheck,
  Activity,
  IndianRupee,
  RefreshCw,
  Landmark,
} from "lucide-react";

type DashboardStats = {
  heritageSites: number;
  visitors: number;
  bookings: number;
  activeStaff: number;
  currentCrowd: number | null;
  revenue: number | null;
};

const initialStats: DashboardStats = {
  heritageSites: 0,
  visitors: 0,
  bookings: 0,
  activeStaff: 0,
  currentCrowd: null,
  revenue: null,
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchStats() {
    try {
      setError("");

      const response = await fetch("/api/admin/overview");

      if (!response.ok) {
        throw new Error("Unable to load dashboard statistics.");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  const cards = [
    {
      title: "Heritage Sites",
      value: stats.heritageSites,
      description: "Registered heritage locations",
      icon: MapPin,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Visitors",
      value: stats.visitors,
      description: "Registered visitor accounts",
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Total Bookings",
      value: stats.bookings,
      description: "All recorded bookings",
      icon: Ticket,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Active Staff",
      value: stats.activeStaff,
      description: "Currently active staff accounts",
      icon: UserCheck,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Current Crowd",
      value:
        stats.currentCrowd === null
          ? "Unavailable"
          : stats.currentCrowd.toLocaleString("en-IN"),
      description: "Reliable occupancy data not initialized",
      icon: Activity,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Total Revenue",
      value:
        stats.revenue === null
          ? "Unavailable"
          : `₹${stats.revenue.toLocaleString("en-IN")}`,
      description: "Verified payment data not available",
      icon: IndianRupee,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#211426] to-[#49304f] p-7 text-white sm:p-10">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-amber-300">
            HeritageFlow Administration
          </p>

          <h2 className="text-3xl font-bold sm:text-4xl">
            Welcome to Admin Dashboard
          </h2>

          <p className="mt-3 text-sm leading-6 text-purple-100 sm:text-base">
            Manage heritage sites, monitor visitor activity and
            oversee staff operations from one place.
          </p>
        </div>

        <Landmark
          size={150}
          className="absolute -bottom-8 right-5 hidden text-white/10 sm:block"
        />
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">System Overview</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Live statistics from your database
            </p>
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">
            {error}
            <button
              onClick={fetchStats}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>

                    <h3 className="mt-3 text-3xl font-bold">
                      {loading ? "..." : card.value}
                    </h3>
                  </div>

                  <div className={`rounded-xl p-3 ${card.bg}`}>
                    <Icon size={23} className={card.color} />
                  </div>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">System Information</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Database Connection
            </p>
            <p className="mt-2 font-semibold text-green-600">
              Connected
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Crowd Monitoring
            </p>
            <p className="mt-2 font-semibold text-amber-600">
              Awaiting initialization
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
