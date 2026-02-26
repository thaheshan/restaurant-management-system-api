mport jwt from "jsonwebtoken";
import { config } from "../config/env";
import { JwtPayload } from "../types";

export const signAccessToken = (payload: Omit<JwtPayload, "iat" | "exp">): string =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as any);

export const signRefreshToken = (payload: Omit<JwtPayload, "iat" | "exp">): string =>
  jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpires } as any);

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwtSecret) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
