
"use client";

import { useMemo, useState } from "react";
import { Search, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { allDestinations } from "@/data/all-destinations";

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedState, setSelectedState] = useState("All States");

  const categories = [
    "All",
    "Forts",
    "Palaces",
    "Temples",
    "Monuments",
    "Caves",
  ];

  const states = [
    "All States",
    ...Array.from(new Set(allDestinations.map((place) => place.state))).sort(),
  ];

  const filteredDestinations = useMemo(() => {
    return allDestinations.filter((place) => {
      const matchesSearch =
        `${place.name} ${place.location} ${place.state} ${place.category}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        place.category === selectedCategory;

      const matchesState =
        selectedState === "All States" ||
        place.state === selectedState;

      return matchesSearch && matchesCategory && matchesState;
    });
  }, [search, selectedCategory, selectedState]);

  return (
    <div>
      {/* Page Heading */}
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-500">
          Discover India's Heritage
        </p>

        <h1 className="text-3xl font-bold md:text-4xl">
          Explore Heritage Places
        </h1>

        <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          Discover India's remarkable forts, palaces, temples and monuments.
          Find your next destination and explore its history.
        </p>
      </div>

      {/* Search and State Filter */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by place, city or state..."
            className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none transition focus:border-amber-400"
          />
        </div>

        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-amber-400"
        >
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              selectedCategory === category
                ? "bg-amber-400 text-[#24152d]"
                : "border border-border bg-card text-muted-foreground hover:border-amber-400 hover:text-amber-500"
            }`}
          >
            {category === "All" ? "All Places" : category}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          Heritage Destinations
        </h2>

        <p className="text-sm text-muted-foreground">
          {filteredDestinations.length} places found
        </p>
      </div>

      {/* Destination Grid */}
      {filteredDestinations.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredDestinations.map((place) => (
            <article
              key={place.id}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-52 overflow-hidden bg-muted">
                {place.image ? (
                  <img
                    src={place.image}
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
              </div>

              <div className="p-5">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin size={14} className="text-amber-500" />
                  {place.location}, {place.state}
                </div>

                <h3 className="text-lg font-bold">
                  {place.name}
                </h3>

                <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                  {place.description}
                </p>

                <Link
                  href={`/visitor/places/${place.id}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 transition hover:gap-3 dark:text-amber-400"
                >
                  View Details
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <Search className="mx-auto mb-4 text-muted-foreground" size={32} />
          <h3 className="text-lg font-bold">No places found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try changing your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
