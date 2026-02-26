mport { Request, Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError, paginate } from "../utils/response";
import { AuthRequest } from "../types";
import { hashPassword } from "../utils/password";

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page="1", limit="20", role, search } = req.query as any;
    const skip  = (parseInt(page)-1) * parseInt(limit);
    const where: any = {};
    if (role)   where.role = role;
    if (search) where.OR  = [{ name:{ contains:search } },{ email:{ contains:search } }];
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take:parseInt(limit), select:{ id:true,name:true,email:true,role:true,phone:true,isActive:true,createdAt:true }, orderBy:{ createdAt:"desc" } }),
      prisma.user.count({ where }),
    ]);
    sendSuccess(res, users, "Users fetched", 200, paginate(total, parseInt(page), parseInt(limit)));
  } catch (err: any) { sendError(res, err.message); }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id:req.params.id },
      select: { id:true,name:true,email:true,role:true,phone:true,isActive:true,createdAt:true },
    });
    if (!user) { sendError(res, "User not found", 404); return; }
    sendSuccess(res, user);
  } catch (err: any) { sendError(res, err.message); }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { password, ...rest } = req.body;
    const data: any = { ...rest };
    if (password) data.passwordHash = await hashPassword(password);
    const user = await prisma.user.update({ where:{ id:req.params.id }, data, select:{ id:true,name:true,email:true,role:true,phone:true,isActive:true } });
    sendSuccess(res, user, "User updated");
  } catch (err: any) { sendError(res, err.message); }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where:{ id:req.params.id } });
    sendSuccess(res, null, "User deleted");
  } catch (err: any) { sendError(res, err.message); }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where:{ id:req.params.id } });
    if (!user) { sendError(res, "Not found", 404); return; }
    const updated = await prisma.user.update({ where:{ id:req.params.id }, data:{ isActive:!user.isActive } });
    sendSuccess(res, { id:updated.id, isActive:updated.isActive }, `User ${updated.isActive?"activated":"deactivated"}`);
  } catch (err: any) { sendError(res, err.message); }
};

// Customer: toggle favorite item
export const toggleFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { itemId } = req.body;
    const profile = await prisma.customerProfile.findUnique({ where:{ userId:req.user!.id } });
    if (!profile) { sendError(res, "Profile not found", 404); return; }
    const favs: string[] = JSON.parse(profile.favoriteItemIds);
    const idx = favs.indexOf(itemId);
    idx >= 0 ? favs.splice(idx,1) : favs.push(itemId);
    const updated = await prisma.customerProfile.update({ where:{ userId:req.user!.id }, data:{ favoriteItemIds:JSON.stringify(favs) } });
    sendSuccess(res, { favoriteItemIds: JSON.parse(updated.favoriteItemIds) }, idx>=0 ? "Removed from favorites" : "Added to favorites");
  } catch (err: any) { sendError(res, err.message); }
};

// Customer: get own profile
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.customerProfile.findUnique({ where:{ userId:req.user!.id } });
    sendSuccess(res, profile);
  } catch (err: any) { sendError(res, err.message); }
};
