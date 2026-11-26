
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to view your tickets." },
        { status: 401 }
      );
    }

    if (session.user.role !== "VISITOR") {
      return NextResponse.json(
        { error: "Only visitors can access their tickets." },
        { status: 403 }
      );
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        booking: {
          userId: session.user.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        qrCode: true,
        holderName: true,
        status: true,
        usedAt: true,
        createdAt: true,
        booking: {
          select: {
            id: true,
            bookingCode: true,
            status: true,
            quantity: true,
            totalAmount: true,
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
            payments: {
              where: {
                status: "PAID",
              },
              select: {
                status: true,
                paidAt: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      tickets: tickets.map((ticket) => ({
        ...ticket,
        booking: {
          ...ticket.booking,
          totalAmount: Number(ticket.booking.totalAmount),
        },
      })),
    });
  } catch (error) {
    console.error("Visitor tickets API error:", error);

    return NextResponse.json(
      { error: "Unable to load your tickets." },
      { status: 500 }
    );
  }
}
