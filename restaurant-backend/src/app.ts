mport express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";

import { config } from "./config/env";
import { logger } from "./config/logger";
import { errorHandler, notFound } from "./middleware/error.middleware";
import routes from "./routes";

const app: Application = express();

// ── Security ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

// ── Rate limiting ─────────────────────────────────────────
app.use(rateLimit({
  windowMs: config.rateLimitWindow,
  max:      config.rateLimitMax,
  message:  { success:false, message:"Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders:   false,
}));

// ── General middleware ────────────────────────────────────
app.use(compression());
app.use(express.json({ limit:"10mb" }));
app.use(express.urlencoded({ extended:true, limit:"10mb" }));
app.use(morgan("combined", { stream:{ write: (msg) => logger.http(msg.trim()) } }));

// ── Static files ──────────────────────────────────────────
app.use("/uploads", express.static(path.join(process.cwd(), config.uploadDir)));

// ── API Routes ────────────────────────────────────────────
app.use(config.apiPrefix, routes);

// ── Root ──────────────────────────────────────────────────
app.get("/", (_req, res) => res.json({
  name:    "Nuvola Restaurant API",
  version: "1.0.0",
  docs:    `${config.apiPrefix}/health`,
  status:  "🟢 Running",
}));

// ── Error handling ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
