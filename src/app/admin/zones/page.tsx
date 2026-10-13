'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Zone, Building } from '@/lib/types';
import {
  Compass,
  FileSpreadsheet,
  Upload,
  Plus,
  Building2,
  Check,
  AlertCircle,
  MapPin,
} from 'lucide-react';

export default function AdminZonesPage() {
  const { zones, buildings, addBuilding } = useApp();
  const [csvContent, setCsvContent] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleCsvImport = () => {
    if (!csvContent.trim()) return;

    try {
      const lines = csvContent.trim().split('\n');
      let importedCount = 0;

      for (const line of lines) {
        // Skip header if contains 'zone'
        if (line.toLowerCase().includes('zone')) continue;
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          const zoneId = parseInt(parts[0], 10);
          const plotNo = parseInt(parts[1], 10);
          const landArea = parts[2] ? parseFloat(parts[2]) : undefined;

          if (!isNaN(zoneId) && !isNaN(plotNo)) {
            addBuilding({
              zoneId,
              plotNo,
              landArea,
            });
            importedCount++;
          }
        }
      }

      setImportStatus(`تم استيراد ${importedCount} قطعة بنجاح!`);
      setCsvContent('');
    } catch (err: any) {
      setImportStatus('خطأ أثناء قراءة ملف CSV، يرجى مراجعة التنسيق');
    }
  };

  const sampleCsv = `zone, plot_no, land_area
1, 45, 600
1, 46, 550
2, 90, 620
4, 142, 650
8, 205, 500`;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/20">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              إدارة مناطق الحي وقطع الأراضي والمباني
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مناطق الحي المتميز الـ 16 واستيراد قوائم القطع والمباني بالجملة
            </p>
          </div>
        </div>
      </div>

      {/* CSV Bulk Importer Tool */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            استيراد قطع الأراضي والمباني من ملف CSV
          </h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          الصيغة المطلوبة للأعمدة: <code>zone, plot_no, land_area</code> (المنطقة، رقم القطعة، مساحة الأرض).
          يمكنك لصق البيانات مباشرة أدناه للاستيراد السريع.
        </p>

        <div className="space-y-3">
          <textarea
            rows={4}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            placeholder={`الصق أسطر CSV هنا...\n${sampleCsv}`}
            className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 shadow-xs"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setCsvContent(sampleCsv)}
              className="text-xs text-amber-600 hover:text-amber-700 font-bold underline"
            >
              ملء نموذج تجريبي
            </button>

            <button
              onClick={handleCsvImport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition"
            >
              <Upload className="w-4 h-4" />
              <span>بدء الاستيراد للقطع</span>
            </button>
          </div>

          {importStatus && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-600" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* 16 Zones Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            قائمة مناطق الحي المتميز الـ 16
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
              <tr>
                <th className="py-3.5 px-4">رقم المنطقة</th>
                <th className="py-3.5 px-4">الاسم</th>
                <th className="py-3.5 px-4">الاتجاه الجغرافي</th>
                <th className="py-3.5 px-4">إحداثيات الخريطة (X, Y)</th>
                <th className="py-3.5 px-4">القطع المسجلة</th>
                <th className="py-3.5 px-4">ملاحظات الموقع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {zones.map((z) => {
                const zBuildings = buildings.filter((b) => b.zoneId === z.id);
                return (
                  <tr key={z.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                      <span className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                        {z.id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {z.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                        {z.direction}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      X: {z.mapX}% , Y: {z.mapY}%
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {zBuildings.length} قطعة
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-sm truncate">
                      {z.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
