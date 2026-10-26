import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Purging old database records for pristine presentation dataset...');
  
  // Clean in dependency order
  await prisma.shipmentScan.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.request.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('🌱 Seeding presentation-ready ProcureFlow Enterprise dataset...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Organization Seed
  const org = await prisma.organization.create({
    data: {
      id: '1d07f8fe-0697-4f63-9d89-6af7e775724b',
      name: 'ProcureFlow Enterprise',
    },
  });

  console.log(`✅ Organization created: ${org.name} (${org.id})`);

  // 2. Users Seed (All 4 Core RBAC Roles + 2 Warehouse Team Members)
  const adminUser = await prisma.user.create({
    data: {
      id: '93926b75-4bb3-4090-aa33-7aff3a46b478',
      name: 'James Ray Gemilga',
      email: 'admin@procureflow.com',
      passwordHash,
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      name: 'Danielle Kylle Espiritu',
      email: 'manager@procureflow.com',
      passwordHash,
      role: 'PROCUREMENT_MANAGER',
      organizationId: org.id,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      name: 'Jaylord Deloy',
      email: 'staff@procureflow.com',
      passwordHash,
      role: 'WAREHOUSE_STAFF',
      organizationId: org.id,
    },
  });

  const auditorUser = await prisma.user.create({
    data: {
      name: 'Orlian Digap',
      email: 'auditor@procureflow.com',
      passwordHash,
      role: 'AUDITOR',
      organizationId: org.id,
    },
  });

  // Additional team members to demonstrate rich team roster
  const staffUser2 = await prisma.user.create({
    data: {
      name: 'Sofia Rodriguez',
      email: 'rodriguez@procureflow.com',
      passwordHash,
      role: 'WAREHOUSE_STAFF',
      organizationId: org.id,
    },
  });

  const staffUser3 = await prisma.user.create({
    data: {
      name: 'Mark Kenneth Tan',
      email: 'tan@procureflow.com',
      passwordHash,
      role: 'WAREHOUSE_STAFF',
      organizationId: org.id,
    },
  });

  console.log(`✅ Users created: 
    - Admin: ${adminUser.name} (${adminUser.email})
    - Manager: ${managerUser.name} (${managerUser.email})
    - Staff: ${staffUser.name} (${staffUser.email})
    - Auditor: ${auditorUser.name} (${auditorUser.email})
    - Associates: ${staffUser2.name}, ${staffUser3.name}`);

  // 3. Rich Presentation Inventory Catalogue (18 items across 5 categories & 3 regional depots)
  const inventoryData = [
    {
      sku: 'LOG-SCAN-01',
      name: 'Industrial Barcode Scanner Terminal',
      category: 'Hardware',
      stock: 12, // Low stock (< 15) -> Ready for 1-Click Restock demonstration!
      maxStock: 50,
      threshold: 15,
      warehouse: 'Digos City Central HQ',
    },
    {
      sku: 'DSK-STAND-02',
      name: 'Dual-Motor Electric Standing Desk',
      category: 'Furniture',
      stock: 0, // Critical Out of Stock -> Has PENDING request ready for Manager Approval demo!
      maxStock: 40,
      threshold: 10,
      warehouse: 'Digos City Central HQ',
    },
    {
      sku: 'CHR-AERO-03',
      name: 'AeroMesh Ergonomic Task Chair',
      category: 'Furniture',
      stock: 8, // Low Stock -> Has APPROVED request with active in-transit logistics at Stop 2!
      maxStock: 60,
      threshold: 10,
      warehouse: 'Digos City Central HQ',
    },
    {
      sku: 'PRNT-HP-04',
      name: 'HP Enterprise Color LaserJet Pro',
      category: 'Electronics',
      stock: 18, // Has RETURNED request -> Ready for Staff Correction & Resubmission demo!
      maxStock: 30,
      threshold: 5,
      warehouse: 'Santa Cruz Regional Depot',
    },
    {
      sku: 'MON-DELL-05',
      name: 'Dell UltraSharp 27" 4K UHD Monitor',
      category: 'Electronics',
      stock: 45, // Has REJECTED request -> Ready for Rejection Audit demo!
      maxStock: 80,
      threshold: 15,
      warehouse: 'Digos City Central HQ',
    },
    {
      sku: 'KEY-MECH-06',
      name: 'Ergonomic Mechanical Keyboard (Hot-Swap)',
      category: 'Hardware',
      stock: 75,
      maxStock: 120,
      threshold: 20,
      warehouse: 'Digos City Central HQ',
    },
    {
      sku: 'CBL-CAT6-07',
      name: 'Bulk Cat6 UTP 10Gbps Ethernet Spool (1000ft)',
      category: 'IT Infrastructure',
      stock: 35,
      maxStock: 100,
      threshold: 10,
      warehouse: 'Davao South Logistics Hub',
    },
    {
      sku: 'SFT-HELM-08',
      name: 'ANSI High-Visibility Safety Helmets (Class E)',
      category: 'Safety Equipment',
      stock: 95,
      maxStock: 150,
      threshold: 25,
      warehouse: 'Santa Cruz Regional Depot',
    },
    {
      sku: 'SRV-RACK-09',
      name: '42U Enterprise Server Rack Enclosure',
      category: 'IT Infrastructure',
      stock: 2, // Low stock -> Has PENDING request for 5 units
      maxStock: 10,
      threshold: 4,
      warehouse: 'Davao South Logistics Hub',
    },
    {
      sku: 'SWT-CISCO-10',
      name: 'Cisco Catalyst 24-Port Gigabit PoE+ Switch',
      category: 'IT Infrastructure',
      stock: 3, // Low stock -> Has APPROVED request in transit at Stop 3!
      maxStock: 25,
      threshold: 6,
      warehouse: 'Digos City Central HQ',
    },
    {
      sku: 'UPS-APC-11',
      name: 'APC Smart-UPS 3000VA LCD 230V Backup',
      category: 'Electronics',
      stock: 14, // Healthy -> Has APPROVED request delivered at Stop 4!
      maxStock: 30,
      threshold: 6,
      warehouse: 'Davao South Logistics Hub',
    },
    {
      sku: 'SFT-GLV-12',
      name: 'Heavy-Duty Kevlar Cut-Resistant Gloves',
      category: 'Safety Equipment',
      stock: 6, // Low stock (< 20) -> Ready for 1-Click Restock!
      maxStock: 80,
      threshold: 20,
      warehouse: 'Digos City Central HQ',
    },
    {
      sku: 'CAM-CONF-13',
      name: '4K Ultra-Wide Auto-Framing Conference Camera',
      category: 'Electronics',
      stock: 14,
      maxStock: 25,
      threshold: 5,
      warehouse: 'Santa Cruz Regional Depot',
    },
    {
      sku: 'DOC-THINK-14',
      name: 'Lenovo ThinkPad Thunderbolt 4 Workstation Dock',
      category: 'Hardware',
      stock: 0, // Critical Out of stock -> Has PENDING request for 30 units
      maxStock: 50,
      threshold: 10,
      warehouse: 'Digos City Central HQ',
    },
    {
      sku: 'FBR-OPT-15',
      name: '10G LC-to-LC Duplex Multimode OM4 Fiber Patch Cable',
      category: 'IT Infrastructure',
      stock: 85, // Healthy -> Has REJECTED request (excess buffer)
      maxStock: 120,
      threshold: 25,
      warehouse: 'Davao South Logistics Hub',
    },
    {
      sku: 'FAC-SPILL-16',
      name: '55-Gallon Chemical Spill Response Containment Kit',
      category: 'Safety Equipment',
      stock: 3, // Low stock -> Has RETURNED request (missing MSDS sheet)
      maxStock: 10,
      threshold: 5,
      warehouse: 'Santa Cruz Regional Depot',
    },
    {
      sku: 'TBL-CONF-17',
      name: 'Modular 12-Seater Boardroom Conference Table',
      category: 'Furniture',
      stock: 1, // Low stock (< 2) -> Ready for 1-Click Restock!
      maxStock: 4,
      threshold: 2,
      warehouse: 'Digos City Central HQ',
    },
    {
      sku: 'BC-GUN-18',
      name: 'Honeywell Voyager 1202g Wireless Laser Scanner',
      category: 'Hardware',
      stock: 16,
      maxStock: 40,
      threshold: 8,
      warehouse: 'Digos City Central HQ',
    },
  ];

  const createdItems = new Map<string, string>();

  for (const item of inventoryData) {
    const created = await prisma.inventoryItem.create({
      data: {
        ...item,
        organizationId: org.id,
      },
    });
    createdItems.set(item.sku, created.id);
  }

  console.log(`✅ ${inventoryData.length} presentation items created across Hardware, Furniture, Electronics, Safety, and IT Infrastructure.`);

  // 4. Seed Comprehensive Requests for Presentation

  // ==========================================
  // SHIPMENT 1: APPROVED & IN-TRANSIT (At Stop 2: Digos North Sorting Hub)
  // Ready for Sorting Center Barcode Scan Simulator Demo
  // ==========================================
  const chairItemId = createdItems.get('CHR-AERO-03')!;
  const approvedReq1 = await prisma.request.create({
    data: {
      quantity: 25,
      priority: 'High',
      justification: 'Stock critically under threshold (8 left). Urgent replenishment for Digos City HQ workstations.',
      status: 'APPROVED',
      shippingStatus: 'IN_TRANSIT',
      currentCheckpoint: 2, // At Digos North Sorting Hub -> Ready to scan into Stop 3 & 4!
      estimatedArrival: new Date(Date.now() + 2.5 * 60 * 60 * 1000), // 2.5 hours remaining
      latitude: 6.7680,
      longitude: 125.3720,
      itemId: chairItemId,
      requestedById: staffUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  });

  // Checkpoint 1 scan: Regional Depot Dispatch
  await prisma.shipmentScan.create({
    data: {
      requestId: approvedReq1.id,
      checkpointStep: 1,
      checkpointName: 'Dispatched from Regional Depot',
      location: 'Santa Cruz Logistics Hub (Davao-Digos Highway)',
      action: 'DISPATCHED',
      notes: 'Initial cargo manifest verified. Carrier fleet #PF-402 departed regional depot.',
      latitude: 6.8320,
      longitude: 125.4150,
      scannedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      scannedById: staffUser.id,
      organizationId: org.id,
    },
  });

  // Checkpoint 2 scan: Digos North Sorting Hub Arrival
  await prisma.shipmentScan.create({
    data: {
      requestId: approvedReq1.id,
      checkpointStep: 2,
      checkpointName: 'Arrived at Digos North Sorting Hub',
      location: 'Digos City Distribution Center (Rizal Ave Ext)',
      action: 'SORTED',
      notes: 'Optical scan verified inbound. Package sorted into Digos Central District route.',
      latitude: 6.7680,
      longitude: 125.3720,
      scannedAt: new Date(Date.now() - 45 * 60 * 1000),
      scannedById: staffUser.id,
      organizationId: org.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actionType: 'APPROVAL',
      description: `Approved restocking request for 25x AeroMesh Ergonomic Task Chair by Danielle Kylle Espiritu. Dispatched carrier fleet #PF-402 via Davao-Digos corridor.`,
      requestId: approvedReq1.id,
      ipAddress: '192.168.1.104',
      userId: managerUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // SHIPMENT 2: APPROVED & IN-TRANSIT (At Stop 3: Quezon Avenue Corridor)
  // Ready to demonstrate approach to final destination bay!
  // ==========================================
  const switchItemId = createdItems.get('SWT-CISCO-10')!;
  const approvedReq2 = await prisma.request.create({
    data: {
      quantity: 12,
      priority: 'High',
      justification: 'Only 3 units remaining. Core switches needed for Digos network operations center.',
      status: 'APPROVED',
      shippingStatus: 'IN_TRANSIT',
      currentCheckpoint: 3, // At Quezon Avenue Corridor -> Ready to scan into Step 4!
      estimatedArrival: new Date(Date.now() + 45 * 60 * 1000), // 45 mins remaining
      latitude: 6.7530,
      longitude: 125.3560,
      itemId: switchItemId,
      requestedById: staffUser2.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  });

  await prisma.shipmentScan.create({
    data: {
      requestId: approvedReq2.id,
      checkpointStep: 1,
      checkpointName: 'Dispatched from Regional Depot',
      location: 'Santa Cruz Logistics Hub (Davao-Digos Highway)',
      action: 'DISPATCHED',
      notes: 'Loaded into express delivery vehicle #PF-108.',
      latitude: 6.8320,
      longitude: 125.4150,
      scannedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      scannedById: staffUser.id,
      organizationId: org.id,
    },
  });

  await prisma.shipmentScan.create({
    data: {
      requestId: approvedReq2.id,
      checkpointStep: 2,
      checkpointName: 'Arrived at Digos North Sorting Hub',
      location: 'Digos City Distribution Center (Rizal Ave Ext)',
      action: 'SORTED',
      notes: 'Cleared priority handling sortation.',
      latitude: 6.7680,
      longitude: 125.3720,
      scannedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      scannedById: staffUser.id,
      organizationId: org.id,
    },
  });

  await prisma.shipmentScan.create({
    data: {
      requestId: approvedReq2.id,
      checkpointStep: 3,
      checkpointName: 'En Route via Quezon Avenue Corridor',
      location: 'Quezon Avenue, Digos City Downtown',
      action: 'IN_TRANSIT',
      notes: 'Carrier vehicle en route through Digos City downtown corridor (Speed: 40 km/h).',
      latitude: 6.7530,
      longitude: 125.3560,
      scannedAt: new Date(Date.now() - 25 * 60 * 1000),
      scannedById: staffUser.id,
      organizationId: org.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actionType: 'APPROVAL',
      description: `Approved restocking request for 12x Cisco Catalyst 24-Port Gigabit Switch by Danielle Kylle Espiritu.`,
      requestId: approvedReq2.id,
      ipAddress: '192.168.1.104',
      userId: managerUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // SHIPMENT 3: APPROVED & COMPLETED (At Stop 4: Digos Central Receiving Bay)
  // Demonstrates completed shipment history and stock safety restoration
  // ==========================================
  const upsItemId = createdItems.get('UPS-APC-11')!;
  const approvedReq3 = await prisma.request.create({
    data: {
      quantity: 8,
      priority: 'Medium',
      justification: 'Preventive battery replacement units for server room power protection.',
      status: 'APPROVED',
      shippingStatus: 'DELIVERED',
      currentCheckpoint: 4, // Fully arrived
      estimatedArrival: new Date(Date.now() - 2 * 60 * 60 * 1000),
      latitude: 6.7420,
      longitude: 125.3450,
      itemId: upsItemId,
      requestedById: staffUser3.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  for (let s = 1; s <= 4; s++) {
    const names = [
      'Dispatched from Regional Depot',
      'Arrived at Digos North Sorting Hub',
      'En Route via Quezon Avenue Corridor',
      'Destination Receiving Bay (Bay 3)'
    ];
    const locs = [
      'Santa Cruz Logistics Hub',
      'Digos City Distribution Center',
      'Quezon Avenue Corridor',
      'Digos City Central Warehouse'
    ];
    const lats = [6.8320, 6.7680, 6.7530, 6.7420];
    const lngs = [125.4150, 125.3720, 125.3560, 125.3450];
    await prisma.shipmentScan.create({
      data: {
        requestId: approvedReq3.id,
        checkpointStep: s,
        checkpointName: names[s - 1],
        location: locs[s - 1],
        action: s === 4 ? 'DELIVERED' : 'CHECK_IN',
        notes: s === 4 ? 'Shipment signed for and stock safe buffer confirmed.' : 'Transit scan verified.',
        latitude: lats[s - 1],
        longitude: lngs[s - 1],
        scannedAt: new Date(Date.now() - (12 - s * 2.5) * 60 * 60 * 1000),
        scannedById: staffUser.id,
        organizationId: org.id,
      },
    });
  }

  // ==========================================
  // REQUEST 4: PENDING (High Priority - Out of Stock Standing Desks)
  // Ready for Manager 1-Click Approval Demo
  // ==========================================
  const deskItemId = createdItems.get('DSK-STAND-02')!;
  const pendingReq1 = await prisma.request.create({
    data: {
      quantity: 40,
      priority: 'High',
      justification: 'Stock at zero units. Urgent order for new engineering division workstation onboarding.',
      status: 'PENDING',
      itemId: deskItemId,
      requestedById: staffUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  });

  await prisma.auditLog.create({
    data: {
      actionType: 'CREATION',
      description: `Initiated restocking request for 40x Dual-Motor Electric Standing Desk (Status: PENDING) by Jaylord Deloy`,
      requestId: pendingReq1.id,
      ipAddress: '192.168.1.112',
      userId: staffUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // REQUEST 5: PENDING (High Priority - Server Rack Enclosure)
  // Ready for Manager 1-Click Approval Demo
  // ==========================================
  const rackItemId = createdItems.get('SRV-RACK-09')!;
  const pendingReq2 = await prisma.request.create({
    data: {
      quantity: 5,
      priority: 'High',
      justification: 'Only 2 racks remaining in Davao South Hub. Core data center migration commences next month.',
      status: 'PENDING',
      itemId: rackItemId,
      requestedById: staffUser2.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
    },
  });

  await prisma.auditLog.create({
    data: {
      actionType: 'CREATION',
      description: `Initiated restocking request for 5x 42U Enterprise Server Rack Enclosure by Sofia Rodriguez`,
      requestId: pendingReq2.id,
      ipAddress: '192.168.1.115',
      userId: staffUser2.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // REQUEST 6: PENDING (Medium Priority - ThinkPad Docks)
  // Ready for Manager Approval or Rejection Demo
  // ==========================================
  const dockItemId = createdItems.get('DOC-THINK-14')!;
  const pendingReq3 = await prisma.request.create({
    data: {
      quantity: 30,
      priority: 'Medium',
      justification: 'Stock depleted. Needed for hybrid engineering and developer laptop deployments.',
      status: 'PENDING',
      itemId: dockItemId,
      requestedById: staffUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  });

  await prisma.auditLog.create({
    data: {
      actionType: 'CREATION',
      description: `Initiated restocking request for 30x Lenovo ThinkPad Thunderbolt 4 Workstation Dock by Jaylord Deloy`,
      requestId: pendingReq3.id,
      ipAddress: '192.168.1.112',
      userId: staffUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // REQUEST 7: RETURNED for Revision (TC-RW-05 Demo - Storage Limit)
  // Ready for Staff Revision and Re-submission Demo
  // ==========================================
  const printerItemId = createdItems.get('PRNT-HP-04')!;
  const returnedReq1 = await prisma.request.create({
    data: {
      quantity: 12,
      priority: 'Medium',
      justification: 'Backup printer units for finance department invoice generation.',
      status: 'RETURNED',
      reviewNotes: 'Storage bay currently has room for max 6 printer units. Please adjust quantity to 6.',
      itemId: printerItemId,
      requestedById: staffUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
  });

  await prisma.auditLog.create({
    data: {
      actionType: 'RETURNED',
      description: `Request returned for correction by Procurement Manager Danielle Kylle Espiritu: Storage bay currently has room for max 6 units.`,
      requestId: returnedReq1.id,
      ipAddress: '192.168.1.104',
      userId: managerUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // REQUEST 8: RETURNED for Revision (TC-RW-05 Demo - Safety Compliance Docs)
  // Ready for Staff Revision and Re-submission Demo
  // ==========================================
  const spillItemId = createdItems.get('FAC-SPILL-16')!;
  const returnedReq2 = await prisma.request.create({
    data: {
      quantity: 5,
      priority: 'High',
      justification: 'Quarterly safety compliance replenishment for chemical and battery storage room.',
      status: 'RETURNED',
      reviewNotes: 'Please attach certified supplier Hazmat safety data sheet (MSDS) before resubmission.',
      itemId: spillItemId,
      requestedById: staffUser2.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    },
  });

  await prisma.auditLog.create({
    data: {
      actionType: 'RETURNED',
      description: `Request returned for correction by Procurement Manager Danielle Kylle Espiritu: Missing supplier Hazmat MSDS documentation.`,
      requestId: returnedReq2.id,
      ipAddress: '192.168.1.104',
      userId: managerUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // REQUEST 9: REJECTED (TC-RW-04 Demo - Budget Cap Exceeded)
  // Ready for Auditor Inspection & Budget Compliance Demo
  // ==========================================
  const monitorItemId = createdItems.get('MON-DELL-05')!;
  const rejectedReq1 = await prisma.request.create({
    data: {
      quantity: 100,
      priority: 'Low',
      justification: 'Bulk reserve order of 4K monitors for future quarterly expansion.',
      status: 'REJECTED',
      reviewNotes: 'Rejected: Bulk order of 100 units exceeds quarterly electronics budget cap (₱750,000 threshold).',
      itemId: monitorItemId,
      requestedById: staffUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
    },
  });

  await prisma.auditLog.create({
    data: {
      actionType: 'REJECTION',
      description: `Rejected request for 100x Dell UltraSharp 27" 4K UHD Monitor by Danielle Kylle Espiritu. Reason: Exceeds quarterly electronics budget cap (₱750,000 threshold).`,
      requestId: rejectedReq1.id,
      ipAddress: '192.168.1.104',
      userId: managerUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // REQUEST 10: REJECTED (TC-RW-04 Demo - Redundant Order)
  // Ready for Auditor Inspection Demo
  // ==========================================
  const fiberItemId = createdItems.get('FBR-OPT-15')!;
  const rejectedReq2 = await prisma.request.create({
    data: {
      quantity: 80,
      priority: 'Low',
      justification: 'Stockpile reserve for network infrastructure overhaul.',
      status: 'REJECTED',
      reviewNotes: 'Rejected: Current warehouse stock of 85 units comfortably exceeds minimum threshold (25 units). No reorder needed this quarter.',
      itemId: fiberItemId,
      requestedById: staffUser3.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    },
  });

  await prisma.auditLog.create({
    data: {
      actionType: 'REJECTION',
      description: `Rejected request for 80x 10G LC-to-LC Duplex Fiber Patch Cable by Danielle Kylle Espiritu. Reason: Sufficient stock buffer (85 units in stock).`,
      requestId: rejectedReq2.id,
      ipAddress: '192.168.1.104',
      userId: managerUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
    },
  });

  // Additional security audit log for admin settings
  await prisma.auditLog.create({
    data: {
      actionType: 'ROLE_CHANGE',
      description: `System Administrator James Ray Gemilga configured organization security parameters and verified RBAC policy enforcement.`,
      ipAddress: '192.168.1.101',
      userId: adminUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    },
  });

  await prisma.auditLog.create({
    data: {
      actionType: 'COMPLIANCE_REVIEW',
      description: `Compliance Auditor Orlian Digap accessed immutable audit records and verified zero unauthorized mutations.`,
      ipAddress: '192.168.1.199',
      userId: auditorUser.id,
      organizationId: org.id,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  console.log('✅ 10 Comprehensive Presentation Requests seeded:');
  console.log(`   - 3 APPROVED Shipments:`);
  console.log(`     * #${approvedReq1.id.slice(0, 8).toUpperCase()} (AeroMesh Chairs) in-transit at Stop 2`);
  console.log(`     * #${approvedReq2.id.slice(0, 8).toUpperCase()} (Cisco Switches) in-transit at Stop 3`);
  console.log(`     * #${approvedReq3.id.slice(0, 8).toUpperCase()} (APC Smart-UPS) delivered at Stop 4`);
  console.log(`   - 3 PENDING Approvals (Desks, Server Racks, ThinkPad Docks) ready for manager approval`);
  console.log(`   - 2 RETURNED for Revision (LaserJet Printers, Hazmat Spill Kits) ready for staff revision`);
  console.log(`   - 2 REJECTED with Reason (4K Monitors, Fiber Patch Cables) ready for auditor inspection`);
  console.log(`   - 3 Unrequested Low-Stock Items (Scanner Terminal, Kevlar Gloves, Boardroom Table) ready for 1-Click Auto Restock demo`);

  console.log('🎉 Expanded presentation dataset seeded successfully and ready for defense!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
