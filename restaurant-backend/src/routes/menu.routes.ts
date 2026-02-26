mport { Router } from "express";
import { getMenu, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability } from "../controllers/menu.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { menuItemValidator } from "../validators/menu.validator";
import { validate } from "../middleware/validate.middleware";
import { getReviews, createReview } from "../controllers/review.controller";

const router = Router();
const staff  = ["manager","super_admin","chef"];

router.get( "/",                   getMenu);
router.get( "/:id",                getMenuItem);
router.post("/",                   authenticate, authorize(...staff), menuItemValidator, validate, createMenuItem);
router.put( "/:id",                authenticate, authorize(...staff), updateMenuItem);
router.delete("/:id",              authenticate, authorize("manager","super_admin"), deleteMenuItem);
router.patch("/:id/toggle",        authenticate, authorize(...staff), toggleAvailability);

// Reviews
router.get( "/:itemId/reviews",    getReviews);
router.post("/:itemId/reviews",    authenticate, createReview);

export default router;
