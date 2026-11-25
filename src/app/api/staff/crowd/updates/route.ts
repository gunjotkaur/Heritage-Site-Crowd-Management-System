
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CrowdUpdateStatus } from "@/generated/prisma/client";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "STAFF") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const staff = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isActive: true,
        role: true,
        assignedSiteId: true,
      },
    });

    if (!staff || !staff.isActive || staff.role !== "STAFF") {
      return NextResponse.json(
        { error: "Active staff account not found." },
        { status: 403 }
      );
    }

    if (!staff.assignedSiteId) {
      return NextResponse.json({ site: null });
    }

    const site = await prisma.heritageSite.findFirst({
      where: {
        id: staff.assignedSiteId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        city: true,
        maxCapacity: true,
      },
    });

    return NextResponse.json({ site });
  } catch (error) {
    console.error("Fetch staff assigned site error:", error);

    return NextResponse.json(
      { error: "Failed to fetch assigned site." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "STAFF") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const reportedOccupancy = body.reportedOccupancy;
    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";

    if (
      !Number.isInteger(reportedOccupancy) ||
      reportedOccupancy < 0
    ) {
      return NextResponse.json(
        { error: "Enter a valid non-negative whole-number occupancy." },
        { status: 400 }
      );
    }

    if (reason.length > 1000) {
      return NextResponse.json(
        { error: "Reason cannot exceed 1000 characters." },
        { status: 400 }
      );
    }

    const staff = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isActive: true,
        role: true,
        assignedSiteId: true,
      },
    });

    if (!staff || !staff.isActive || staff.role !== "STAFF") {
      return NextResponse.json(
        { error: "Active staff account not found." },
        { status: 403 }
      );
    }

    if (!staff.assignedSiteId) {
      return NextResponse.json(
        { error: "You are not assigned to a heritage site." },
        { status: 400 }
      );
    }

    const site = await prisma.heritageSite.findFirst({
      where: {
        id: staff.assignedSiteId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        maxCapacity: true,
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Your assigned heritage site is unavailable." },
        { status: 404 }
      );
    }

    if (reportedOccupancy > site.maxCapacity) {
      return NextResponse.json(
        {
          error: `Reported occupancy cannot exceed site capacity of ${site.maxCapacity}.`,
        },
        { status: 400 }
      );
    }

    const update = await prisma.crowdUpdate.create({
      data: {
        siteId: site.id,
        submittedById: session.user.id,
        reportedOccupancy,
        reason: reason || null,
        status: CrowdUpdateStatus.PENDING,
      },
      select: {
        id: true,
        reportedOccupancy: true,
        status: true,
        submittedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Crowd report submitted successfully for admin approval.",
        site: site.name,
        update,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Staff crowd submission error:", error);

    return NextResponse.json(
      { error: "Failed to submit crowd report." },
      { status: 500 }
    );
  }
}
