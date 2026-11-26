
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to view your saved places." },
        { status: 401 }
      );
    }

    if (session.user.role !== "VISITOR") {
      return NextResponse.json(
        { error: "Only visitors can access saved places." },
        { status: 403 }
      );
    }

    const savedPlaces = await prisma.savedPlace.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            description: true,
            city: true,
            state: true,
            coverImage: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json({
      savedPlaces: savedPlaces
        .filter((saved) => saved.site.isActive)
        .map((saved) => ({
          id: saved.id,
          createdAt: saved.createdAt,
          site: saved.site,
        })),
    });
  } catch (error) {
    console.error("Visitor saved places GET error:", error);

    return NextResponse.json(
      { error: "Unable to load saved places." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to save places." },
        { status: 401 }
      );
    }

    if (session.user.role !== "VISITOR") {
      return NextResponse.json(
        { error: "Only visitors can save places." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const siteId = body?.siteId;

    if (typeof siteId !== "string" || !siteId.trim()) {
      return NextResponse.json(
        { error: "A valid heritage site ID is required." },
        { status: 400 }
      );
    }

    const site = await prisma.heritageSite.findFirst({
      where: {
        id: siteId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Heritage site not found." },
        { status: 404 }
      );
    }

    const savedPlace = await prisma.savedPlace.upsert({
      where: {
        userId_siteId: {
          userId: session.user.id,
          siteId,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        siteId,
      },
    });

    return NextResponse.json(
      { message: "Place saved successfully.", savedPlace },
      { status: 201 }
    );
  } catch (error) {
    console.error("Visitor saved places POST error:", error);

    return NextResponse.json(
      { error: "Unable to save this place." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to remove saved places." },
        { status: 401 }
      );
    }

    if (session.user.role !== "VISITOR") {
      return NextResponse.json(
        { error: "Only visitors can remove saved places." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const siteId = body?.siteId;

    if (typeof siteId !== "string" || !siteId.trim()) {
      return NextResponse.json(
        { error: "A valid heritage site ID is required." },
        { status: 400 }
      );
    }

    await prisma.savedPlace.deleteMany({
      where: {
        userId: session.user.id,
        siteId,
      },
    });

    return NextResponse.json({
      message: "Place removed from saved places.",
    });
  } catch (error) {
    console.error("Visitor saved places DELETE error:", error);

    return NextResponse.json(
      { error: "Unable to remove this place." },
      { status: 500 }
    );
  }
}
