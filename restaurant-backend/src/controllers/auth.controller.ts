mport { Request, Response } from "express";
import { prisma } from "../config/database";
import { hashPassword, comparePassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { sendSuccess, sendCreated, sendError } from "../utils/response";
import { AuthRequest } from "../types";
import { v4 as uuidv4 } from "uuid";

// POST /auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role = "customer" } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { sendError(res, "Email already registered", 409); return; }

    const passwordHash = await hashPassword(password);
    const allowedRoles = ["customer","manager","chef","waiter","inventory_staff"];
    const userRole     = allowedRoles.includes(role) ? role : "customer";

    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone, role: userRole },
      select: { id:true, name:true, email:true, role:true, phone:true, createdAt:true },
    });

    // Create customer profile
    if (userRole === "customer") {
      await prisma.customerProfile.create({ data: { userId:user.id, loyaltyPoints:100 } });
    }

    const accessToken  = signAccessToken({ id:user.id, email:user.email, role:user.role, name:user.name });
    const refreshToken = signRefreshToken({ id:user.id, email:user.email, role:user.role, name:user.name });

    await prisma.refreshToken.create({
      data: { token:refreshToken, userId:user.id, expiresAt: new Date(Date.now() + 30*24*60*60*1000) },
    });

    sendCreated(res, { user, accessToken, refreshToken }, "Registration successful");
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) { sendError(res, "Invalid credentials", 401); return; }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) { sendError(res, "Invalid credentials", 401); return; }

    const payload      = { id:user.id, email:user.email, role:user.role, name:user.name };
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: { token:refreshToken, userId:user.id, expiresAt: new Date(Date.now() + 30*24*60*60*1000) },
    });

    const profile = user.role === "customer"
      ? await prisma.customerProfile.findUnique({ where: { userId:user.id } })
      : null;

    sendSuccess(res, {
      user: { id:user.id, name:user.name, email:user.email, role:user.role, phone:user.phone, avatar:user.avatar },
      profile,
      accessToken,
      refreshToken,
    }, "Login successful");
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
};

// POST /auth/refresh
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) { sendError(res, "Refresh token required", 400); return; }

    const stored = await prisma.refreshToken.findUnique({ where: { token }, include: { user:true } });
    if (!stored || stored.expiresAt < new Date()) { sendError(res, "Invalid or expired refresh token", 401); return; }

    const decoded     = verifyRefreshToken(token);
    const newAccess   = signAccessToken({ id:decoded.id, email:decoded.email, role:decoded.role, name:decoded.name });
    const newRefresh  = signRefreshToken({ id:decoded.id, email:decoded.email, role:decoded.role, name:decoded.name });

    await prisma.refreshToken.delete({ where: { token } });
    await prisma.refreshToken.create({
      data: { token:newRefresh, userId:decoded.id, expiresAt: new Date(Date.now() + 30*24*60*60*1000) },
    });

    sendSuccess(res, { accessToken:newAccess, refreshToken:newRefresh }, "Token refreshed");
  } catch {
    sendError(res, "Invalid refresh token", 401);
  }
};

// POST /auth/logout
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (token) await prisma.refreshToken.deleteMany({ where: { token } });
    sendSuccess(res, null, "Logged out successfully");
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
};

// GET /auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id:true, name:true, email:true, role:true, phone:true, avatar:true, createdAt:true },
    });
    if (!user) { sendError(res, "User not found", 404); return; }

    const profile = user.role === "customer"
      ? await prisma.customerProfile.findUnique({ where: { userId:user.id } })
      : null;

    sendSuccess(res, { ...user, profile });
  } catch (err: any) {
    sendError(res, err.message, 500);
  }
};
