import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthRequest = Request & { user?: { sub: string; role: string } };

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? "dev-secret") as { sub: string; role: string };
    if (payload.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin role required" });
    }
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
