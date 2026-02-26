mport { Router } from "express";
import authRoutes      from "./auth.routes";
import menuRoutes      from "./menu.routes";
import orderRoutes     from "./order.routes";
import inventoryRoutes from "./inventory.routes";
import userRoutes      from "./user.routes";
import promoRoutes     from "./promo.routes";

const router = Router();

router.use("/auth",      authRoutes);
router.use("/menu",      menuRoutes);
router.use("/orders",    orderRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/users",     userRoutes);
router.use("/promos",    promoRoutes);

// Health check
router.get("/health", (_req, res) => res.json({ status:"ok", timestamp:new Date().toISOString(), version:"1.0.0" }));

export default router;
