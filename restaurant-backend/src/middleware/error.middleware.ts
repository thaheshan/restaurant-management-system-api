mport { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { sendError } from "../utils/response";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(err.message, { stack: err.stack });

  if (err.name === "PrismaClientKnownRequestError") {
    if (err.code === "P2002") { sendError(res, "A record with this value already exists", 409, err.message); return; }
    if (err.code === "P2025") { sendError(res, "Record not found", 404, err.message); return; }
  }

  if (err.name === "ValidationError") { sendError(res, err.message, 422); return; }

  const status  = err.statusCode ?? err.status ?? 500;
  const message = err.message ?? "Internal server error";
  sendError(res, message, status, process.env.NODE_ENV === "development" ? err.stack : undefined);
};

export const notFound = (_req: Request, res: Response): void => {
  sendError(res, "Route not found", 404);
};
