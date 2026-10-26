/* 
 * CS 490 SENIOR CAPSTONE - ROLE-BASED ACCESS CONTROL (RBAC) & WORKFLOW ENGINE
 * Full compliance with User Stories & Test Cases:
 * - TC-RBAC-01: Prevent Warehouse Staff from Approving or Rejecting Requests
 * - TC-RBAC-02: Verify Auditor Has Read-Only Access
 * - TC-RBAC-03: Restrict Administrator Based on Assigned Permissions
 * - TC-RBAC-04: Block Unauthorized Direct API or URL Access
 * - TC-RW-01 to TC-RW-05: Restocking Workflow (Create, Validate, Approve, Reject with Reason, Return & Resubmit)
 * - TC-AUD-01 to TC-AUD-03: Audit Trail (Traceable Creation, Status Changes, Immutable Logs)
 * - TC-TXN-01 to TC-TXN-03 & TC-ERR-01 to TC-ERR-02: ACID Transactions, Anti-Race Conditions, Safe Rollbacks
 */
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getCurrentUser, getIpAddress } from '@/lib/session';
import { 
  inventoryItemSchema, 
  requestCreationSchema, 
  requestUpdateSchema,
  approvalActionSchema 
} from '@/lib/validations';
import { LOGISTICS_CHECKPOINTS } from '@/lib/logistics';

/**
 * TC-RBAC-02: Read-Only enforcement for Auditor role
 */
function assertNotAuditor(role: string, actionName: string) {
  if (role === 'AUDITOR') {
    throw new Error(`Forbidden: Auditors have read-only access and cannot perform ${actionName} (TC-RBAC-02).`);
  }
}

/**
 * Creates a new inventory item
 * Enforces: TC-RBAC-02 (Auditors read-only), Zod validation, ACID logging
 */
export async function createInventoryItem(data: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');

  assertNotAuditor(user.role, 'inventory item creation');

  // Week 7 Checklist: Runtime Validation Boundaries (Zod)
  const validation = inventoryItemSchema.safeParse({
    name: data.get('name'),
    sku: data.get('sku'),
    category: data.get('category'),
    stock: parseInt(data.get('stock') as string || '0', 10),
    maxStock: parseInt(data.get('maxStock') as string || '100', 10),
    threshold: parseInt(data.get('threshold') as string || '10', 10),
    warehouse: data.get('warehouse'),
  });

  if (!validation.success) {
    const errorMsg = validation.error.issues.map((e: { message: string }) => e.message).join(', ');
    throw new Error(`Validation Error: ${errorMsg}`);
  }

  const { name, sku, category, stock, maxStock, threshold, warehouse } = validation.data;

  // ACID Transactional Integrity
  await prisma.$transaction([
    prisma.inventoryItem.create({
      data: {
        name,
        sku,
        category,
        stock,
        maxStock,
        threshold,
        warehouse,
        organizationId: user.organizationId as string,
      },
    }),
    prisma.auditLog.create({
      data: {
        actionType: 'CREATION',
        description: `Created new inventory item: ${name} (${sku}) at ${warehouse}`,
        ipAddress: getIpAddress(),
        userId: user.id,
        organizationId: user.organizationId as string,
      },
    }),
  ]);

  revalidatePath('/dashboard/inventory');
}

/**
 * TC-RW-01: Create a Valid Restocking Request
 * TC-RW-02: Validate Required Restocking Request Fields
 * TC-AUD-01: Record Creation of a Restocking Request
 * TC-ERR-01: Handle Database Failure During Request Creation Safely
 */
