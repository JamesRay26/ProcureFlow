'use client';

import { Search, MapPin, ChevronDown, Send, Keyboard, Monitor, Mouse, Check, AlertTriangle, Minus, Plus as PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createRequest } from '@/app/actions';

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [priority, setPriority] = useState('Medium');
  const [quantity, setQuantity] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    // Basic inline fetch for available items
    fetch('/api/inventory').then(res => res.json()).then(data => setItems(data.items || [])).catch(() => {});
  }, []);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) {
      setError('Please select an item from the dropdown.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData(e.currentTarget);
      formData.append('itemId', selectedItem.id);
      formData.append('priority', priority);
      formData.append('quantity', quantity.toString());
      await createRequest(formData);
      router.push('/dashboard/requests');
    } catch (err: any) {
      setError(err.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center text-sm font-medium text-slate-500">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
        <span className="mx-2">&gt;</span>
        <Link href="/dashboard/requests" className="hover:text-blue-600 transition-colors">Requests</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-blue-600 font-bold">New Request</span>
      </div>

      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">New Restocking Request</h2>
        <p className="text-slate-500 font-medium mt-1 dark:text-slate-400">Fill in the details for your restocking request</p>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {error && (
          <div className="m-8 mb-0 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10 mb-10">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Item Name with Autocomplete */}
              <div className="relative">
                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Item Name</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedItem(null);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search inventory items..."
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-blue-500 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all"
                  />
                </div>
                
                {isDropdownOpen && filteredItems.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                    {filteredItems.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setSelectedItem(item);
                          setSearchQuery(item.name);
                          setIsDropdownOpen(false);
                        }}
                        className="p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-700 flex items-center justify-center shrink-0 text-blue-600">
                          <Check className={`w-4 h-4 ${selectedItem?.id === item.id ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                          <p className="text-xs text-slate-500">SKU: {item.sku} &bull; Stock: {item.stock}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Quantity Needed</label>
                <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-r border-slate-200 dark:border-slate-700">
                    <Minus className="w-4 h-4 font-bold" />
                  </button>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="flex-1 text-center py-3 font-bold text-slate-900 dark:text-slate-100 bg-transparent outline-none"
                  />
                  <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-l border-slate-200 dark:border-slate-700">
                    <PlusIcon className="w-4 h-4 font-bold" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Priority Level */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Priority Level</label>
                <div className="grid grid-cols-3 gap-3">
                  <button type="button" onClick={() => setPriority('Low')} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${priority === 'Low' ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-sm font-bold text-slate-700 dark:text-slate-200">Low</span></div>
                    {priority === 'Low' && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                  <button type="button" onClick={() => setPriority('Medium')} className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${priority === 'Medium' ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-sm font-bold text-slate-900 dark:text-slate-100">Medium</span></div>
                    {priority === 'Medium' && <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                  </button>
                  <button type="button" onClick={() => setPriority('High')} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${priority === 'High' ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-sm font-bold text-slate-700 dark:text-slate-200">High</span></div>
                    {priority === 'High' && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                </div>
              </div>

              {/* Justification */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Justification</label>
                <textarea name="justification" rows={4} placeholder="Explain why this restock is necessary..." className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"></textarea>
              </div>

              {/* Alert Box */}
              {selectedItem && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex gap-4 items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedItem.stock} units remaining</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Reorder point: {selectedItem.threshold} units in {selectedItem.warehouse}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <input type="hidden" name="itemId" value={selectedItem?.id || ''} />
          <input type="hidden" name="quantity" value={quantity} />
          <input type="hidden" name="priority" value={priority} />

          <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={() => router.push('/dashboard')} className="text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Cancel
            </button>
            <div className="flex items-center gap-4">
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50">
                <Send className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
