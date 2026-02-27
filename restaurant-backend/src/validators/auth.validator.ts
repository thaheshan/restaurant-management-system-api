mport { body } from "express-validator";

export const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min:2, max:100 }),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isLength({ min:6 }).withMessage("Password must be at least 6 characters"),
  body("phone").optional().isMobilePhone("any").withMessage("Invalid phone number"),
];

export const loginValidator = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];
