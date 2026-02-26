mport { Request, Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendCreated, sendError, paginate } from "../utils/response";
import { AuthRequest } from "../types";

// GET /menu
export const getMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, featured, popular, page="1", limit="50" } = req.query as any;
    const skip = (parseInt(page)-1) * parseInt(limit);

    const where: any = { isAvailable: true };
    if (category && category !== "all") where.category = category;
    if (featured === "true") where.isFeatured = true;
    if (popular  === "true") where.isPopular  = true;
    if (search) where.OR = [
      { name:        { contains: search, mode:"insensitive" } },
      { description: { contains: search, mode:"insensitive" } },
    ];

    const [items, total] = await Promise.all([
      prisma.menuItem.findMany({ where, skip, take:parseInt(limit), orderBy:[{isFeatured:"desc"},{sortOrder:"asc"},{name:"asc"}] }),
      prisma.menuItem.count({ where }),
    ]);

    const parsed = items.map(i => ({
      ...i,
      ingredients: JSON.parse(i.ingredients),
      allergens:   JSON.parse(i.allergens),
      dietaryTags: JSON.parse(i.dietaryTags),
    }));

    sendSuccess(res, parsed, "Menu fetched", 200, paginate(total, parseInt(page), parseInt(limit)));
  } catch (err: any) { sendError(res, err.message); }
};

// GET /menu/:id
export const getMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id:req.params.id }, include: { reviews: { include: { user: { select:{name:true,avatar:true} } }, orderBy:{createdAt:"desc"}, take:10 } } });
    if (!item) { sendError(res, "Menu item not found", 404); return; }
    sendSuccess(res, { ...item, ingredients:JSON.parse(item.ingredients), allergens:JSON.parse(item.allergens), dietaryTags:JSON.parse(item.dietaryTags) });
  } catch (err: any) { sendError(res, err.message); }
};

// POST /menu  [manager+]
export const createMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ingredients=[], allergens=[], dietaryTags=[], ...rest } = req.body;
    const item = await prisma.menuItem.create({ data: { ...rest, ingredients:JSON.stringify(ingredients), allergens:JSON.stringify(allergens), dietaryTags:JSON.stringify(dietaryTags) } });
    sendCreated(res, item, "Menu item created");
  } catch (err: any) { sendError(res, err.message); }
};

// PUT /menu/:id  [manager+]
export const updateMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ingredients, allergens, dietaryTags, ...rest } = req.body;
    const data: any = { ...rest };
    if (ingredients) data.ingredients = JSON.stringify(ingredients);
    if (allergens)   data.allergens   = JSON.stringify(allergens);
    if (dietaryTags) data.dietaryTags = JSON.stringify(dietaryTags);
    const item = await prisma.menuItem.update({ where:{ id:req.params.id }, data });
    sendSuccess(res, item, "Menu item updated");
  } catch (err: any) { sendError(res, err.message); }
};

// DELETE /menu/:id  [manager+]
export const deleteMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.menuItem.delete({ where:{ id:req.params.id } });
    sendSuccess(res, null, "Menu item deleted");
  } catch (err: any) { sendError(res, err.message); }
};

// PATCH /menu/:id/toggle  [manager+]
export const toggleAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await prisma.menuItem.findUnique({ where:{ id:req.params.id } });
    if (!item) { sendError(res, "Not found", 404); return; }
    const updated = await prisma.menuItem.update({ where:{ id:req.params.id }, data:{ isAvailable:!item.isAvailable } });
    sendSuccess(res, updated, `Item is now ${updated.isAvailable ? "available" : "unavailable"}`);
  } catch (err: any) { sendError(res, err.message); }
};
