mport { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { verifyAccessToken } from "../utils/jwt";
import { sendError } from "../utils/response";

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      sendError(res, "No token provided", 401); return;
    }
    const token   = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    req.user      = decoded;
    next();
  } catch {
    sendError(res, "Invalid or expired token", 401);
  }
};

export const authorize = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) { sendError(res, "Unauthorized", 401); return; }
    if (!roles.includes(req.user.role)) {
      sendError(res, "Insufficient permissions", 403); return;
    }
    next();
  };

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      req.user    = verifyAccessToken(token);
    }
  } catch { /* optional — ignore */ }
  next();
};
