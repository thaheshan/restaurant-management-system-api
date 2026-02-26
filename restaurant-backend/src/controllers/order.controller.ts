mport { Request, Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendCreated, sendError, paginate } from "../utils/response";
import { AuthRequest } from "../types";
import { generateOrderNumber } from "../utils/orderNumber";

// POST /orders  — place new order
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, orderType="dine-in", tableNumber, notes="", promoCode, deliveryAddress } = req.body;
    const userId = req.user?.id;

    // Validate and price items
    let subtotal = 0;
    const resolvedItems: any[] = [];

    for (const i of items) {
      const menuItem = await prisma.menuItem.findUnique({ where:{ id:i.menuItemId } });
      if (!menuItem || !menuItem.isAvailable) { sendError(res, `Item "${i.menuItemId}" not available`, 400); return; }
      const total = menuItem.price * i.quantity;
      subtotal   += total;
      resolvedItems.push({ menuItemId:i.menuItemId, quantity:i.quantity, unitPrice:menuItem.price, total, notes:i.notes??""  });
    }

    // Promo code
    let discount = 0;
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({ where:{ code:promoCode } });
      if (promo && promo.isActive && (!promo.expiresAt || promo.expiresAt > new Date()) && promo.usedCount < promo.maxUses) {
        discount = promo.type === "percentage" ? subtotal * (promo.discount/100) : promo.discount;
        await prisma.promoCode.update({ where:{ code:promoCode }, data:{ usedCount:{ increment:1 } } });
      }
    }

    const tax           = subtotal * 0.08;
    const total         = subtotal + tax - discount;
    const loyaltyEarned = Math.floor(total);

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: "pending",
        orderType, tableNumber, notes, promoCode, deliveryAddress,
        subtotal, tax, discount, total, loyaltyEarned,
        estimatedTime: 20 + Math.floor(Math.random() * 15),
        items: { create: resolvedItems },
      },
      include: { items: { include: { menuItem: true } } },
    });

    // Add loyalty points
    if (userId) {
      await prisma.customerProfile.upsert({
        where:  { userId },
        update: { loyaltyPoints:{ increment:loyaltyEarned }, totalOrders:{ increment:1 } },
        create: { userId, loyaltyPoints:loyaltyEarned, totalOrders:1 },
      });
    }

    sendCreated(res, order, "Order placed successfully");
  } catch (err: any) { sendError(res, err.message); }
};

// GET /orders  — customer: own orders | manager: all orders
export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page="1", limit="20", status } = req.query as any;
    const skip   = (parseInt(page)-1) * parseInt(limit);
    const isStaff = ["manager","super_admin","chef","waiter"].includes(req.user?.role ?? "");

    const where: any = {};
    if (!isStaff) where.userId = req.user!.id;
    if (status)   where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, skip, take:parseInt(limit), orderBy:{ createdAt:"desc" }, include:{ items:{ include:{ menuItem:{ select:{name:true,imageEmoji:true,price:true} } } } } }),
      prisma.order.count({ where }),
    ]);

    sendSuccess(res, orders, "Orders fetched", 200, paginate(total, parseInt(page), parseInt(limit)));
  } catch (err: any) { sendError(res, err.message); }
};

// GET /orders/:id
export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findUnique({
      where: { id:req.params.id },
      include: { items:{ include:{ menuItem:true } }, user:{ select:{name:true,email:true,phone:true} } },
    });
    if (!order) { sendError(res, "Order not found", 404); return; }
    const isStaff = ["manager","super_admin","chef","waiter"].includes(req.user?.role ?? "");
    if (!isStaff && order.userId !== req.user?.id) { sendError(res, "Forbidden", 403); return; }
    sendSuccess(res, order);
  } catch (err: any) { sendError(res, err.message); }
};

// PATCH /orders/:id/status  [staff only]
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending","confirmed","preparing","ready","delivered","cancelled"];
    if (!validStatuses.includes(status)) { sendError(res, "Invalid status", 400); return; }

    const stepMap: Record<string,number> = { pending:0, confirmed:1, preparing:2, ready:3, delivered:4, cancelled:-1 };
    const order = await prisma.order.update({
      where: { id:req.params.id },
      data:  { status, trackingStep:stepMap[status] },
    });
    sendSuccess(res, order, `Order status updated to ${status}`);
  } catch (err: any) { sendError(res, err.message); }
};

// GET /orders/stats  [manager+]
export const getOrderStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const weekAgo = new Date(Date.now() - 7*24*60*60*1000);

    const [totalOrders, todayOrders, weekRevenue, statusCounts] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where:{ createdAt:{ gte:today } } }),
      prisma.order.aggregate({ where:{ createdAt:{ gte:weekAgo }, status:{ not:"cancelled" } }, _sum:{ total:true } }),
      prisma.order.groupBy({ by:["status"], _count:true }),
    ]);

    sendSuccess(res, { totalOrders, todayOrders, weekRevenue:weekRevenue._sum.total??0, statusCounts });
  } catch (err: any) { sendError(res, err.message); }
};
