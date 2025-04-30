import QueryString, { ParsedQs } from "qs";
import { Request } from "express";


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

// generate url for previous and next paination of data

export const buildPageUrl = (newPage: number|null,req:Request) => {
    if (!newPage) return null;
    

    const queryParams = new URLSearchParams({
        ...req.query,
        page: newPage.toString()
      } as Record<string, string>);
    
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    
    return `${baseUrl}?${queryParams.toString()}`;
  };