'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Workspace Settings</h2>
        <p className="text-slate-500 font-medium mt-1 dark:text-slate-400">Personalize your application experience.</p>
      </header>
      
      <div className="max-w-3xl space-y-8">
        {/* Theme Settings Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Appearance & Theme</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customize how ProcureFlow looks on your device.</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Light Mode */}
              <button 
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-blue-600 bg-blue-50 dark:bg-slate-700/50 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400'}`}
              >
                <Sun className="w-8 h-8 mb-3" />
                <span className="font-bold">Light Mode</span>
              </button>

              {/* Dark Mode */}
              <button 
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-blue-600 bg-slate-900 text-blue-400' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400'}`}
              >
                <Moon className="w-8 h-8 mb-3" />
                <span className="font-bold">Dark Mode</span>
              </button>

              {/* System Mode */}
              <button 
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-blue-600 bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400'}`}
              >
                <Monitor className="w-8 h-8 mb-3" />
                <span className="font-bold">System Default</span>
              </button>
            </div>
          </div>
        </section>

        {/* Custom Color Scheme Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mt-8">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Brand Color</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select the primary accent color for your workspace.</p>
          </div>
          
          <div className="p-6">
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  document.documentElement.removeAttribute('data-theme-color');
                  localStorage.setItem('theme-color', 'default');
                }}
                className="w-12 h-12 rounded-full bg-[#2563EB] ring-4 ring-transparent hover:ring-slate-200 dark:hover:ring-slate-700 focus:ring-slate-300 transition-all shadow-md"
                title="Default Blue"
              />
              <button 
                onClick={() => {
                  document.documentElement.setAttribute('data-theme-color', 'emerald');
                  localStorage.setItem('theme-color', 'emerald');
                }}
                className="w-12 h-12 rounded-full bg-[#059669] ring-4 ring-transparent hover:ring-slate-200 dark:hover:ring-slate-700 focus:ring-slate-300 transition-all shadow-md"
                title="Emerald"
              />
              <button 
                onClick={() => {
                  document.documentElement.setAttribute('data-theme-color', 'rose');
                  localStorage.setItem('theme-color', 'rose');
                }}
                className="w-12 h-12 rounded-full bg-[#E11D48] ring-4 ring-transparent hover:ring-slate-200 dark:hover:ring-slate-700 focus:ring-slate-300 transition-all shadow-md"
                title="Rose"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">Note: Refreshing the page might briefly reset the color until we bind it fully.</p>
          </div>
        </section>
      </div>
    </>
  );
}
