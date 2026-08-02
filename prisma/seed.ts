// Demo seed data. Every phone number, commercial register number, email and
// address below is FAKE placeholder data for local development/demo only —
// it does not represent any real Shugan document, customer, or transaction.
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding demo data...");

  // --- Cities & districts -----------------------------------------------
  const riyadh = await prisma.city.upsert({
    where: { id: "city-riyadh" },
    update: {},
    create: {
      id: "city-riyadh",
      name: "الرياض",
      nameEn: "Riyadh",
      region: "منطقة الرياض",
      isActive: true,
    },
  });

  const eastRiyadhDistricts = [
    { id: "dist-rawdah", name: "حي الروضة", nameEn: "Al Rawdah" },
    { id: "dist-qadisiyah", name: "حي القادسية", nameEn: "Al Qadisiyah" },
    { id: "dist-nahdah", name: "حي النهضة", nameEn: "Al Nahdah" },
    { id: "dist-yarmuk", name: "حي اليرموك", nameEn: "Al Yarmuk" },
    { id: "dist-rimal", name: "حي الرمال", nameEn: "Al Rimal" },
    { id: "dist-rayyan", name: "حي الريان", nameEn: "Al Rayyan" },
    { id: "dist-ishbiliyah", name: "حي إشبيلية", nameEn: "Ishbiliyah" },
    { id: "dist-mounsiyah", name: "حي المونسية", nameEn: "Al Mounsiyah" },
  ];

  for (const d of eastRiyadhDistricts) {
    await prisma.district.upsert({
      where: { id: d.id },
      update: {},
      create: { ...d, cityId: riyadh.id },
    });
  }

  // Additional cities kept inactive: demonstrates the catalogue is ready to
  // expand without any schema change — admin can flip `isActive` later.
  await prisma.city.upsert({
    where: { id: "city-jeddah" },
    update: {},
    create: { id: "city-jeddah", name: "جدة", nameEn: "Jeddah", region: "منطقة مكة المكرمة", isActive: false },
  });
  await prisma.city.upsert({
    where: { id: "city-dammam" },
    update: {},
    create: { id: "city-dammam", name: "الدمام", nameEn: "Dammam", region: "المنطقة الشرقية", isActive: false },
  });

  // --- Admin account ------------------------------------------------------
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@kharasanapro.demo" },
    update: {},
    create: {
      email: "admin@kharasanapro.demo",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      adminLevel: "SUPER_ADMIN",
      name: "مدير المنصة (تجريبي)",
      status: "ACTIVE",
    },
  });

  // --- Shugan Ready-Mix Concrete — founding supplier (DEMO DATA) ---------
  const shuganUser = await prisma.user.upsert({
    where: { phone: "966500000001" },
    update: {},
    create: {
      phone: "966500000001",
      role: "COMPANY",
      name: "حساب شركة شغن للخرسانة الجاهزة (تجريبي)",
      status: "ACTIVE",
    },
  });

  const shugan = await prisma.company.upsert({
    where: { userId: shuganUser.id },
    update: {},
    create: {
      userId: shuganUser.id,
      name: "شركة شغن للخرسانة الجاهزة",
      nameEn: "Shugan Ready-Mix Concrete Co. (Demo)",
      slug: "shugan-ready-mix",
      brandColorHex: "#0B5FFF",
      description:
        "المورد الأول على منصة خرسانة برو، يغطي مشاريع شرق الرياض. (بيانات تجريبية لأغراض العرض فقط)",
      descriptionEn:
        "The first supplier on the Kharasana Pro platform, covering East Riyadh projects. (Demo data for showcase purposes only)",
      crNumber: "1010000000", // FAKE demo commercial register number
      crDocUrl: null,
      status: "APPROVED",
      isFeatured: true,
      ratingAvg: 4.8,
      ratingCount: 12,
    },
  });

  // Composite unique constraints with a NULL column don't dedupe reliably
  // across engines, so check-then-create instead of upsert here.
  const existingServiceArea = await prisma.companyServiceArea.findFirst({
    where: { companyId: shugan.id, cityId: riyadh.id, districtId: null },
  });
  if (!existingServiceArea) {
    await prisma.companyServiceArea.create({
      data: { companyId: shugan.id, cityId: riyadh.id, districtId: null },
    });
  }

  await prisma.commissionSetting.upsert({
    where: { id: "commission-global-default" },
    update: {},
    create: {
      id: "commission-global-default",
      scope: "GLOBAL",
      type: "PER_M3",
      value: 5, // SAR per m3 — demo default, editable by admin later
      isActive: true,
    },
  });

  // --- A second demo company still pending admin review ------------------
  const pendingUser = await prisma.user.upsert({
    where: { phone: "966500000002" },
    update: {},
    create: {
      phone: "966500000002",
      role: "COMPANY",
      name: "حساب شركة تجريبية أخرى بانتظار الاعتماد",
      status: "PENDING_APPROVAL",
    },
  });

  await prisma.company.upsert({
    where: { userId: pendingUser.id },
    update: {},
    create: {
      userId: pendingUser.id,
      name: "شركة الاختبار للخرسانة (تجريبي)",
      nameEn: "Test Concrete Co. (Demo)",
      slug: "test-concrete-demo",
      crNumber: "1010000001",
      status: "PENDING_REVIEW",
    },
  });

  // --- Demo sales rep, approved -------------------------------------------
  const repUser = await prisma.user.upsert({
    where: { phone: "966500000003" },
    update: {},
    create: {
      phone: "966500000003",
      role: "SALES_REP",
      name: "مندوب تجريبي",
      status: "ACTIVE",
    },
  });

  await prisma.salesRep.upsert({
    where: { userId: repUser.id },
    update: {},
    create: {
      userId: repUser.id,
      referralCode: "KP-DEMO001",
      status: "APPROVED",
      commissionType: "INHERIT",
    },
  });

  // --- Demo customer + one sample order + one quote -----------------------
  const customer = await prisma.user.upsert({
    where: { phone: "966500000009" },
    update: {},
    create: {
      phone: "966500000009",
      role: "CUSTOMER",
      name: "عميل تجريبي",
      status: "ACTIVE",
    },
  });

  const sampleOrder = await prisma.order.upsert({
    where: { code: "KP-DEMO-0001" },
    update: {},
    create: {
      code: "KP-DEMO-0001",
      customerId: customer.id,
      cityId: riyadh.id,
      districtId: "dist-rawdah",
      locationDetails: "بجانب حديقة الروضة (بيانات تجريبية)",
      projectType: "RESIDENTIAL",
      concreteType: "READY_MIX_PUMPABLE",
      strengthGrade: "C30",
      quantityM3: 45,
      pumpRequired: true,
      pumpType: "BOOM",
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: "طلب تجريبي لأغراض العرض فقط",
      status: "QUOTED",
    },
  });

  await prisma.quote.upsert({
    where: { id: "demo-quote-1" },
    update: {},
    create: {
      id: "demo-quote-1",
      orderId: sampleOrder.id,
      companyId: shugan.id,
      pricePerM3: 260,
      pumpPrice: 800,
      totalPrice: 45 * 260 + 800,
      notes: "عرض تجريبي من شغن",
      status: "PENDING",
    },
  });

  console.log("Seed complete:");
  console.log(`  Admin login  -> admin@kharasanapro.demo / Admin@12345 (id ${admin.id})`);
  console.log("  Shugan phone -> 966500000001 (OTP shown in server console/API response in dev)");
  console.log("  Customer     -> 966500000009");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
