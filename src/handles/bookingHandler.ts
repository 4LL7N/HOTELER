import { Request, Response } from "express";
import prisma from "../prismaClient";
import { filterGenerator, orderBy, select } from "../modules/bookingModules";

export const getBookings = async (req: Request, res: Response) => {
  // if(req.user?.role != "ADMIN"){
  //     res.status(400).json({
  //         status:"fail",
  //         message:"forbidden"
  //     })
  //     return
  // }

  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    fields,
    status,
    userId,
    roomId,
    minPrice,
    maxPrice,
    checkInAfter,
    checkInBefore,
    search,
  } = req.query;

  // Convert status to the expected Prisma enum if present
  const parsedStatus = typeof status === "string" ? status.toUpperCase() : undefined;

  const where = filterGenerator({
    status: parsedStatus,
    userId,
    roomId,
    minPrice,
    maxPrice,
    checkInAfter,
    checkInBefore,
    search,
  });

  const sortBy = orderBy(sort)

  const limitFields = select(fields)

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;


  const [total, bookings] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      orderBy: sortBy,
      select: limitFields,
      skip,
      take: limitNumber,
    })
  ]);

  res.status(200).json({
    status: "success",
    lenght: bookings.length,
    bookings: bookings,
  });
};

export const postBookings = async (req: Request, res: Response) => {
  const { checkIn, checkOut, totalPrice, roomId } = req.body;
  const userId = req.user?.id;

  try {
    if (!checkIn || !checkOut || !totalPrice || !roomId) {
      res.status(400).json({
        status: "fail",
        message: "Missing required fields",
      });
      return;
    }
    const newCheckIn = new Date(checkIn);
    const newCheckOut = new Date(checkOut);
    const today = new Date();

    if (newCheckIn < today) {
      res.status(400).json({
        status: "fail",
        message: "Check-in date cannot be in the past",
      });
      return;
    }

    if (newCheckIn >= newCheckOut) {
      res.status(400).json({
        status: "fail",
        message: "Check-in must be before check-out",
      });
      return;
    }

    const conflictingBookings = await prisma.booking.findMany({
      where: {
        roomId: roomId,
        AND: [
          { checkIn: { lt: newCheckOut } },
          { checkOut: { gt: newCheckIn } },
        ],
      },
    });

    if (conflictingBookings.length > 0) {
      res.status(409).json({
        status: "fail",
        message: "Room is already booked for the selected dates",
      });
      return;
    }

    const newBooking = await prisma.booking.create({
      data: {
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        totalPrice,
        roomId,
        userId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    res.status(201).json({
      status: "success",
      newBooking,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};
