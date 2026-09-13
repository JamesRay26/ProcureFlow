'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInventoryItem } from '@/app/actions';
import { Save, X } from 'lucide-react';
import Link from 'next/link';

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData(e.currentTarget);
      await createInventoryItem(formData);
      router.push('/dashboard/inventory');
    } catch (err: any) {
      setError(err.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center text-sm font-medium text-slate-500">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
        <span className="mx-2">&gt;</span>
        <Link href="/dashboard/inventory" className="hover:text-blue-600 transition-colors">Inventory</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-blue-600 font-bold">New Item</span>
      </div>

      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Add New Inventory Item</h2>
        <p className="text-slate-500 font-medium mt-1 dark:text-slate-400">Register a new product or asset in the warehouse</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 max-w-2xl">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Item Name</label>
              <input required type="text" name="name" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" placeholder="e.g. Ergonomic Office Chair" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">SKU / ID</label>
              <input required type="text" name="sku" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" placeholder="e.g. FUR-CHR-001" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Category</label>
            <select name="category" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500">
              <option value="Electronics">Electronics</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Office Furniture">Office Furniture</option>
              <option value="Safety Equipment">Safety Equipment</option>
              <option value="IT Infrastructure">IT Infrastructure</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Initial Stock</label>
              <input required type="number" name="stock" defaultValue={0} min={0} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Max Capacity</label>
              <input required type="number" name="maxStock" defaultValue={100} min={1} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Min Threshold</label>
              <input required type="number" name="threshold" defaultValue={10} min={1} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Warehouse Location</label>
            <select name="warehouse" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500">
              <option value="Main DC">Main DC</option>
              <option value="East Coast">East Coast</option>
              <option value="West Coast">West Coast</option>
              <option value="Manila HQ">Manila HQ</option>
              <option value="Cebu Branch">Cebu Branch</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Link href="/dashboard/inventory" className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </form>
    </>
  );
}
