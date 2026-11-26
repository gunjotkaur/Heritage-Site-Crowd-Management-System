import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to view your bookings." },
        { status: 401 }
      );
    }

    if (session.user.role !== "VISITOR") {
      return NextResponse.json(
        { error: "Only visitors can access their bookings." },
        { status: 403 }
      );
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        bookingCode: true,
        quantity: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        cancelledAt: true,

        site: {
          select: {
            name: true,
            slug: true,
            city: true,
            coverImage: true,
          },
        },

        timeSlot: {
          select: {
            date: true,
            startTime: true,
            endTime: true,
          },
        },

        ticketCategory: {
          select: {
            name: true,
            currency: true,
          },
        },

        tickets: {
          select: {
            id: true,
            status: true,
            usedAt: true,
          },
        },

        payments: {
          select: {
            amount: true,
            currency: true,
            status: true,
            method: true,
            paidAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json({
      bookings: bookings.map((booking) => ({
        ...booking,
        totalAmount: Number(booking.totalAmount),
        payments: booking.payments.map((payment) => ({
          ...payment,
          amount: Number(payment.amount),
        })),
      })),
    });
  } catch (error) {
    console.error("Visitor bookings API error:", error);

    return NextResponse.json(
      { error: "Failed to fetch your bookings." },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to book a visit." },
        { status: 401 }
      );
    }

    // Only visitors can create bookings
    if (session.user.role !== "VISITOR") {
      return NextResponse.json(
        { error: "Only visitors can create bookings." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const { siteId, timeSlotId, ticketCategoryId, quantity } = body;

    // Validate required fields
    if (
      typeof siteId !== "string" ||
      typeof timeSlotId !== "string" ||
      typeof ticketCategoryId !== "string" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10
    ) {
      return NextResponse.json(
        { error: "Invalid booking details." },
        { status: 400 }
      );
    }

    const booking = await prisma.$transaction(async (tx) => {
      // Verify the site
      const site = await tx.heritageSite.findFirst({
        where: {
          id: siteId,
          isActive: true,
        },
      });

      if (!site) {
        throw new Error("SITE_NOT_FOUND");
      }

      // Verify the ticket category belongs to this site
      const category = await tx.ticketCategory.findFirst({
        where: {
          id: ticketCategoryId,
          siteId,
          isActive: true,
        },
      });

      if (!category) {
        throw new Error("CATEGORY_NOT_FOUND");
      }

      // Verify the time slot belongs to this site
      const slot = await tx.timeSlot.findFirst({
        where: {
          id: timeSlotId,
          siteId,
          isActive: true,
        },
      });

      if (!slot) {
        throw new Error("SLOT_NOT_FOUND");
      }

      // Atomically reserve capacity to prevent overbooking
      const capacityUpdate = await tx.timeSlot.updateMany({
        where: {
          id: timeSlotId,
          siteId,
          isActive: true,
          bookedCount: {
            lte: slot.capacity - quantity,
          },
        },
        data: {
          bookedCount: {
            increment: quantity,
          },
        },
      });

      if (capacityUpdate.count !== 1) {
        throw new Error("SLOT_FULL");
      }

      // Calculate price using the database value
      const totalAmount = Number(category.price) * quantity;

      // Create pending booking
      return tx.booking.create({
        data: {
          bookingCode: `HF-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
          userId: session.user.id,
          siteId,
          timeSlotId,
          ticketCategoryId,
          quantity,
          totalAmount,
          status: "PENDING",
        },
        select: {
          id: true,
          bookingCode: true,
          quantity: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      });
    });

    return NextResponse.json(
      {
        message: "Booking created successfully.",
        booking: {
          ...booking,
          totalAmount: Number(booking.totalAmount),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      const errors = {
        SITE_NOT_FOUND: ["Heritage site not found.", 404],
        CATEGORY_NOT_FOUND: ["Invalid ticket category.", 400],
        SLOT_NOT_FOUND: ["Selected time slot is unavailable.", 404],
        SLOT_FULL: ["Sorry, this time slot no longer has enough capacity.", 409],
      };

      const knownError = errors[error.message];

      if (knownError) {
        return NextResponse.json(
          { error: knownError[0] },
          { status: knownError[1] }
        );
      }
    }

    console.error("Create booking API error:", error);

    return NextResponse.json(
      { error: "Failed to create booking. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to cancel your booking." },
        { status: 401 }
      );
    }

    if (session.user.role !== "VISITOR") {
      return NextResponse.json(
        { error: "Only visitors can cancel bookings." },
        { status: 403 }
      );
    }

    const { bookingId } = await request.json();

    if (typeof bookingId !== "string" || !bookingId.trim()) {
      return NextResponse.json(
        { error: "Invalid booking ID." },
        { status: 400 }
      );
    }

    const booking = await prisma.$transaction(async (tx) => {
      const existingBooking = await tx.booking.findFirst({
        where: {
          id: bookingId,
          userId: session.user.id,
        },
        select: {
          id: true,
          status: true,
          quantity: true,
          timeSlotId: true,
          payments: {
            where: {
              status: "PAID",
            },
            select: {
              id: true,
            },
            take: 1,
          },
        },
      });

      if (!existingBooking) {
        throw new Error("BOOKING_NOT_FOUND");
      }

      if (existingBooking.status !== "PENDING") {
        throw new Error("BOOKING_NOT_CANCELLABLE");
      }
      if (existingBooking.payments.length > 0) {
        throw new Error("BOOKING_ALREADY_PAID");
      }

      const updated = await tx.booking.updateMany({
        where: {
          id: bookingId,
          userId: session.user.id,
          status: "PENDING",
        },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      if (updated.count !== 1) {
        throw new Error("BOOKING_NOT_CANCELLABLE");
      }

      const capacityUpdate = await tx.timeSlot.updateMany({
        where: {
          id: existingBooking.timeSlotId,
          bookedCount: {
            gte: existingBooking.quantity,
          },
        },
        data: {
          bookedCount: {
            decrement: existingBooking.quantity,
          },
        },
      });

      if (capacityUpdate.count !== 1) {
        throw new Error("CAPACITY_RELEASE_FAILED");
      }

      return { id: bookingId, status: "CANCELLED" };
    });

    return NextResponse.json({
      message: "Booking cancelled successfully.",
      booking,
    });
  } catch (error) {
    const errors = {
      BOOKING_NOT_FOUND: ["Booking not found.", 404],
      BOOKING_NOT_CANCELLABLE: [
        "This booking cannot be cancelled.",
        409,
      ],
      CAPACITY_RELEASE_FAILED: [
        "Could not release booking capacity.",
        409,
      ],
      BOOKING_ALREADY_PAID: [
        "This booking has already been paid and cannot be cancelled here.",
        409,
      ],
    };

    const knownError = errors[error.message];

    if (knownError) {
      return NextResponse.json(
        { error: knownError[0] },
        { status: knownError[1] }
      );
    }

    console.error("Cancel booking API error:", error);

    return NextResponse.json(
      { error: "Failed to cancel booking." },
      { status: 500 }
    );
  }
}
