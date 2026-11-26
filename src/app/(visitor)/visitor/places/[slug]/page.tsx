
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Clock,
  CalendarDays,
  Users,
  Activity,
  History,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

type SiteDetails = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  history: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  coverImage: string | null;
  images: string[];
  openingTime: string;
  closingTime: string;
  closedDays: number[];
  maxCapacity: number;
};

type CrowdDetails = {
  currentOccupancy: number | null;
  capacity: number;
  occupancyPercent: number | null;
  level: string | null;
  lastUpdatedAt: string | null;
  source: string | null;
};

type CrowdSnapshot = {
  occupancy: number;
  occupancyPercent: number;
  level: string;
  recordedAt: string;
};

type CrowdPrediction = {
  predictedFor: string;
  predictedOccupancy: number;
  predictedLevel: string;
  confidence: number | null;
};

type SiteResponse = {
  site: SiteDetails;
  crowd: CrowdDetails;
  history: CrowdSnapshot[];
  predictions: CrowdPrediction[];
};

const crowdStyles: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// Temporary hero image fallbacks.
// Database images will take priority whenever available.
const siteHeroImages: Record<string, string> = {
  "red-fort":
    "https://images.unsplash.com/photo-1598434192043-71111c1b3f41?w=1600",
  "india-gate":
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1600",
  "qutub-minar":
    "https://images.unsplash.com/photo-1565018054866-968e244671af?w=1600",
};

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function HeritagePlaceDetailsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [data, setData] = useState<SiteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSiteDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/visitor/places/${encodeURIComponent(slug)}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load heritage site.");
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void fetchSiteDetails();
  }, [fetchSiteDetails]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            className="mx-auto mb-3 animate-spin text-amber-500"
            size={30}
          />
          <p className="text-sm text-muted-foreground">
            Loading heritage destination...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertCircle className="mb-4 text-amber-500" size={40} />

        <h1 className="text-2xl font-bold">
          Heritage site unavailable
        </h1>

        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {error || "We could not find this heritage destination."}
        </p>

        <Link
          href="/visitor/explore"
          className="mt-6 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-[#24152d] transition hover:bg-amber-300"
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  const { site, crowd, history, predictions } = data;

  const heroImage =
    site.coverImage ||
    site.images[0] ||
    siteHeroImages[site.slug];

  return (
    <div className="space-y-8 pb-10">
      {/* Back Navigation */}
      <Link
        href="/visitor/explore"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-amber-500"
      >
        <ArrowLeft size={17} />
        Back to Explore
      </Link>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-[#24152d]">
        <div className="relative h-[300px] md:h-[420px]">
          {heroImage ? (
            <img
              src={heroImage}
              alt={site.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#49304f] via-[#302039] to-[#17101f]">
              <div className="text-center text-white/70">
                <History size={48} className="mx-auto mb-3" />
                <p className="text-sm">
                  Heritage image coming soon
                </p>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#160f20] via-[#160f20]/40 to-transparent" />

          <div className="absolute bottom-0 left-0 w-full p-6 text-white md:p-10">
            <span className="mb-4 inline-block rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[#24152d]">
              {site.category}
            </span>

            <h1 className="text-3xl font-bold md:text-5xl">
              {site.name}
            </h1>

            <p className="mt-3 flex items-center gap-2 text-sm text-white/80 md:text-base">
              <MapPin size={17} />
              {site.city}, {site.state}, {site.country}
            </p>
          </div>
        </div>
            </section>

      {/* Book Your Visit */}
      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/20 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-[#24152d] dark:text-amber-100">
            Planning a visit?
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Reserve your tickets and choose a convenient visiting time.
          </p>
        </div>

        <Link
          href={`/visitor/book-visit?site=${site.slug}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-[#24152d] shadow-sm transition hover:bg-amber-300 hover:shadow-md"
        >
          Book Your Visit
          <ArrowRight size={17} />
        </Link>
      </section>

      {/* Crowd Overview */}
      <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
              Crowd Monitoring
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Current Crowd Status
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor visitor activity and site capacity.
            </p>
          </div>

          <button
            onClick={() => void fetchSiteDetails()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20"
          >
            <RefreshCw size={15} />
            Refresh Data
          </button>
        </div>

        {/* Crowd Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Users size={22} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Current Visitors
            </p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight">
              {crowd.currentOccupancy !== null
                ? crowd.currentOccupancy.toLocaleString("en-IN")
                : "—"}
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              {crowd.currentOccupancy !== null
                ? "Recorded visitor count"
                : "Awaiting crowd update"}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              <Activity size={22} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Crowd Level
            </p>
            {crowd.level ? (
              <>
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${
                      crowdStyles[crowd.level] ||
                      "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {crowd.level}
                  </span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Based on the latest recorded occupancy
                </p>
              </>
            ) : (
              <>
                <h3 className="mt-2 text-2xl font-bold">Unavailable</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  No crowd level has been recorded
                </p>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <Users size={22} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Maximum Capacity
            </p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight">
              {site.maxCapacity.toLocaleString("en-IN")}
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Configured visitor capacity
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <TrendingUp size={22} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Occupancy
            </p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight">
              {crowd.occupancyPercent !== null
                ? `${crowd.occupancyPercent}%`
                : "—"}
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              {crowd.occupancyPercent !== null
                ? "Of total site capacity"
                : "Awaiting occupancy data"}
            </p>
          </div>
        </div>

        {/* Capacity Progress */}
        <div className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Site Occupancy</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Current visitors compared with maximum capacity
              </p>
            </div>

            {crowd.occupancyPercent !== null && (
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-bold">
                {crowd.occupancyPercent}% occupied
              </span>
            )}
          </div>

          {crowd.occupancyPercent !== null &&
          crowd.currentOccupancy !== null ? (
            <>
              <div
                className="mt-5 h-3 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Site occupancy"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(
                  100,
                  Math.max(0, crowd.occupancyPercent)
                )}
              >
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    crowd.level === "CRITICAL"
                      ? "bg-red-500"
                      : crowd.level === "HIGH"
                        ? "bg-orange-500"
                        : crowd.level === "MEDIUM"
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, crowd.occupancyPercent)
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {crowd.currentOccupancy.toLocaleString("en-IN")} visitors
                </span>
                <span>
                  Capacity: {site.maxCapacity.toLocaleString("en-IN")}
                </span>
              </div>
            </>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
              <Activity
                size={24}
                className="mx-auto text-muted-foreground"
              />
              <p className="mt-2 text-sm font-semibold">
                Occupancy data not available
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                The capacity indicator will appear when a crowd update is recorded.
              </p>
            </div>
          )}
        </div>

        {/* Last Updated Information */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
          <Activity size={16} className="shrink-0 text-amber-500" />
          {crowd.lastUpdatedAt ? (
            <span>
              Last updated: {formatDate(crowd.lastUpdatedAt)}
              {crowd.source &&
                ` • Source: ${crowd.source.replaceAll("_", " ")}`}
            </span>
          ) : (
            <span>
              No current crowd update has been recorded for this heritage site yet.
            </span>
          )}
        </div>
      </section>


      {/* About and Visiting Information */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* About */}
        <section className="rounded-2xl border border-border bg-card p-6 xl:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <History size={21} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500">
                Discover the Past
              </p>
              <h2 className="text-xl font-bold">
                About {site.name}
              </h2>
            </div>
          </div>

          <p className="text-sm leading-7 text-muted-foreground">
            {site.description}
          </p>

          {site.history && (
            <>
              <h3 className="mt-6 mb-2 font-bold">
                Historical Background
              </h3>

              <p className="text-sm leading-7 text-muted-foreground">
                {site.history}
              </p>
            </>
          )}

          <div className="mt-6 border-t border-border pt-5">
            <h3 className="mb-2 font-bold">
              Location
            </h3>

            <p className="text-sm leading-7 text-muted-foreground">
              {site.address}, {site.city}, {site.state}, {site.country}
            </p>
          </div>
        </section>

        {/* Visiting Hours */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              <Clock size={21} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500">
                Plan Your Visit
              </p>
              <h2 className="text-xl font-bold">
                Visiting Hours
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Opening Time
              </p>
              <p className="mt-1 font-semibold">
                {site.openingTime}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Closing Time
              </p>
              <p className="mt-1 font-semibold">
                {site.closingTime}
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays size={15} />
                Weekly Closing Days
              </p>

              {site.closedDays.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {site.closedDays.map((day) => (
                    <span
                      key={day}
                      className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold"
                    >
                      {days[day] ?? "Unknown"}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-semibold">
                  No weekly closing day configured
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      
      {/* Crowd History */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <History size={21} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500">
                Monitoring Records
              </p>
              <h2 className="text-xl font-bold">
                Recent Crowd History
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Previously recorded visitor activity
              </p>
            </div>
          </div>

          <span className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 sm:inline-flex">
            Last 10 records
          </span>
        </div>

        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((item, index) => (
              <div
                key={`${item.recordedAt}-${index}`}
                className="group flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/30 p-4 transition-all duration-200 hover:border-blue-200 hover:bg-muted/60 dark:hover:border-blue-900"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <Users size={18} />
                  </div>

                  <div>
                    <p className="font-bold">
                      {item.occupancy.toLocaleString("en-IN")} visitors
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(item.recordedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums">
                      {item.occupancyPercent}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Capacity used
                    </p>
                  </div>

                  <span
                    className={`min-w-[88px] rounded-full px-3 py-1.5 text-center text-xs font-bold ${
                      crowdStyles[item.level] ||
                      "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <History size={22} />
            </div>
            <p className="font-semibold">
              No crowd history yet
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Historical visitor records will appear here as staff update
              the crowd information at this destination.
            </p>
          </div>
        )}
      </section>

      {/* Crowd Predictions */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <TrendingUp size={21} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500">
              Plan Ahead
            </p>
            <h2 className="text-xl font-bold">
              Expected Crowd
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Forecasted visitor activity for upcoming periods
            </p>
          </div>
        </div>

        {predictions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {predictions.map((prediction) => (
              <div
                key={prediction.predictedFor}
                className="rounded-xl border border-border/70 bg-muted/30 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:hover:border-emerald-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {formatDate(prediction.predictedFor)}
                  </p>

                  <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <TrendingUp size={16} />
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold tabular-nums">
                  {prediction.predictedOccupancy.toLocaleString("en-IN")}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Expected visitors
                </p>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Predicted crowd
                  </span>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      crowdStyles[prediction.predictedLevel] ||
                      "bg-muted text-muted-foreground"
                    }`}
                  >
                    {prediction.predictedLevel}
                  </span>
                </div>

                {prediction.confidence !== null && (
                  <div className="mt-5 border-t border-border pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Prediction confidence
                      </span>
                      <span className="text-xs font-bold">
                        {Math.round(prediction.confidence * 100)}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, prediction.confidence * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <TrendingUp size={22} />
            </div>
            <p className="font-semibold">
              Predictions are not available yet
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Crowd forecasts will appear here when prediction data becomes
              available for this heritage destination.
            </p>
          </div>
        )}
      </section>

    </div>
  );
}
