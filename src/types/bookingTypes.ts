import { Prisma } from '@prisma/client';
import { ParsedQs } from 'qs';

export interface filterGeneratorBookingFilterType {
    status?:string | ParsedQs | (string | ParsedQs)[],
    userId?:string | ParsedQs | (string | ParsedQs)[],
    roomId?:string | ParsedQs | (string | ParsedQs)[],
    minPrice?:string | ParsedQs | (string | ParsedQs)[],
    maxPrice?:string | ParsedQs | (string | ParsedQs)[],
    checkInAfter?:string | ParsedQs | (string | ParsedQs)[],
    checkInBefore?:string | ParsedQs | (string | ParsedQs)[],
    search?:string | ParsedQs | (string | ParsedQs)[]
}

export interface filterGeneratorWhereType extends filterGeneratorBookingFilterType {
    totalPrice?:{
        gte?:number,
        lte?:number
    },
    checkIn?:{
        gte?:Date,
        lte?:Date
    },
    OR?: Array<Record<string, any>>;
}
