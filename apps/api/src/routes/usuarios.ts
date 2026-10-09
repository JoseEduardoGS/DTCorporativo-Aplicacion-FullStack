import { Router } from "express";
import bcrypt from "bcrypt";
import { crearUsuarioSchema, actualizarUsuarioSchema } from "@trituradora/shared";
import { prisma } from "../db/prisma";
import { withAudit } from "../db/withAudit";
import { requireAuth, requireRole } from "../middlewares/auth";

const usuarioPublicoSelect = {
  id: true,
  nombre: true,
  email: true,
  activo: true,
  createdAt: true,
  rol: { select: { nombre: true } },
} as const;

export const usuariosRouter = Router();

usuariosRouter.use(requireAuth, requireRole("Director"));

usuariosRouter.post("/", async (req, res) => {
  const resultado = crearUsuarioSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      error: { message: "Datos inválidos", detalles: resultado.error.issues },
    });
  }

  const { nombre, email, password, rol } = resultado.data;

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    return res.status(409).json({ error: { message: "Ya existe un usuario con ese email" } });
  }

  const rolDb = await prisma.rol.findUnique({ where: { nombre: rol } });
  if (!rolDb) {
    return res.status(400).json({ error: { message: "Rol inexistente" } });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const usuario = await withAudit(req.auth!.userId, (tx) =>
    tx.usuario.create({
      data: { nombre, email, passwordHash, rolId: rolDb.id },
      select: usuarioPublicoSelect,
    })
  );

  res.status(201).json(usuario);
});

usuariosRouter.get("/", async (_req, res) => {
  const usuarios = await prisma.usuario.findMany({
    select: usuarioPublicoSelect,
    orderBy: { createdAt: "desc" },
  });

  res.json(usuarios);
});

usuariosRouter.patch("/:id", async (req, res) => {
  const resultado = actualizarUsuarioSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      error: { message: "Datos inválidos", detalles: resultado.error.issues },
    });
  }

  const { id } = req.params;
  const { nombre, rol, activo } = resultado.data;

  const esMismoUsuario = id === req.auth!.userId;
  if (esMismoUsuario && (activo === false || (rol && rol !== req.auth!.rol))) {
    return res
      .status(400)
      .json({ error: { message: "No puedes desactivarte ni cambiar tu propio rol" } });
  }

  const existente = await prisma.usuario.findUnique({ where: { id } });
  if (!existente) {
    return res.status(404).json({ error: { message: "Usuario no encontrado" } });
  }

  let rolId: number | undefined;
  if (rol) {
    const rolDb = await prisma.rol.findUnique({ where: { nombre: rol } });
    if (!rolDb) {
      return res.status(400).json({ error: { message: "Rol inexistente" } });
    }
    rolId = rolDb.id;
  }

  const usuario = await withAudit(req.auth!.userId, (tx) =>
    tx.usuario.update({
      where: { id },
      data: { nombre, activo, rolId },
      select: usuarioPublicoSelect,
    })
  );

  res.json(usuario);
});