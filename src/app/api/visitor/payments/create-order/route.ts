
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  try {
    // 1. Authenticate visitor
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to continue." },
        { status: 401 }
      );
    }

    if (session.user.role !== "VISITOR") {
      return NextResponse.json(
        { error: "Only visitors can make payments." },
        { status: 403 }
      );
    }

    // 2. Read booking ID
    const body = await request.json().catch(() => null);
    const bookingId = body?.bookingId;

    if (typeof bookingId !== "string" || !bookingId.trim()) {
      return NextResponse.json(
        { error: "A valid booking ID is required." },
        { status: 400 }
      );
    }

    // 3. Find booking belonging to this visitor
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: session.user.id,
      },
      include: {
        ticketCategory: true,
        payments: {
          where: {
            status: "PENDING",
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "This booking is not awaiting payment." },
        { status: 400 }
      );
    }

    // 4. Reuse an existing paid or pending payment safely
    const paidPayment = await prisma.payment.findFirst({
      where: {
        bookingId: booking.id,
        status: "PAID",
      },
    });

    if (paidPayment) {
      return NextResponse.json(
        { error: "This booking has already been paid." },
        { status: 409 }
      );
    }

    const existingPayment = booking.payments.find(
      (payment) => payment.razorpayOrderId
    );

    if (existingPayment?.razorpayOrderId) {
      return NextResponse.json({
        orderId: existingPayment.razorpayOrderId,
        amount: Math.round(Number(existingPayment.amount) * 100),
        currency: existingPayment.currency,
        keyId: env.RAZORPAY_KEY_ID,
        paymentId: existingPayment.id,
        bookingCode: booking.bookingCode,
      });
    }

    // 5. Calculate amount in paise
    const amount = Math.round(Number(booking.totalAmount) * 100);
    const currency = booking.ticketCategory.currency || "INR";

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid booking amount." },
        { status: 400 }
      );
    }

    if (currency !== "INR") {
      return NextResponse.json(
        { error: "Only INR payments are currently supported." },
        { status: 400 }
      );
    }

    // 6. Create Razorpay order on the server
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: booking.bookingCode,
      notes: {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
      },
    });

    // 7. Save payment and Razorpay order ID
    const payment = booking.payments[0]
      ? await prisma.payment.update({
          where: {
            id: booking.payments[0].id,
          },
          data: {
            amount: booking.totalAmount,
            currency,
            method: "RAZORPAY",
            razorpayOrderId: order.id,
          },
        })
      : await prisma.payment.create({
          data: {
            bookingId: booking.id,
            amount: booking.totalAmount,
            currency,
            status: "PENDING",
            method: "RAZORPAY",
            razorpayOrderId: order.id,
          },
        });

    // 8. Return checkout details
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
      paymentId: payment.id,
      bookingCode: booking.bookingCode,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);

    return NextResponse.json(
      { error: "Unable to create payment order. Please try again." },
      { status: 500 }
    );
  }
}
