// src/jobs/expiration.cron.ts
import { CronJob } from "cron";
import prisma from "../prismaClient";
import { filterGeneratorFilterType, filterGeneratorWhereType } from "../types/bookingTypes";
import QueryString, { ParsedQs } from "qs";
import { Request } from "express";
import { Prisma } from "@prisma/client";

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
export const filterGenerator = (filters:filterGeneratorFilterType) => {
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

// Build sorting

export const orderBy = (sort: string | QueryString.ParsedQs | (string | QueryString.ParsedQs)[]) => {
  return typeof sort == "string"? (sort).split(",").map((field:any) => {
    const sortOrder = field.startsWith("-") ? "desc" : "asc";
    const sortField = field.replace(/^-/, "");
    return { [sortField]: sortOrder };
  }):undefined
};

// Field selection
export const select = (fields: string | ParsedQs | (string | ParsedQs)[]|undefined) => {
  if (fields) {
    return (fields as string).split(",").reduce((acc: any, field: string) => {
      acc[field] = true;
      return acc;
    }, {});
  } else {
    return undefined;
  }
};

export const buildPageUrl = (newPage: number|null,req:Request,) => {
    if (!newPage) return null;
    

    const queryParams = new URLSearchParams({
        ...req.query,
        page: newPage.toString()
      } as Record<string, string>);
    
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    
    return `${baseUrl}?${queryParams.toString()}`;
  };