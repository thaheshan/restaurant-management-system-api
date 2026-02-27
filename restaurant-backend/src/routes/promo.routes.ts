mport { Router } from "express";
import { validatePromo, getPromoCodes, createPromoCode } from "../controllers/promo.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.post("/validate", validatePromo);
router.get( "/",         authenticate, authorize("manager","super_admin"), getPromoCodes);
router.post("/",         authenticate, authorize("manager","super_admin"), createPromoCode);

export default router;
