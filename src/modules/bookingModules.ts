// src/jobs/expiration.cron.ts
import { CronJob } from "cron";
import prisma from "../prismaClient";
import { filterGeneratorBookingFilterType } from "../types/bookingTypes";
import { booking, Prisma } from "@prisma/client";
import { transporter } from "./nodemailer";

//check booking function
const checkExpiredBookings = async () => {
  try {
    const now = new Date();

    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lte: now },
        Payment: { is: null },
      },
    });



    await prisma.$transaction([
      prisma.booking.updateMany({
        where: {
          id: { in: expiredBookings.map((b) => b.id) },
        },
        data: { status: "CANCELLED" },
      }),
    ]);

    expiredBookings.forEach(async (item:booking)=>{

      const user = await prisma.user.findUnique({
        where:{
          id:item.userId
        }
      })

      await transporter.sendMail({
        to: user?.email,
        subject: "HOTELER booking",
        text: `Your booking ${item.id} has expired and is now cancelled.`,
      })
    })

    console.log(
      `Cancelled ${
        expiredBookings.length
      } expired bookings at ${now.toISOString()}`
    );
  } catch (error) {
    console.error("Error processing expired bookings:", error);
  }
};

//check bookings expire time every 5m
export const expirationJob = new CronJob(
  "*/5 * * * *",
  checkExpiredBookings,
  null,
  true,
  "UTC+04:00"
);



//Build filter
export const filterGenerator = (filters:filterGeneratorBookingFilterType) => {
    const where:any = {}
  if (filters.status) where.status = filters.status;
  if (filters.userId) where.userId = filters.userId;
  if (filters.roomId) where.roomId = filters.roomId;
  if (filters.minPrice || filters.maxPrice) {
    where.totalPrice = {};
    if (filters.minPrice) where.totalPrice.gte = Number(filters.minPrice);
    if (filters.maxPrice) where.totalPrice.lte = Number(filters.maxPrice);
  }
  if (filters.checkInAfter || filters.checkInBefore) {
    where.checkIn = {};
    if (filters.checkInAfter) where.checkIn.gte = new Date(filters.checkInAfter as string);
    if (filters.checkInBefore) where.checkIn.lte = new Date(filters.checkInBefore as string);
  }
  if (filters.search) {
    where.OR = [
      { user: { email: { contains: filters.search, mode: "insensitive" } } },
      { room: { number: { contains: filters.search, mode: "insensitive" } } },
      { room: { type: { contains: filters.search, mode: "insensitive" } } },
    ];
  }
  return where;
};
