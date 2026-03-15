import { prisma } from "./prisma";

export async function logAction(actor: string, action: string, metadata: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: { actor, action, metadata }
  });
}
