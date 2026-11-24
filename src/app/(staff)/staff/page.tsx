
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  MapPin,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle,
  Users,
  ShieldCheck,
  ScanLine,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

type AssignedSite = {
  id: string;
  name: string;
  city: string;
  maxCapacity: number;
};

export default function StaffDashboardPage() {
  const [site, setSite] = useState<AssignedSite | null>(null);
  const [occupancy, setOccupancy] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAssignedSite = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/staff/crowd/updates", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load assigned site.");
      }

      setSite(result.site);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedSite();
  }, [fetchAssignedSite]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const reportedOccupancy = Number(occupancy);

    if (
      !Number.isInteger(reportedOccupancy) ||
      reportedOccupancy < 0
    ) {
      setError("Please enter a valid whole number of visitors.");
      return;
    }

    if (!site || reportedOccupancy > site.maxCapacity) {
      setError("Reported occupancy cannot exceed the site's capacity.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/staff/crowd/updates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportedOccupancy,
          reason: reason.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit crowd report.");
      }

      setSuccess(
        result.message || "Crowd report submitted for Admin approval."
      );

      setOccupancy("");
      setReason("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-600">
            <ShieldCheck size={20} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Staff Portal
            </span>
          </div>

          <h1 className="mt-2 text-3xl font-bold">
            Staff Dashboard
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            View your assigned heritage site and manage visitor entry and crowd updates.
          </p>
        </div>

        <button
          onClick={fetchAssignedSite}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </section>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-600">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-500/15 p-3 text-amber-600">
              <ScanLine size={28} />
            </div>

            <div>
              <h2 className="text-xl font-bold">Visitor QR Scanner</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Scan visitor tickets to record entry and exit and update site occupancy.
              </p>
            </div>
          </div>

          <Link
            href="/staff/scan"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 font-semibold text-black transition hover:bg-amber-400"
          >
            Open Scanner
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading your assigned site...
        </div>
      ) : !site ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-8 text-center">
          <MapPin className="mx-auto text-amber-600" size={32} />
          <h2 className="mt-3 text-lg font-bold">
            No Site Assigned
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please contact your Admin to get a heritage site assigned to your account.
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-amber-600">
              <MapPin size={20} />
              <h2 className="text-lg font-bold">Your Assigned Site</h2>
            </div>

            <h3 className="mt-4 text-2xl font-bold">{site.name}</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {site.city}
            </p>

            <div className="mt-5 flex items-center gap-3 rounded-lg bg-muted p-4">
              <Users size={22} className="text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Maximum Site Capacity
                </p>
                <p className="text-xl font-bold">{site.maxCapacity}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">
              Submit Crowd Update
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Enter the current visitor count at your assigned site.
              Your report will be sent to the Admin for approval.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="occupancy"
                  className="mb-2 block text-sm font-medium"
                >
                  Current Visitor Count
                </label>

                <input
                  id="occupancy"
                  type="number"
                  min="0"
                  max={site.maxCapacity}
                  step="1"
                  required
                  value={occupancy}
                  onChange={(e) => setOccupancy(e.target.value)}
                  placeholder="Enter current number of visitors"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-amber-500"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Maximum capacity: {site.maxCapacity}
                </p>
              </div>

              <div>
                <label
                  htmlFor="reason"
                  className="mb-2 block text-sm font-medium"
                >
                  Remarks (Optional)
                </label>

                <textarea
                  id="reason"
                  rows={3}
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Add any relevant observations..."
                  className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-400 disabled:opacity-50 sm:w-auto"
              >
                <Send size={17} />
                {submitting ? "Submitting..." : "Submit Crowd Report"}
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
