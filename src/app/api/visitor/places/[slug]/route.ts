
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CROWD_THRESHOLDS } from "@/config/constants";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { slug } = await params;

    const site = await prisma.heritageSite.findFirst({
      where: {
        slug,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        history: true,
        address: true,
        city: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
        coverImage: true,
        images: true,
        openingTime: true,
        closingTime: true,
        closedDays: true,
        maxCapacity: true,

        crowdState: {
          select: {
            currentOccupancy: true,
            lastUpdatedAt: true,
            source: true,
          },
        },

        crowdSnapshots: {
          orderBy: { recordedAt: "desc" },
          take: 10,
          select: {
            occupancy: true,
            occupancyPercent: true,
            level: true,
            recordedAt: true,
          },
        },

        crowdPredictions: {
          where: {
            predictedFor: {
              gte: new Date(),
            },
          },
          orderBy: { predictedFor: "asc" },
          take: 10,
          select: {
            predictedFor: true,
            predictedOccupancy: true,
            predictedLevel: true,
            confidence: true,
          },
        },
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Heritage site not found" },
        { status: 404 }
      );
    }

    const currentOccupancy =
      site.crowdState?.currentOccupancy ?? null;

    const occupancyPercent =
      currentOccupancy !== null && site.maxCapacity > 0
        ? Number(
            (
              (currentOccupancy / site.maxCapacity) *
              100
            ).toFixed(1)
          )
        : null;

    let crowdLevel: string | null = null;

    if (occupancyPercent !== null) {
      if (occupancyPercent >= CROWD_THRESHOLDS.CRITICAL) {
        crowdLevel = "CRITICAL";
      } else if (occupancyPercent >= CROWD_THRESHOLDS.HIGH) {
        crowdLevel = "HIGH";
      } else if (occupancyPercent >= CROWD_THRESHOLDS.MEDIUM) {
        crowdLevel = "MEDIUM";
      } else {
        crowdLevel = "LOW";
      }
    }

    return NextResponse.json({
      site: {
        id: site.id,
        name: site.name,
        slug: site.slug,
        category: site.category,
        description: site.description,
        history: site.history,
        address: site.address,
        city: site.city,
        state: site.state,
        country: site.country,
        latitude: site.latitude,
        longitude: site.longitude,
        coverImage: site.coverImage,
        images: site.images,
        openingTime: site.openingTime,
        closingTime: site.closingTime,
        closedDays: site.closedDays,
        maxCapacity: site.maxCapacity,
      },

      crowd: {
        currentOccupancy,
        capacity: site.maxCapacity,
        occupancyPercent,
        level: crowdLevel,
        lastUpdatedAt:
          site.crowdState?.lastUpdatedAt ?? null,
        source: site.crowdState?.source ?? null,
      },

      history: site.crowdSnapshots,

      predictions: site.crowdPredictions,
    });
  } catch (error) {
    console.error("Visitor heritage site API error:", error);

    return NextResponse.json(
      { error: "Failed to fetch heritage site information" },
      { status: 500 }
    );
  }
}
