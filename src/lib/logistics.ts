/**
 * Digos City Logistics Route Checkpoints
 * Shared constants for logistics tracking, sorting scanner, and map visualizer
 */

export interface LogisticsCheckpoint {
  step: number;
  title: string;
  location: string;
  lat: number;
  lng: number;
  action: string;
  shippingStatus: string;
  etaHours: number;
}

export const LOGISTICS_CHECKPOINTS: LogisticsCheckpoint[] = [
  {
    step: 1,
    title: 'Dispatched from Regional Depot',
    location: 'Santa Cruz Logistics Hub (Davao-Digos Highway)',
    lat: 6.8320,
    lng: 125.4150,
    action: 'DISPATCHED',
    shippingStatus: 'SHIPPED',
    etaHours: 4,
  },
  {
    step: 2,
    title: 'Arrived at Digos North Sorting Hub',
    location: 'Digos City Distribution Center (Rizal Ave Ext)',
    lat: 6.7680,
    lng: 125.3720,
    action: 'SORTED',
    shippingStatus: 'IN_TRANSIT',
    etaHours: 2.5,
  },
  {
    step: 3,
    title: 'En Route via Quezon Avenue Corridor',
    location: 'Quezon Avenue, Digos City Downtown',
    lat: 6.7530,
    lng: 125.3560,
    action: 'IN_TRANSIT',
    shippingStatus: 'IN_TRANSIT',
    etaHours: 0.75,
  },
  {
    step: 4,
    title: 'Delivered to Destination Warehouse',
    location: 'Digos City Central Warehouse (Receiving Bay 3)',
    lat: 6.7420,
    lng: 125.3450,
    action: 'DELIVERED',
    shippingStatus: 'DELIVERED',
    etaHours: 0,
  },
];
