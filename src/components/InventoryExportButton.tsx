'use client';

import { useRef } from 'react';

type InventoryRow = {
  id: string;
  name: string;
  category: string;
  stock: number;
  threshold: number;
  warehouse: string;
  date: string;
  status: string;
};

function csvCell(value: string | number) {
  let text = String(value);
  // Keep user-entered text from being interpreted as spreadsheet formulas.
  if (typeof value === 'string' && /^[\s]*[=+\-@]/.test(text)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
}

export default function InventoryExportButton({ items }: { items: InventoryRow[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const columns = ['Item ID', 'Item Name', 'Category', 'Current Stock', 'Min. Threshold', 'Warehouse', 'Last Restocked', 'Status'];
  const rows = items.map(item => [item.id, item.name, item.category, item.stock, item.threshold, item.warehouse, item.date, item.status]);
  const csvPreview = [columns, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';

  function exportCsv() {
    dialogRef.current?.close();
    const csv = '\uFEFF' + csvPreview;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition-colors">
        Export CSV
      </button>
      <dialog ref={dialogRef} aria-labelledby="inventory-export-title" aria-describedby="inventory-export-description" className="w-[calc(100%_-_2rem)] max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/50 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
        <h3 id="inventory-export-title" className="text-xl font-bold">Export inventory?</h3>
        <p id="inventory-export-description" className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Download {items.length} inventory {items.length === 1 ? 'item' : 'items'} as a CSV file?
        </p>
        <div className="mt-5">
          <h4 className="mb-2 text-sm font-bold">CSV file preview</h4>
          <div tabIndex={0} role="region" aria-label="CSV file preview" className="max-h-72 overflow-auto rounded-lg border border-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700">
            <table className="w-full min-w-[800px] text-left text-xs text-slate-700 dark:text-slate-300">
              <caption className="sr-only">Inventory CSV preview</caption>
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900">
                <tr>
                  {columns.map(column => (
                    <th key={column} scope="col" className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-bold dark:border-slate-700">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {rows.map((row, index) => (
                  <tr key={items[index].id} className="bg-white dark:bg-slate-800">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="whitespace-pre-wrap px-4 py-3">{cell}</td>
                    ))}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">No inventory items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {items.length === 0 && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">No inventory items to export. The file will contain column headers only.</p>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" autoFocus onClick={() => dialogRef.current?.close()} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:hover:bg-slate-700">
            Cancel
          </button>
          <button type="button" onClick={exportCsv} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
            Export
          </button>
        </div>
      </dialog>
    </>
  );
}
