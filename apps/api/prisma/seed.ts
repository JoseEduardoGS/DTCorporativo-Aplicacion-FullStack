import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/db/prisma";

async function main() {
  const nombresRoles = ["Director", "Administrador", "Supervisor"];

  for (const nombre of nombresRoles) {
    await prisma.rol.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  const rolDirector = await prisma.rol.findUniqueOrThrow({
    where: { nombre: "Director" },
  });

  const emailDirector = "director@trituradora.local";
  const yaExiste = await prisma.usuario.findUnique({
    where: { email: emailDirector },
  });

  if (!yaExiste) {
    const passwordHash = await bcrypt.hash("CambiaEstaContrasena123", 10);
    await prisma.usuario.create({
      data: {
        nombre: "Director General",
        email: emailDirector,
        passwordHash,
        rolId: rolDirector.id,
      },
    });
    console.log("Usuario Director creado:", emailDirector, "- password temporal: CambiaEstaContrasena123");
  } else {
    console.log("El usuario Director ya existe, no se crea de nuevo.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });