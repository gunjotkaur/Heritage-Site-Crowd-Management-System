
"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Compass,
  Ticket,
  QrCode,
  Heart,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  MapPin,
  ArrowRight,
  Menu,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";



const destinations = [
  {
    name: "Red Fort",
    location: "Delhi, India",
    category: "Historical Fort",
    image:
      "https://images.unsplash.com/photo-1598434192043-71111c1b3f41?w=800",
  },
  {
    name: "Mysore Palace",
    location: "Mysore, Karnataka",
    category: "Royal Palace",
    image:
      "https://images.unsplash.com/photo-1600112356915-089abb8fc71a?w=800",
  },
  {
    name: "Ajanta Caves",
    location: "Aurangabad, Maharashtra",
    category: "Ancient Caves",
    image:
      "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=800",
  },
  {
    name: "Hawa Mahal",
    location: "Jaipur, Rajasthan",
    category: "Historical Palace",
    image:
      "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=800",
  },
  {
    name: "Qutub Minar",
    location: "Delhi, India",
    category: "Historical Monument",
    image:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800",
  },
  {
    name: "Konark Sun Temple",
    location: "Puri, Odisha",
    category: "Ancient Temple",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/KONARK%20Sun%20Temple.jpg",
  },
];

const popularPlaces = [
  {
    name: "Taj Mahal",
    location: "Agra, Uttar Pradesh",
    image:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1000",
  },
  {
    name: "Hawa Mahal",
    location: "Jaipur, Rajasthan",
    image:
      "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=1000",
  },
  {
    name: "India Gate",
    location: "New Delhi, India",
    image:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1000",
  },
];

