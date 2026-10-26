import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import TrackingClient from './TrackingClient';

export default async function TrackingPage() {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) redirect('/');

  // Fetch approved requests (active logistics shipments)
  const approvedRequests = await prisma.request.findMany({
    where: { 
      organizationId: user.organizationId,
      status: 'APPROVED',
    },
    include: {
      item: true,
      requestedBy: true,
      scans: {
        include: { scannedBy: true },
        orderBy: { scannedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch recent scan history across all shipments in this organization
  const recentScans = await prisma.shipmentScan.findMany({
    where: { organizationId: user.organizationId },
    include: {
      request: {
        include: { item: true },
      },
      scannedBy: true,
    },
    orderBy: { scannedAt: 'desc' },
    take: 10,
  });

  const formattedShipments = approvedRequests.map((req) => ({
    id: req.id,
    trackingCode: `PF-TRK-${req.id.slice(0, 8).toUpperCase()}`,
    sku: req.item.sku,
    name: req.item.name,
    quantity: req.quantity,
    currentStock: req.item.stock,
    threshold: req.item.threshold,
    warehouse: req.item.warehouse,
    shippingStatus: req.shippingStatus || 'IN_TRANSIT',
    currentCheckpoint: req.currentCheckpoint || 1,
    estimatedArrival: req.estimatedArrival ? req.estimatedArrival.toISOString() : null,
    createdAt: req.createdAt.toISOString(),
    requestedBy: req.requestedBy.name,
    latitude: req.latitude || 6.8320,
    longitude: req.longitude || 125.4150,
    scans: req.scans.map((s) => ({
      id: s.id,
      checkpointStep: s.checkpointStep,
      checkpointName: s.checkpointName,
      location: s.location,
      action: s.action,
      notes: s.notes,
      scannedAt: s.scannedAt.toISOString(),
      scannedBy: s.scannedBy.name,
    })),
  }));

  const formattedRecentScans = recentScans.map((s) => ({
    id: s.id,
    requestId: s.requestId,
    trackingCode: `PF-TRK-${s.requestId.slice(0, 8).toUpperCase()}`,
    itemName: s.request.item.name,
    checkpointStep: s.checkpointStep,
    checkpointName: s.checkpointName,
    location: s.location,
    action: s.action,
    notes: s.notes,
    scannedAt: s.scannedAt.toISOString(),
    scannedBy: s.scannedBy.name,
  }));

  return (
    <TrackingClient 
      initialShipments={formattedShipments} 
      recentScans={formattedRecentScans}
      userRole={user.role}
      userName={user.name}
    />
  );
}
