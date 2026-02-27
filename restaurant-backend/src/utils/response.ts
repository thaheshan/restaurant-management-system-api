mport { Response } from "express";
import { ApiResponse, PaginationMeta } from "../types";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200,
  meta?: PaginationMeta
): Response => {
  const body: ApiResponse<T> = { success: true, message, data, meta };
  return res.status(statusCode).json(body);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: string
): Response => {
  const body: ApiResponse = { success: false, message, error };
  return res.status(statusCode).json(body);
};

export const sendCreated = <T>(res: Response, data: T, message = "Created successfully"): Response =>
  sendSuccess(res, data, message, 201);

export const paginate = (total: number, page: number, limit: number): PaginationMeta => ({
  total, page, limit, pages: Math.ceil(total / limit),
});
