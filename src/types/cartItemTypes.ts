import { ParsedQs } from 'qs';


export interface filterGeneratorCartItemFilterType {
    adults?:string | ParsedQs | (string | ParsedQs)[]|undefined,
    children?:string | ParsedQs | (string | ParsedQs)[],
    services?:string | ParsedQs | (string | ParsedQs)[],
    checkInAfter?:string | ParsedQs | (string | ParsedQs)[],
    checkInBefore?:string | ParsedQs | (string | ParsedQs)[],
    checkOutAfter:string | ParsedQs | (string | ParsedQs)[]|undefined,
    checlOutBefore:string | ParsedQs | (string | ParsedQs)[]|undefined,
    roomId?:string | ParsedQs | (string | ParsedQs)[],
    search?:string | ParsedQs | (string | ParsedQs)[]
}

export interface metaType {
    total: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    nextPage: string | null;
    prevPage: string | null;
}