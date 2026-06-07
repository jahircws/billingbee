import { PrismaClient, AdminRole, OrgRole, Currency } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // -------------------------------------------------------------------------
  // Admin user
  // -------------------------------------------------------------------------
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@billingbee.co" },
    update: {},
    create: {
      email: "admin@billingbee.co",
      passwordHash,
      name: "BillingBee Admin",
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log(`  ✓ Admin user: ${admin.email}`);

  // -------------------------------------------------------------------------
  // Demo organization (used to anchor default taxes + categories)
  // -------------------------------------------------------------------------
  const demoOrg = await prisma.organization.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo Organization",
      slug: "demo",
      email: "demo@billingbee.co",
      country: "IN",
      currency: Currency.INR,
      plan: "pro",
    },
  });
  console.log(`  ✓ Demo org: ${demoOrg.slug}`);

  // -------------------------------------------------------------------------
  // Default taxes (seeded on demo org; cloned for real orgs at signup)
  // -------------------------------------------------------------------------
  const defaultTaxes = [
    { name: "GST 18%", rate: 18, description: "Goods & Services Tax — 18%", isDefault: true },
    { name: "GST 12%", rate: 12, description: "Goods & Services Tax — 12%", isDefault: false },
    { name: "GST 5%",  rate: 5,  description: "Goods & Services Tax — 5%",  isDefault: false },
    { name: "No Tax",  rate: 0,  description: "Tax exempt",                  isDefault: false },
  ];

  for (const tax of defaultTaxes) {
    const existing = await prisma.tax.findFirst({
      where: { orgId: demoOrg.id, name: tax.name },
    });
    if (!existing) {
      await prisma.tax.create({ data: { orgId: demoOrg.id, ...tax } });
    }
    console.log(`  ✓ Tax: ${tax.name}`);
  }

  // -------------------------------------------------------------------------
  // Default categories (seeded on demo org; cloned for real orgs at signup)
  // -------------------------------------------------------------------------
  const defaultCategories = [
    { name: "Software",    color: "#6366f1", icon: "code-2" },
    { name: "Design",      color: "#ec4899", icon: "palette" },
    { name: "Marketing",   color: "#f59e0b", icon: "megaphone" },
    { name: "Operations",  color: "#10b981", icon: "settings" },
    { name: "Other",       color: "#6b7280", icon: "folder" },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { orgId_name: { orgId: demoOrg.id, name: cat.name } },
      update: {},
      create: { orgId: demoOrg.id, ...cat },
    });
    console.log(`  ✓ Category: ${cat.name}`);
  }

  // -------------------------------------------------------------------------
  // Demo user + org membership
  // -------------------------------------------------------------------------
  const demoUserHash = await bcrypt.hash("Demo@1234", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@billingbee.co" },
    update: {},
    create: {
      email: "demo@billingbee.co",
      name: "Demo User",
      passwordHash: demoUserHash,
      emailVerified: new Date(),
    },
  });
  console.log(`  ✓ Demo user: ${demoUser.email}`);

  await prisma.orgUser.upsert({
    where: { orgId_userId: { orgId: demoOrg.id, userId: demoUser.id } },
    update: {},
    create: {
      orgId: demoOrg.id,
      userId: demoUser.id,
      role: OrgRole.OWNER,
      joinedAt: new Date(),
    },
  });
  console.log(`  ✓ Demo user linked to demo org as OWNER`);

  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