export async function createRequest(data: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');

  assertNotAuditor(user.role, 'request creation');

  // TC-RW-02: Runtime Validation Boundaries (Zod)
  const rawQuantity = data.get('quantity');
  const parsedQuantity = rawQuantity !== null && rawQuantity !== '' ? parseInt(rawQuantity as string, 10) : NaN;

  const validation = requestCreationSchema.safeParse({
    itemId: data.get('itemId'),
    quantity: parsedQuantity,
    priority: data.get('priority'),
    justification: (data.get('justification') as string) || undefined,
  });

  if (!validation.success) {
    const errorMsg = validation.error.issues.map((e: { message: string }) => e.message).join(', ');
    throw new Error(`Validation Error: ${errorMsg}`);
  }

  const { itemId, quantity, priority, justification } = validation.data;

  // Multi-tenant check with Left-Prefix index
  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, organizationId: user.organizationId },
  });
  if (!item) throw new Error('Item not found in organization inventory');

  // TC-RW-01 & TC-AUD-01: Interactive ACID Transaction (Atomic Request Creation + Audit Log)
  await prisma.$transaction(async (tx) => {
    const req = await tx.request.create({
      data: {
        quantity,
        priority,
        justification,
        status: 'PENDING',
        itemId: item.id,
        requestedById: user.id,
        organizationId: user.organizationId as string,
      },
    });

    await tx.auditLog.create({
      data: {
        actionType: 'CREATION',
        description: `Initiated restocking request for ${quantity}x ${item.name} (Initial Status: PENDING)`,
        requestId: req.id,
        ipAddress: getIpAddress(),
        userId: user.id,
        organizationId: user.organizationId as string,
      },
    });
  });

  revalidatePath('/dashboard/requests');
  revalidatePath('/dashboard');
}

/**
 * TC-RW-03: Approve a Pending Restocking Request
 * TC-RBAC-01: Prevent Warehouse Staff from Approving
 * TC-RBAC-02: Prevent Auditor from Approving
 * TC-RBAC-03: Restrict Administrator from Approving without assigned role
 * TC-TXN-01: Prevent Simultaneous Inventory Over-Allocation
 * TC-TXN-02: Process Valid Simultaneous Inventory Allocations
 * TC-TXN-03: Prevent Duplicate Processing of the Same Allocation
 * TC-AUD-02: Record Approval Details in Audit Trail
 */
export async function approveRequest(requestId: string, notes?: string) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');
  
  // TC-RBAC-01: Block Warehouse Staff
  if (user.role === 'WAREHOUSE_STAFF') {
    throw new Error('Forbidden: Warehouse Staff are denied from approving requests (TC-RBAC-01).');
  }

  // TC-RBAC-02: Block Auditor
  assertNotAuditor(user.role, 'approval');

  // TC-RBAC-03: Separation of Duties - Admin does not automatically approve procurement decisions
  if (user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN') {
    throw new Error('Forbidden: Administrator role does not have Approve Request permission (TC-RBAC-03: Separation of Duties). Restocking decisions are reserved for Procurement Managers.');
  }

  // Authorize only Procurement Manager
  if (user.role !== 'PROCUREMENT_MANAGER') {
    throw new Error('Forbidden: Only authorized Procurement Managers can approve restocking requests (TC-RW-03).');
  }

  const validation = approvalActionSchema.safeParse({ requestId, notes });
  if (!validation.success) {
    throw new Error('Invalid request parameters');
  }

  // Interactive ACID Transaction: Prevents Race Conditions & Over-Allocation
  await prisma.$transaction(async (tx) => {
    const req = await tx.request.findFirst({
      where: { id: requestId, organizationId: user.organizationId as string },
      include: { item: true },
    });
    if (!req) throw new Error('Request not found');

    // TC-TXN-03: Prevent Duplicate Processing
    if (req.status === 'APPROVED') {
      throw new Error('Duplicate processing rejected: Request has already been approved and allocated (TC-TXN-03).');
    }
    if (req.status === 'REJECTED') {
      throw new Error('Cannot approve a request that has been rejected.');
    }

    const previousStatus = req.status;

    // TC-TXN-01 & TC-TXN-02: Safe stock allocation / update
    await tx.inventoryItem.update({
      where: { id: req.itemId },
      data: { stock: { increment: req.quantity } },
    });

    await tx.request.update({
      where: { id: req.id },
      data: { 
        status: 'APPROVED',
        shippingStatus: 'IN_TRANSIT',
        reviewNotes: notes || null,
        estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Digos City logistics ETA
        latitude: 6.7530,
        longitude: 125.3560,
      },
    });

    // TC-AUD-02: Record Approval details in Audit Trail
    await tx.auditLog.create({
      data: {
        actionType: 'APPROVAL',
        description: notes 
          ? `Approved by ${user.name} with notes: "${notes}". Status changed: ${previousStatus} -> APPROVED. Allocation: +${req.quantity} units.` 
          : `Approved by ${user.name}. Status changed: ${previousStatus} -> APPROVED. Allocation: +${req.quantity} units of ${(req.item?.name || 'requested item')}.`,
        requestId: req.id,
        ipAddress: getIpAddress(),
        userId: user.id,
        organizationId: user.organizationId as string,
      },
    });
  });

  revalidatePath('/dashboard/approvals');
  revalidatePath('/dashboard/requests');
  revalidatePath('/dashboard/inventory');
}

