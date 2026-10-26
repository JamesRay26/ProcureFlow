import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import InventoryClient, { InventoryItemData } from './InventoryClient';

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (!user.organizationId) redirect('/dashboard');

  const [dbItems, pendingRequests] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: 'asc' }
    }),
    prisma.request.findMany({
      where: { organizationId: user.organizationId, status: 'PENDING' },
      select: { id: true, itemId: true, quantity: true, priority: true }
    })
  ]);

  const pendingMap = new Map<string, { id: string; quantity: number; priority: string }>();
  for (const r of pendingRequests) {
    pendingMap.set(r.itemId, { id: r.id, quantity: r.quantity, priority: r.priority });
  }

  const items: InventoryItemData[] = dbItems.map(item => {
    let status = 'In Stock';
    if (item.stock === 0) status = 'Out of Stock';
    else if (item.stock <= item.threshold) status = 'Low Stock';
    
    const pending = pendingMap.get(item.id);

    return {
      id: item.sku,
      dbId: item.id,
      name: item.name,
      category: item.category,
      stock: item.stock,
      stockMax: item.maxStock,
      threshold: item.threshold,
      warehouse: item.warehouse,
      date: 'N/A',
      status,
      pendingRequest: pending ? { id: pending.id, quantity: pending.quantity, priority: pending.priority } : null,
    };
  });

  return <InventoryClient initialItems={items} userRole={user.role} />;
}
