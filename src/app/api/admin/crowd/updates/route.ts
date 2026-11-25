
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const updates = await prisma.crowdUpdate.findMany({
      where: {
        status: CrowdUpdateStatus.PENDING,
      },
      include: {
        site: {
          select: {
            name: true,
            city: true,
            maxCapacity: true,
          },
        },
        submittedBy: {
          select: {
            name: true,
            loginId: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json({ updates });
  } catch (error) {
    console.error("Fetch pending crowd updates error:", error);

    return NextResponse.json(
      { error: "Failed to fetch pending crowd updates" },
      { status: 500 }
    );
  }
}
