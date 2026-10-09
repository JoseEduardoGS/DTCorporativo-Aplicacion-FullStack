import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: { message: "Email y contraseña son requeridos" } });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { rol: true },
  });

  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: { message: "Credenciales inválidas" } });
  }

  const contrasenaValida = await bcrypt.compare(password, usuario.passwordHash);

  if (!contrasenaValida) {
    return res.status(401).json({ error: { message: "Credenciales inválidas" } });
  }

  const payload = { userId: usuario.id, rol: usuario.rol.nombre };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol.nombre },
  });
});

authRouter.post("/refresh", async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ error: { message: "No hay sesión activa" } });
  }

  let payload: { userId: string; rol: string };
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
      userId: string;
      rol: string;
    };
  } catch {
    return res.status(401).json({ error: { message: "Sesión inválida o expirada" } });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.userId },
    include: { rol: true },
  });

  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: { message: "Sesión inválida o expirada" } });
  }

  const nuevoAccessToken = jwt.sign(
    { userId: usuario.id, rol: usuario.rol.nombre },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: "15m" }
  );

  res.json({ accessToken: nuevoAccessToken });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.json({ message: "Sesión cerrada" });
});