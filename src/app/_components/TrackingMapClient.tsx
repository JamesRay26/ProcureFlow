'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw, 
  Package, 
  TrendingUp, 
  Building2,
  Navigation,
  ScanBarcode,
  ArrowRight,
  ShieldAlert,
  Radio,
  Zap
} from 'lucide-react';
import { scanShipmentCheckpoint } from '@/app/actions';

export interface CheckpointData {
  step: number;
  title: string;
  location: string;
  lat: number;
  lng: number;
  time: string;
  description: string;
}

interface TrackingMapClientProps {
  requestId: string;
  itemName: string;
  itemSku: string;
  incomingQty: number;
  currentStock: number;
  threshold: number;
  warehouseName: string;
  isApproved: boolean;
  initialCheckpoint?: number;
  userRole?: string;
}

// Custom Leaflet Icons using SVG HTML (No emojis, sleek enterprise markers)
const createCustomIcon = (svgPath: string, bgClass: string, isPulse: boolean = false) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${isPulse ? '<div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background-color: rgba(37, 99, 235, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
        <div style="width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 2px solid white; color: white; ${bgClass}">
          ${svgPath}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
};

const warehouseIcon = createCustomIcon(
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>', 
  'background: #3b82f6;'
);
const hubIcon = createCustomIcon(
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>', 
  'background: #6366f1;'
);
const destinationIcon = createCustomIcon(
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>', 
  'background: #10b981;'
);
const truckIcon = createCustomIcon(
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>', 
  'background: #2563eb;', 
  true
);

// Component to smoothly pan the map when current step changes
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

