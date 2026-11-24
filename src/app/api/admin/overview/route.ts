
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const [
      heritageSites,
      visitors,
      bookings,
      activeStaff,
    ] = await Promise.all([
      prisma.heritageSite.count(),
      prisma.user.count({
        where: { role: "VISITOR" },
      }),
      prisma.booking.count(),
      prisma.user.count({
        where: {
          role: "STAFF",
          isActive: true,
        },
      }),
    ]);

    return NextResponse.json({
      heritageSites,
      visitors,
      bookings,
      activeStaff,
      currentCrowd: null,
      revenue: null,
    });
  } catch (error) {
    console.error("Admin overview error:", error);

    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
