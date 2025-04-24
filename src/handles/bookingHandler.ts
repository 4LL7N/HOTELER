import { Request, Response } from "express";
import prisma from "../prismaClient";
import {
  buildPageUrl,
  filterGenerator,
  orderBy,
  select,
} from "../modules/bookingModules";
import { Prisma } from "@prisma/client";

//      path = /
export const getBookings = async (req: Request, res: Response) => {
  const userId = req.user?.role !== "ADMIN"
  ? req.user?.id  // Regular users can only see their own bookings
  : req.query.userId as string | undefined;

  if (req.user?.role != "ADMIN") {
    res.status(401).json({
      status: "fail",
      message: "fobiden to get all booking",
    });
  }

  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    fields,
    status,
    roomId,
    minPrice,
    maxPrice,
    checkInAfter,
    checkInBefore,
    search,
  } = req.query;

  const parsedStatus =
    typeof status === "string" ? status.toUpperCase() : undefined;

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

  const sortBy = orderBy(sort);

  const limitFields = select(fields);

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
    }),
  ]);

  const totalPages = Math.ceil(total / limitNumber);

  const meta = {
    total,
    totalPages,
    currentPage: pageNumber,
    itemsPerPage: limitNumber,
    nextPage: buildPageUrl(
      pageNumber < totalPages ? pageNumber + 1 : null,
      req
    ),
    prevPage: buildPageUrl(pageNumber > 1 ? pageNumber - 1 : null, req),
  };

  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: {
      bookings,
    },
    meta,
  });
};

