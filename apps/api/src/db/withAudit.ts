import { Prisma } from "../generated/prisma/client";
import { prisma } from "./prisma";

export async function withAudit<T>(
  usuarioId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${usuarioId}, true)`;
    return callback(tx);
  });
}