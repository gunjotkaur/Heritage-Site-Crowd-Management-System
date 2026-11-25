
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CROWD_THRESHOLDS } from "@/config/constants";

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

    const [sites, pendingUpdates] = await Promise.all([
      prisma.heritageSite.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          city: true,
          maxCapacity: true,
          crowdState: {
            select: {
              currentOccupancy: true,
              lastUpdatedAt: true,
              source: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),

      prisma.crowdUpdate.count({
        where: { status: "PENDING" },
      }),
    ]);

    const crowdData = sites.map((site) => {
      const occupancy = site.crowdState?.currentOccupancy ?? null;

      const occupancyPercent =
        occupancy !== null && site.maxCapacity > 0
          ? Number(((occupancy / site.maxCapacity) * 100).toFixed(1))
          : null;

      let level: string | null = null;

      if (occupancyPercent !== null) {
        if (occupancyPercent >= CROWD_THRESHOLDS.CRITICAL) {
          level = "CRITICAL";
        } else if (occupancyPercent >= CROWD_THRESHOLDS.HIGH) {
          level = "HIGH";
        } else if (occupancyPercent >= CROWD_THRESHOLDS.MEDIUM) {
          level = "MEDIUM";
        } else {
          level = "LOW";
        }
      }

      return {
        id: site.id,
        name: site.name,
        city: site.city,
        capacity: site.maxCapacity,
        currentOccupancy: occupancy,
        occupancyPercent,
        level,
        lastUpdatedAt: site.crowdState?.lastUpdatedAt ?? null,
        source: site.crowdState?.source ?? null,
      };
    });

    return NextResponse.json({
      sites: crowdData,
      pendingUpdates,
    });
  } catch (error) {
    console.error("Admin crowd monitoring error:", error);

    return NextResponse.json(
      { error: "Failed to fetch crowd information" },
      { status: 500 }
    );
  }
}
