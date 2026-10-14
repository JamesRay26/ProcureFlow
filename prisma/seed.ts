import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting idempotent database seed...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Idempotent Organization Seed (Upsert by ID)
  const org = await prisma.organization.upsert({
    where: { id: '1d07f8fe-0697-4f63-9d89-6af7e775724b' },
    update: {},
    create: {
      id: '1d07f8fe-0697-4f63-9d89-6af7e775724b',
      name: 'ProcureFlow Enterprise',
    },
  });

  console.log(`✅ Organization seeded: ${org.name} (${org.id})`);

  // 2. Idempotent Users Seed (Upsert)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@procureflow.com' },
    update: {
      organizationId: org.id,
    },
    create: {
      id: '93926b75-4bb3-4090-aa33-7aff3a46b478',
      name: 'System Admin',
      email: 'admin@procureflow.com',
      passwordHash,
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@procureflow.com' },
    update: {
      organizationId: org.id,
    },
    create: {
      name: 'Warehouse Specialist',
      email: 'staff@procureflow.com',
      passwordHash,
      role: 'WAREHOUSE_STAFF',
      organizationId: org.id,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@procureflow.com' },
    update: {
      organizationId: org.id,
    },
    create: {
      name: 'Procurement Manager',
      email: 'manager@procureflow.com',
      passwordHash,
      role: 'PROCUREMENT_MANAGER',
      organizationId: org.id,
    },
  });

  console.log(`✅ Users seeded: Admin (${adminUser.email}), Staff (${staffUser.email}), Manager (${managerUser.email})`);

  // 3. Idempotent Inventory Items Seed (Upsert by compound unique [sku, organizationId])
  const itemsData = [
    {
      sku: 'PRNT-001',
      name: 'Heavy-Duty Laser Printer',
      category: 'Electronics',
      stock: 45,
      maxStock: 100,
      threshold: 15,
      warehouse: 'Digos City Central HQ',
    },
    {
      sku: 'KEY-123',
      name: 'Ergonomic Mechanical Keyboard',
      category: 'Peripherals',
      stock: 75,
      maxStock: 150,
      threshold: 20,
      warehouse: 'Digos City Central HQ',
    },
    {
      sku: 'MOU-204',
      name: 'Wireless Precision Mouse',
      category: 'Peripherals',
      stock: 50,
      maxStock: 100,
      threshold: 15,
      warehouse: 'Digos City Central HQ',
    },
    {
      sku: 'CHR-991',
      name: 'Ergonomic Executive Chair',
      category: 'Furniture',
      stock: 8, // Low Stock (< threshold 10)
      maxStock: 80,
      threshold: 10,
      warehouse: 'Digos City Central HQ',
    },
    {
      sku: 'DSK-400',
      name: 'Adjustable Standing Desk',
      category: 'Furniture',
      stock: 0, // Critical Out of Stock
      maxStock: 50,
      threshold: 10,
      warehouse: 'Digos City Central HQ',
    },
  ];

  for (const item of itemsData) {
    await prisma.inventoryItem.upsert({
      where: {
        sku_organizationId: {
          sku: item.sku,
          organizationId: org.id,
        },
      },
      update: {
        stock: item.stock,
        threshold: item.threshold,
        warehouse: item.warehouse,
      },
      create: {
        ...item,
        organizationId: org.id,
      },
    });
  }

  console.log(`✅ ${itemsData.length} inventory items seeded with Digos City Central HQ localization.`);

  // 4. Idempotent Sample Request Seed
  const sampleItem = await prisma.inventoryItem.findFirst({
    where: { sku: 'CHR-991', organizationId: org.id },
  });

  if (sampleItem) {
    const existingReq = await prisma.request.findFirst({
      where: { itemId: sampleItem.id, organizationId: org.id },
    });

    if (!existingReq) {
      await prisma.request.create({
        data: {
          quantity: 25,
          priority: 'High',
          justification: 'Stock critically under threshold (8 left). Urgent restocking needed for Digos City HQ.',
          status: 'APPROVED',
          shippingStatus: 'IN_TRANSIT',
          estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          latitude: 6.7530,
          longitude: 125.3560,
          itemId: sampleItem.id,
          requestedById: staffUser.id,
          organizationId: org.id,
        },
      });
      console.log('✅ Sample in-transit request seeded.');
    }
  }

  console.log('🎉 Idempotent database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
