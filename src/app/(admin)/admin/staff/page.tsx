
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  MapPin,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

type StaffMember = {
  id: string;
  name: string | null;
  loginId: string | null;
  email: string | null;
  isActive: boolean;
  assignedSiteId: string | null;
};

type HeritageSite = {
  id: string;
  name: string;
  city: string;
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [sites, setSites] = useState<HeritageSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchStaffData = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/admin/staff", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to fetch staff information.");
      }

      setStaff(result.staff);
      setSites(result.sites);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  async function updateStaff(
    staffId: string,
    changes: { assignedSiteId?: string | null; isActive?: boolean }
  ) {
    try {
      setUpdatingId(staffId);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffId,
          ...changes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update staff member.");
      }

      setSuccess(result.message || "Staff member updated successfully.");
      await fetchStaffData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const activeCount = staff.filter((member) => member.isActive).length;
  const assignedCount = staff.filter(
    (member) => member.assignedSiteId !== null
  ).length;

  function getSiteName(siteId: string | null) {
    if (!siteId) return "Not assigned";

    return sites.find((site) => site.id === siteId)?.name ?? "Unavailable";
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600">
              <ShieldCheck size={20} />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Administration
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-bold">
              Staff Management
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Manage staff accounts and assign heritage sites.
            </p>
          </div>

          <button
            onClick={fetchStaffData}
            disabled={loading || updatingId !== null}
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
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-600">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Staff"
          value={staff.length}
          icon={<Users size={22} />}
        />

        <SummaryCard
          title="Active Staff"
          value={activeCount}
          icon={<UserCheck size={22} />}
        />

        <SummaryCard
          title="Assigned Staff"
          value={assignedCount}
          icon={<MapPin size={22} />}
        />
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <h2 className="text-lg font-bold">Staff Members</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign sites and manage staff account status.
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading staff members...
          </div>
        ) : staff.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto text-muted-foreground" size={30} />
            <p className="mt-3 font-medium">No staff members found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Staff accounts will appear here when they are created.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {staff.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-5 p-5 xl:flex-row xl:items-center xl:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold">
                    {member.name || "Unnamed Staff"}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Login ID: {member.loginId || "Not available"}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {member.email || "No email"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        member.isActive
                          ? "bg-green-500/10 text-green-600"
                          : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </span>

                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
                      {getSiteName(member.assignedSiteId)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div>
                    <label
                      htmlFor={`site-${member.id}`}
                      className="mb-1 block text-xs font-medium text-muted-foreground"
                    >
                      Assigned Heritage Site
                    </label>

                    <select
                      id={`site-${member.id}`}
                      value={member.assignedSiteId ?? ""}
                      disabled={updatingId !== null}
                      onChange={(e) =>
                        updateStaff(member.id, {
                          assignedSiteId: e.target.value || null,
                        })
                      }
                      className="w-full min-w-52 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-amber-500 disabled:opacity-50"
                    >
                      <option value="">Not assigned</option>

                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name} — {site.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() =>
                      updateStaff(member.id, {
                        isActive: !member.isActive,
                      })
                    }
                    disabled={updatingId !== null}
                    className={`mt-5 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${
                      member.isActive
                        ? "border border-red-500/30 text-red-600 hover:bg-red-500/10"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {member.isActive ? (
                      <>
                        <UserX size={16} />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck size={16} />
                        Activate
                      </>
                    )}
                  </button>

                  {updatingId === member.id && (
                    <span className="text-xs text-muted-foreground">
                      Updating...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
  value: number;
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
