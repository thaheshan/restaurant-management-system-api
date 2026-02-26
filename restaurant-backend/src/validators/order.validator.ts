mport { body } from "express-validator";

export const createOrderValidator = [
  body("items").isArray({ min:1 }).withMessage("Order must have at least one item"),
  body("items.*.menuItemId").notEmpty().withMessage("Menu item ID is required"),
  body("items.*.quantity").isInt({ min:1 }).withMessage("Quantity must be at least 1"),
  body("orderType").isIn(["dine-in","takeaway"]).withMessage("Invalid order type"),
  body("tableNumber").optional().isInt({ min:1 }),
];
