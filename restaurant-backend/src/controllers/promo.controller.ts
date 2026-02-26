mport { Request, Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../types";

export const validatePromo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, subtotal } = req.body;
    const promo = await prisma.promoCode.findUnique({ where:{ code:code.toUpperCase() } });
    if (!promo || !promo.isActive) { sendError(res, "Invalid promo code", 400); return; }
    if (promo.expiresAt && promo.expiresAt < new Date()) { sendError(res, "Promo code expired", 400); return; }
    if (promo.usedCount >= promo.maxUses) { sendError(res, "Promo code limit reached", 400); return; }
    const discount = promo.type === "percentage" ? (subtotal ?? 0) * (promo.discount/100) : promo.discount;
    sendSuccess(res, { code:promo.code, discount, type:promo.type, percentage:promo.discount });
  } catch (err: any) { sendError(res, err.message); }
};

export const getPromoCodes = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const codes = await prisma.promoCode.findMany({ orderBy:{ createdAt:"desc" } });
    sendSuccess(res, codes);
  } catch (err: any) { sendError(res, err.message); }
};

export const createPromoCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const code = await prisma.promoCode.create({ data: { ...req.body, code:req.body.code.toUpperCase() } });
    sendSuccess(res, code, "Promo code created", 201);
  } catch (err: any) { sendError(res, err.message); }
};
