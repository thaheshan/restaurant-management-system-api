mport { Request, Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendCreated, sendError } from "../utils/response";
import { AuthRequest } from "../types";

export const getInventory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.inventoryItem.findMany({ orderBy:{ name:"asc" } });
    const alerts = items.filter(i => i.healthStatus === "critical" || i.healthStatus === "warning");
    sendSuccess(res, { items, alerts, alertCount:alerts.length });
  } catch (err: any) { sendError(res, err.message); }
};

export const getInventoryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await prisma.inventoryItem.findUnique({ where:{ id:req.params.id } });
    if (!item) { sendError(res, "Not found", 404); return; }
    sendSuccess(res, item);
  } catch (err: any) { sendError(res, err.message); }
};

export const createInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await prisma.inventoryItem.create({ data: req.body });
    sendCreated(res, item, "Inventory item created");
  } catch (err: any) { sendError(res, err.message); }
};

export const updateInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await prisma.inventoryItem.update({ where:{ id:req.params.id }, data:req.body });
    sendSuccess(res, item, "Inventory item updated");
  } catch (err: any) { sendError(res, err.message); }
};

export const deleteInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.inventoryItem.delete({ where:{ id:req.params.id } });
    sendSuccess(res, null, "Inventory item deleted");
  } catch (err: any) { sendError(res, err.message); }
};

export const updateStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { quantity } = req.body;
    const existing = await prisma.inventoryItem.findUnique({ where:{ id:req.params.id } });
    if (!existing) { sendError(res, "Not found", 404); return; }

    const healthStatus =
      quantity <= 0              ? "critical" :
      quantity < existing.minimumStock ? "warning"  :
      quantity >= existing.maximumStock * 0.8 ? "fresh" : "good";

    const item = await prisma.inventoryItem.update({ where:{ id:req.params.id }, data:{ currentStock:quantity, healthStatus } });
    sendSuccess(res, item, "Stock updated");
  } catch (err: any) { sendError(res, err.message); }
};
