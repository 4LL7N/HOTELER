import { filterGeneratorCartItemFilterType } from "../types/cartItemTypes";

export const filterGenerator = (filters:filterGeneratorCartItemFilterType) => {
    const where:any = {}
  if (filters.adults) where.adults = filters.adults;
  if (filters.children) where.children = filters.children;
  if (filters.services) where.services = filters.services;
  if (filters.roomId) where.roomId = filters.roomId;
  
  if (filters.checkInAfter || filters.checkInBefore) {
    where.checkIn = {};
    if (filters.checkInAfter) where.checkIn.gte = new Date(filters.checkInAfter as string);
    if (filters.checkInBefore) where.checkIn.lte = new Date(filters.checkInBefore as string);
  }
  if (filters.checkOutAfter || filters.checlOutBefore) {
    where.checkIn = {};
    if (filters.checkOutAfter) where.checkOut.gte = new Date(filters.checkOutAfter as string);
    if (filters.checlOutBefore) where.checkOut.lte = new Date(filters.checlOutBefore as string);
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