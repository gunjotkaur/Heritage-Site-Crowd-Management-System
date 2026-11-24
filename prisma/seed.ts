
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const adapter = new PrismaPg({
  connectionString: getRequiredEnv("DIRECT_URL"),
});

const prisma = new PrismaClient({ adapter });

async function createAccount(data: {
  name: string;
  email: string;
  loginId: string;
  password: string;
  role: Role;
}) {
  const passwordHash = await bcrypt.hash(data.password, 12);

  await prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      loginId: data.loginId,
      passwordHash,
      role: data.role,
      isActive: true,
    },
    create: {
      name: data.name,
      email: data.email,
      loginId: data.loginId,
      passwordHash,
      role: data.role,
      isActive: true,
    },
  });

  console.log(`${data.role} account configured successfully.`);
}

async function main() {
  await createAccount({
    name: getRequiredEnv("ADMIN_NAME"),
    email: getRequiredEnv("ADMIN_EMAIL"),
    loginId: getRequiredEnv("ADMIN_LOGIN_ID"),
    password: getRequiredEnv("ADMIN_PASSWORD"),
    role: Role.ADMIN,
  });

  await createAccount({
    name: getRequiredEnv("STAFF_NAME"),
    email: getRequiredEnv("STAFF_EMAIL"),
    loginId: getRequiredEnv("STAFF_LOGIN_ID"),
    password: getRequiredEnv("STAFF_PASSWORD"),
    role: Role.STAFF,
  });
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
