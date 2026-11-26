
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { allDestinations } from "@/data/all-destinations";
import {
  Bookmark,
  MapPin,
  ArrowRight,
  Trash2,
  Search,
} from "lucide-react";

type SavedPlace = {
  id: string;
  createdAt: string;
  site: {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string;
    city: string;
    state: string;
    coverImage: string | null;
    isActive: boolean;
  };
};

export default function SavedPlacesPage() {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadSavedPlaces() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/visitor/saved-places");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load saved places.");
      }

      setSavedPlaces(data.savedPlaces || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeSavedPlace(siteId: string) {
    try {
      setRemovingId(siteId);
      setError("");

      const response = await fetch("/api/visitor/saved-places", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ siteId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to remove saved place.");
      }

      setSavedPlaces((previous) =>
        previous.filter((item) => item.site.id !== siteId)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove saved place."
      );
    } finally {
      setRemovingId(null);
    }
  }

  useEffect(() => {
    loadSavedPlaces();
  }, []);

  return (
    <div>
      {/* Page Heading */}
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-500">
          Your Personal Collection
        </p>

        <h1 className="text-3xl font-bold md:text-4xl">
          Saved Places
        </h1>

        <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          Keep your favourite heritage destinations together and plan
          your next historical adventure.
        </p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <Bookmark size={17} className="text-amber-500" />
          <span className="font-semibold">{savedPlaces.length}</span>
          <span className="text-muted-foreground">
            saved {savedPlaces.length === 1 ? "place" : "places"}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-80 animate-pulse rounded-2xl border border-border bg-muted"
            />
          ))}
        </div>
      ) : savedPlaces.length > 0 ? (
        <>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold">Your Collection</h2>
            <span className="text-sm text-muted-foreground">
              {savedPlaces.length} destinations
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {savedPlaces.map((item) => {
              const place = item.site;
              const destination = allDestinations.find(
                (item) => item.name === place.name
              );

              const imageUrl = place.coverImage || destination?.image;

              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden bg-muted">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={place.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Image coming soon
                      </div>
                    )}

                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#24152d]">
                      {place.category}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeSavedPlace(place.id)}
                      disabled={removingId !== null}
                      title="Remove saved place"
                      aria-label={`Remove ${place.name} from saved places`}
                      className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-md transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-5">
                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin size={14} className="text-amber-500" />
                      {place.city}, {place.state}
                    </div>

                    <h3 className="text-lg font-bold">
                      {place.name}
                    </h3>

                    <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                      {place.description}
                    </p>

                    <Link
                      href={`/visitor/places/${place.slug}`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 transition hover:gap-3 dark:text-amber-400"
                    >
                      View Details
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <Bookmark size={30} />
          </div>

          <h2 className="text-xl font-bold">
            No saved places yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Explore India's incredible heritage destinations and
            bookmark the places you would love to visit.
          </p>

          <Link
            href="/visitor/explore"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-[#24152d] transition hover:bg-amber-300"
          >
            <Search size={17} />
            Explore Places
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
