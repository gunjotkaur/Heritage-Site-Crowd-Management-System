
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Ticket,
  Users,
  ShieldCheck,
  Info,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type TicketCategory = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
};

type TimeSlot = {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  remainingCapacity: number;
};

type HeritageSite = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  coverImage: string | null;
  openingTime: string;
  closingTime: string;
  ticketCategories: TicketCategory[];
};

function getTomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMaxBookingDate() {
  const date = new Date();
  date.setDate(date.getDate() + 29);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function BookVisitPage() {
  const [siteSlug, setSiteSlug] = useState("");
  const [site, setSite] = useState<HeritageSite | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<{
    id: string;
    bookingCode: string;
    totalAmount: number;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSiteSlug(params.get("site") || "");
    setSelectedDate(getTomorrowDate());
  }, []);

  useEffect(() => {
    if (!siteSlug) return;

    const controller = new AbortController();

    async function loadBookingOptions() {
      setLoading(true);
      setError("");
      setMessage("");
      setSelectedSlot("");

      try {
        const response = await fetch(
          `/api/visitor/booking-options?site=${encodeURIComponent(siteSlug)}&date=${selectedDate}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load booking options.");
        }

        setSite(data.site);
        setSlots(data.slots || []);
        setMessage(data.message || "");

        if (data.site?.ticketCategories?.length > 0) {
          setSelectedCategory(data.site.ticketCategories[0].id);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadBookingOptions();

    return () => controller.abort();
  }, [siteSlug, selectedDate]);

  const selectedTicket = site?.ticketCategories.find(
    (category) => category.id === selectedCategory
  );

  const selectedTimeSlot = slots.find(
    (slot) => slot.id === selectedSlot
  );

  const totalAmount = selectedTicket
    ? selectedTicket.price * quantity
    : 0;

  const canContinue =
    !!selectedTimeSlot &&
    !!selectedTicket &&
    quantity >= 1 &&
    quantity <= 10 &&
    quantity <= selectedTimeSlot.remainingCapacity;

  const handleCreateBooking = async () => {
    if (!site || !canContinue || bookingSubmitting) return;

    setBookingSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/visitor/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteId: site.id,
          timeSlotId: selectedSlot,
          ticketCategoryId: selectedCategory,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking.");
      }

      setCreatedBooking({
        id: data.booking.id,
        bookingCode: data.booking.bookingCode,
        totalAmount: Number(data.booking.totalAmount),
      });

      setMessage("Your booking has been created successfully!");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating your booking."
      );
    } finally {
      setBookingSubmitting(false);
    }
  };
  const handlePayment = async () => {
    if (!createdBooking || paymentProcessing || !razorpayLoaded) {
      return;
    }

    setPaymentProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/visitor/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: createdBooking.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to start payment.");
      }
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "HeritageFlow",
        description: `Heritage visit booking ${data.bookingCode}`,
        order_id: data.orderId,
        handler: async function (paymentResponse: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          setPaymentProcessing(true);
          setError("");

          try {
            const verifyResponse = await fetch("/api/visitor/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(paymentResponse),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.error || "Payment verification failed."
              );
            }

            setMessage("Payment successful! Your booking is confirmed.");

            window.location.href = "/visitor/tickets";
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Payment verification failed. Please contact support if money was deducted."
            );
          } finally {
            setPaymentProcessing(false);
          }
        },
        theme: {
          color: "#d97706",
        },
      };
      const RazorpayCheckout = (window as any).Razorpay;

      if (!RazorpayCheckout) {
        throw new Error("Razorpay Checkout has not loaded. Please refresh.");
      }

      const checkout = new RazorpayCheckout(options);
      checkout.open();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start payment."
      );
    } finally {
      setPaymentProcessing(false);
    }
    
  };

  if (!siteSlug) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <Ticket className="mx-auto mb-4 text-amber-500" size={40} />
        <h1 className="text-xl font-bold">Select a heritage site</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please choose a heritage destination before booking your visit.
        </p>
        <Link
          href="/visitor/explore"
          className="mt-5 inline-flex rounded-xl bg-amber-400 px-5 py-3 font-semibold text-[#24152d] hover:bg-amber-300"
        >
          Explore Places
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => setError("Unable to load Razorpay. Please refresh and try again.")}
      />
      {createdBooking && (
        <div className="rounded-2xl border border-green-300 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-950/30">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
            <CheckCircle2 size={34} />
          </div>

          <h2 className="mt-5 text-2xl font-bold text-green-800 dark:text-green-300">
            Booking Created Successfully!
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Your visit booking has been saved.
          </p>

          <div className="mx-auto mt-6 max-w-sm rounded-xl border border-green-200 bg-white p-5 text-left dark:border-green-900 dark:bg-background">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Booking Reference
            </p>
            <p className="mt-1 text-lg font-bold">
              {createdBooking.bookingCode}
            </p>

            <div className="mt-4 flex justify-between text-sm">
              <span className="text-muted-foreground">Total amount</span>
              <span className="font-bold">
                ₹{createdBooking.totalAmount}
              </span>
            </div>

            <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">
              Payment is not processed yet. Your booking is currently pending.
            </p>
            <button
              type="button"
              onClick={handlePayment}
              disabled={!razorpayLoaded || paymentProcessing}
              className="mt-5 w-full rounded-xl bg-amber-400 px-5 py-3.5 text-sm font-bold text-[#24152d] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paymentProcessing
                ? "Processing Payment..."
                : !razorpayLoaded
                  ? "Loading Payment..."
                  : `Pay ₹${createdBooking.totalAmount} Now`}
            </button>
          </div>
        </div>
      )}

      {/* Page Heading */}
      <div>
        <Link
          href={site ? `/visitor/places/${site.slug}` : "/visitor/explore"}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-amber-500"
        >
          <ArrowLeft size={17} />
          Back to heritage site
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-amber-500">
              HeritageFlow Reservations
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Book Your Visit
            </h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Plan your journey through India's incredible heritage.
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 sm:flex">
            <ShieldCheck className="text-amber-500" size={21} />
            <span className="text-sm font-medium">
              Secure booking experience
            </span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
          <Loader2 className="animate-spin text-amber-500" size={34} />
          <p className="text-sm text-muted-foreground">
            Loading booking options...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <p className="font-semibold">Unable to load booking options</p>
          <p className="mt-2 text-sm">{error}</p>
          <button
            onClick={() => setSiteSlug("")}
            className="mt-4 text-sm font-semibold underline"
          >
            Go back and select a site
          </button>
        </div>
      )}

      {!loading && !error && site && (
        <>
          {/* Heritage Site Card */}
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="relative bg-gradient-to-r from-[#24152d] via-[#392447] to-[#62436e] p-6 text-white md:p-8">
              <div className="absolute right-8 top-5 opacity-10">
                <MapPin size={100} />
              </div>

              <div className="relative max-w-2xl">
                <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Selected destination
                </span>

                <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                  {site.name}
                </h2>

                <p className="mt-3 flex items-start gap-2 text-sm text-white/75">
                  <MapPin size={17} className="mt-0.5 shrink-0" />
                  {site.address}, {site.city}, {site.state}
                </p>

                <div className="mt-5 flex flex-wrap gap-5 text-sm text-white/80">
                  <span className="flex items-center gap-2">
                    <Clock3 size={17} className="text-amber-300" />
                    {formatTime(site.openingTime)} – {formatTime(site.closingTime)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users size={17} className="text-amber-300" />
                    Capacity: {site.ticketCategories.length > 0 ? "Limited slots" : "Check availability"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1fr_350px]">

            {/* Booking Form */}
            <div className="space-y-7">

              {/* Date Selection */}
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400">
                    <CalendarDays size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold">Choose your visit date</h3>
                    <p className="text-sm text-muted-foreground">
                      Select the day you plan to visit
                    </p>
                  </div>
                </div>

                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().getFullYear() + "-" +
                    String(new Date().getMonth() + 1).padStart(2, "0") + "-" +
                    String(new Date().getDate()).padStart(2, "0")}
                  max={getMaxBookingDate()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 sm:max-w-sm"
                />

                <p className="mt-3 text-xs text-muted-foreground">
                  Selected date: {formatDate(selectedDate)}
                </p>
              </section>

              {/* Time Slot Selection */}
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400">
                    <Clock3 size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold">Choose a time slot</h3>
                    <p className="text-sm text-muted-foreground">
                      Available visiting sessions
                    </p>
                  </div>
                </div>

                {slots.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center">
                    <CalendarDays className="mx-auto mb-3 text-muted-foreground" size={30} />
                    <p className="font-semibold">No available time slots</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {message || "Please select another date to see available sessions."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {slots.map((slot) => {
                      const active = selectedSlot === slot.id;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot.id)}
                          className={`rounded-xl border p-4 text-left transition ${
                            active
                              ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/30"
                              : "border-border hover:border-amber-400/60 hover:bg-amber-400/5"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">
                              {formatTime(slot.startTime)}
                            </span>
                            {active && (
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                SELECTED
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Until {formatTime(slot.endTime)}
                          </p>

                          <p className="mt-3 text-xs font-medium text-green-600 dark:text-green-400">
                            {slot.remainingCapacity.toLocaleString("en-IN")} spots available
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Ticket Categories */}
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400">
                    <Ticket size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold">Select ticket category</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose the applicable ticket type
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {site.ticketCategories.map((category) => {
                    const active = selectedCategory === category.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition ${
                          active
                            ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/30"
                            : "border-border hover:border-amber-400/60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            active ? "border-amber-500 bg-amber-400" : "border-muted-foreground"
                          }`}>
                            {active && (
                              <span className="h-2 w-2 rounded-full bg-[#24152d]" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{category.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {category.description}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 font-bold">
                          {formatPrice(category.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-xl bg-amber-400/10 p-3 text-xs text-muted-foreground">
                  <Info size={17} className="shrink-0 text-amber-500" />
                  Prices currently configured for this demonstration.
                </div>
              </section>

              {/* Quantity */}
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400">
                      <Users size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold">Number of visitors</h3>
                      <p className="text-sm text-muted-foreground">
                        Maximum 10 tickets per booking
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-xl font-semibold transition hover:border-amber-400 disabled:opacity-40"
                    >
                      −
                    </button>

                    <span className="min-w-6 text-center text-lg font-bold">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      disabled={quantity >= 10}
                      onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-xl font-semibold transition hover:border-amber-400 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Booking Summary */}
            <aside className="lg:sticky lg:top-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-bold">Booking Summary</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review your visit details
                </p>

                <div className="my-5 border-t border-border" />

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Destination</p>
                    <p className="mt-1 font-semibold">{site.name}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Visit date</p>
                    <p className="mt-1 font-semibold">
                      {formatDate(selectedDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Time slot</p>
                    <p className="mt-1 font-semibold">
                      {selectedTimeSlot
                        ? `${formatTime(selectedTimeSlot.startTime)} – ${formatTime(selectedTimeSlot.endTime)}`
                        : "Not selected"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Ticket category</p>
                    <p className="mt-1 font-semibold">
                      {selectedTicket?.name || "Not selected"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Visitors</p>
                    <p className="mt-1 font-semibold">{quantity}</p>
                  </div>
                </div>

                <div className="my-5 border-t border-border" />

                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total amount</span>
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {formatPrice(totalAmount)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCreateBooking}
                  disabled={!canContinue || bookingSubmitting || !!createdBooking}
                  className={`mt-6 w-full rounded-xl px-5 py-3.5 text-sm font-bold text-[#24152d] transition ${
                    !canContinue || bookingSubmitting || createdBooking
                      ? "cursor-not-allowed bg-amber-400 opacity-60"
                      : "bg-amber-400 hover:bg-amber-300"
                  }`}
                >
                  {bookingSubmitting
                    ? "Creating Booking..."
                    : createdBooking
                      ? "Booking Created"
                      : "Confirm Booking"}
                </button>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  No payment has been collected.
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
