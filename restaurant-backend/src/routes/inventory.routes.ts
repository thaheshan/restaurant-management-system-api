mport { Router } from "express";
import { getInventory, getInventoryItem, createInventoryItem, updateInventoryItem, deleteInventoryItem, updateStock } from "../controllers/inventory.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router  = Router();
const staff   = ["manager","super_admin","inventory_staff"];

router.get(   "/",         authenticate, authorize(...staff), getInventory);
router.get(   "/:id",      authenticate, authorize(...staff), getInventoryItem);
router.post(  "/",         authenticate, authorize(...staff), createInventoryItem);
router.put(   "/:id",      authenticate, authorize(...staff), updateInventoryItem);
router.delete("/:id",      authenticate, authorize("manager","super_admin"), deleteInventoryItem);
router.patch( "/:id/stock",authenticate, authorize(...staff), updateStock);

export default router;
