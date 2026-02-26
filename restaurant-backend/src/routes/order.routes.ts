mport { Router } from "express";
import { createOrder, getOrders, getOrder, updateOrderStatus, getOrderStats } from "../controllers/order.controller";
import { authenticate, authorize, optionalAuth } from "../middleware/auth.middleware";
import { createOrderValidator } from "../validators/order.validator";
import { validate } from "../middleware/validate.middleware";

const router = Router();
const staff  = ["manager","super_admin","chef","waiter"];

router.post("/",           optionalAuth, createOrderValidator, validate, createOrder);
router.get( "/",           authenticate, getOrders);
router.get( "/stats",      authenticate, authorize(...staff.slice(0,2)), getOrderStats);
router.get( "/:id",        authenticate, getOrder);
router.patch("/:id/status",authenticate, authorize(...staff), updateOrderStatus);

export default router;
