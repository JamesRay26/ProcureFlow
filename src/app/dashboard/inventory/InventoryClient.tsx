'use client';

import { useState, useMemo } from 'react';
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
  Check
} from 'lucide-react';

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
}

interface InventoryClientProps {
  initialItems: InventoryItemData[];
}

export default function InventoryClient({ initialItems }: InventoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Stock' | 'Low Stock' | 'Out of Stock'>('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All Warehouses');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [currentPage, setCurrentPage] = useState(1);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const itemsPerPage = 8;

  // Extract unique warehouses and categories
  const warehouses = useMemo(() => {
    const set = new Set<string>();
    initialItems.forEach(i => { if (i.warehouse) set.add(i.warehouse); });
    return ['All Warehouses', ...Array.from(set)];
  }, [initialItems]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    initialItems.forEach(i => { if (i.category) set.add(i.category); });
    return ['All Categories', ...Array.from(set)];
  }, [initialItems]);

  // Overall counts
  const totalItemsCount = initialItems.length;
  const inStockCount = initialItems.filter(i => i.status === 'In Stock').length;
  const lowStockCount = initialItems.filter(i => i.status === 'Low Stock').length;
  const outOfStockCount = initialItems.filter(i => i.status === 'Out of Stock').length;

  // Filter items dynamically
  const filteredItems = useMemo(() => {
    return initialItems.filter(item => {
      // Status filter
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }
      // Warehouse filter
      if (selectedWarehouse !== 'All Warehouses' && item.warehouse !== selectedWarehouse) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'All Categories' && item.category !== selectedCategory) {
        return false;
      }
      // Search query
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
  }, [initialItems, statusFilter, selectedWarehouse, selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Export CSV handler
  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      alert('No items to export.');
      return;
    }

    const headers = ['Item SKU', 'Item Name', 'Category', 'Current Stock', 'Max Stock', 'Min Threshold', 'Warehouse', 'Status'];
    const rows = filteredItems.map(item => [
      `"${item.id.replace(/"/g, '""')}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      item.stock,
      item.stockMax,
      item.threshold,
      `"${item.warehouse.replace(/"/g, '""')}"`,
      `"${item.status}"`
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
          <Link 
            href="/dashboard/inventory/new" 
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-5 h-5" /> Add Item
          </Link>
        </div>
      </div>

      {/* Export notification toast */}
      {exportNotice && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center justify-between text-sm font-bold shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {exportNotice}
          </div>
          <button onClick={() => setExportNotice(null)} className="text-emerald-600 hover:text-emerald-900 text-xs">Dismiss</button>
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
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search items or SKU..." 
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
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
          
          {/* Status Segmented Buttons (All, In Stock, Low Stock, Out of Stock) */}
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
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Item SKU</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Item Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Current Stock</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Min. Threshold</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Warehouse</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Status</th>
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
