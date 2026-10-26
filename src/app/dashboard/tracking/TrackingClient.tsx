'use client';

import { useState, useTransition, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  Truck, 
  ScanBarcode, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Search, 
  ArrowRight, 
  Building2, 
  Shield, 
  Package, 
  Sparkles,
  Radio,
  ExternalLink
} from 'lucide-react';
import { scanShipmentCheckpoint } from '@/app/actions';
import { LOGISTICS_CHECKPOINTS } from '@/lib/logistics';

// Dynamically import TrackingMapClient to avoid SSR leaflet window errors
const TrackingMapClient = dynamic(() => import('@/app/_components/TrackingMapClient'), { 
  ssr: false, 
  loading: () => (
    <div className="h-96 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-sm font-bold">
      Loading interactive logistics route map...
    </div>
  )
});

export interface ShipmentItem {
  id: string;
  trackingCode: string;
  sku: string;
  name: string;
  quantity: number;
  currentStock: number;
  threshold: number;
  warehouse: string;
  shippingStatus: string;
  currentCheckpoint: number;
  estimatedArrival: string | null;
  createdAt: string;
  requestedBy: string;
  latitude: number;
  longitude: number;
  scans: Array<{
    id: string;
    checkpointStep: number;
    checkpointName: string;
    location: string;
    action: string;
    notes: string | null;
    scannedAt: string;
    scannedBy: string;
  }>;
}

export interface ScanRecord {
  id: string;
  requestId: string;
  trackingCode: string;
  itemName: string;
  checkpointStep: number;
  checkpointName: string;
  location: string;
  action: string;
  notes: string | null;
  scannedAt: string;
  scannedBy: string;
}

interface TrackingClientProps {
  initialShipments: ShipmentItem[];
  recentScans: ScanRecord[];
  userRole: string;
  userName: string;
}

