import "dotenv/config";

import { hash } from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing from .env.");
}

if (!adminEmail || !adminPassword) {
  throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.");
}

if (new TextEncoder().encode(adminPassword).length < 8) {
  throw new Error("ADMIN_PASSWORD must be at least 8 bytes.");
}

if (new TextEncoder().encode(adminPassword).length > 72) {
  throw new Error("ADMIN_PASSWORD must not exceed 72 bytes.");
}

const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      passwordHash,
      role: "ADMIN",
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log("Admin account is ready:");
  console.log(admin);
}

main()
  .catch((error) => {
    console.error("Could not create admin account:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });