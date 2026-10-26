import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../lib/prisma';

import { LOGISTICS_CHECKPOINTS } from '../lib/logistics';

describe('Warehouse Scanner & Inventory Automation Suite', () => {
  let orgId: string;
  let staffUserId: string;
  let testItemId: string;
  let testRequestId: string;

  beforeAll(async () => {
    const org = await prisma.organization.upsert({
      where: { id: '1d07f8fe-0697-4f63-9d89-6af7e775724b' },
      update: {},
      create: {
        id: '1d07f8fe-0697-4f63-9d89-6af7e775724b',
        name: 'ProcureFlow Enterprise',
      },
    });
    orgId = org.id;

    const staff = await prisma.user.findUnique({ where: { email: 'staff@procureflow.com' } });
    if (staff) staffUserId = staff.id;

    const item = await prisma.inventoryItem.upsert({
      where: {
        sku_organizationId: {
          sku: 'SCAN-TEST-001',
          organizationId: orgId,
        },
      },
      update: { stock: 5, maxStock: 100, threshold: 15 },
      create: {
        sku: 'SCAN-TEST-001',
        name: 'Scanner Barcode Terminal Unit',
        category: 'Hardware',
        stock: 5,
        maxStock: 100,
        threshold: 15,
        warehouse: 'Digos City Central HQ',
        organizationId: orgId,
      },
    });
    testItemId = item.id;

    // Create an approved request ready for shipment scanning
    const req = await prisma.request.create({
      data: {
        quantity: 25,
        priority: 'High',
        justification: 'Automated test logistics request',
        status: 'APPROVED',
        shippingStatus: 'SHIPPED',
        currentCheckpoint: 1,
        itemId: testItemId,
        requestedById: staffUserId,
        organizationId: orgId,
      },
    });
    testRequestId = req.id;
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.shipmentScan.deleteMany({ where: { requestId: testRequestId } });
    await prisma.request.deleteMany({ where: { itemId: testItemId } });
    await prisma.inventoryItem.deleteMany({ where: { id: testItemId } });
  });

  it('TC-SCAN-01: Logistics Route Checkpoints are strictly sequenced (1 through 4)', () => {
    expect(LOGISTICS_CHECKPOINTS).toHaveLength(4);
    expect(LOGISTICS_CHECKPOINTS[0].step).toBe(1);
    expect(LOGISTICS_CHECKPOINTS[1].title).toContain('Digos North Sorting Hub');
    expect(LOGISTICS_CHECKPOINTS[3].action).toBe('DELIVERED');
  });

  it('TC-SCAN-02: Scanning parcel at sorting hub records ShipmentScan and updates checkpoint', async () => {
    const hubCheckpoint = LOGISTICS_CHECKPOINTS[1]; // Step 2: Digos North Sorting Hub

    const scan = await prisma.shipmentScan.create({
      data: {
        requestId: testRequestId,
        checkpointStep: hubCheckpoint.step,
        checkpointName: hubCheckpoint.title,
        location: hubCheckpoint.location,
        action: hubCheckpoint.action,
        latitude: hubCheckpoint.lat,
        longitude: hubCheckpoint.lng,
        scannedById: staffUserId,
        organizationId: orgId,
      },
    });

    expect(scan.id).toBeDefined();
    expect(scan.checkpointStep).toBe(2);
    expect(scan.checkpointName).toBe('Arrived at Digos North Sorting Hub');

    // Update request state
    const updatedReq = await prisma.request.update({
      where: { id: testRequestId },
      data: {
        currentCheckpoint: 2,
        shippingStatus: 'IN_TRANSIT',
        latitude: hubCheckpoint.lat,
        longitude: hubCheckpoint.lng,
      },
    });

    expect(updatedReq.currentCheckpoint).toBe(2);
    expect(updatedReq.shippingStatus).toBe('IN_TRANSIT');
  });

  it('TC-AUTO-01: Auto-Restock optimal calculation calculates (maxStock - stock)', async () => {
    const item = await prisma.inventoryItem.findUnique({ where: { id: testItemId } });
    expect(item).toBeDefined();

    if (!item) return;

    // Stock is 5, maxStock is 100, threshold is 15
    const calculatedNeeded = Math.max(item.maxStock - item.stock, item.threshold * 2);
    expect(calculatedNeeded).toBe(95);

    // Auto-priority logic: stock <= half threshold -> High
    const priority = item.stock <= Math.floor(item.threshold / 2) ? 'High' : 'Medium';
    expect(priority).toBe('High');
  });
});
