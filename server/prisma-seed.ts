import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("ChangeMe123!", 10);

  const bht = await prisma.department.upsert({
    where: { name: "BHT" },
    update: {},
    create: { name: "BHT", escalationSeconds: 30 }
  });

  const admissions = await prisma.department.upsert({
    where: { name: "Admissions" },
    update: {},
    create: { name: "Admissions", escalationSeconds: 30 }
  });

  await prisma.user.upsert({
    where: { email: "admin@facility.local" },
    update: {},
    create: {
      name: "Facility Admin",
      email: "admin@facility.local",
      password: hash,
      role: Role.ADMIN,
      department: "Admin"
    }
  });

  await prisma.buttonRoute.upsert({
    where: { buttonName: "Delivery" },
    update: { departmentId: bht.id },
    create: { buttonName: "Delivery", departmentId: bht.id }
  });

  await prisma.buttonRoute.upsert({
    where: { buttonName: "Patient Check-In" },
    update: { departmentId: admissions.id },
    create: { buttonName: "Patient Check-In", departmentId: admissions.id }
  });

  await prisma.buttonRoute.upsert({
    where: { buttonName: "Visitor Check-In" },
    update: { departmentId: bht.id },
    create: { buttonName: "Visitor Check-In", departmentId: bht.id }
  });
}

main().finally(() => prisma.$disconnect());
