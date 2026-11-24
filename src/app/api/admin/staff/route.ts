
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

    const [staff, sites] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "STAFF",
        },
        select: {
          id: true,
          name: true,
          loginId: true,
          email: true,
          isActive: true,
          assignedSiteId: true,
        },
        orderBy: {
          name: "asc",
        },
      }),

      prisma.heritageSite.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          city: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    return NextResponse.json({ staff, sites });
  } catch (error) {
    console.error("Fetch staff management data error:", error);

    return NextResponse.json(
      { error: "Failed to fetch staff management data." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    const body = await request.json();
    const { staffId } = body;

    if (typeof staffId !== "string" || !staffId.trim()) {
      return NextResponse.json(
        { error: "Valid staff ID is required." },
        { status: 400 }
      );
    }

    const hasSiteUpdate = Object.prototype.hasOwnProperty.call(
      body,
      "assignedSiteId"
    );

    const hasStatusUpdate = Object.prototype.hasOwnProperty.call(
      body,
      "isActive"
    );

    if (!hasSiteUpdate && !hasStatusUpdate) {
      return NextResponse.json(
        { error: "No update information provided." },
        { status: 400 }
      );
    }

    if (
      hasSiteUpdate &&
      body.assignedSiteId !== null &&
      typeof body.assignedSiteId !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid heritage site ID." },
        { status: 400 }
      );
    }

    if (hasStatusUpdate && typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { error: "Invalid staff account status." },
        { status: 400 }
      );
    }

    const existingStaff = await prisma.user.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!existingStaff || existingStaff.role !== "STAFF") {
      return NextResponse.json(
        { error: "Staff member not found." },
        { status: 404 }
      );
    }

    if (hasSiteUpdate && body.assignedSiteId !== null) {
      const site = await prisma.heritageSite.findFirst({
        where: {
          id: body.assignedSiteId,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (!site) {
        return NextResponse.json(
          { error: "Active heritage site not found." },
          { status: 404 }
        );
      }
    }

    const updatedStaff = await prisma.user.update({
      where: {
        id: staffId,
      },
      data: {
        ...(hasSiteUpdate && {
          assignedSiteId: body.assignedSiteId,
        }),
        ...(hasStatusUpdate && {
          isActive: body.isActive,
        }),
      },
      select: {
        id: true,
        name: true,
        loginId: true,
        email: true,
        isActive: true,
        assignedSiteId: true,
      },
    });

    return NextResponse.json({
      message: "Staff member updated successfully.",
      staff: updatedStaff,
    });
  } catch (error) {
    console.error("Update staff management error:", error);

    return NextResponse.json(
      { error: "Failed to update staff member." },
      { status: 500 }
    );
  }
}
