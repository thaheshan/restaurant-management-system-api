mport multer from "multer";
import path from "path";
import { config } from "../config/env";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename:    (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ["image/jpeg","image/jpg","image/png","image/webp"];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only image files are allowed"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxFileSize },
});
