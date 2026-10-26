'use client';

import { useState, useMemo, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Download,
  Check,
  Shield,
  Sparkles,
  Zap,
  Clock,
  ArrowRight
} from 'lucide-react';
import { autoRestockItem, autoRestockAllLowStock } from '@/app/actions';

export interface InventoryItemData {
  id: string; // SKU
  dbId: string;
  name: string;
  category: string;
  stock: number;
  stockMax: number;
  threshold: number;
  warehouse: string;
  date: string;
  status: string; // 'In Stock' | 'Low Stock' | 'Out of Stock'
  pendingRequest?: {
    id: string;
    quantity: number;
    priority: string;
  } | null;
}

interface InventoryClientProps {
  initialItems: InventoryItemData[];
  userRole?: string;
}

export default function InventoryClient({ initialItems, userRole = 'WAREHOUSE_STAFF' }: InventoryClientProps) {
  const [items, setItems] = useState<InventoryItemData[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Stock' | 'Low Stock' | 'Out of Stock'>('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All Warehouses');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [currentPage, setCurrentPage] = useState(1);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [restockNotice, setRestockNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 8;

  // Sync state if initialItems changes
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Keyboard shortcut: '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' && 
        document.activeElement !== searchInputRef.current && 
        !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Extract unique warehouses and categories
  const warehouses = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.warehouse) set.add(i.warehouse); });
    return ['All Warehouses', ...Array.from(set)];
  }, [items]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.category) set.add(i.category); });
    return ['All Categories', ...Array.from(set)];
  }, [items]);

  // Overall counts
  const totalItemsCount = items.length;
  const inStockCount = items.filter(i => i.status === 'In Stock').length;
  const lowStockCount = items.filter(i => i.status === 'Low Stock').length;
  const outOfStockCount = items.filter(i => i.status === 'Out of Stock').length;

  const lowStockItems = useMemo(() => {
    return items.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock');
  }, [items]);

  const unrequestedItems = useMemo(() => {
    return lowStockItems.filter(i => !i.pendingRequest);
  }, [lowStockItems]);

  const pendingCount = lowStockItems.length - unrequestedItems.length;

  // Filter items dynamically
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }
      if (selectedWarehouse !== 'All Warehouses' && item.warehouse !== selectedWarehouse) {
        return false;
      }
      if (selectedCategory !== 'All Categories' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesSku = item.id.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        const matchesWh = item.warehouse.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesCat && !matchesWh) {
          return false;
        }
      }
      return true;
    });
  }, [items, statusFilter, selectedWarehouse, selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // 1-Click Auto Restock single item
  const handleAutoRestock = (dbId: string, itemName: string) => {
    if (userRole === 'AUDITOR') return;
    startTransition(async () => {
      try {
        const res = await autoRestockItem(dbId);
        setItems(prev => prev.map(i => i.dbId === dbId ? {
          ...i,
          pendingRequest: { id: res.requestId, quantity: res.quantity, priority: 'High' }
        } : i));
        setRestockNotice(`Auto-generated restocking request for ${res.itemName} (+${res.quantity} units)! Awaiting Procurement Manager approval.`);
      } catch (err: unknown) {
        setRestockNotice(err instanceof Error ? err.message : 'Failed to restock');
      } finally {
        setTimeout(() => setRestockNotice(null), 5000);
      }
    });
  };

  // Batch Auto Restock all low stock items
  const handleBatchAutoRestock = () => {
    if (userRole === 'AUDITOR') return;
    startTransition(async () => {
      try {
        const res = await autoRestockAllLowStock();
        // Mark all unrequested items as having pending requests locally
        setItems(prev => prev.map(i => {
          if ((i.status === 'Low Stock' || i.status === 'Out of Stock') && !i.pendingRequest) {
            const quantity = Math.max(i.stockMax - i.stock, i.threshold * 2);
            return {
              ...i,
              pendingRequest: { id: 'pending-batch', quantity, priority: i.stock === 0 ? 'High' : 'Medium' }
            };
          }
          return i;
        }));
        setRestockNotice(res.message + ' Requests are now in the pipeline awaiting Manager approval.');
      } catch (err: unknown) {
        setRestockNotice(err instanceof Error ? err.message : 'Batch restock failed');
      } finally {
        setTimeout(() => setRestockNotice(null), 5500);
      }
    });
  };

  // Export CSV handler
  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      alert('No items to export.');
      return;
    }

    const headers = ['Item SKU', 'Item Name', 'Category', 'Current Stock', 'Max Stock', 'Min Threshold', 'Warehouse', 'Status', 'Pending Request'];
    const rows = filteredItems.map(item => [
      `"${item.id.replace(/"/g, '""')}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      item.stock,
      item.stockMax,
      item.threshold,
      `"${item.warehouse.replace(/"/g, '""')}"`,
      `"${item.status}"`,
      item.pendingRequest ? `"Pending (+${item.pendingRequest.quantity} units)"` : '"None"'
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `procureflow_inventory_${statusFilter.toLowerCase().replace(/\s+/g, '_')}_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported ${filteredItems.length} item(s) to CSV!`);
    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Inventory Overview</h2>
          <p className="text-slate-500 font-medium mt-1 dark:text-slate-400">Track and manage all warehouse inventory items</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold shadow-sm transition-all hover:border-slate-300 active:scale-95"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Export CSV
          </button>
          {userRole === 'AUDITOR' ? (
            <span className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold shadow-sm">
              <Shield className="w-4 h-4" /> Auditor Read-Only (TC-RBAC-02)
            </span>
          ) : (
            <Link 
              href="/dashboard/inventory/new" 
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-5 h-5" /> Add Item
            </Link>
          )}
        </div>
      </div>

      {/* Export notification toast */}
      {exportNotice && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center justify-between text-sm font-bold shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {exportNotice}
          </div>
          <button onClick={() => setExportNotice(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Restock notification toast */}
      {restockNotice && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-xl flex items-center justify-between text-sm font-bold shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{restockNotice}</span>
          </div>
          <button onClick={() => setRestockNotice(null)} className="text-blue-600 hover:text-blue-900 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Automated Restock Quick Action Banner (When low stock items exist) */}
      {(lowStockCount > 0 || outOfStockCount > 0) && userRole !== 'AUDITOR' && (
        <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {unrequestedItems.length > 0
                  ? `Automated Restock Engine: ${unrequestedItems.length} ${unrequestedItems.length === 1 ? 'item needs' : 'items need'} restock requests generated`
                  : `Restock Pipeline Active: All ${pendingCount} low-stock items have pending requests submitted`}
              </h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                {unrequestedItems.length > 0
                  ? `Auto-calculate replenishment volumes and generate procurement requests in one click (${pendingCount} already awaiting manager approval).`
                  : `Restock requests are currently awaiting Procurement Manager review in the Approvals queue. Once approved, stock will be added and logistics dispatched.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {unrequestedItems.length > 0 ? (
              <button
                type="button"
                disabled={isPending}
                onClick={handleBatchAutoRestock}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all hover:shadow active:scale-95 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isPending ? 'Generating Requests...' : `Auto-Restock ${unrequestedItems.length} Items`}
              </button>
            ) : (
              <Link
                href={userRole === 'PROCUREMENT_MANAGER' || userRole === 'ADMIN' ? '/dashboard/approvals' : '/dashboard/requests'}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
              >
                {userRole === 'PROCUREMENT_MANAGER' || userRole === 'ADMIN' ? 'Review in Approvals Queue' : 'View Pipeline Requests'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {/* Total Items */}
        <div 
          onClick={() => { setStatusFilter('All'); setCurrentPage(1); }}
          className={`p-6 rounded-2xl shadow-sm border border-l-4 border-l-blue-600 flex justify-between items-center cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'All' ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}
        >
          <div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">Total Items</p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalItemsCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* In Stock */}
        <div 
          onClick={() => { setStatusFilter('In Stock'); setCurrentPage(1); }}
          className={`p-6 rounded-2xl shadow-sm border border-l-4 border-l-emerald-500 flex justify-between items-center cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'In Stock' ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}
        >
          <div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">In Stock</p>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-500">{inStockCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div 
          onClick={() => { setStatusFilter('Low Stock'); setCurrentPage(1); }}
          className={`p-6 rounded-2xl shadow-sm border border-l-4 border-l-amber-500 flex justify-between items-center cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'Low Stock' ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}
        >
          <div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">Low Stock Alerts</p>
            <h3 className="text-3xl font-extrabold text-amber-500 dark:text-amber-500">{lowStockCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Out of Stock */}
        <div 
          onClick={() => { setStatusFilter('Out of Stock'); setCurrentPage(1); }}
          className={`p-6 rounded-2xl shadow-sm border border-l-4 border-l-red-500 flex justify-between items-center cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'Out of Stock' ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}
        >
          <div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">Out of Stock</p>
            <h3 className="text-3xl font-extrabold text-red-600 dark:text-red-500">{outOfStockCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input with Keyboard Shortcut hint */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search items, SKU, category..." 
                className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded pointer-events-none">
                /
              </span>
            </div>

            {/* Warehouse Dropdown */}
            <div className="relative">
              <select 
                value={selectedWarehouse}
                onChange={(e) => { setSelectedWarehouse(e.target.value); setCurrentPage(1); }}
                aria-label="Filter by warehouse"
                className="pl-4 pr-10 py-2.5 appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20"
              >
                {warehouses.map(wh => (
                  <option key={wh} value={wh}>{wh}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Category Dropdown */}
            <div className="relative">
              <select 
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                aria-label="Filter by category"
                className="pl-4 pr-10 py-2.5 appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Status Segmented Buttons */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 w-full md:w-auto overflow-x-auto shadow-sm">
            {(['All', 'In Stock', 'Low Stock', 'Out of Stock'] as const).map((tab) => {
              const isActive = statusFilter === tab;
              return (
                <button 
                  key={tab}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No inventory items match your current filter.</p>
              <button 
                onClick={() => { setStatusFilter('All'); setSearchQuery(''); setSelectedWarehouse('All Warehouses'); setSelectedCategory('All Categories'); }}
                className="mt-3 text-xs font-bold text-blue-600 hover:underline"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Item SKU</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Item Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Current Stock</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Min. Threshold</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Warehouse</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100 text-right">Replenishment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
                {paginatedItems.map((item, i) => (
                  <tr key={item.dbId || i} className={`
                    transition-colors
                    ${item.status === 'Low Stock' ? 'bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-100/50 dark:hover:bg-amber-950/20' : 
                      item.status === 'Out of Stock' ? 'bg-red-50/40 dark:bg-red-950/10 hover:bg-red-100/50 dark:hover:bg-red-950/20' : 
                      'hover:bg-slate-50/60 dark:hover:bg-slate-800/50'}
                  `}>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">{item.id}</td>
                    <td className="px-6 py-4 text-sm font-extrabold text-slate-900 dark:text-slate-100">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{item.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 w-36">
                        <span className={`text-xs font-bold ${
                          item.status === 'Out of Stock' ? 'text-red-600 dark:text-red-400 font-extrabold' :
                          item.status === 'Low Stock' ? 'text-amber-600 dark:text-amber-400' :
                          'text-slate-900 dark:text-slate-100'
                        }`}>
                          {item.stock} / {item.stockMax} units
                        </span>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.status === 'Out of Stock' ? 'bg-red-500' :
                              item.status === 'Low Stock' ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(3, (item.stock / Math.max(1, item.stockMax)) * 100))}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">{item.threshold}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300 font-medium">{item.warehouse}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                        item.status === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' :
                        item.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' :
                        'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {userRole !== 'AUDITOR' && item.pendingRequest ? (
                        <Link
                          href={`/dashboard/requests/${item.pendingRequest.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shadow-sm"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Req #{item.pendingRequest.id.slice(0, 8).toUpperCase()} Pending (+{item.pendingRequest.quantity})</span>
                        </Link>
                      ) : userRole !== 'AUDITOR' && (item.status === 'Low Stock' || item.status === 'Out of Stock') ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleAutoRestock(item.dbId, item.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          1-Click Restock (+{item.stockMax - item.stock})
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">Optimal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Footer */}
        {filteredItems.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-900 dark:text-white">{Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
              <span className="font-bold text-slate-900 dark:text-white">{Math.min(filteredItems.length, currentPage * itemsPerPage)}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-white">{filteredItems.length}</span> items
            </p>
            <div className="flex gap-2">
              <button 
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button 
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNum 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button 
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
