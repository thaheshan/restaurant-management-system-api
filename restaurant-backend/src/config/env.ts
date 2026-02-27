mport dotenv from "dotenv";
dotenv.config();

export const config = {
  env:              process.env.NODE_ENV ?? "development",
  port:             parseInt(process.env.PORT ?? "5000"),
  apiPrefix:        process.env.API_PREFIX ?? "/api/v1",

  jwtSecret:        process.env.JWT_SECRET ?? "fallback_secret",
  jwtExpiresIn:     process.env.JWT_EXPIRES_IN ?? "7d",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "fallback_refresh",
  jwtRefreshExpires:process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",

  allowedOrigins:   (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000").split(","),

  rateLimitWindow:  parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "900000"),
  rateLimitMax:     parseInt(process.env.RATE_LIMIT_MAX ?? "100"),

  uploadDir:        process.env.UPLOAD_DIR ?? "uploads",
  maxFileSize:      parseInt(process.env.MAX_FILE_SIZE ?? "5242880"),
};
