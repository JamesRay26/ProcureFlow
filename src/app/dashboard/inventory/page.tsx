import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import InventoryClient, { InventoryItemData } from './InventoryClient';

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (!user.organizationId) redirect('/dashboard');

  const dbItems = await prisma.inventoryItem.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: 'asc' }
  });

  const items: InventoryItemData[] = dbItems.map(item => {
    let status = 'In Stock';
    if (item.stock === 0) status = 'Out of Stock';
    else if (item.stock <= item.threshold) status = 'Low Stock';
    
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
      status
    };
  });

  return <InventoryClient initialItems={items} userRole={user.role} />;
}
