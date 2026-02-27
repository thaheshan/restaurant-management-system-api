mport { Request, Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendCreated, sendError } from "../utils/response";
import { AuthRequest } from "../types";

export const getReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await prisma.review.findMany({ where:{ menuItemId:req.params.itemId }, include:{ user:{ select:{name:true,avatar:true} } }, orderBy:{ createdAt:"desc" } });
    sendSuccess(res, reviews);
  } catch (err: any) { sendError(res, err.message); }
};

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rating, comment } = req.body;
    const menuItemId = req.params.itemId;

    const review = await prisma.review.create({ data:{ menuItemId, userId:req.user!.id, rating, comment } });

    // Recalculate average rating
    const agg = await prisma.review.aggregate({ where:{ menuItemId }, _avg:{ rating:true }, _count:true });
    await prisma.menuItem.update({ where:{ id:menuItemId }, data:{ rating:parseFloat((agg._avg.rating??0).toFixed(1)), reviewCount:agg._count } });

    sendCreated(res, review, "Review submitted");
  } catch (err: any) { sendError(res, err.message); }
};
