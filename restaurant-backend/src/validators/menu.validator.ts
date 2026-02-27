mport { body } from "express-validator";

export const menuItemValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("category").isIn(["appetizer","main_course","dessert","beverage","side_dish","special"]).withMessage("Invalid category"),
  body("price").isFloat({ min:0 }).withMessage("Price must be a positive number"),
  body("preparationTime").optional().isInt({ min:1 }).withMessage("Prep time must be positive"),
  body("calories").optional().isInt({ min:0 }),
];
