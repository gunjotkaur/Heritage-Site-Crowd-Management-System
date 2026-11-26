
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const siteSlug = searchParams.get("site");
    const dateParam = searchParams.get("date");

    if (!siteSlug) {
      return NextResponse.json(
        { error: "Heritage site is required." },
        { status: 400 }
      );
    }

    const site = await prisma.heritageSite.findFirst({
      where: {
        slug: siteSlug,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        city: true,
        state: true,
        coverImage: true,
        openingTime: true,
        closingTime: true,
        closedDays: true,
        maxCapacity: true,
        ticketCategories: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            currency: true,
          },
          orderBy: { price: "asc" },
        },
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Heritage site not found." },
        { status: 404 }
      );
    }

    let selectedDate: Date | null = null;

    if (dateParam) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return NextResponse.json(
          { error: "Invalid date format. Use YYYY-MM-DD." },
          { status: 400 }
        );
      }

      const [year, month, day] = dateParam.split("-").map(Number);

      selectedDate = new Date(year, month - 1, day);
      selectedDate.setHours(0, 0, 0, 0);

      if (
        selectedDate.getFullYear() !== year ||
        selectedDate.getMonth() !== month - 1 ||
        selectedDate.getDate() !== day
      ) {
        return NextResponse.json(
          { error: "Invalid calendar date." },
          { status: 400 }
        );
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return NextResponse.json(
          { error: "Please select today or a future date." },
          { status: 400 }
        );
      }
      const maxBookingDate = new Date(today);
      maxBookingDate.setDate(maxBookingDate.getDate() + 29);

      if (selectedDate > maxBookingDate) {
        return NextResponse.json(
          { error: "Bookings are available only within the next 30 days." },
          { status: 400 }
        );
      }

      if (site.closedDays.includes(selectedDate.getDay())) {
        return NextResponse.json({
          site: {
            ...site,
            ticketCategories: site.ticketCategories.map((category) => ({
              ...category,
              price: Number(category.price),
            })),
          },
          slots: [],
          message: "This heritage site is closed on the selected day.",
        });
      }
    }

    const slots = selectedDate
      ? await prisma.timeSlot.findMany({
          where: {
            siteId: site.id,
            date: selectedDate,
            isActive: true,
          },
          orderBy: { startTime: "asc" },
        })
      : [];

    const now = new Date();

    const availableSlots = slots
      .filter((slot) => {
        const remainingCapacity = slot.capacity - slot.bookedCount;

        if (remainingCapacity <= 0) return false;

        const [hour, minute] = slot.startTime.split(":").map(Number);
        const slotDateTime = new Date(selectedDate!);
        slotDateTime.setHours(hour, minute, 0, 0);

        return slotDateTime > now;
      })
      .map((slot) => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        bookedCount: slot.bookedCount,
        remainingCapacity: slot.capacity - slot.bookedCount,
      }));

    return NextResponse.json({
      site: {
        ...site,
        ticketCategories: site.ticketCategories.map((category) => ({
          ...category,
          price: Number(category.price),
        })),
      },
      slots: availableSlots,
    });
  } catch (error) {
    console.error("BOOKING OPTIONS API ERROR:", error);

    return NextResponse.json(
      { error: "Unable to load booking options." },
      { status: 500 }
    );
  }
}