export default function TrackingMapClient({
  requestId,
  itemName,
  itemSku,
  incomingQty,
  currentStock,
  threshold,
  warehouseName,
  isApproved,
  initialCheckpoint = 3,
  userRole = 'WAREHOUSE_STAFF',
}: TrackingMapClientProps) {
  // 4 E-Commerce Route Checkpoints (Digos City Logistics Route)
  const checkpoints: CheckpointData[] = [
    {
      step: 1,
      title: 'Dispatched from Regional Depot',
      location: 'Santa Cruz Logistics Hub (Davao-Digos Highway)',
      lat: 6.8320,
      lng: 125.4150,
      time: '08:30 AM',
      description: 'Shipment verified and dispatched via Davao-Digos South Corridor.'
    },
    {
      step: 2,
      title: 'Arrived at Digos North Sorting Hub',
      location: 'Digos City Distribution Center (Rizal Ave Ext)',
      lat: 6.7680,
      lng: 125.3720,
      time: '11:15 AM',
      description: 'Scanned and sorted into Digos Central District delivery manifest.'
    },
    {
      step: 3,
      title: 'En Route via Quezon Avenue Corridor',
      location: 'Quezon Avenue, Digos City Downtown',
      lat: 6.7530,
      lng: 125.3560,
      time: '01:45 PM',
      description: 'Carrier fleet #PF-402 en route through Digos City. Speed: 42 km/h.'
    },
    {
      step: 4,
      title: 'Destination Receiving Bay',
      location: `${warehouseName || 'Digos City Central Warehouse'} (Bay 3)`,
      lat: 6.7420,
      lng: 125.3450,
      time: '03:30 PM (Estimated)',
      description: 'Shipment delivered to Digos City receiving bay, verified, and added to inventory.'
    }
  ];

  const trackingCode = `PF-TRK-${(requestId || '88392104').slice(0, 8).toUpperCase()}`;
  const [currentStep, setCurrentStep] = useState(initialCheckpoint);
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [scanStatus, setScanStatus] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  // Sync current checkpoint if initialCheckpoint prop changes from parent
  useEffect(() => {
    setCurrentStep(initialCheckpoint);
  }, [initialCheckpoint]);

  const isAuditor = userRole === 'AUDITOR';

  // Play realistic scanner beep tone via Web Audio API (Zero external packages)
  const playScanBeep = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, audioCtx.currentTime); // 950Hz crisp confirmation chirp
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext unavailable or restricted in browser environment
    }
  };

  // Perform barcode scan simulation to move to the next checkpoint location
  const executeBarcodeScan = async (forcedNextStep?: number) => {
    if (isAuditor) {
      setScanStatus({
        message: 'Auditor Read-Only: Scanning restricted in accordance with TC-RBAC-02.',
        type: 'error'
      });
      return;
    }

    const nextStep = forcedNextStep !== undefined 
      ? forcedNextStep 
      : Math.min(currentStep + 1, 4);

    setIsScanning(true);
    playScanBeep();

    const targetCheckpoint = checkpoints[nextStep - 1];

    // Trigger visual laser sweep and then advance coordinates smoothly
    setTimeout(async () => {
      setCurrentStep(nextStep);
      setIsScanning(false);
      setScanStatus({
        message: `WAYBILL VERIFIED: Scanned at ${targetCheckpoint.title} (${targetCheckpoint.location}). Map marker updated.`,
        type: 'success'
      });

      // Synchronize with database if approved
      if (requestId && isApproved) {
        try {
          await scanShipmentCheckpoint({
            requestId,
            checkpointStep: nextStep,
            notes: `Optical barcode scan at ${targetCheckpoint.title}`,
          });
        } catch {
          // Graceful fallback if offline or mock
        }
      }
    }, 600);
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = barcodeQuery.trim().toUpperCase();
    if (!clean) return;

    if (
      clean === trackingCode ||
      clean === requestId.toUpperCase() ||
      clean === itemSku.toUpperCase() ||
      clean.includes(requestId.slice(0, 6).toUpperCase())
    ) {
      setBarcodeQuery('');
      if (currentStep >= 4) {
        setScanStatus({
          message: 'Package already received at Destination Bay 3. Reset route to re-simulate.',
          type: 'info'
        });
      } else {
        executeBarcodeScan();
      }
    } else {
      setBarcodeQuery('');
      executeBarcodeScan();
    }
  };

  const handleResetRoute = async () => {
    setIsSimulating(false);
    setCurrentStep(1);
    setScanStatus({
      message: 'Demo route reset: Carrier positioned at Stop 1 (Santa Cruz Logistics Hub Depot).',
      type: 'info'
    });
    if (requestId && isApproved && !isAuditor) {
      try {
        await scanShipmentCheckpoint({
          requestId,
          checkpointStep: 1,
          notes: 'Simulation reset to Step 1',
        });
      } catch {
        // Fallback
      }
    }
  };

  // Auto simulation timer
  useEffect(() => {
    if (isSimulating) {
      simulationRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 4) {
            setIsSimulating(false);
            return 4;
          }
          const next = prev + 1;
          playScanBeep();
          return next;
        });
      }, 3500);
    } else if (simulationRef.current) {
      clearInterval(simulationRef.current);
    }
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, [isSimulating]);

  const activeCheckpoint = checkpoints[currentStep - 1];
  const polylinePositions = checkpoints.map((c) => [c.lat, c.lng] as [number, number]);

  // ETA Calculation
  const getEtaText = () => {
    if (currentStep === 1) return 'Estimated Arrival: Tomorrow, 10:00 AM (18 hrs remaining)';
    if (currentStep === 2) return 'Estimated Arrival: Today, 04:30 PM (5 hrs remaining)';
    if (currentStep === 3) return 'Estimated Arrival: Today, 03:30 PM (Approaching Bay — 45 mins)';
    return 'Arrived: Completed & Signed for at Receiving Bay!';
  };

  const anticipatedStock = currentStock + incomingQty;
  const isStockSafeAfterArrival = anticipatedStock > threshold;

  return (
    <div className="space-y-6">
      {/* 1. Anticipated Stock Level Alert Banner */}
      <div className="p-5 rounded-2xl border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800/60 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2.5 py-0.5 rounded-full">
                  Stock Anticipation Radar
                </span>
                <span className="text-xs text-slate-500 font-medium">SKU: {itemSku}</span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                Restocking Anticipation for {itemName}
              </h4>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
            currentStep === 4 
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}>
            {currentStep === 4 ? 'Stock Replenished' : 'Incoming In-Transit'}
          </span>
        </div>

        {/* Stock Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-blue-200/60 dark:border-blue-800/40">
          <div className="p-3 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-blue-100 dark:border-blue-900/40">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Current Stock</p>
            <p className={`text-xl font-extrabold mt-0.5 ${currentStock <= threshold ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
              {currentStock} units
            </p>
          </div>
          <div className="p-3 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-blue-100 dark:border-blue-900/40">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">En Route Units</p>
            <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
              +{incomingQty} units
            </p>
          </div>
          <div className="p-3 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-blue-100 dark:border-blue-900/40">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Anticipated Stock</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {anticipatedStock} units
            </p>
          </div>
          <div className="p-3 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-blue-100 dark:border-blue-900/40">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Min. Safe Threshold</p>
            <p className="text-xl font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">
              {threshold} units
            </p>
          </div>
        </div>

        {/* Anticipation explanation text */}
        <p className="text-xs text-blue-900 dark:text-blue-200 font-medium mt-3 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          {isStockSafeAfterArrival 
            ? `Arrival of this order will restore ${itemName} to a healthy inventory status above the ${threshold}-unit threshold.` 
            : `Even with +${incomingQty} units, stock will still remain close to threshold. Additional restocking advised.`}
        </p>
      </div>

      {/* 2. Live Map Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Map Header with ETA & Simulation Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50/60 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                Live Parcel Route Tracking
              </h3>
            </div>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {getEtaText()}
            </p>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isSimulating 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSimulating ? <><Pause className="w-3.5 h-3.5" /> Pause Transit</> : <><Play className="w-3.5 h-3.5" /> Simulate Transit</>}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSimulating(false);
                setCurrentStep(1);
              }}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Reset to Origin"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Leaflet Map */}
        <div className="h-80 w-full relative z-0">
          <MapContainer 
            center={[activeCheckpoint.lat, activeCheckpoint.lng]} 
            zoom={12} 
            scrollWheelZoom={false} 
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Connecting Polyline Route */}
            <Polyline 
              positions={polylinePositions} 
              pathOptions={{ 
                color: '#2563eb', 
                weight: 5, 
                dashArray: '10, 8', 
                opacity: 0.85 
              }} 
            />

            {/* Checkpoint 1 (Origin) */}
            <Marker position={[checkpoints[0].lat, checkpoints[0].lng]} icon={warehouseIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <strong className="block text-slate-900 font-bold">{checkpoints[0].title}</strong>
                  <span className="text-slate-500">{checkpoints[0].location}</span>
                </div>
              </Popup>
            </Marker>

            {/* Checkpoint 2 (Hub) */}
            <Marker position={[checkpoints[1].lat, checkpoints[1].lng]} icon={hubIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <strong className="block text-slate-900 font-bold">{checkpoints[1].title}</strong>
                  <span className="text-slate-500">{checkpoints[1].location}</span>
                </div>
              </Popup>
            </Marker>

            {/* Checkpoint 4 (Destination) */}
            <Marker position={[checkpoints[3].lat, checkpoints[3].lng]} icon={destinationIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <strong className="block text-slate-900 font-bold">{checkpoints[3].title}</strong>
                  <span className="text-slate-500">{checkpoints[3].location}</span>
                </div>
              </Popup>
            </Marker>

            {/* Moving Delivery Truck Marker */}
            <Marker 
              position={[activeCheckpoint.lat, activeCheckpoint.lng]} 
              icon={truckIcon}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="p-1.5 text-xs">
                  <div className="flex items-center gap-1 text-blue-600 font-extrabold">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Carrier Fleet #PF-402</span>
                  </div>
                  <strong className="block text-slate-900 font-bold mt-1">{activeCheckpoint.title}</strong>
                  <p className="text-slate-500 text-[11px] mt-0.5">{activeCheckpoint.description}</p>
                </div>
              </Popup>
            </Marker>

            <MapRecenter lat={activeCheckpoint.lat} lng={activeCheckpoint.lng} />
          </MapContainer>
        </div>

        {/* 2b. Sorting Center Barcode & Tracking ID Scan Simulator */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-sm">
                  <ScanBarcode className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Sorting Center Barcode &amp; Waybill Scanner Simulator
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Simulate optical barcode and handheld RFID scans to progress parcels between regional logistics hubs.
              </p>
            </div>

            {/* Quick Demo Reset / Re-run */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetRoute}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
                title="Reset parcel to origin depot for presentation repeat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Route Demo
              </button>
            </div>
          </div>

          {/* Scanner Workstation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left: Interactive Barcode Label (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Carrier Waybill / Tracking ID
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
                    RFID Active
                  </span>
                </div>

                {/* Vector Barcode Graphic with Laser Sweep */}
                <div className="relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center overflow-hidden my-1">
                  {/* Optical Laser Line */}
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1 bg-red-500 shadow-[0_0_14px_#ef4444] animate-laser z-20 pointer-events-none" />
                  )}

                  {/* Laser Scan Grid Overlay when active */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-red-500/10 pointer-events-none z-10 animate-pulse" />
                  )}

                  {/* SVG Code 128 Simulated Barcode */}
                  <div className="flex items-center justify-center gap-[2.5px] h-12 w-full max-w-[260px] py-1">
                    {[3,1,2,4,1,3,2,1,4,2,1,3,1,2,4,1,2,3,2,1,4,1,3,2,1,3,2,4,1,2,3,1,2].map((w, idx) => (
                      <div
                        key={idx}
                        style={{ width: `${w * 1.5}px` }}
                        className={`h-full ${idx % 2 === 0 ? 'bg-slate-900 dark:bg-white' : 'bg-transparent'}`}
                      />
                    ))}
                  </div>

                  <div className="mt-1.5 font-mono text-xs font-black tracking-widest text-slate-900 dark:text-white">
                    {trackingCode}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">SKU: <strong className="text-slate-800 dark:text-slate-200">{itemSku}</strong></span>
                <span className="text-slate-500 font-medium">Qty: <strong className="text-blue-600 dark:text-blue-400">+{incomingQty} units</strong></span>
              </div>
            </div>

            {/* Right: Optical Scanner Action Panel (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              {/* Scan Status Toast / Announcement */}
              <div className="min-h-[38px] mb-3">
                {scanStatus ? (
                  <div className={`p-2 rounded-lg text-xs font-bold flex items-center gap-2 border ${
                    scanStatus.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : scanStatus.type === 'error'
                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      : 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  }`}>
                    {scanStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : scanStatus.type === 'error' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    <span className="truncate">{scanStatus.message}</span>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Point handheld terminal or click below to scan parcel at next destination.</span>
                  </div>
                )}
              </div>

              {/* Station Transition Indicator */}
              <div className="mb-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Current Location</span>
                    <strong className="text-slate-900 dark:text-white font-extrabold truncate max-w-[160px] block">
                      Stop {currentStep}: {checkpoints[currentStep - 1].title.split(' ')[0]} {checkpoints[currentStep - 1].title.split(' ')[1] || ''}
                    </strong>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mx-2" />

                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Next Station</span>
                    {currentStep < 4 ? (
                      <strong className="text-blue-600 dark:text-blue-400 font-extrabold truncate max-w-[160px] block">
                        Stop {currentStep + 1}: {checkpoints[currentStep].title.split(' ')[0]} {checkpoints[currentStep].title.split(' ')[1] || ''}
                      </strong>
                    ) : (
                      <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold block">
                        Completed (Bay 3)
                      </strong>
                    )}
                  </div>
                </div>
              </div>

              {/* Primary Barcode Scan Action Button */}
              <div className="space-y-2">
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => executeBarcodeScan()}
                    disabled={isScanning || isAuditor}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                      isAuditor
                        ? 'bg-slate-400 cursor-not-allowed opacity-70'
                        : isScanning
                        ? 'bg-blue-700 shadow-blue-500/30'
                        : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-blue-600/20'
                    }`}
                  >
                    <ScanBarcode className={`w-4 h-4 ${isScanning ? 'animate-bounce' : ''}`} />
                    {isAuditor
                      ? 'Scanning Restricted (Auditor Read-Only - TC-RBAC-02)'
                      : isScanning
                      ? 'Scanning Barcode & Computing Route...'
                      : `Scan Barcode Arrival at Stop ${currentStep + 1} (${checkpoints[currentStep].title.split(' ')[0]}...)`
                    }
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                    <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Shipment Received & Cleared at Digos Central Bay 3
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Stock levels have been safely replenished. Ready for presentation review.
                    </p>
                  </div>
                )}

                {/* Manual Scan Input or Barcode Gun Emulation */}
                <form onSubmit={handleManualScanSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={`Scan or paste ${trackingCode}`}
                      value={barcodeQuery}
                      onChange={(e) => setBarcodeQuery(e.target.value)}
                      disabled={isAuditor}
                      className="w-full text-xs py-2 pl-8 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <ScanBarcode className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  <button
                    type="submit"
                    disabled={isAuditor || !barcodeQuery.trim()}
                    className="px-3 py-2 text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors shrink-0"
                  >
                    Scan Input
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Station Stepper Breadcrumb */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
            {checkpoints.map((cp) => {
              const isPassed = currentStep > cp.step;
              const isCurrent = currentStep === cp.step;
              return (
                <div
                  key={cp.step}
                  className={`p-2 rounded-lg border text-xs transition-all ${
                    isCurrent 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-extrabold' 
                      : isPassed 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-bold' 
                      : 'bg-white/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] uppercase tracking-wider opacity-85">Stop {cp.step}</span>
                    {isPassed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : null}
                    {isCurrent ? <span className="w-2 h-2 rounded-full bg-white animate-ping" /> : null}
                  </div>
                  <p className="truncate text-[11px]">{cp.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. E-Commerce Milestone Checkpoint Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Shipment Checkpoint Timeline
        </h4>

        <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
          {checkpoints.map((cp) => {
            const isCompleted = currentStep > cp.step;
            const isCurrent = currentStep === cp.step;
            return (
              <div key={cp.step} className="relative flex items-start gap-4">
                {/* Timeline node */}
                <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isCurrent 
                    ? 'bg-blue-600 border-white dark:border-slate-900 ring-4 ring-blue-100 dark:ring-blue-900/40 text-white' 
                    : isCompleted 
                    ? 'bg-emerald-500 border-white dark:border-slate-900 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 border-white dark:border-slate-900 text-transparent'
                }`}>
                  {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <h5 className={`text-sm font-bold ${
                      isCurrent ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {cp.title}
                    </h5>
                    <span className="text-xs font-semibold text-slate-400">{cp.time}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">{cp.location}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cp.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