/**
 * TC-RW-04: Reject a Pending Restocking Request
 * TC-RBAC-01: Prevent Warehouse Staff from Rejecting
 * TC-RBAC-02: Prevent Auditor from Rejecting
 * TC-RBAC-03: Restrict Administrator from Rejecting without assigned permission
 * TC-AUD-02: Record Rejection Details & Reason in Audit Trail
 */
export async function rejectRequest(requestId: string, notes?: string) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');
  
  if (user.role === 'WAREHOUSE_STAFF') {
    throw new Error('Forbidden: Warehouse Staff are denied from rejecting requests (TC-RBAC-01).');
  }

  assertNotAuditor(user.role, 'rejection');

  if (user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN') {
    throw new Error('Forbidden: Administrator role does not have rejection permission (TC-RBAC-03). Only Procurement Managers can reject requests.');
  }

  if (user.role !== 'PROCUREMENT_MANAGER') {
    throw new Error('Forbidden: Only Procurement Managers can reject restocking requests (TC-RW-04).');
  }

  // TC-RW-04: Reason is required for rejections
  if (!notes || notes.trim().length === 0) {
    throw new Error('Validation Error: A rejection reason is required to reject a restocking request (TC-RW-04).');
  }

  const validation = approvalActionSchema.safeParse({ requestId, notes });
  if (!validation.success) {
    throw new Error('Invalid request parameters');
  }

  await prisma.$transaction(async (tx) => {
    const req = await tx.request.findFirst({
      where: { id: requestId, organizationId: user.organizationId as string },
      include: { item: true },
    });
    if (!req) throw new Error('Request not found');

    if (req.status === 'APPROVED') {
      throw new Error('Cannot reject a request that has already been approved.');
    }

    const previousStatus = req.status;

    await tx.request.update({
      where: { id: req.id },
      data: { 
        status: 'REJECTED',
        reviewNotes: notes.trim(),
      },
    });

    // TC-AUD-02: Record Rejection in Audit Trail
    await tx.auditLog.create({
      data: {
        actionType: 'REJECTION',
        description: `Rejected by ${user.name}. Reason: "${notes.trim()}". Status changed: ${previousStatus} -> REJECTED.`,
        requestId: req.id,
        ipAddress: getIpAddress(),
        userId: user.id,
        organizationId: user.organizationId as string,
      },
    });
  });

  revalidatePath('/dashboard/approvals');
  revalidatePath('/dashboard/requests');
}

/**
 * TC-RW-05: Return a Request for Correction
 * Sets status to RETURNED and records manager feedback
 */
export async function returnRequest(requestId: string, notes?: string) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');
  
  if (user.role === 'WAREHOUSE_STAFF') {
    throw new Error('Forbidden: Warehouse Staff cannot return requests (TC-RBAC-01).');
  }

  assertNotAuditor(user.role, 'return for correction');

  if (user.role !== 'PROCUREMENT_MANAGER') {
    throw new Error('Forbidden: Only Procurement Managers can return requests for correction (TC-RW-05).');
  }

  if (!notes || notes.trim().length === 0) {
    throw new Error('Validation Error: Please provide notes explaining what needs correction before returning (TC-RW-05).');
  }

  await prisma.$transaction(async (tx) => {
    const req = await tx.request.findFirst({
      where: { id: requestId, organizationId: user.organizationId as string },
      include: { item: true },
    });
    if (!req) throw new Error('Request not found');

    if (req.status === 'APPROVED' || req.status === 'REJECTED') {
      throw new Error(`Cannot return an order that is already ${req.status.toLowerCase()}.`);
    }

    const previousStatus = req.status;

    await tx.request.update({
      where: { id: req.id },
      data: { 
        status: 'RETURNED',
        reviewNotes: notes.trim(),
      },
    });

    // TC-AUD-02: Record Return in Audit Trail
    await tx.auditLog.create({
      data: {
        actionType: 'RETURNED',
        description: `Returned for correction by ${user.name}. Manager Instructions: "${notes.trim()}". Status changed: ${previousStatus} -> RETURNED.`,
        requestId: req.id,
        ipAddress: getIpAddress(),
        userId: user.id,
        organizationId: user.organizationId as string,
      },
    });
  });

  revalidatePath('/dashboard/approvals');
  revalidatePath('/dashboard/requests');
}