export default function VisitorDashboardPage() {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [activeSlide, setActiveSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Places");

  useEffect(() => {
    if (isCarouselPaused) return;

    const interval = setInterval(() => {
      setActiveSlide((current) =>
        (current + 1) % popularPlaces.length
      );
    }, 5500);

    return () => clearInterval(interval);
  }, [isCarouselPaused]);

  const nextSlide = () => {
    setActiveSlide((current) =>
      (current + 1) % popularPlaces.length
    );
  };

  const previousSlide = () => {
    setActiveSlide((current) =>
      (current - 1 + popularPlaces.length) % popularPlaces.length
    );
  };

  const filteredDestinations = destinations.filter((place) => {
    const matchesSearch = `${place.name} ${place.location} ${place.category}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All Places" ||
      (selectedCategory === "Forts" && place.category.includes("Fort")) ||
      (selectedCategory === "Palaces" && place.category.includes("Palace")) ||
      (selectedCategory === "Temples" && place.category.includes("Temple")) ||
      (selectedCategory === "Monuments" &&
        place.category.includes("Monument"));

    return matchesSearch && matchesCategory;
  });

  const bg = "bg-background";
  const surface = "bg-card";
  const text = "text-foreground";
  const muted = "text-muted-foreground";
  const border = "border-border";

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/visitor" },
    { name: "Explore Places", icon: Compass, href: "/visitor/explore" },
    { name: "My Bookings", icon: Ticket, href: "/visitor/bookings" },
    { name: "My Tickets", icon: QrCode, href: "/visitor/tickets" },
    { name: "Saved Places", icon: Heart, href: "/visitor/saved" },
    { name: "Settings", icon: Settings, href: "/visitor/settings" },
  ];

  return(
    <>
          {/* Search Bar */}
          <div className="mb-10">
            <div className={`flex items-center gap-3 rounded-2xl border ${border} ${surface} px-5 py-4 shadow-sm`}>
              <Search className={muted} size={21} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search monuments, forts, palaces and more..."
                className={`w-full bg-transparent text-sm outline-none ${text} placeholder:text-gray-400`}
              />
              <span className={`hidden text-xs sm:block ${muted}`}>
                Explore India
              </span>
            </div>
          </div>
          
          {/* Popular Destinations Carousel */}
          <section className="mb-12">
            <div className="mb-5">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-500">
                Discover India
              </p>

              <h2 className="text-xl font-bold md:text-2xl">
                Popular Destinations
              </h2>

              <p className={`mt-1 text-sm ${muted}`}>
                Discover India's most iconic heritage destinations.
              </p>
            </div>

            <div
              className="relative overflow-hidden rounded-3xl shadow-lg"
              onMouseEnter={() => setIsCarouselPaused(true)}
              onMouseLeave={() => setIsCarouselPaused(false)}
              onFocus={() => setIsCarouselPaused(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setIsCarouselPaused(false);
                }
              }}
            >
            <div className="relative h-[300px] sm:h-[380px] lg:h-[430px]">
              {popularPlaces.map((place, index) => (
                <div
                  key={place.name}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    activeSlide === index
                      ? "z-10 opacity-100"
                      : "z-0 opacity-0"
                  }`}
                  aria-hidden={activeSlide !== index}
                >
                  <img
                    src={place.image}
                    alt={place.name}
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />

                  <div className="absolute bottom-0 left-0 top-0 flex max-w-xl flex-col justify-center px-7 py-8 text-white sm:px-12 lg:px-16">
                    <span className="mb-4 w-fit rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#24152d]">
                      Featured Destination
                    </span>

                    <h3 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                      {place.name}
                    </h3>

                    <p className="mt-3 flex items-center gap-2 text-sm text-white/85 sm:text-base">
                      <MapPin size={18} />
                      {place.location}
                    </p>

                    <button
                      type="button"
                      className="mt-7 flex w-fit items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-[#24152d] transition hover:bg-amber-300"
                    >
                      Explore Destination
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Previous Button */}
              <button
                type="button"
                onClick={previousSlide}
                aria-label="Previous destination"
                className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition hover:bg-amber-400 hover:text-[#24152d] sm:left-6 sm:h-12 sm:w-12"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next destination"
                className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition hover:bg-amber-400 hover:text-[#24152d] sm:right-6 sm:h-12 sm:w-12"
              >
                <ChevronRight size={24} />
              </button>

              {/* Slide Indicators */}
              <div className="absolute bottom-5 right-7 z-20 flex items-center gap-2">
                {popularPlaces.map((place, index) => (
                  <button
                    key={place.name}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Show ${place.name}`}
                    aria-current={activeSlide === index ? "true" : undefined}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      activeSlide === index
                        ? "w-8 bg-amber-400"
                        : "w-2.5 bg-white/70 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>


          {/* All Destinations */}
          <section>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-500">
                  Explore & Experience
                </p>

                <h2 className="text-xl font-bold md:text-2xl">
                  Explore Heritage Sites
                </h2>

                <p className={`mt-1 text-sm ${muted}`}>
                  Discover historical places and their timeless stories.
                </p>
              </div>

              <Link
                href="/visitor/explore"
                className="flex items-center gap-2 text-sm font-semibold text-amber-600 transition hover:gap-3 dark:text-amber-400"
              >
                View All Places
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {["All Places", "Forts", "Palaces", "Temples", "Monuments"].map(
                (category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                      selectedCategory === category
                        ? "bg-amber-400 text-[#24152d]"
                        : `${surface} border ${border} ${muted} hover:border-amber-400 hover:text-amber-500`
                    }`}
                  >
                    {category}
                  </button>
                )
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDestinations.map((place) => (
                <article
                  key={place.name}
                  className={`overflow-hidden rounded-2xl border ${border} ${surface} shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={place.image}
                      alt={place.name}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#24152d]">
                      {place.category}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold">{place.name}</h3>
                    <p className={`mt-2 flex items-center gap-2 text-sm ${muted}`}>
                      <MapPin size={15} className="text-amber-500" />
                      {place.location}
                    </p>

                    <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#24152d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 hover:text-[#24152d]">
                      View Details <ArrowRight size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {filteredDestinations.length === 0 && (
              <div className={`rounded-2xl border ${border} ${surface} p-10 text-center`}>
                <Search className={`mx-auto mb-3 ${muted}`} size={30} />
                <p className="font-semibold">No destinations found</p>
                <p className={`mt-1 text-sm ${muted}`}>
                  Try searching for another heritage site.
                </p>
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className={`mt-16 border-t ${border} py-6 text-center`}>
            <p className={`text-xs ${muted}`}>
              © 2026 HeritageFlow. Preserving our heritage, inspiring generations.
            </p>
          </footer>

    </>
  );
}
