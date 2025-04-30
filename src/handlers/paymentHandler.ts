import { Request, Response } from "express";
import prisma from "../prismaClient";
import { stripe } from "../modules/stripe";
import { transporter } from "../modules/nodemailer";

export const createPayment = async (req: Request, res: Response) => {
  const { bookingId } = req.body;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      res.status(404).json({
        status: "fail",
        message: "Booking not found",
      });
      return
    }
    if (booking.status == "CANCELLED" ) {
        res.status(400).json({ message: "Cannot pay booking is expired" });
        return
      }
    
      if (booking.status == "CONFIRMED" ) {
        res.status(400).json({ message: "booking is aready processed " });
        return
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(booking.totalPrice * 100),
        currency: 'usd',
        metadata: { bookingId }
      });

      await prisma.payment.create({
        data: {
          amount: booking.totalPrice,
          method:"card",
          bookingId,
        }
      });

      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        paymentId: paymentIntent.id
      });

  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const event = sig? stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!):null
  
    if(!event){
        res.status(500).json({
            status:"fail",
            message:"Internal server error"
        })
        return
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Update payment status
      await prisma.payment.update({
        where: { stripeId: paymentIntent.id },
        data: { status: 'COMPLETED' }
      });
  
      // Update booking status
      await prisma.booking.update({
        where: { id: paymentIntent.metadata.bookingId },
        data: { status: 'CONFIRMED' }
      });
  
      // Send confirmation email
      const booking = await prisma.booking.findUnique({
        where: { id: paymentIntent.metadata.bookingId },
        include: { room: true, user: true }
      });
    
      if(!booking){
        res.status(404).json({
            status:"fail",
            message:"during webhook, booking was not found"
        })
        await prisma.payment.update({
            where: { stripeId: paymentIntent.id },
            data: { status: 'FAILED' }
          });
        return
      }
    
      await transporter.sendMail({
        to: booking?.user.email,
        subject: 'Booking Confirmation',
        html: `
          <h1>Booking Confirmed!</h1>
          <p>Room: ${booking.room.number}</p>
          <p>Check-in: ${booking.checkIn.toDateString()}</p>
          <p>Check-out: ${booking.checkOut.toDateString()}</p>
          <p>Total Paid: $${booking.totalPrice}</p>
        `
      });
      
    }else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        
        await prisma.payment.update({
          where: { stripeId: paymentIntent.id },
          data: { status: 'FAILED' }
        });
      
        await prisma.booking.update({
          where: { id: paymentIntent.metadata.bookingId },
          data: { status:"CANCELLED" }
        });
      }
  
    res.status(200).end();
  };