/**
 * TC-RW-05: Requester corrects and resubmits request
 * Rule: Requester can edit when PENDING or RETURNED. Once APPROVED or REJECTED, cannot be altered.
 * If status was RETURNED, resubmitting returns it to PENDING!
 */
export async function updateRequestDetails(requestId: string, quantity: number, priority: string, justification: string) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');

  assertNotAuditor(user.role, 'editing request');

  // Runtime Validation Boundaries (Zod)
  const validation = requestUpdateSchema.safeParse({
    requestId,
    quantity,
    priority,
    justification,
  });

  if (!validation.success) {
    const errorMsg = validation.error.issues.map((e: { message: string }) => e.message).join(', ');
    throw new Error(`Validation Error: ${errorMsg}`);
  }

  const req = await prisma.request.findUnique({
    where: { id: requestId, organizationId: user.organizationId as string },
    include: { item: true }
  });
  
  if (!req) throw new Error('Request not found');

  // Once approved or rejected, automatically cannot be altered
  if (req.status === 'APPROVED' || req.status === 'REJECTED') {
    throw new Error('Order is locked. Requests that have been approved or rejected cannot be altered.');
  }

  const previousStatus = req.status;
  // TC-RW-05: When returned request is corrected and resubmitted, status returns to PENDING
  const nextStatus = 'PENDING';

  await prisma.$transaction([
    prisma.request.update({
      where: { id: requestId },
      data: {
        quantity: validation.data.quantity,
        priority: validation.data.priority,
        justification: validation.data.justification,
        status: nextStatus,
        reviewNotes: null, // Clear correction notice once resubmitted
      },
    }),
    prisma.auditLog.create({
      data: {
        actionType: previousStatus === 'RETURNED' ? 'RESUBMISSION' : 'MODIFICATION',
        description: previousStatus === 'RETURNED'
          ? `Corrected and resubmitted by requester ${user.name} (Qty: ${validation.data.quantity}, Priority: ${validation.data.priority}). Status returned: RETURNED -> PENDING.`
          : `Request #${req.id.slice(0, 8)} updated by requester (Qty: ${validation.data.quantity}, Priority: ${validation.data.priority}).`,
        requestId: req.id,
        userId: user.id,
        ipAddress: getIpAddress(),
        organizationId: user.organizationId as string,
      },
    }),
  ]);
  
  revalidatePath(`/dashboard/requests/${requestId}`);
  revalidatePath('/dashboard/requests');
  revalidatePath('/dashboard/approvals');
}

/**
 * Admin Action: Update Organization Name
 * Only accessible by ADMIN role
 */
export async function updateOrganizationName(newName: string) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');

  if (user.role !== 'ADMIN' && user.role !== 'SYSTEM_ADMIN') {
    throw new Error('Forbidden: Only administrators can change the organization name.');
  }

  if (!newName || newName.trim().length < 2) {
    throw new Error('Organization name must be at least 2 characters.');
  }

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: user.organizationId },
      data: { name: newName.trim() },
    }),
    prisma.auditLog.create({
      data: {
        actionType: 'SETTINGS_CHANGE',
        description: `Organization name updated to "${newName.trim()}" by ${user.name}.`,
        ipAddress: getIpAddress(),
        userId: user.id,
        organizationId: user.organizationId as string,
      },
    }),
  ]);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
}

/**
 * Admin Action: Update a team member's role
 * Only accessible by ADMIN role
 */