export const postBookings = async (req: Request, res: Response) => {
  const { checkIn, checkOut, roomId } = req.body;
  const userId = req.user?.id;

  try {
    if (!checkIn || !checkOut || !roomId) {
      res.status(400).json({
        status: "fail",
        message: "Missing required fields",
      });
      return;
    }
    const newCheckIn = new Date(checkIn);
    const newCheckOut = new Date(checkOut);
    const today = new Date();

    const daysDiff = Math.ceil(
      (newCheckOut.getTime() - newCheckIn.getTime()) / (1000 * 60 * 60 * 24)
    );

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

    const roomInfo = await prisma.room.findUnique({
      where: {
        id: roomId,
      },
    });

    if (!roomInfo) {
      res.status(409).json({
        status: "fail",
        message: "Room povided id does not exists",
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
        totalPrice: daysDiff * roomInfo.price,
        roomId,
        userId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
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

//      path = /:roomId

export const getOneRoomBookings = async (req: Request, res: Response) => {
  const roomId = req.params.roomId;

  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    fields,
    status,
    minPrice,
    maxPrice,
    checkInAfter,
    checkInBefore,
    search,
  } = req.query;

  const parsedStatus =
    typeof status === "string" ? status.toUpperCase() : undefined;

  const where = filterGenerator({
    status: parsedStatus,
    roomId,
    minPrice,
    maxPrice,
    checkInAfter,
    checkInBefore,
    search,
  });

  const sortBy = orderBy(sort);

  const limitFields = select(fields);

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    const [total, bookings] = await prisma.$transaction([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy: sortBy,
        select: limitFields,
        skip,
        take: limitNumber,
      }),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    const meta = {
      total,
      totalPages,
      currentPage: pageNumber,
      itemsPerPage: limitNumber,
      nextPage: buildPageUrl(
        pageNumber < totalPages ? pageNumber + 1 : null,
        req
      ),
      prevPage: buildPageUrl(pageNumber > 1 ? pageNumber - 1 : null, req),
    };

    res.status(200).json({
      status: "success",
      length: bookings.length,
      bookings,
      meta,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

export const getOneRoomBookingsOfUser = async (req: Request, res: Response) => {
  const roomId = req.params.roomId;
  const userId = req.user?.id;

  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    status,
    minPrice,
    maxPrice,
    checkInAfter,
    checkInBefore,
    search,
  } = req.query;

  const parsedStatus =
    typeof status === "string" ? status.toUpperCase() : undefined;

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

  const sortBy = orderBy(sort);


  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    const [total, bookings] = await prisma.$transaction([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy: sortBy,
        select: {
          id:true,
          checkIn:true,
          checkOut:true
        },
        skip,
        take: limitNumber,
      }),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    const meta = {
      total,
      totalPages,
      currentPage: pageNumber,
      itemsPerPage: limitNumber,
      nextPage: buildPageUrl(
        pageNumber < totalPages ? pageNumber + 1 : null,
        req
      ),
      prevPage: buildPageUrl(pageNumber > 1 ? pageNumber - 1 : null, req),
    };

    res.status(200).json({
      status: "success",
      length: bookings.length,
      bookings,
      meta,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

//    path = /:roomId/:bookingId

export const getOneBookingForOneRoom = async (req: Request, res: Response) => {
  const id = req.params.bookingId;
  const userId = req.user?.id;

  try {
    const booking = await prisma.booking.findUnique({
      where: {
        userId,
        id,
      },
    });

    if (!booking) {
      res.status(404).json({
        status: "fail",
        message: "No booking with provided id",
      });
    }

    res.status(200).json({
      status: "success",
      booking,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

export const changeBooking = async (req: Request, res: Response) => {
  const id = req.params.bookingId;
  const roomId = req.params.roomId;
  const userId = req.user?.id;

  if (req.user?.role != "ADMIN") {
    res.status(401).json({
      status: "fail",
      message: "fobiden to change booking",
    });
  }

  const {
    status,
    checkIn,
    checkOut,
    totalPrice,
  }: {
    status: Prisma.EnumbookingStatusFieldUpdateOperationsInput;
    checkIn: Date;
    checkOut: Date;
    totalPrice: number;
  } = req.body;
  const data: {
    status: Prisma.EnumbookingStatusFieldUpdateOperationsInput;
    checkIn?: Date;
    checkOut?: Date;
    totalPrice?: number;
  } = {
    status,
  };

  if (req.user?.role != "ADMIN") {
    if (totalPrice || checkOut || checkIn) {
      res.status(401).json({
        status: "fail",
        messaage: "forbiden to make totalPrice, checkOut, checkIn changes",
      });
      return;
    }
  } else {
    totalPrice ? (data.totalPrice = Number(totalPrice)) : null;
    checkOut ? (data.checkOut = new Date(checkOut)) : null;
    checkIn ? (data.checkIn = new Date(checkIn)) : null;
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: {
        ...(req.user?.role !== "ADMIN" && { userId }),
        id,
        roomId,
      },
    });

    if (!booking) {
      res.status(404).json({
        status: "fail",
        message: "No booking with provided id",
      });
      return;
    }

    const change = await prisma.booking.update({
      where: {
        ...(req.user?.role !== "ADMIN" && { userId }),
        id,
        roomId,
      },
      data,
    });

    res.status(204).json({
      status: "success",
      change,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(404).json({
        status: "fail",
        message: "Booking not found or unauthorized"
      });
      return
    }

    // Handle other potential errors (e.g., invalid data)
    if (err instanceof Prisma.PrismaClientValidationError) {
      res.status(400).json({
        status: "fail",
        message: "Invalid data format"
      });
      return
    }

    res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};

export const deleteBookings = async (req: Request, res: Response) => {
  const roomId = req.params.roomId;
  const id = req.params.bookingId;
  const userId = req.user?.id;

  if (req.user?.role != "ADMIN") {
    res.status(401).json({
      status: "fail",
      message: "fobiden to delete booking",
    });
  }

  try {

    const booking = await prisma.booking.delete({
      where: {
        id,
        roomId,
        ...(req.user?.role !== "ADMIN" && { userId })
      },
    });
    console.log(booking);
    
    res.status(204).json({
      status: "success",
      message: "booking deleted succesfuly",
      booking
    });

  } catch (err) {

    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(404).json({
        status: "fail",
        message: "Booking not found or you don't have permission to delete it"
      });
      return
    }

    res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};
