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

  const auditorUser = await prisma.user.upsert({
    where: { email: 'auditor@procureflow.com' },
    update: {
      organizationId: org.id,
    },
    create: {
      name: 'Compliance Auditor',
      email: 'auditor@procureflow.com',
      passwordHash,
      role: 'AUDITOR',
      organizationId: org.id,
    },
  });

  console.log(`✅ Users seeded: Admin (${adminUser.email}), Staff (${staffUser.email}), Manager (${managerUser.email}), Auditor (${auditorUser.email})`);

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

  // 4. Seed Requests across all 4 workflow states (PENDING, RETURNED, APPROVED, REJECTED)
  const keyboardItem = await prisma.inventoryItem.findFirst({
    where: { sku: 'KEY-123', organizationId: org.id },
  });
  const printerItem = await prisma.inventoryItem.findFirst({
    where: { sku: 'PRNT-001', organizationId: org.id },
  });
  const chairItem = await prisma.inventoryItem.findFirst({
    where: { sku: 'CHR-991', organizationId: org.id },
  });
  const mouseItem = await prisma.inventoryItem.findFirst({
    where: { sku: 'MOU-204', organizationId: org.id },
  });

  // 4a. PENDING request (TC-RW-01, TC-RW-03, TC-RW-04, TC-RW-05)
  if (keyboardItem) {
    const existingReq = await prisma.request.findFirst({
      where: { itemId: keyboardItem.id, status: 'PENDING', organizationId: org.id },
    });
    if (!existingReq) {
      const req = await prisma.request.create({
        data: {
          quantity: 20,
          priority: 'Medium',
          justification: 'Replenishing engineering lab workstation peripherals before Q4 intake.',
          status: 'PENDING',
          itemId: keyboardItem.id,
          requestedById: staffUser.id,
          organizationId: org.id,
        },
      });
      await prisma.auditLog.create({
        data: {
          actionType: 'CREATION',
          description: `Initiated restocking request for 20x ${keyboardItem.name}`,
          requestId: req.id,
          ipAddress: '127.0.0.1',
          userId: staffUser.id,
          organizationId: org.id,
        },
      });
      console.log('✅ Seeded PENDING request (Ready for Manager Approval / Staff Edit).');
    }
  }

  // 4b. RETURNED request (TC-RW-05: Return for correction and requester resubmission)
  if (printerItem) {
    const existingReq = await prisma.request.findFirst({
      where: { itemId: printerItem.id, status: 'RETURNED', organizationId: org.id },
    });
    if (!existingReq) {
      const req = await prisma.request.create({
        data: {
          quantity: 8,
          priority: 'High',
          justification: 'Backup units for finance department invoice printing.',
          status: 'RETURNED',
          reviewNotes: 'Storage capacity in Digos City HQ server room currently only accommodates 4 units. Please reduce quantity.',
          itemId: printerItem.id,
          requestedById: staffUser.id,
          organizationId: org.id,
        },
      });
      await prisma.auditLog.create({
        data: {
          actionType: 'RETURNED',
          description: `Request returned for correction by Procurement Manager: Storage capacity limits require quantity adjustment.`,
          requestId: req.id,
          ipAddress: '127.0.0.1',
          userId: managerUser.id,
          organizationId: org.id,
        },
      });
      console.log('✅ Seeded RETURNED request (Ready for Staff correction and resubmission).');
    }
  }

  // 4c. APPROVED request (TC-RW-03: In-transit parcel tracking to Digos City)
  if (chairItem) {
    const existingReq = await prisma.request.findFirst({
      where: { itemId: chairItem.id, status: 'APPROVED', organizationId: org.id },
    });
    if (!existingReq) {
      const req = await prisma.request.create({
        data: {
          quantity: 25,
          priority: 'High',
          justification: 'Stock critically under threshold (8 left). Urgent restocking needed for Digos City HQ.',
          status: 'APPROVED',
          shippingStatus: 'IN_TRANSIT',
          estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          latitude: 6.7530,
          longitude: 125.3560,
          itemId: chairItem.id,
          requestedById: staffUser.id,
          organizationId: org.id,
        },
      });
      await prisma.auditLog.create({
        data: {
          actionType: 'APPROVAL',
          description: `Approved request for 25 units of ${chairItem.name}. Dispatched logistics shipment to Digos City Central HQ.`,
          requestId: req.id,
          ipAddress: '127.0.0.1',
          userId: managerUser.id,
          organizationId: org.id,
        },
      });
      console.log('✅ Seeded APPROVED request (In-transit parcel tracking to Digos City).');
    }
  }

  // 4d. REJECTED request (TC-RW-04: Rejection with recorded reason and manager)
  if (mouseItem) {
    const existingReq = await prisma.request.findFirst({
      where: { itemId: mouseItem.id, status: 'REJECTED', organizationId: org.id },
    });
    if (!existingReq) {
      const req = await prisma.request.create({
        data: {
          quantity: 250,
          priority: 'Low',
          justification: 'Requested bulk surplus mouse units for auxiliary warehouse backup.',
          status: 'REJECTED',
          reviewNotes: 'Rejected: Requested quantity of 250 units exceeds quarterly budget allocation limits for peripherals.',
          itemId: mouseItem.id,
          requestedById: staffUser.id,
          organizationId: org.id,
        },
      });
      await prisma.auditLog.create({
        data: {
          actionType: 'REJECTION',
          description: `Rejected request for ${mouseItem.name}: Exceeds quarterly budget allocation limits.`,
          requestId: req.id,
          ipAddress: '127.0.0.1',
          userId: managerUser.id,
          organizationId: org.id,
        },
      });
      console.log('✅ Seeded REJECTED request (TC-RW-04: Recorded reason & manager).');
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
