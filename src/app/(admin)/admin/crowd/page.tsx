
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  RefreshCw,
  MapPin,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

type CrowdSite = {
  id: string;
  name: string;
  city: string;
  capacity: number;
  currentOccupancy: number | null;
  occupancyPercent: number | null;
  level: string | null;
  lastUpdatedAt: string | null;
  source: string | null;
};

type PendingUpdate = {
  id: string;
  reportedOccupancy: number;
  reason: string | null;
  submittedAt: string;
  site: {
    name: string;
    city: string;
    maxCapacity: number;
  };
  submittedBy: {
    name: string | null;
    loginId: string | null;
  };
};

type CrowdData = {
  sites: CrowdSite[];
  pendingUpdates: number;
};

const levelStyles: Record<string, string> = {
  LOW: "bg-green-500/10 text-green-600",
  MEDIUM: "bg-amber-500/10 text-amber-600",
  HIGH: "bg-orange-500/10 text-orange-600",
  CRITICAL: "bg-red-500/10 text-red-600",
};

export default function CrowdMonitoringPage() {
  const [data, setData] = useState<CrowdData>({
    sites: [],
    pendingUpdates: 0,
  });
  const [updates, setUpdates] = useState<PendingUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchCrowdData = useCallback(async () => {
    try {
      setError("");

      const [crowdResponse, updatesResponse] = await Promise.all([
        fetch("/api/admin/crowd", { cache: "no-store" }),
        fetch("/api/admin/crowd/updates", { cache: "no-store" }),
      ]);

      if (!crowdResponse.ok || !updatesResponse.ok) {
        throw new Error("Unable to fetch crowd information.");
      }

      const crowdResult = await crowdResponse.json();
      const updatesResult = await updatesResponse.json();

      setData(crowdResult);
      setUpdates(updatesResult.updates);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrowdData();
  }, [fetchCrowdData]);

  async function reviewUpdate(
    id: string,
    action: "APPROVED" | "REJECTED"
  ) {
    try {
      setError("");
      setReviewingId(id);

      const response = await fetch(`/api/admin/crowd/updates/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to review this report.");
      }

      await fetchCrowdData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setReviewingId(null);
    }
  }

  const initializedSites = data.sites.filter(
    (site) => site.currentOccupancy !== null
  ).length;

  const totalOccupancy = data.sites.reduce(
    (total, site) => total + (site.currentOccupancy ?? 0),
    0
  );

  function formatDate(date: string | null) {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600">
              <Activity size={20} />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Monitoring Centre
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-bold">
              Crowd Monitoring
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Monitor occupancy and crowd conditions across heritage sites.
            </p>
          </div>

          <button
            onClick={fetchCrowdData}
            disabled={loading || reviewingId !== null}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Heritage Sites"
          value={data.sites.length}
          icon={<MapPin size={22} />}
        />

        <SummaryCard
          title="Initialized Sites"
          value={initializedSites}
          icon={<Activity size={22} />}
        />

        <SummaryCard
          title="Current Occupancy"
          value={
            initializedSites > 0
              ? totalOccupancy.toLocaleString("en-IN")
              : "Unavailable"
          }
          icon={<Users size={22} />}
        />

        <SummaryCard
          title="Pending Staff Updates"
          value={updates.length}
          icon={<Clock size={22} />}
        />
      </section>

      {/* Pending Staff Reports */}
      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Pending Staff Reports</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review staff-submitted occupancy counts before approval.
              </p>
            </div>

            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
              {updates.length} Pending
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading staff reports...
          </div>
        ) : updates.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle className="mx-auto text-green-600" size={30} />
            <p className="mt-3 font-medium">No pending reports</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New staff crowd reports will appear here for review.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {updates.map((update) => (
              <div
                key={update.id}
                className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold">{update.site.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {update.site.city}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">
                        Reported occupancy:{" "}
                      </span>
                      <strong>
                        {update.reportedOccupancy.toLocaleString("en-IN")}
                      </strong>
                    </p>

                    <p>
                      <span className="text-muted-foreground">
                        Site capacity:{" "}
                      </span>
                      <strong>
                        {update.site.maxCapacity.toLocaleString("en-IN")}
                      </strong>
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Submitted by:{" "}
                    {update.submittedBy.name ||
                      update.submittedBy.loginId ||
                      "Staff"}
                    {" · "}
                    {formatDate(update.submittedAt)}
                  </p>

                  {update.reason && (
                    <p className="text-sm text-muted-foreground">
                      Reason: {update.reason}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-3">
                  <button
                    onClick={() => reviewUpdate(update.id, "APPROVED")}
                    disabled={reviewingId !== null}
                    className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {reviewingId === update.id ? "Processing..." : "Approve"}
                  </button>

                  <button
                    onClick={() => reviewUpdate(update.id, "REJECTED")}
                    disabled={reviewingId !== null}
                    className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Site-wise Crowd Status */}
      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <h2 className="text-lg font-bold">Site-wise Crowd Status</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current occupancy, capacity and crowd classification.
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading crowd information...
          </div>
        ) : data.sites.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No active heritage sites found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-semibold">Heritage Site</th>
                  <th className="px-5 py-4 font-semibold">Occupancy</th>
                  <th className="px-5 py-4 font-semibold">Capacity</th>
                  <th className="px-5 py-4 font-semibold">Occupancy %</th>
                  <th className="px-5 py-4 font-semibold">Crowd Level</th>
                  <th className="px-5 py-4 font-semibold">Last Updated</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {data.sites.map((site) => (
                  <tr key={site.id} className="hover:bg-muted/30">
                    <td className="px-5 py-5">
                      <p className="font-semibold">{site.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {site.city}
                      </p>
                    </td>

                    <td className="px-5 py-5 font-medium">
                      {site.currentOccupancy === null
                        ? "Not initialized"
                        : site.currentOccupancy.toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-5">
                      {site.capacity.toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-5">
                      {site.occupancyPercent === null
                        ? "—"
                        : `${site.occupancyPercent}%`}
                    </td>

                    <td className="px-5 py-5">
                      {site.level ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            levelStyles[site.level] ??
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {site.level}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Unavailable
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-5 text-xs text-muted-foreground">
                      {formatDate(site.lastUpdatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 text-amber-600" size={21} />

          <div>
            <h3 className="font-semibold">Crowd data initialization</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Occupancy is currently unavailable for sites without an
              approved crowd baseline. Staff reports require administrator
              approval before updating official occupancy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold">{value}</p>
    </div>
  );
}
