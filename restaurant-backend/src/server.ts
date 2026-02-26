mport app from "./app";
import { config } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./config/database";
import fs from "fs";
import path from "path";

// Ensure upload directory exists
const uploadPath = path.join(process.cwd(), config.uploadDir);
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive:true });

const startServer = async (): Promise<void> => {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.info("✅ Database connected");

    const server = app.listen(config.port, () => {
      logger.info(`🚀 Nuvola API running on port ${config.port}`);
      logger.info(`   Environment: ${config.env}`);
      logger.info(`   API prefix:  ${config.apiPrefix}`);
      logger.info(`   Health:      http://localhost:${config.port}${config.apiPrefix}/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info("Server and DB closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));
    process.on("uncaughtException",  (err) => { logger.error("Uncaught exception",  err); process.exit(1); });
    process.on("unhandledRejection", (err) => { logger.error("Unhandled rejection", err); process.exit(1); });

  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
};

startServer();
