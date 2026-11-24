
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  BookingStatus,
  CrowdLevel,
  CrowdSource,
  EntryType,
  PaymentStatus,
  TicketStatus,
} from "@/generated/prisma/client";
import { CROWD_THRESHOLDS } from "@/config/constants";

function getCrowdLevel(percentage: number): CrowdLevel {
  if (percentage >= CROWD_THRESHOLDS.CRITICAL) {
    return CrowdLevel.CRITICAL;
  }

  if (percentage >= CROWD_THRESHOLDS.HIGH) {
    return CrowdLevel.HIGH;
  }

  if (percentage >= CROWD_THRESHOLDS.MEDIUM) {
    return CrowdLevel.MEDIUM;
  }

  return CrowdLevel.LOW;
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

    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body.qrCode !== "string" ||
      !body.qrCode.trim() ||
      !["ENTRY", "EXIT"].includes(body.type)
    ) {
      return NextResponse.json(
        { error: "A valid QR code and scan type (ENTRY or EXIT) are required." },
        { status: 400 }
      );
    }

    const qrCode = body.qrCode.trim();
    const scanType =
      body.type === "ENTRY" ? EntryType.ENTRY : EntryType.EXIT;

    const result = await prisma.$transaction(
      async (tx) => {
        const staff = await tx.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            role: true,
            isActive: true,
            assignedSiteId: true,
          },
        });

        if (
          !staff ||
          staff.role !== "STAFF" ||
          !staff.isActive
        ) {
          throw new Error("STAFF_NOT_ACTIVE");
        }

        if (!staff.assignedSiteId) {
          throw new Error("STAFF_NOT_ASSIGNED");
        }

        const site = await tx.heritageSite.findFirst({
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
          throw new Error("SITE_UNAVAILABLE");
        }

        const ticket = await tx.ticket.findUnique({
          where: { qrCode },
          include: {
            booking: {
              include: {
                site: {
                  select: {
                    id: true,
                    name: true,
                    isActive: true,
                    maxCapacity: true,
                  },
                },
                payments: {
                  where: {
                    status: PaymentStatus.PAID,
                  },
                  select: { id: true },
                },
              },
            },
            entryLogs: {
              orderBy: [
                { scannedAt: "desc" },
                { id: "desc" },
              ],
              take: 1,
            },
          },
        });

        if (!ticket) {
          throw new Error("INVALID_TICKET");
        }

        if (ticket.booking.siteId !== site.id) {
          throw new Error("WRONG_SITE");
        }

        if (!ticket.booking.site.isActive) {
          throw new Error("SITE_UNAVAILABLE");
        }

        if (ticket.booking.status !== BookingStatus.CONFIRMED) {
          throw new Error("BOOKING_NOT_CONFIRMED");
        }

        if (ticket.booking.payments.length === 0) {
          throw new Error("PAYMENT_NOT_COMPLETED");
        }

        if (ticket.status !== TicketStatus.VALID) {
          throw new Error("TICKET_NOT_VALID");
        }

        const lastLog = ticket.entryLogs[0];

        if (scanType === EntryType.ENTRY) {
          if (lastLog?.type === EntryType.ENTRY) {
            throw new Error("ALREADY_ENTERED");
          }

          if (lastLog?.type === EntryType.EXIT) {
            throw new Error("REENTRY_NOT_ALLOWED");
          }
        } else {
          if (!lastLog || lastLog.type !== EntryType.ENTRY) {
            throw new Error("NOT_INSIDE");
          }
        }

        const crowdState = await tx.siteCrowdState.findUnique({
          where: { siteId: site.id },
        });

        if (
          !crowdState ||
          crowdState.currentOccupancy === null
        ) {
          throw new Error("OCCUPANCY_NOT_INITIALIZED");
        }

        const currentOccupancy = crowdState.currentOccupancy;

        if (
          currentOccupancy < 0 ||
          currentOccupancy > site.maxCapacity
        ) {
          throw new Error("INVALID_OCCUPANCY_STATE");
        }

        if (
          scanType === EntryType.ENTRY &&
          currentOccupancy >= site.maxCapacity
        ) {
          throw new Error("SITE_CAPACITY_REACHED");
        }

        if (
          scanType === EntryType.EXIT &&
          currentOccupancy <= 0
        ) {
          throw new Error("OCCUPANCY_ZERO");
        }

        const newOccupancy =
          scanType === EntryType.ENTRY
            ? currentOccupancy + 1
            : currentOccupancy - 1;

        const now = new Date();

        // Lock the ticket through a conditional update.
        const ticketUpdate = await tx.ticket.updateMany({
          where: {
            id: ticket.id,
            status: TicketStatus.VALID,
            updatedAt: ticket.updatedAt,
          },
          data:
            scanType === EntryType.EXIT
              ? {
                  status: TicketStatus.USED,
                  usedAt: now,
                  updatedAt: now,
                }
              : {
                  updatedAt: now,
                },
        });

        if (ticketUpdate.count !== 1) {
          throw new Error("SCAN_CONFLICT");
        }

        // Compare-and-update prevents lost occupancy updates.
        const stateUpdate = await tx.siteCrowdState.updateMany({
          where: {
            siteId: site.id,
            currentOccupancy,
          },
          data: {
            currentOccupancy: newOccupancy,
            lastUpdatedAt: now,
            source: CrowdSource.QR_SCAN,
            updatedById: staff.id,
          },
        });

        if (stateUpdate.count !== 1) {
          throw new Error("OCCUPANCY_CONFLICT");
        }

        const occupancyPercent =
          (newOccupancy / site.maxCapacity) * 100;

        const level = getCrowdLevel(occupancyPercent);

        await tx.entryLog.create({
          data: {
            ticketId: ticket.id,
            siteId: site.id,
            staffId: staff.id,
            type: scanType,
            scannedAt: now,
          },
        });

        await tx.crowdSnapshot.create({
          data: {
            siteId: site.id,
            occupancy: newOccupancy,
            capacity: site.maxCapacity,
            occupancyPercent,
            level,
            recordedAt: now,
          },
        });

        return {
          success: true,
          message:
            scanType === EntryType.ENTRY
              ? "Visitor entry recorded successfully."
              : "Visitor exit recorded successfully.",
          type: scanType,
          visitor: ticket.holderName || "Visitor",
          site: site.name,
          occupancy: newOccupancy,
          capacity: site.maxCapacity,
          occupancyPercent: Number(occupancyPercent.toFixed(2)),
          crowdLevel: level,
          scannedAt: now,
        };
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    const errorCode =
      error instanceof Error ? error.message : "";

    const errors: Record<
      string,
      { message: string; status: number }
    > = {
      STAFF_NOT_ACTIVE: {
        message: "Your staff account is inactive or unavailable.",
        status: 403,
      },
      STAFF_NOT_ASSIGNED: {
        message: "You are not assigned to a heritage site.",
        status: 400,
      },
      SITE_UNAVAILABLE: {
        message: "Your assigned heritage site is unavailable.",
        status: 404,
      },
      INVALID_TICKET: {
        message: "Invalid QR code. Ticket not found.",
        status: 404,
      },
      WRONG_SITE: {
        message: "This ticket belongs to another heritage site.",
        status: 403,
      },
      BOOKING_NOT_CONFIRMED: {
        message: "This booking is not confirmed.",
        status: 400,
      },
      PAYMENT_NOT_COMPLETED: {
        message: "Payment for this booking is not completed.",
        status: 400,
      },
      TICKET_NOT_VALID: {
        message: "This ticket is no longer valid or has already been used.",
        status: 409,
      },
      ALREADY_ENTERED: {
        message: "This visitor has already entered.",
        status: 409,
      },
      REENTRY_NOT_ALLOWED: {
        message: "This ticket has already been used. Re-entry is not allowed.",
        status: 409,
      },
      NOT_INSIDE: {
        message: "No active entry found for this ticket.",
        status: 409,
      },
      OCCUPANCY_NOT_INITIALIZED: {
        message: "Crowd occupancy must be initialized by an Admin before scanning.",
        status: 409,
      },
      INVALID_OCCUPANCY_STATE: {
        message: "The site's current occupancy is invalid. Contact an Admin.",
        status: 409,
      },
      SITE_CAPACITY_REACHED: {
        message: "The heritage site has reached its maximum capacity.",
        status: 409,
      },
      OCCUPANCY_ZERO: {
        message: "Cannot record an exit when occupancy is zero.",
        status: 409,
      },
      SCAN_CONFLICT: {
        message: "This ticket was scanned simultaneously. Please try again.",
        status: 409,
      },
      OCCUPANCY_CONFLICT: {
        message: "Occupancy changed during scanning. Please scan again.",
        status: 409,
      },
    };

    if (errors[errorCode]) {
      return NextResponse.json(
        { error: errors[errorCode].message },
        { status: errors[errorCode].status }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "A concurrent scan occurred. Please try again." },
        { status: 409 }
      );
    }

    console.error("QR scan error:", error);

    return NextResponse.json(
      { error: "Failed to process QR scan." },
      { status: 500 }
    );
  }
}

