
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Ticket,
  Search,
  RefreshCw,
  ArrowRight,
  CalendarCheck,
  CircleCheck,
  CircleX,
  AlertCircle,
} from "lucide-react";

type Booking = {
  id: string;
  bookingCode: string;
  quantity: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  cancelledAt: string | null;
  site: {
    name: string;
    slug: string;
    city: string;
    coverImage: string | null;
  };
  timeSlot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  ticketCategory: {
    name: string;
    currency: string;
  };
  tickets: {
    id: string;
    status: string;
    usedAt: string | null;
  }[];
  payments: {
    amount: number;
    currency: string;
    status: string;
    method: string | null;
    paidAt: string | null;
  }[];
};

type Filter = "ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED";

const filters: { label: string; value: Filter }[] = [
  { label: "All Bookings", value: "ALL" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusStyle(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "COMPLETED":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "CANCELLED":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "EXPIRED":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    default:
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState("");

  async function fetchBookings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/visitor/bookings");

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please log in to view your bookings."
            : "Unable to load your bookings. Please try again."
        );
      }

      const data = await response.json();
      setBookings(data.bookings ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking(bookingId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setCancellingId(bookingId);
      setCancelError("");
      setCancelSuccess("");

      const response = await fetch("/api/visitor/bookings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to cancel booking.");
      }

      setCancelSuccess("Your booking has been cancelled successfully.");

      await fetchBookings();
    } catch (err) {
      setCancelError(
        err instanceof Error
          ? err.message
          : "Something went wrong while cancelling."
      );
    } finally {
      setCancellingId(null);
    }
  }

  async function handlePayPendingBooking(bookingId: string) {
    if (!razorpayLoaded || payingBookingId) return;

    try {
      setPayingBookingId(bookingId);
      setPaymentError("");

      const response = await fetch("/api/visitor/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to start payment.");
      }

      const RazorpayCheckout = (window as any).Razorpay;

      if (!RazorpayCheckout) {
        throw new Error("Razorpay Checkout has not loaded. Please refresh.");
      }

      const checkout = new RazorpayCheckout({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "HeritageFlow",
        description: `Heritage visit booking ${data.bookingCode}`,
        order_id: data.orderId,

        handler: async (paymentResponse: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyResponse = await fetch(
              "/api/visitor/payments/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(paymentResponse),
              }
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.error || "Payment verification failed."
              );
            }

            window.location.href = "/visitor/tickets";
          } catch (err) {
            setPaymentError(
              err instanceof Error
                ? err.message
                : "Payment verification failed. Please contact support if money was deducted."
            );
            setPayingBookingId(null);
          }
        },

        modal: {
          ondismiss: () => {
            setPayingBookingId(null);
          },
        },

        theme: {
          color: "#d97706",
        },
      });

      checkout.open();
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : "Unable to start payment."
      );
      setPayingBookingId(null);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.site.name.toLowerCase().includes(search.toLowerCase()) ||
        booking.bookingCode.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        activeFilter === "ALL" ||
        (activeFilter === "UPCOMING" &&
          ["CONFIRMED", "PENDING"].includes(booking.status)) ||
        booking.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [bookings, activeFilter, search]);

  const counts = {
    ALL: bookings.length,
    UPCOMING: bookings.filter((b) =>
      ["CONFIRMED", "PENDING"].includes(b.status)
    ).length,
    COMPLETED: bookings.filter((b) => b.status === "COMPLETED").length,
    CANCELLED: bookings.filter((b) => b.status === "CANCELLED").length,
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() =>
          setError("Unable to load Razorpay. Please refresh and try again.")
        }
      />
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Page Heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-medium text-purple-600 dark:text-purple-400">
              YOUR JOURNEY
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              My Bookings
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Keep track of your heritage visits and reservations.
            </p>
          </div>

          <Link
            href="/visitor/explore"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            Explore Places
            <ArrowRight size={17} />
          </Link>
        </div>

        {cancelSuccess && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
            {cancelSuccess}
          </div>
        )}

        {cancelError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {cancelError}
          </div>
        )}
        {paymentError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {paymentError}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "Total Bookings",
              count: counts.ALL,
              icon: Ticket,
              color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
            },
            {
              label: "Upcoming",
              count: counts.UPCOMING,
              icon: CalendarCheck,
              color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
            },
            {
              label: "Completed",
              count: counts.COMPLETED,
              icon: CircleCheck,
              color: "text-green-600 bg-green-100 dark:bg-green-900/30",
            },
            {
              label: "Cancelled",
              count: counts.CANCELLED,
              icon: CircleX,
              color: "text-red-600 bg-red-100 dark:bg-red-900/30",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}>
                  <Icon size={21} />
                </div>
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="relative mb-5">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by heritage site or booking ID..."
              className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm outline-none transition focus:border-purple-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  activeFilter === filter.value
                    ? "bg-purple-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900/30"
                }`}
              >
                {filter.label}
                <span className="ml-2 opacity-75">
                  {counts[filter.value]}
                </span>
              </button>
            ))}

            <button
              onClick={fetchBookings}
              disabled={loading}
              className="ml-auto inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <RefreshCw size={28} className="mx-auto animate-spin text-purple-600" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading your bookings...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/20">
            <AlertCircle size={30} className="mx-auto text-red-500" />
            <p className="mt-3 font-semibold">Unable to load bookings</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={fetchBookings}
              className="mt-5 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Booking List */}
        {!loading && !error && filteredBookings.length > 0 && (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const payment = booking.payments[0];
              const paid = payment?.status === "PAID";
              const ticketCount = booking.tickets.length;

              return (
                <div
                  key={booking.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-md"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="flex min-h-48 items-center justify-center bg-gradient-to-br from-purple-100 to-amber-100 p-6 dark:from-purple-950 dark:to-amber-950 md:w-56">
                      {booking.site.coverImage ? (
                        <img
                          src={booking.site.coverImage}
                          alt={booking.site.name}
                          className="h-40 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <MapPin size={32} className="mx-auto text-purple-600" />
                          <p className="mt-3 text-sm font-semibold text-purple-800 dark:text-purple-300">
                            {booking.site.name}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-bold">
                            {booking.site.name}
                          </h2>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin size={15} />
                            {booking.site.city}
                          </p>
                        </div>

                        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="my-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-center gap-3">
                          <CalendarDays size={19} className="text-purple-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Visit Date</p>
                            <p className="text-sm font-semibold">
                              {formatDate(booking.timeSlot.date)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Clock3 size={19} className="text-purple-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Time Slot</p>
                            <p className="text-sm font-semibold">
                              {formatTime(booking.timeSlot.startTime)} – {formatTime(booking.timeSlot.endTime)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Ticket size={19} className="text-purple-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Tickets</p>
                            <p className="text-sm font-semibold">
                              {booking.quantity} × {booking.ticketCategory.name}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Booking ID: {booking.bookingCode}
                          </p>
                          <p className="mt-1 text-lg font-bold">
                            {booking.ticketCategory.currency}{" "}
                            {booking.totalAmount.toLocaleString("en-IN")}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Payment:
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                paid
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              }`}
                            >
                              {payment?.status ?? "NOT RECORDED"}
                            </span>

                            <span className="text-xs text-muted-foreground">
                              • {ticketCount} ticket{ticketCount !== 1 ? "s" : ""} generated
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {paid && ticketCount > 0 && (
                            <Link
                              href="/visitor/tickets"
                              className="inline-flex items-center gap-2 rounded-xl border border-purple-200 px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 dark:border-purple-900 dark:text-purple-300 dark:hover:bg-purple-950"
                            >
                              View Tickets
                              <ArrowRight size={16} />
                            </Link>
                          )}

                          {booking.status === "PENDING" && !paid && (
                            <button
                              type="button"
                              onClick={() => handlePayPendingBooking(booking.id)}
                              disabled={!razorpayLoaded || payingBookingId !== null}
                              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-[#24152d] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {payingBookingId === booking.id
                                ? "Processing..."
                                : !razorpayLoaded
                                  ? "Loading Payment..."
                                  : "Pay Now"}
                            </button>
                          )}

                          {booking.status === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancellingId === booking.id}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                            >
                              {cancellingId === booking.id
                                ? "Cancelling..."
                                : "Cancel Booking"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBookings.length === 0 && (
          <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <CalendarDays size={30} />
            </div>

            <h2 className="mt-5 text-xl font-bold">
              {bookings.length === 0
                ? "No bookings yet"
                : "No matching bookings"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {bookings.length === 0
                ? "Your heritage journeys will appear here once you book your first visit."
                : "Try changing your search or selecting another booking filter."}
            </p>

            {bookings.length === 0 && (
              <Link
                href="/visitor/explore"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700"
              >
                Explore Heritage Sites
                <ArrowRight size={17} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
