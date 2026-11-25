
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CrowdLevel,
  CrowdSource,
  CrowdUpdateStatus,
} from "@/generated/prisma/client";
import { CROWD_THRESHOLDS } from "@/config/constants";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    if (!["APPROVED", "REJECTED"].includes(body.action)) {
      return NextResponse.json(
        { error: "Invalid review action" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const update = await tx.crowdUpdate.findUnique({
        where: { id },
        include: { site: true },
      });

      if (!update) {
        throw new Error("UPDATE_NOT_FOUND");
      }

      if (update.status !== CrowdUpdateStatus.PENDING) {
        throw new Error("ALREADY_REVIEWED");
      }

      if (body.action === "APPROVED") {
        if (
          update.reportedOccupancy < 0 ||
          update.reportedOccupancy > update.site.maxCapacity
        ) {
          throw new Error("INVALID_OCCUPANCY");
        }

        const occupancyPercent =
          (update.reportedOccupancy / update.site.maxCapacity) * 100;

        let level: CrowdLevel;

        if (occupancyPercent >= CROWD_THRESHOLDS.CRITICAL) {
          level = CrowdLevel.CRITICAL;
        } else if (occupancyPercent >= CROWD_THRESHOLDS.HIGH) {
          level = CrowdLevel.HIGH;
        } else if (occupancyPercent >= CROWD_THRESHOLDS.MEDIUM) {
          level = CrowdLevel.MEDIUM;
        } else {
          level = CrowdLevel.LOW;
        }

        const review = await tx.crowdUpdate.updateMany({
          where: {
            id,
            status: CrowdUpdateStatus.PENDING,
          },
          data: {
            status: CrowdUpdateStatus.APPROVED,
            reviewedById: session.user.id,
            reviewedAt: new Date(),
          },
        });

        if (review.count !== 1) {
          throw new Error("ALREADY_REVIEWED");
        }

        await tx.siteCrowdState.upsert({
          where: { siteId: update.siteId },
          update: {
            currentOccupancy: update.reportedOccupancy,
            lastUpdatedAt: new Date(),
            source: CrowdSource.STAFF_MANUAL,
            updatedById: session.user.id,
          },
          create: {
            siteId: update.siteId,
            currentOccupancy: update.reportedOccupancy,
            lastUpdatedAt: new Date(),
            source: CrowdSource.STAFF_MANUAL,
            updatedById: session.user.id,
          },
        });

        await tx.crowdSnapshot.create({
          data: {
            siteId: update.siteId,
            occupancy: update.reportedOccupancy,
            capacity: update.site.maxCapacity,
            occupancyPercent,
            level,
          },
        });
      } else {
        const review = await tx.crowdUpdate.updateMany({
          where: {
            id,
            status: CrowdUpdateStatus.PENDING,
          },
          data: {
            status: CrowdUpdateStatus.REJECTED,
            reviewedById: session.user.id,
            reviewedAt: new Date(),
          },
        });

        if (review.count !== 1) {
          throw new Error("ALREADY_REVIEWED");
        }
      }

      return { success: true, status: body.action };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UPDATE_NOT_FOUND") {
        return NextResponse.json(
          { error: "Crowd update not found" },
          { status: 404 }
        );
      }

      if (error.message === "ALREADY_REVIEWED") {
        return NextResponse.json(
          { error: "This crowd update has already been reviewed" },
          { status: 409 }
        );
      }

      if (error.message === "INVALID_OCCUPANCY") {
        return NextResponse.json(
          { error: "Reported occupancy exceeds the site's capacity" },
          { status: 400 }
        );
      }
    }

    console.error("Crowd update review error:", error);

    return NextResponse.json(
      { error: "Failed to review crowd update" },
      { status: 500 }
    );
  }
}
