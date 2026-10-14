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
  Navigation
} from 'lucide-react';

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
}

// Custom Leaflet Icons using SVG HTML
const createCustomIcon = (emoji: string, bgClass: string, isPulse: boolean = false) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${isPulse ? '<div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background-color: rgba(37, 99, 235, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
        <div style="width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 2px solid white; ${bgClass}">
          ${emoji}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
};

const warehouseIcon = createCustomIcon('🏭', 'background: #3b82f6;');
const hubIcon = createCustomIcon('🏢', 'background: #8b5cf6;');
const destinationIcon = createCustomIcon('🏁', 'background: #10b981;');
const truckIcon = createCustomIcon('🚚', 'background: #2563eb;', true);

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
  isApproved
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

  const [currentStep, setCurrentStep] = useState(3); // Default at Step 3 (In Transit)
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  // Auto simulation timer
  useEffect(() => {
    if (isSimulating) {
      simulationRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 4) {
            setIsSimulating(false);
            return 4;
          }
          return prev + 1;
        });
      }, 3000);
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

        {/* Step Progression Tabs */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-xs font-bold text-slate-500 mb-2">Advance checkpoint to test arrival progression:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {checkpoints.map((cp) => {
              const isPassed = currentStep > cp.step;
              const isCurrent = currentStep === cp.step;
              return (
                <button
                  key={cp.step}
                  type="button"
                  onClick={() => {
                    setIsSimulating(false);
                    setCurrentStep(cp.step);
                  }}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                    isCurrent 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                      : isPassed 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase tracking-wider opacity-80">Stop {cp.step}</span>
                    {isPassed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : null}
                  </div>
                  <p className="truncate">{cp.title}</p>
                </button>
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
