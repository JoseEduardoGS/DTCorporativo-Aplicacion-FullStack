import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  userId: string;
  rol: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: { message: "Token no proporcionado" } });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: { message: "Token inválido o expirado" } });
  }
}

export function requireRole(...rolesPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: { message: "No autenticado" } });
    }

    if (!rolesPermitidos.includes(req.auth.rol)) {
      return res.status(403).json({ error: { message: "No tienes permiso para esta acción" } });
    }

    next();
  };
}