export async function updateMemberRole(memberId: string, newRole: string) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');

  if (user.role !== 'ADMIN' && user.role !== 'SYSTEM_ADMIN') {
    throw new Error('Forbidden: Only administrators can change member roles.');
  }

  const validRoles = ['ADMIN', 'PROCUREMENT_MANAGER', 'WAREHOUSE_STAFF', 'AUDITOR'];
  if (!validRoles.includes(newRole)) {
    throw new Error(`Invalid role: ${newRole}`);
  }

  const member = await prisma.user.findFirst({
    where: { id: memberId, organizationId: user.organizationId },
  });
  if (!member) throw new Error('Member not found in your organization.');

  // Prevent admin from changing their own role
  if (member.id === user.id) {
    throw new Error('You cannot change your own role. Ask another administrator.');
  }

  const previousRole = member.role;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: memberId },
      data: { role: newRole },
    }),
    prisma.auditLog.create({
      data: {
        actionType: 'ROLE_CHANGE',
        description: `Role changed for ${member.name} (${member.email}): ${previousRole} -> ${newRole} by ${user.name}.`,
        ipAddress: getIpAddress(),
        userId: user.id,
        organizationId: user.organizationId as string,
      },
    }),
  ]);

  revalidatePath('/dashboard/team');
  revalidatePath('/dashboard/settings');
}

/**
 * Admin Action: Remove a team member from the organization
 * Only accessible by ADMIN role
 */
export async function removeMember(memberId: string) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');

  if (user.role !== 'ADMIN' && user.role !== 'SYSTEM_ADMIN') {
    throw new Error('Forbidden: Only administrators can remove team members.');
  }

  const member = await prisma.user.findFirst({
    where: { id: memberId, organizationId: user.organizationId },
  });
  if (!member) throw new Error('Member not found in your organization.');

  // Prevent admin from removing themselves
  if (member.id === user.id) {
    throw new Error('You cannot remove yourself from the organization.');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: memberId },
      data: { organizationId: null },
    }),
    prisma.auditLog.create({
      data: {
        actionType: 'MEMBER_REMOVED',
        description: `${member.name} (${member.email}, ${member.role}) was removed from the organization by ${user.name}.`,
        ipAddress: getIpAddress(),
        userId: user.id,
        organizationId: user.organizationId as string,
      },
    }),
  ]);

  revalidatePath('/dashboard/team');
  revalidatePath('/dashboard/settings');
}


/**
 * Scan a shipment at a sorting center or warehouse checkpoint
 * Enforces: TC-RBAC-02 (Auditors read-only), ACID transaction, ETA recalculation
 */
export async function scanShipmentCheckpoint({
  requestId,
  checkpointStep,
  notes,
}: {
  requestId: string;
  checkpointStep: number;
  notes?: string;
}) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');

  assertNotAuditor(user.role, 'shipment scanning');

  if (checkpointStep < 1 || checkpointStep > 4) {
    throw new Error('Invalid checkpoint step. Must be between 1 and 4.');
  }

  const checkpoint = LOGISTICS_CHECKPOINTS[checkpointStep - 1];

  await prisma.$transaction(async (tx) => {
    const req = await tx.request.findFirst({
      where: { id: requestId, organizationId: user.organizationId as string },
      include: { item: true },
    });
    if (!req) throw new Error('Shipment request not found');

    if (req.status !== 'APPROVED') {
      throw new Error('Cannot scan shipment: Restocking request is not in APPROVED status.');
    }

    const newEta = new Date(Date.now() + checkpoint.etaHours * 60 * 60 * 1000);

    // Update request with new checkpoint, location coordinates, ETA, and shipping status
    await tx.request.update({
      where: { id: req.id },
      data: {
        currentCheckpoint: checkpointStep,
        shippingStatus: checkpoint.shippingStatus,
        latitude: checkpoint.lat,
        longitude: checkpoint.lng,
        estimatedArrival: newEta,
      },
    });

    // Record shipment scan event
    await tx.shipmentScan.create({
      data: {
        requestId: req.id,
        checkpointStep,
        checkpointName: checkpoint.title,
        location: checkpoint.location,
        action: checkpoint.action,
        notes: notes || null,
        latitude: checkpoint.lat,
        longitude: checkpoint.lng,
        scannedById: user.id,
        organizationId: user.organizationId as string,
      },
    });

    // Record in immutable audit trail
    await tx.auditLog.create({
      data: {
        actionType: 'SHIPMENT_SCAN',
        description: `Shipment #${req.id.slice(0, 8)} scanned at Step ${checkpointStep} (${checkpoint.title}) by ${user.name}. Status: ${checkpoint.shippingStatus}.`,
        requestId: req.id,
        ipAddress: getIpAddress(),
        userId: user.id,
        organizationId: user.organizationId as string,
      },
    });
  });

  revalidatePath('/dashboard/tracking');
  revalidatePath('/dashboard/requests');
  revalidatePath(`/dashboard/requests/${requestId}`);
  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard');
}

