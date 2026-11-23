"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {

  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "features", "about"];
      const marker = window.scrollY + window.innerHeight * 0.55;

      let currentSection = "home";

      sections.forEach((section) => {
        const element = document.getElementById(section);

        if (element) {
          const sectionTop =
            element.getBoundingClientRect().top + window.scrollY;

          if (sectionTop <= marker) {
            currentSection = section;
          }
        }
      });

      // Ensure About is highlighted at the bottom of the page.
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 5
      ) {
        currentSection = "about";
      }

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="relative min-h-screen bg-[#160f20]">

      {/* Hero Background */}
      <div
        className="relative min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1564507592333-c60657eea523?w=2000&q=90')",
        }}
      >
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#160f20]/85 via-[#160f20]/55 to-[#160f20]/20" />

        <div className="relative z-10 flex min-h-screen flex-col">

          {/* Navigation Bar */}
          <header className="fixed left-5 right-5 top-5 z-50 rounded-2xl border border-white/20 bg-[#24152d]/80 px-6 py-5 shadow-lg backdrop-blur-md md:left-10 md:right-10 md:px-10">
            <nav className="flex items-center justify-between">

              {/* Logo */}
              <Link href="/" className="flex items-center gap-3">
                <span className="text-4xl">🏛️</span>
                <div>
                  <h2 className="text-xl font-bold tracking-wide text-white md:text-2xl">
                    HeritageFlow
                  </h2>
                  <p className="text-xs tracking-widest text-amber-200">
                    PRESERVE OUR LEGACY
                  </p>
                </div>
              </Link>

              {/* Navigation Links */}
              <div className="hidden items-center gap-9 text-sm font-medium text-white md:flex">

                <Link
                  href="#home"
                  onClick={(e) => {
                    e.preventDefault();

                    document.getElementById("home")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });

                    window.history.replaceState(null, "", "#home");
                  }}
                  className={`border-b-2 pb-1 transition ${
                    activeSection === "home"
                      ? "border-amber-400 text-amber-300"
                      : "border-transparent hover:border-amber-400 hover:text-amber-300"
                  }`}
                >
                  Home
                </Link>

                <a
                  href="#features"
                  className={`border-b-2 pb-1 transition ${
                    activeSection === "features"
                      ? "border-amber-400 text-amber-300"
                      : "border-transparent hover:border-amber-400 hover:text-amber-300"
                  }`}
                >
                  Features
                </a>

                <a
                  href="#page-bottom"
                  className={`border-b-2 pb-1 transition ${
                    activeSection === "about"
                      ? "border-amber-400 text-amber-300"
                      : "border-transparent hover:border-amber-400 hover:text-amber-300"
                  }`}
                >
                  About
                </a>

              </div>

              {/* Sign In and Sign Up */}
              <div className="flex items-center gap-3">
                <Link
                  href="/visitor"
                  className="rounded-full border border-white/60 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-[#24152d]"
                >
                  Sign In
                </Link>

                <Link
                  href="/visitor"
                  className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-[#211426] transition hover:bg-amber-300"
                >
                  Sign Up
                </Link>
              </div>

            </nav>
          </header>

          {/* Hero Section */}
          <section
              id="home"
              className="flex flex-1 items-center px-7 pb-20 pt-48 md:px-16 md:pt-52 lg:px-24"
            >
            <div className="max-w-3xl">

              <p className="mb-7 text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
                Preserve &nbsp; • &nbsp; Manage &nbsp; • &nbsp; Experience
              </p>

              <h1 className="font-serif text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                Our Heritage,
                <br />
                Our{" "}
                <span className="text-amber-300">
                  Responsibility.
                </span>
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-8 text-white/90 md:text-xl">
                Every monument has a story worth preserving.
                Experience India's timeless heritage through
                smarter, safer and more organized visits.
              </p>

              <p className="mt-5 max-w-lg border-l-2 border-amber-400 pl-4 text-sm italic leading-7 text-amber-100 md:text-base">
                "Our heritage is not just a memory of the past,
                but a legacy we must protect for the future."
              </p>

              {/* Get Started */}
              <Link
                href="/visitor"
                className="mt-10 inline-flex items-center gap-4 rounded-full bg-amber-400 px-9 py-4 font-bold text-[#211426] shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:bg-amber-300 hover:shadow-xl"
              >
                Get Started
                <span className="text-xl">→</span>
              </Link>

            </div>
          </section>

          {/* Bottom Features */}
          <section
            id="features"
            className="scroll-mt-8 border-t border-white/20 bg-black/25 px-7 py-10 backdrop-blur-sm md:px-16"
          >

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-3">

              <div className="flex items-center gap-4 text-white">
                <span className="text-3xl">👥</span>
                <div>
                  <h3 className="font-semibold">Real-Time Monitoring</h3>
                  <p className="text-sm text-white/70">
                    Smarter crowd management
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-white">
                <span className="text-3xl">🛡️</span>
                <div>
                  <h3 className="font-semibold">Safe & Organized Visits</h3>
                  <p className="text-sm text-white/70">
                    Better visitor experiences
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-white">
                <span className="text-3xl">🏛️</span>
                <div>
                  <h3 className="font-semibold">Heritage Preservation</h3>
                  <p className="text-sm text-white/70">
                    Protecting our legacy
                  </p>
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>

      {/* About Section */}
      <section
        id="about"
        className="scroll-mt-8 bg-[#160f20] px-7 py-24 text-white md:px-16"
      >
        <div className="mx-auto max-w-5xl">

          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
            About Us
          </p>

          <h2 className="font-serif text-4xl font-bold md:text-6xl">
            Discover HeritageFlow
          </h2>

          <div className="mt-8 h-1 w-20 rounded-full bg-amber-400" />

          <p className="mt-8 max-w-3xl text-lg leading-9 text-white/75">
            HeritageFlow is a smart heritage site and crowd management
            platform designed to make visits to historical monuments
            safer, smoother and more organized.
          </p>

          <p className="mt-5 max-w-3xl text-lg leading-9 text-white/75">
            From digital ticketing and visitor management to real-time
            crowd monitoring, our goal is to bring technology and
            heritage preservation together while protecting the
            historical places that connect us to our past.
          </p>

          <p className="mt-10 font-serif text-xl italic text-amber-200">
            Preserving yesterday. Managing today. Protecting tomorrow.
          </p>

        </div>
      </section>
      <div id="page-bottom" />

    </main>
  );
}