export default function TrackingClient({
  initialShipments,
  recentScans: initialRecentScans,
  userRole,
  userName,
}: TrackingClientProps) {
  const [shipments, setShipments] = useState<ShipmentItem[]>(initialShipments);
  const [scans, setScans] = useState<ScanRecord[]>(initialRecentScans);
  const [selectedStation, setSelectedStation] = useState<number>(2); // Default: Digos North Sorting Hub
  const [barcodeInput, setBarcodeInput] = useState('');
  const [activeShipmentId, setActiveShipmentId] = useState<string>(
    initialShipments.length > 0 ? initialShipments[0].id : ''
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAuditor = userRole === 'AUDITOR';

  // Play realistic scanner beep tone via Web Audio API
  const playScanBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz beep
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch {
      // AudioContext unavailable in environment
    }
  };

  const handleScan = async (targetIdOrSku: string, targetStep?: number) => {
    if (isAuditor) {
      alert('Auditors have read-only access and are restricted from scanning shipments (TC-RBAC-02).');
      return;
    }

    const cleanInput = targetIdOrSku.trim().toUpperCase();
    if (!cleanInput) return;

    // Match by Request ID, Tracking Code, or SKU
    const matched = shipments.find(
      s => s.id === cleanInput || 
           s.trackingCode.toUpperCase() === cleanInput || 
           s.sku.toUpperCase() === cleanInput ||
           s.id.slice(0, 8).toUpperCase() === cleanInput
    );

    if (!matched) {
      setScanFeedback({
        message: `No active approved shipment found matching "${cleanInput}".`,
        type: 'error'
      });
      setTimeout(() => setScanFeedback(null), 3500);
      return;
    }

    const stepToSet = targetStep !== undefined ? targetStep : selectedStation;
    const checkpointInfo = LOGISTICS_CHECKPOINTS[stepToSet - 1];

    playScanBeep();
    setBarcodeInput('');

    startTransition(async () => {
      try {
        await scanShipmentCheckpoint({
          requestId: matched.id,
          checkpointStep: stepToSet,
          notes: `Scanned at ${checkpointInfo.title} by ${userName}`,
        });

        // Update local state for immediate reactive UI
        setShipments(prev => prev.map(s => {
          if (s.id === matched.id) {
            return {
              ...s,
              currentCheckpoint: stepToSet,
              shippingStatus: checkpointInfo.shippingStatus,
              latitude: checkpointInfo.lat,
              longitude: checkpointInfo.lng,
              estimatedArrival: new Date(Date.now() + checkpointInfo.etaHours * 3600 * 1000).toISOString(),
            };
          }
          return s;
        }));

        setScans(prev => [
          {
            id: `scan-${Date.now()}`,
            requestId: matched.id,
            trackingCode: matched.trackingCode,
            itemName: matched.name,
            checkpointStep: stepToSet,
            checkpointName: checkpointInfo.title,
            location: checkpointInfo.location,
            action: checkpointInfo.action,
            notes: `Scanned by ${userName}`,
            scannedAt: new Date().toISOString(),
            scannedBy: userName,
          },
          ...prev.slice(0, 9),
        ]);

        setActiveShipmentId(matched.id);
        setScanFeedback({
          message: `Scanned: ${matched.name} arrived at [${checkpointInfo.title}]! Route & ETA updated.`,
          type: 'success'
        });
      } catch (err: unknown) {
        setScanFeedback({
          message: err instanceof Error ? err.message : 'Scan failed',
          type: 'error'
        });
      } finally {
        setTimeout(() => setScanFeedback(null), 4000);
      }
    });
  };

  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      if (statusFilter !== 'ALL' && s.shippingStatus !== statusFilter) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return (
          s.trackingCode.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.sku.toLowerCase().includes(q) ||
          s.warehouse.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [shipments, statusFilter, searchFilter]);

  const selectedShipment = useMemo(() => {
    return shipments.find(s => s.id === activeShipmentId) || shipments[0];
  }, [shipments, activeShipmentId]);

  // Statistics
  const totalActive = shipments.length;
  const inTransitCount = shipments.filter(s => s.shippingStatus === 'IN_TRANSIT').length;
  const deliveredCount = shipments.filter(s => s.shippingStatus === 'DELIVERED').length;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-1 rounded-md">
              E-Commerce Logistics Network
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Logistics Tracking & Scanner
          </h2>
          <p className="text-slate-500 font-medium mt-1 dark:text-slate-400">
            Real-time checkpoint scanning, transit updates, and carrier GPS tracking across Digos City corridor.
          </p>
        </div>

        {isAuditor && (
          <span className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold shadow-sm">
            <Shield className="w-4 h-4" /> Auditor Read-Only (TC-RBAC-02)
          </span>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Shipments</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalActive}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">En Route In-Transit</p>
            <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{inTransitCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Delivered to Bay</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{deliveredCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Warehouse / Hub Scanner Terminal */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                Live Logistics Checkpoint Scanner
              </div>
              <h3 className="text-xl font-bold mt-1">Station Arrival & Sorting Terminal</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Scan parcels to instantly confirm hub arrival, recalculate ETA, and advance vehicle tracking.
              </p>
            </div>

            {/* Current Active Station Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Current Station:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
                {LOGISTICS_CHECKPOINTS.map((cp) => (
                  <button
                    key={cp.step}
                    type="button"
                    onClick={() => setSelectedStation(cp.step)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      selectedStation === cp.step
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    }`}
                  >
                    Step {cp.step}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scanner Input Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleScan(barcodeInput);
                  }
                }}
                disabled={isAuditor}
                placeholder={isAuditor ? "Scanning disabled for Auditor (Read-only)" : "Scan barcode or enter Tracking ID / SKU (e.g. PF-TRK-...)"}
                className="w-full pl-12 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              disabled={isPending || isAuditor || !barcodeInput.trim()}
              onClick={() => handleScan(barcodeInput)}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <ScanBarcode className="w-4 h-4" />
              {isPending ? 'Processing...' : 'Scan Arrival'}
            </button>
          </div>

          {/* Feedback banner */}
          {scanFeedback && (
            <div className={`mt-4 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              scanFeedback.type === 'success' 
                ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300' 
                : 'bg-red-950/80 border border-red-700 text-red-300'
            }`}>
              {scanFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : null}
              <span>{scanFeedback.message}</span>
            </div>
          )}

          {/* Selected Station Banner */}
          <div className="mt-4 pt-4 border-t border-slate-800/70 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div>
              <span className="font-semibold text-slate-300">Station {selectedStation}: </span>
              <span>{LOGISTICS_CHECKPOINTS[selectedStation - 1].title}</span>
              <span className="mx-2 text-slate-600">&bull;</span>
              <span className="text-slate-400">{LOGISTICS_CHECKPOINTS[selectedStation - 1].location}</span>
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              Hardware Barcode Scanners Supported (Auto-Enter)
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Shipments List & Live Route Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        
        {/* Left Column: Shipment Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            
            {/* Filters */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter by tracking # or item name..."
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                {['ALL', 'IN_TRANSIT', 'DELIVERED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      statusFilter === st 
                        ? 'bg-slate-900 dark:bg-slate-700 text-white' 
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {st === 'ALL' ? 'All Shipments' : st === 'IN_TRANSIT' ? 'In Transit' : 'Delivered'}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {filteredShipments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm font-medium">
                No shipments matching your filter.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredShipments.map((shipment) => {
                  const isSelected = shipment.id === activeShipmentId;
                  const currentCheckpointData = LOGISTICS_CHECKPOINTS[(shipment.currentCheckpoint || 1) - 1];

                  return (
                    <div
                      key={shipment.id}
                      onClick={() => setActiveShipmentId(shipment.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-sm ring-1 ring-blue-500/20' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                            {shipment.trackingCode}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                            {shipment.name}
                          </h4>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                          shipment.shippingStatus === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                        }`}>
                          {shipment.shippingStatus}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-3">
                        <p><strong>SKU:</strong> {shipment.sku} &bull; <strong>Qty:</strong> {shipment.quantity} units</p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">Current: {currentCheckpointData.title}</span>
                        </p>
                      </div>

                      {/* Quick scan button */}
                      {!isAuditor && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            Stop {shipment.currentCheckpoint} of 4
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextStep = Math.min(4, (shipment.currentCheckpoint || 1) + 1);
                              handleScan(shipment.id, nextStep);
                            }}
                            disabled={shipment.currentCheckpoint >= 4 || isPending}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1"
                          >
                            <ScanBarcode className="w-3.5 h-3.5" />
                            {shipment.currentCheckpoint >= 4 ? 'Fully Delivered' : `Scan Stop ${(shipment.currentCheckpoint || 1) + 1}`}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Route & Interactive Checkpoint Visualizer (7 cols) */}
        <div className="lg:col-span-7">
          {selectedShipment ? (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      Active Manifest #{selectedShipment.trackingCode}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedShipment.name}
                    </h3>
                  </div>
                  <Link
                    href={`/dashboard/requests/${selectedShipment.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                  >
                    View Request Details <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Render the Leaflet route map */}
                <TrackingMapClient
                  requestId={selectedShipment.id}
                  itemName={selectedShipment.name}
                  itemSku={selectedShipment.sku}
                  incomingQty={selectedShipment.quantity}
                  currentStock={selectedShipment.currentStock}
                  threshold={selectedShipment.threshold}
                  warehouseName={selectedShipment.warehouse}
                  isApproved={true}
                  initialCheckpoint={selectedShipment.currentCheckpoint || 1}
                  userRole={userRole}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-400">
              <Truck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="font-bold text-slate-700 dark:text-slate-300">Select a shipment to inspect live route and transit timeline.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Scan History Stream */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Checkpoint Scan Stream</h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">Live Audit-Verified</span>
        </div>

        {scans.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No scans recorded yet. Scan a parcel above to log station events.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400">
                  <th className="px-5 py-3">Tracking Code</th>
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3">Checkpoint / Hub</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Operator</th>
                  <th className="px-5 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                    <td className="px-5 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {scan.trackingCode}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {scan.itemName}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {scan.checkpointName}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                        {scan.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {scan.scannedBy}
                    </td>
                    <td className="px-5 py-3 text-slate-400 font-medium">
                      {new Date(scan.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
