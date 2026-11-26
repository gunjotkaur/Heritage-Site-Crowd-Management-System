
"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Ticket,
  RefreshCw,
  Search,
  QrCode,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

type TicketData = {
  id: string;
  qrCode: string;
  holderName: string | null;
  status: "VALID" | "USED" | "CANCELLED" | "EXPIRED";
  usedAt: string | null;
  createdAt: string;
  booking: {
    id: string;
    bookingCode: string;
    status: string;
    quantity: number;
    totalAmount: number;
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
    payments: {
      status: string;
      paidAt: string | null;
    }[];
  };
};

const statusStyles: Record<string, string> = {
  VALID:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  USED:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  CANCELLED:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  EXPIRED:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [qrImages, setQrImages] = useState<Record<string, string>>({});

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/visitor/tickets");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load tickets.");
      }

      const loadedTickets: TicketData[] = data.tickets || [];
      setTickets(loadedTickets);

      const images: Record<string, string> = {};

      await Promise.all(
        loadedTickets.map(async (ticket) => {
          images[ticket.id] = await QRCode.toDataURL(ticket.qrCode, {
            width: 240,
            margin: 2,
            errorCorrectionLevel: "H",
            color: {
              dark: "#241331",
              light: "#FFFFFF",
            },
          });
        })
      );

      setQrImages(images);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = tickets.filter((ticket) => {
    const query = search.toLowerCase();

    return (
      ticket.booking.bookingCode.toLowerCase().includes(query) ||
      ticket.booking.site.name.toLowerCase().includes(query) ||
      ticket.booking.ticketCategory.name.toLowerCase().includes(query)
    );
  });

  const validCount = tickets.filter(
    (ticket) => ticket.status === "VALID"
  ).length;

  const usedCount = tickets.filter(
    (ticket) => ticket.status === "USED"
  ).length;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 animate-spin text-purple-600" size={30} />
          <p className="text-sm text-muted-foreground">
            Loading your tickets...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-semibold text-purple-600">
            YOUR VISIT COMPANION
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Tickets
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your heritage journeys, all in one place. Keep your QR tickets ready for entry.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
        >
          <RefreshCw size={16} />
          Refresh Tickets
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle size={19} />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
            <Ticket size={21} />
          </div>
          <p className="text-sm text-muted-foreground">Total Tickets</p>
          <p className="mt-1 text-3xl font-bold">{tickets.length}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <ShieldCheck size={21} />
          </div>
          <p className="text-sm text-muted-foreground">Valid Tickets</p>
          <p className="mt-1 text-3xl font-bold">{validCount}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            <QrCode size={21} />
          </div>
          <p className="text-sm text-muted-foreground">Used Tickets</p>
          <p className="mt-1 text-3xl font-bold">{usedCount}</p>
        </div>
      </div>

      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by booking reference, site or category..."
          className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-950"
        />
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
            <Ticket size={30} />
          </div>
          <h2 className="text-xl font-bold">No tickets yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Your tickets will appear here once your booking is confirmed and payment is completed.
          </p>
          <a
            href="/visitor/explore"
            className="mt-6 inline-flex rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800"
          >
            Explore Heritage Sites
          </a>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Search className="mx-auto mb-3 text-muted-foreground" size={28} />
          <h2 className="font-semibold">No matching tickets</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another booking reference or heritage site name.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="flex flex-col gap-5 p-5 sm:flex-row">
                <div className="flex flex-1 flex-col">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[ticket.status]}`}
                    >
                      {ticket.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {ticket.booking.ticketCategory.name}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold">
                    {ticket.booking.site.name}
                  </h2>

                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin size={15} />
                    {ticket.booking.site.city}
                  </p>

                  <div className="mt-5 space-y-3 text-sm">
                    <p className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-purple-600" />
                      {formatDate(ticket.booking.timeSlot.date)}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock3 size={16} className="text-purple-600" />
                      {ticket.booking.timeSlot.startTime} – {ticket.booking.timeSlot.endTime}
                    </p>
                  </div>

                  <div className="mt-auto pt-5">
                    <p className="text-xs text-muted-foreground">
                      BOOKING REFERENCE
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold tracking-wide">
                      {ticket.booking.bookingCode}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Ticket ID: {ticket.id}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-3">
                  {qrImages[ticket.id] ? (
                    <Image
                      src={qrImages[ticket.id]}
                      alt={`QR code for ticket ${ticket.id}`}
                      width={180}
                      height={180}
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-[180px] w-[180px] items-center justify-center">
                      <RefreshCw className="animate-spin text-purple-600" />
                    </div>
                  )}
                  <p className="mt-2 text-xs font-semibold text-gray-800">
                    {ticket.status === "VALID"
                      ? "Show at entry gate"
                      : ticket.status === "USED"
                        ? "Already used"
                        : "Not valid for entry"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
                <span>
                  {ticket.holderName || "Ticket holder"}
                </span>
                <span>
                  {ticket.booking.payments.length > 0
                    ? "Payment completed"
                    : "Payment not recorded"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
