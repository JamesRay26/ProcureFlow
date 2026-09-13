import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import ApprovalsClient from './ApprovalsClient';

export default async function ApprovalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (!user.organizationId) redirect('/dashboard');

  const pendingRequests = await prisma.request.findMany({
    where: { 
      organizationId: user.organizationId,
      status: 'PENDING'
    },
    include: { item: true, requestedBy: true },
    orderBy: { createdAt: 'desc' }
  });

  const formattedRequests = pendingRequests.map(req => {
    const timeDiff = Math.floor((new Date().getTime() - new Date(req.createdAt).getTime()) / (1000 * 3600));
    return {
      id: req.id,
      shortId: req.id.slice(0, 8).toUpperCase(),
      title: req.item.name,
      requester: req.requestedBy.name,
      time: timeDiff < 1 ? 'Just now' : `${timeDiff} hours ago`,
      priority: req.priority,
      status: req.status,
      price: `$${(req.item.maxStock * 10).toLocaleString()}`, // Mocking cost logic for now
      desc: req.item.category,
      qty: req.quantity,
      date: new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      category: req.item.category,
      requesterRole: req.requestedBy.role,
      email: req.requestedBy.email,
      justification: req.justification || 'No justification provided.',
      initials: req.requestedBy.name.substring(0, 2).toUpperCase(),
      bufferAlloc: `${req.item.stock} of ${req.item.maxStock} safe buffer units`,
      bufferPct: `${Math.min(100, Math.max(0, (req.item.stock / req.item.maxStock) * 100))}%`
    };
  });

  return <ApprovalsClient requests={formattedRequests} />;
}
