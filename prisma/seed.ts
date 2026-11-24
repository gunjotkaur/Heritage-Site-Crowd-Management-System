
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Role,
  SiteCategory,
} from "../src/generated/prisma/client";
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

async function createHeritageSites() {
  const sites = [
    {
      name: "Red Fort",
      slug: "red-fort",
      category: SiteCategory.FORT,
      description:
        "A historic Mughal fort and UNESCO World Heritage Site in Delhi.",
      history:
        "Built by Mughal emperor Shah Jahan and completed in 1648.",
      address: "Netaji Subhash Marg, Lal Qila, Chandni Chowk",
      city: "Delhi",
      state: "Delhi",
      latitude: 28.6562,
      longitude: 77.241,
      openingTime: "09:30",
      closingTime: "16:30",
      closedDays: [1],
      maxCapacity: 1000,
      images: [],
    },
    {
      name: "India Gate",
      slug: "india-gate",
      category: SiteCategory.MONUMENT,
      description:
        "A prominent war memorial located in the heart of New Delhi.",
      history:
        "Designed by Sir Edwin Lutyens and inaugurated in 1931.",
      address: "Kartavya Path, India Gate",
      city: "New Delhi",
      state: "Delhi",
      latitude: 28.6129,
      longitude: 77.2295,
      openingTime: "00:00",
      closingTime: "23:59",
      closedDays: [],
      maxCapacity: 5000,
      images: [],
    },
    {
      name: "Qutub Minar",
      slug: "qutub-minar",
      category: SiteCategory.MONUMENT,
      description:
        "A UNESCO World Heritage Site famous for its historic minaret.",
      history:
        "Construction began under Qutb-ud-din Aibak in the late 12th century.",
      address: "Seth Sarai, Mehrauli",
      city: "New Delhi",
      state: "Delhi",
      latitude: 28.5245,
      longitude: 77.1855,
      openingTime: "07:00",
      closingTime: "17:00",
      closedDays: [],
      maxCapacity: 1500,
      images: [],
    },
  ];

  for (const site of sites) {
    await prisma.heritageSite.upsert({
      where: { slug: site.slug },
      update: site,
      create: site,
    });

    console.log(`${site.name} configured successfully.`);
  }
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

  await createHeritageSites();
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