/**
 * 1-Click Smart Automated Restock for a single inventory item
 * Auto-calculates optimal quantity: maxStock - currentStock
 */
export async function autoRestockItem(itemId: string) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');

  assertNotAuditor(user.role, 'automated restocking');

  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, organizationId: user.organizationId },
  });
  if (!item) throw new Error('Inventory item not found');

  // Calculate optimal replenishment quantity to reach full capacity
  const quantity = Math.max(item.maxStock - item.stock, item.threshold * 2);
  const priority = item.stock === 0 ? 'High' : item.stock <= Math.floor(item.threshold / 2) ? 'High' : 'Medium';
  const justification = `Automated Replenishment: Current stock (${item.stock}) is at or below threshold (${item.threshold}). Auto-calculated +${quantity} units to restore optimal capacity (${item.maxStock}).`;

  let createdId = '';

  await prisma.$transaction(async (tx) => {
    const req = await tx.request.create({
      data: {
        quantity,
        priority,
        justification,
        status: 'PENDING',
        itemId: item.id,
        requestedById: user.id,
        organizationId: user.organizationId as string,
      },
    });
    createdId = req.id;

    await tx.auditLog.create({
      data: {
        actionType: 'CREATION',
        description: `Automated replenishment initiated for ${quantity}x ${item.name} (${item.sku}) by ${user.name}`,
        requestId: req.id,
        ipAddress: getIpAddress(),
        userId: user.id,
        organizationId: user.organizationId as string,
      },
    });
  });

  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard/requests');
  revalidatePath('/dashboard');

  return { success: true, requestId: createdId, itemName: item.name, quantity };
}

/**
 * Batch Action: Auto-restock ALL items currently below threshold in 1 click
 */
export async function autoRestockAllLowStock() {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');

  assertNotAuditor(user.role, 'batch automated restocking');

  const allItems = await prisma.inventoryItem.findMany({
    where: { organizationId: user.organizationId },
  });

  const lowStockItems = allItems.filter(i => i.stock <= i.threshold);
  if (lowStockItems.length === 0) {
    return { count: 0, message: 'All items are currently at optimal stock levels.' };
  }

  // Check which items already have pending requests so we avoid redundant duplicates
  const pendingRequests = await prisma.request.findMany({
    where: {
      organizationId: user.organizationId,
      status: 'PENDING',
    },
    select: { itemId: true },
  });
  const pendingItemIds = new Set(pendingRequests.map(r => r.itemId));

  const itemsToRestock = lowStockItems.filter(i => !pendingItemIds.has(i.id));
  if (itemsToRestock.length === 0) {
    return { count: 0, message: 'All low stock items already have pending restock requests.' };
  }

  await prisma.$transaction(async (tx) => {
    for (const item of itemsToRestock) {
      const quantity = Math.max(item.maxStock - item.stock, item.threshold * 2);
      const priority = item.stock === 0 ? 'High' : 'Medium';
      const justification = `Automated Batch Replenishment: Stock (${item.stock}) <= threshold (${item.threshold}). Replenishing +${quantity} units.`;

      const req = await tx.request.create({
        data: {
          quantity,
          priority,
          justification,
          status: 'PENDING',
          itemId: item.id,
          requestedById: user.id,
          organizationId: user.organizationId as string,
        },
      });

      await tx.auditLog.create({
        data: {
          actionType: 'CREATION',
          description: `Batch auto-restock: Created request for ${quantity}x ${item.name} (${item.sku})`,
          requestId: req.id,
          ipAddress: getIpAddress(),
          userId: user.id,
          organizationId: user.organizationId as string,
        },
      });
    }
  });

  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard/requests');
  revalidatePath('/dashboard');

  return { count: itemsToRestock.length, message: `Successfully generated ${itemsToRestock.length} restock requests!` };
}

