import { Package, CheckCircle2, AlertTriangle, Search, ChevronDown, ChevronLeft, ChevronRight, Plus, Download } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/');
  if (!user.organizationId) redirect('/dashboard');

  const dbItems = await prisma.inventoryItem.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: 'asc' }
  });

  const items = dbItems.map(item => {
    let status = 'In Stock';
    if (item.stock === 0) status = 'Out of Stock';
    else if (item.stock <= item.threshold) status = 'Low Stock';
    
    return {
      id: item.sku, // For mockup visual consistency
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

  const totalItems = items.length;
  const inStock = items.filter(i => i.status === 'In Stock').length;
  const lowStock = items.filter(i => i.status === 'Low Stock').length;
  const outOfStock = items.filter(i => i.status === 'Out of Stock').length;

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Inventory Overview</h2>
          <p className="text-slate-500 font-medium mt-1 dark:text-slate-400">Track and manage all warehouse inventory items</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition-colors">
            Export CSV
          </button>
          <a href="/dashboard/inventory/new" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors">
            <Plus className="w-5 h-5" /> Add Item
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Items */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-600 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">Total Items</p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalItems}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* In Stock */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-500 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">In Stock</p>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-500">{inStock}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">Low Stock Alerts</p>
            <h3 className="text-3xl font-extrabold text-amber-500 dark:text-amber-500">{lowStock}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-red-500 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-1">Out of Stock</p>
            <h3 className="text-3xl font-extrabold text-red-600 dark:text-red-500">{outOfStock}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search items..." 
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="relative hidden md:block">
              <select className="pl-4 pr-10 py-2.5 appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                <option>All Warehouses</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative hidden md:block">
              <select className="pl-4 pr-10 py-2.5 appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                <option>Category</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 w-full md:w-auto overflow-x-auto">
            <button className="px-4 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-md whitespace-nowrap">All</button>
            <button className="px-4 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap">In Stock</button>
            <button className="px-4 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap">Low Stock</button>
            <button className="px-4 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap">Out of Stock</button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Item ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Item Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Current Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Min. Threshold</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Warehouse</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Last Restocked</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-slate-100">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
              {items.map((item, i) => (
                <tr key={i} className={`
                  transition-colors
                  ${item.status === 'Low Stock' ? 'bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100/50 dark:hover:bg-amber-900/20' : 
                    item.status === 'Out of Stock' ? 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20' : 
                    'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}
                `}>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{item.id}</td>
                  <td className="px-6 py-4 text-sm font-extrabold text-slate-900 dark:text-slate-100">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{item.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 w-32">
                      <span className={`text-xs font-bold ${
                        item.status === 'Out of Stock' ? 'text-red-500' :
                        item.status === 'Low Stock' ? 'text-amber-500' :
                        'text-slate-900 dark:text-slate-100'
                      }`}>
                        {item.stock} units
                      </span>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            item.status === 'Out of Stock' ? 'bg-red-500' :
                            item.status === 'Low Stock' ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(2, (item.stock / item.stockMax) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{item.threshold}</td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300 font-medium">{item.warehouse}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{item.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
                      item.status === 'In Stock' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                      item.status === 'Low Stock' ? 'bg-transparent text-amber-600 border-amber-500 dark:text-amber-400 dark:border-amber-500/50' :
                      'bg-transparent text-red-500 border-red-500 dark:text-red-400 dark:border-red-500/50'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Showing 1 to 4 of 2,340 items</p>
          <div className="flex gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold transition-colors shadow-sm shadow-blue-500/20">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
