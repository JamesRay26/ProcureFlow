'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser, getIpAddress } from '@/lib/session';

export async function createInventoryItem(data: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');

  const name = data.get('name') as string;
  const sku = data.get('sku') as string;
  const category = data.get('category') as string;
  const stock = parseInt(data.get('stock') as string) || 0;
  const maxStock = parseInt(data.get('maxStock') as string) || 100;
  const threshold = parseInt(data.get('threshold') as string) || 10;
  const warehouse = data.get('warehouse') as string;

  await prisma.inventoryItem.create({
    data: {
      name, sku, category, stock, maxStock, threshold, warehouse,
      organizationId: user.organizationId
    }
  });

  await prisma.auditLog.create({
    data: {
      actionType: 'CREATION',
      description: `Created new inventory item: ${name} (${sku})`,
      ipAddress: getIpAddress(),
      userId: user.id,
      organizationId: user.organizationId
    }
  });

  revalidatePath('/dashboard/inventory');
}

export async function createRequest(data: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');

  const itemId = data.get('itemId') as string;
  const quantity = parseInt(data.get('quantity') as string) || 0;
  const priority = data.get('priority') as string;
  const justification = data.get('justification') as string;

  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, organizationId: user.organizationId }
  });
  if (!item) throw new Error('Item not found');

  const req = await prisma.request.create({
    data: {
      quantity, priority, justification,
      itemId: item.id,
      requestedById: user.id,
      organizationId: user.organizationId
    }
  });

  await prisma.auditLog.create({
    data: {
      actionType: 'CREATION',
      description: `Initiated restocking request for ${item.name}`,
      requestId: req.id,
      ipAddress: getIpAddress(),
      userId: user.id,
      organizationId: user.organizationId
    }
  });

  revalidatePath('/dashboard/requests');
  revalidatePath('/dashboard');
}

export async function approveRequest(requestId: string, notes?: string) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');
  
  if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'ADMIN' && user.role !== 'PROCUREMENT_MANAGER') {
    throw new Error('Forbidden: Only Admins and Managers can approve requests');
  }

  const req = await prisma.request.findFirst({
    where: { id: requestId, organizationId: user.organizationId },
    include: { item: true }
  });
  if (!req) throw new Error('Request not found');

  // Update Request and Inventory Stock transactionally
  await prisma.$transaction([
    prisma.request.update({
      where: { id: req.id },
      data: { status: 'APPROVED' }
    }),
    prisma.inventoryItem.update({
      where: { id: req.itemId },
      data: { stock: { increment: req.quantity } }
    }),
    prisma.auditLog.create({
      data: {
        actionType: 'APPROVAL',
        description: notes ? `Approved with notes: ${notes}` : `Approved request for ${req.quantity} units of ${req.item.name}`,
        requestId: req.id,
        ipAddress: getIpAddress(),
        userId: user.id,
        organizationId: user.organizationId
      }
    })
  ]);

  revalidatePath('/dashboard/approvals');
  revalidatePath('/dashboard/requests');
  revalidatePath('/dashboard/inventory');
}

export async function rejectRequest(requestId: string, notes?: string) {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) throw new Error('Unauthorized');
  
  if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'ADMIN' && user.role !== 'PROCUREMENT_MANAGER') {
    throw new Error('Forbidden: Only Admins and Managers can reject requests');
  }

  const req = await prisma.request.findFirst({
    where: { id: requestId, organizationId: user.organizationId },
    include: { item: true }
  });
  if (!req) throw new Error('Request not found');

  await prisma.$transaction([
    prisma.request.update({
      where: { id: req.id },
      data: { status: 'REJECTED' }
    }),
    prisma.auditLog.create({
      data: {
        actionType: 'REJECTION',
        description: notes ? `Rejected with notes: ${notes}` : `Rejected request for ${req.item.name}`,
        requestId: req.id,
        ipAddress: getIpAddress(),
        userId: user.id,
        organizationId: user.organizationId
      }
    })
  ]);

  revalidatePath('/dashboard/approvals');
  revalidatePath('/dashboard/requests');
}
