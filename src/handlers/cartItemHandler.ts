import { NextFunction, Request, Response } from "express";
import { filterGenerator } from "../modules/cartItemModules";
import { buildPageUrl, orderBy, select } from "../modules/globalModules";
import prisma from "../prismaClient";

export const getAllCartItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId =
    req.user?.role !== "ADMIN"
      ? req.user?.id
      : (req.query.userId as string | undefined);

  const {
    page = 1,
    limit = 10,
    sort = "-createdAt",
    fields,
    adults,
    children,
    services,
    checkInAfter,
    checkInBefore,
    checkOutAfter,
    checlOutBefore,
    roomId,
    search,
  } = req.query;

  const where = filterGenerator({
    adults,
    children,
    services,
    checkInAfter,
    checkInBefore,
    checkOutAfter,
    checlOutBefore,
    roomId,
    search,
  });

  const sortBy = orderBy(sort);

  const limitFields = select(fields);

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    const [total, cartItems] = await prisma.$transaction([
      prisma.cartItem.count({ where }),
      prisma.cartItem.findMany({
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
      results: cartItems.length,
      cartItems,
      meta,
    });
  } catch (err) {
    console.log(err);
    
    next(err);
  }
};

export const postCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user.id;

  const { checkIn, checkOut, adults, children, services, roomId } = req.body;

  if (!roomId || !checkIn || !checkOut) {
    res.status(400).json({
      status: "fail",
      message: "Missing required fields",
    });
    return;
  }

  try {
    const room = await prisma.room.findUnique({
      where: { id: req.body.roomId },
    });

    if (!room) {
      res.status(404).json({
        status: "fail",
        message: "Room not found",
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
    const data: any = {
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      roomId,
      userId,
      adults,
      children,
    };

    services ? (data.services = services) : null;

    const newCartItem = await prisma.cartItem.create({
      data,
    });

    res.status(201).json({
      status: "success",
      newCartItem,
    });
  } catch (err) {
    next(err);
  }
};

export const getCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user.id;
  const id = req.params.id;

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: {
        userId,
        id,
      },
    });

    if (!cartItem) {
      res.status(404).json({
        status: "fail",
        message: "no item found with this id",
      });
    }

    res.status(200).json({
      status: "success",
      cartItem,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id;
  const id = req.params.id;

  const { checkIn, checkOut, adults, children } = req.body;

  const newCheckIn = new Date(checkIn);
  const newCheckOut = new Date(checkOut);
  const today = new Date();

  if (checkIn && !checkOut) {
    res.status(400).json({
      status: "fail",
      message: "add Check-out date",
    });
    return;
  }

  if (!checkIn && checkOut) {
    res.status(400).json({
      status: "fail",
      message: "add Check-in date",
    });
    return;
  }

  if (checkIn && newCheckIn < today) {
    res.status(400).json({
      status: "fail",
      message: "Check-in date cannot be in the past",
    });
    return;
  }

  if (checkIn && checkOut && newCheckIn >= newCheckOut) {
    res.status(400).json({
      status: "fail",
      message: "Check-in must be before check-out",
    });
    return;
  }
  
  const data: any = {};
  if (checkIn) data.checkIn = newCheckIn;
  if (checkOut) data.checkOut = newCheckOut;
  if (adults !== undefined) data.adults = adults;
  if (children !== undefined) data.children = children;
  try {

    const newCartItem = await prisma.cartItem.update({
      where: {
        id,
        userId,
      },
      data,
    });

    res.status(200).json({
      status: "success",
      newCartItem,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCartItem = async (req: Request, res: Response,next:NextFunction) => {
  const userId = req.user.id;
  const id = req.params.id;

  try{
    const deletedCartItem = await prisma.cartItem.delete({
      where:{
        userId,
        id
      }
    })

    console.log(deletedCartItem);
    
    res.status(204).json({
      status:"success",
      deletedCartItem
    })
  }catch(err){
    next(err)
  }

};
