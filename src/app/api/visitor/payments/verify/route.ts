
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to verify payment." },
        { status: 401 }
      );
    }

    if (session.user.role !== "VISITOR") {
      return NextResponse.json(
        { error: "Only visitors can verify payments." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = body ?? {};

    if (
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid payment verification details." },
        { status: 400 }
      );
    }

    // 1. Verify Razorpay's payment signature
    const expectedSignature = createHmac(
      "sha256",
      env.RAZORPAY_KEY_SECRET
    )
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(signature, "hex");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return NextResponse.json(
        { error: "Payment signature verification failed." },
        { status: 400 }
      );
    }

    // 2. Find the payment and verify booking ownership
    const paymentRecord = await prisma.payment.findFirst({
      where: {
        razorpayOrderId: orderId,
        method: "RAZORPAY",
        booking: {
          userId: session.user.id,
        },
      },
      include: {
        booking: true,
      },
    });

    if (!paymentRecord) {
      return NextResponse.json(
        { error: "Payment order not found." },
        { status: 404 }
      );
    }

    // 3. Verify payment directly with Razorpay
    const razorpayPayment = await razorpay.payments.fetch(paymentId);

    if (
      razorpayPayment.order_id !== orderId ||
      razorpayPayment.status !== "captured" ||
      razorpayPayment.amount !==
        Math.round(Number(paymentRecord.amount) * 100) ||
      razorpayPayment.currency !== paymentRecord.currency
    ) {
      return NextResponse.json(
        { error: "Payment has not been successfully captured." },
        { status: 400 }
      );
    }

    // 4. Confirm booking and create tickets atomically
    const result = await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.payment.findUnique({
        where: { id: paymentRecord.id },
        include: {
          booking: true,
        },
      });

      if (!currentPayment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      // Handle repeated verification requests safely
      if (currentPayment.status === "PAID") {
        const ticketCount = await tx.ticket.count({
          where: { bookingId: currentPayment.bookingId },
        });

        if (
          currentPayment.booking.status === "CONFIRMED" &&
          ticketCount === currentPayment.booking.quantity
        ) {
          return {
            bookingCode: currentPayment.booking.bookingCode,
            ticketCount,
            alreadyProcessed: true,
          };
        }

        throw new Error("PAYMENT_ALREADY_PROCESSED");
      }

      if (currentPayment.status !== "PENDING") {
        throw new Error("PAYMENT_NOT_PENDING");
      }

      if (currentPayment.booking.status !== "PENDING") {
        throw new Error("BOOKING_NOT_PENDING");
      }

      // Conditional update prevents duplicate processing
      const paymentUpdate = await tx.payment.updateMany({
        where: {
          id: currentPayment.id,
          status: "PENDING",
          transactionId: null,
        },
        data: {
          status: "PAID",
          transactionId: paymentId,
          paidAt: new Date(),
        },
      });

      if (paymentUpdate.count !== 1) {
        throw new Error("PAYMENT_ALREADY_PROCESSED");
      }

      const bookingUpdate = await tx.booking.updateMany({
        where: {
          id: currentPayment.bookingId,
          status: "PENDING",
        },
        data: {
          status: "CONFIRMED",
        },
      });

      if (bookingUpdate.count !== 1) {
        throw new Error("BOOKING_NOT_PENDING");
      }

      const existingTickets = await tx.ticket.count({
        where: {
          bookingId: currentPayment.bookingId,
        },
      });

      if (existingTickets !== 0) {
        throw new Error("TICKETS_ALREADY_EXIST");
      }

      // Generate one unique QR token per visitor
      await tx.ticket.createMany({
        data: Array.from(
          { length: currentPayment.booking.quantity },
          () => ({
            bookingId: currentPayment.bookingId,
            qrCode: `HF-${randomUUID()}`,
            status: "VALID" as const,
          })
        ),
      });

      return {
        bookingCode: currentPayment.booking.bookingCode,
        ticketCount: currentPayment.booking.quantity,
        alreadyProcessed: false,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and booking confirmed.",
      ...result,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return NextResponse.json(
      { error: "Unable to verify payment. Please contact support if money was deducted." },
      { status: 500 }
    );
  }
}
