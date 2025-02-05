import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import stripePackage from "stripe";
import { sendBookingConfirmation } from "../utils/email.js";
import { generateInvoice } from "../utils/pdf.js";

const stripe = new stripePackage(process.env.STRIPE_SECRET_KEY);

export const createBooking = async (req, res) => {
  try {
    const { eventId, tickets } = req.body;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    let totalAmount = 0;
    const validatedTickets = [];

    // Validate ticket availability
    for (const item of tickets) {
      const ticketType = event.ticketTypes.find(
        (t) => t.name === item.ticketType
      );

      if (!ticketType || ticketType.capacity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough ${item.ticketType} tickets available`,
        });
      }

      totalAmount += ticketType.price * item.quantity;
      validatedTickets.push({
        ticketType: item.ticketType,
        quantity: item.quantity,
        price: ticketType.price,
      });
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100,
      currency: "usd",
      metadata: { eventId, userId: req.user.userId },
      payment_method_types: ["card"], // Restrict to card-only
      automatic_payment_methods: {
        enabled: false, // Disable automatic payment methods
      },
    });

    // Create temporary booking
    const booking = new Booking({
      event: eventId,
      user: req.user.userId,
      tickets: validatedTickets,
      totalAmount,
      transactionId: paymentIntent.id,
      status: "pending",
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Payment required to complete booking",
      clientSecret: paymentIntent.client_secret,
      bookingId: booking._id,
      transactionId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error in createBooking:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

export const confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Find the booking
    const booking = await Booking.findById(bookingId).populate("event user");
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Check payment status directly with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      booking.transactionId
    );

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
        status: paymentIntent.status,
      });
    }

    // Prevent double processing
    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Booking already processed",
      });
    }

    // Update event capacity
    const event = await Event.findById(booking.event);
    booking.tickets.forEach((bookedTicket) => {
      const ticketType = event.ticketTypes.find(
        (t) => t.name === bookedTicket.ticketType
      );
      ticketType.capacity -= bookedTicket.quantity;
    });

    await event.save();

    // Update booking status
    booking.status = "completed";
    await booking.save();

    // Generate and send confirmation
    const invoiceUrl = await generateInvoice(booking, event);
    await sendBookingConfirmation(booking.user.email, invoiceUrl);

    res.status(200).json({
      success: true,
      message: "Booking confirmed successfully",
      booking: booking.toObject(),
    });
  } catch (error) {
    console.error("Error in confirmBooking:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "event user"
    );
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong" });
    console.log("Error in getBooking: ", error);
  }
};
