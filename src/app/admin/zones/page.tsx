'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Building } from '@/lib/types';
import { zoneService } from '@/services/zoneService';
import {
  Compass,
  FileSpreadsheet,
  Upload,
  Building2,
  Check,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
} from 'lucide-react';

const DIRECTIONS = ['وسط', 'بحري', 'قبلي', 'شرقي', 'غربي'];

export default function AdminZonesPage() {
  const {
    zones,
    buildings,
    addBuilding,
    refreshFromDatabase,
    currentUser,
    isSuperAdmin,
    companies,
  } = useApp();

  const [csvContent, setCsvContent] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // إدارة المناطق — كل شركة تضيف مناطقها الخاصة (وسوبر أدمن يختار الشركة)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    isSuperAdmin ? (currentUser?.companyId || companies[0]?.id || '') : (currentUser?.companyId || '')
  );
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDirection, setNewZoneDirection] = useState<string>('وسط');
  const [addingZone, setAddingZone] = useState(false);
  const [deletingZoneId, setDeletingZoneId] = useState<number | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [zoneMessage, setZoneMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const visibleZones = isSuperAdmin && selectedCompanyId
    ? zones.filter((z) => z.companyId === selectedCompanyId || !z.companyId)
    : zones;

  const zoneBuildings = (zoneId: number): Building[] =>
    buildings.filter((b) => b.zoneId === zoneId);

  const handleAddZone = async () => {
    const name = newZoneName.trim();
    if (!name) {
      setZoneMessage({ type: 'error', text: 'أدخل اسم المنطقة' });
      return;
    }
    if (isSuperAdmin && !selectedCompanyId) {
      setZoneMessage({ type: 'error', text: 'اختر الشركة المالكة للمنطقة' });
      return;
    }
    setAddingZone(true);
    setZoneMessage(null);
    const res = await zoneService.createZone({
      name,
      direction: newZoneDirection,
      companyId: isSuperAdmin ? selectedCompanyId : undefined,
    });
    setAddingZone(false);
    if (res.success) {
      setNewZoneName('');
      setZoneMessage({ type: 'success', text: 'تم إضافة المنطقة بنجاح' });
      await refreshFromDatabase();
    } else {
      setZoneMessage({ type: 'error', text: res.error || 'فشل إضافة المنطقة' });
    }
  };

  const handleDeleteZone = async (zone: { id: number; name: string }) => {
    const linked = zoneBuildings(zone.id);
    if (linked.length > 0) {
      setZoneMessage({
        type: 'error',
        text: `لا يمكن حذف "منطقة ${zone.name}" — بها ${linked.length} مبنى. احذف المباني والوحدات أولاً`,
      });
      return;
    }
    setDeletingZoneId(zone.id);
    setZoneMessage(null);
    const res = await zoneService.deleteZone(zone.id);
    setDeletingZoneId(null);
    if (res.success) {
      setZoneMessage({ type: 'success', text: `تم حذف منطقة ${zone.name}` });
      await refreshFromDatabase();
    } else {
      setZoneMessage({ type: 'error', text: res.error || 'فشل حذف المنطقة' });
    }
  };

  const handleSaveEdit = async (zoneId: number) => {
    const name = editName.trim();
    if (!name) return;
    setSavingEdit(true);
    const res = await zoneService.updateZone(zoneId, { name });
    setSavingEdit(false);
    if (res.success) {
      setEditingZoneId(null);
      setZoneMessage({ type: 'success', text: 'تم تحديث اسم المنطقة' });
      await refreshFromDatabase();
    } else {
      setZoneMessage({ type: 'error', text: res.error || 'فشل تحديث المنطقة' });
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-outline-variant shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-warning text-white flex items-center justify-center shadow-lg shadow-warning/30">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-on-surface">
              إدارة مناطق الشركة وقطع الأراضي والمباني
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              كل شركة تضيف مناطقها الخاصة وتديرها — لا يمكن حذف منطقة بها مبانٍ
            </p>
          </div>
        </div>
      </div>

      {/* Areas Manager */}
      <div className="p-6 rounded-3xl bg-white border border-outline-variant shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-warning" />
          <h3 className="font-bold text-sm text-on-surface">
            إضافة منطقة جديدة
          </h3>
        </div>

        {isSuperAdmin && (
          <div className="sm:w-72">
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              الشركة المالكة
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full border border-outline-variant bg-white rounded-xl py-2.5 px-3 text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary appearance-none cursor-pointer text-xs shadow-xs"
            >
              <option value="">اختر الشركة</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              اسم المنطقة *
            </label>
            <input
              type="text"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddZone()}
              placeholder="مثال: الحي السكني D"
              maxLength={80}
              className="input-base text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              الاتجاه
            </label>
            <select
              value={newZoneDirection}
              onChange={(e) => setNewZoneDirection(e.target.value)}
              className="w-full border border-outline-variant bg-white rounded-xl py-2.5 px-3 text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary appearance-none cursor-pointer text-xs shadow-xs"
            >
              {DIRECTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddZone}
            disabled={addingZone || !newZoneName.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-strong text-on-primary font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {addingZone ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>إضافة المنطقة</span>
          </button>
        </div>

        {zoneMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
              zoneMessage.type === 'success'
                ? 'bg-success-container text-on-success-container border-success'
                : 'bg-error-container text-on-error-container border-error'
            }`}
          >
            {zoneMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{zoneMessage.text}</span>
          </div>
        )}
      </div>

      {/* CSV Bulk Importer Tool */}
      <div className="p-6 rounded-3xl bg-white border border-outline-variant shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-warning" />
          <h3 className="font-bold text-sm text-on-surface">
            استيراد قطع الأراضي والمباني من ملف CSV
          </h3>
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          الصيغة المطلوبة للأعمدة: <code>zone, plot_no, land_area</code> (معرف المنطقة، رقم القطعة، مساحة الأرض).
          يمكنك لصق البيانات مباشرة أدناه للاستيراد السريع.
        </p>

        <div className="space-y-3">
          <textarea
            rows={4}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            placeholder={`الصق أسطر CSV هنا...\n${sampleCsv}`}
            className="w-full text-xs font-mono p-3 rounded-2xl border border-outline-variant bg-white text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary shadow-xs"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setCsvContent(sampleCsv)}
              className="text-xs text-warning font-bold underline"
            >
              ملء نموذج تجريبي
            </button>

            <button
              onClick={handleCsvImport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-warning hover:bg-warning/90 text-white font-bold text-xs shadow-md shadow-warning/30 transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>بدء الاستيراد للقطع</span>
            </button>
          </div>

          {importStatus && (
            <div className="p-3 rounded-xl bg-warning-container text-warning text-xs font-bold border border-warning flex items-center gap-2">
              <Check className="w-4 h-4 text-warning" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Zones Directory Table */}
      <div className="bg-white rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="p-5 border-b border-outline-variant">
          <h3 className="font-bold text-sm text-on-surface">
            مناطق {isSuperAdmin && selectedCompanyId
              ? companies.find((c) => c.id === selectedCompanyId)?.name || 'الشركة'
              : 'الشركة'} ({visibleZones.length})
          </h3>
        </div>

        {visibleZones.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Building2 className="w-10 h-10 text-outline mx-auto" />
            <p className="text-sm font-bold text-on-surface">لا توجد مناطق بعد</p>
            <p className="text-xs text-on-surface-variant">
              أضف أول منطقة من النموذج أعلاه لتتمكن من تسجيل القطع والمباني فيها
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-bold">
                <tr>
                  <th className="py-3.5 px-4">رقم المنطقة</th>
                  <th className="py-3.5 px-4">الاسم</th>
                  <th className="py-3.5 px-4">الاتجاه الجغرافي</th>
                  <th className="py-3.5 px-4">إحداثيات الخريطة (X, Y)</th>
                  <th className="py-3.5 px-4">القطع المسجلة</th>
                  <th className="py-3.5 px-4">إدارة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {visibleZones.map((z) => {
                  const zBuildings = zoneBuildings(z.id);
                  return (
                    <tr key={z.id} className="hover:bg-surface-container-low transition">
                      <td className="py-3.5 px-4 font-black text-on-surface">
                        <span className="w-7 h-7 rounded-xl bg-warning text-white flex items-center justify-center">
                          {z.id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-on-surface">
                        {editingZoneId === z.id ? (
                          <span className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="input-base text-xs w-48"
                              maxLength={80}
                            />
                            <button
                              onClick={() => handleSaveEdit(z.id)}
                              disabled={savingEdit}
                              className="p-1.5 rounded-lg bg-success text-on-success cursor-pointer disabled:opacity-50"
                              aria-label="حفظ"
                            >
                              {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setEditingZoneId(null)}
                              className="p-1.5 rounded-lg bg-surface-container text-on-surface-variant cursor-pointer"
                              aria-label="إلغاء"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ) : (
                          z.name
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {z.direction ? (
                          <span className="px-2 py-0.5 rounded-full bg-warning-container text-warning font-semibold border border-warning">
                            {z.direction}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-on-surface-variant">
                        X: {z.mapX}% , Y: {z.mapY}%
                      </td>
                      <td className="py-3.5 px-4 font-bold text-on-surface">
                        {zBuildings.length} قطعة
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingZoneId(z.id);
                              setEditName(z.name);
                            }}
                            disabled={editingZoneId === z.id}
                            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer disabled:opacity-40"
                            aria-label="تعديل"
                            title="تعديل الاسم"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteZone(z)}
                            disabled={deletingZoneId === z.id || zBuildings.length > 0 || editingZoneId === z.id}
                            className="p-2 rounded-xl text-error hover:bg-error-container transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="حذف"
                            title={
                              zBuildings.length > 0
                                ? `لا يمكن الحذف — بها ${zBuildings.length} مبنى، احذف المباني والوحدات أولاً`
                                : 'حذف المنطقة'
                            }
                          >
                            {deletingZoneId === z.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
