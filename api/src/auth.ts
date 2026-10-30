import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "./env";

export type Role = "USER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

const TokenPayload = z.object({
  sub: z.string(),
  email: z.string(),
  role: z.enum(["USER", "ADMIN"]),
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ email: user.email, role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: "7d",
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  try {
    const payload = TokenPayload.parse(jwt.verify(token, env.JWT_SECRET));
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Sign in again." });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Sign in required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "You do not have permission for this action" });
      return;
    }
    next();
  };
}
