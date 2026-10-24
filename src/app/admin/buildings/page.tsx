'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Building, Zone, Unit } from '@/lib/types';
import { buildingService } from '@/services/buildingService';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Check,
  AlertCircle,
  Map as MapIcon,
} from 'lucide-react';

export default function AdminBuildingsPage() {
  const {
    zones,
    buildings,
    units,
    companies,
    currentUser,
    isSuperAdmin,
    refreshFromDatabase,
  } = useApp();

  const companyId = currentUser?.companyId || '';
  // سوبر أدمن يختار الشركة، ومدير الشركة يرى شركته فقط
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    isSuperAdmin ? companies[0]?.id || '' : companyId
  );
  const activeCompanyId = isSuperAdmin ? selectedCompanyId : companyId;

  // إضافة مبنى
  const [newPlotNo, setNewPlotNo] = useState('');
  const [newZoneId, setNewZoneId] = useState<number | ''>('');
  const [newLandArea, setNewLandArea] = useState('');
  const [newFeatures, setNewFeatures] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [addingBuilding, setAddingBuilding] = useState(false);
  const [pageMessage, setPageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // حذف مبنى
  const [deletingBuildingId, setDeletingBuildingId] = useState<number | null>(null);

  /** المباني الخاصة بالشركة النشطة */
  const companyBuildings = useMemo(
    () => buildings.filter((b) => !activeCompanyId || b.companyId === activeCompanyId),
    [buildings, activeCompanyId]
  );

  /** مناطق الشركة النشطة (رئيسية وفرعية) */
  const companyZones = useMemo(
    () => zones.filter((z) => !activeCompanyId || z.companyId === activeCompanyId),
    [zones, activeCompanyId]
  );

  const mainZones = companyZones.filter((z) => z.parentId == null);
  const subZonesOf = (mainId: number): Zone[] => companyZones.filter((z) => z.parentId === mainId);

  const zoneLabel = (zoneId: number): { name: string; isSub: boolean; parentName?: string } => {
    const zone = companyZones.find((z) => z.id === zoneId);
    if (!zone) return { name: 'غير معروفة', isSub: false };
    if (zone.parentId == null) return { name: zone.name, isSub: false };
    const parent = companyZones.find((z) => z.id === zone.parentId);
    return { name: zone.name, isSub: true, parentName: parent?.name };
  };

  const unitsOfBuilding = (buildingId: number): Unit[] =>
    units.filter((u) => u.buildingId === buildingId);

  const parseFeatures = (text: string): string[] =>
    text.split(/[,،]/).map((f) => f.trim()).filter(Boolean);

  const handleAddBuilding = async () => {
    const plotNo = Number(newPlotNo);
    if (!Number.isFinite(plotNo) || plotNo <= 0) {
      setPageMessage({ type: 'error', text: 'أدخل رقم قطعة صحيح' });
      return;
    }
    if (!newZoneId) {
      setPageMessage({ type: 'error', text: 'اختر منطقة المبنى' });
      return;
    }
    if (isSuperAdmin && !activeCompanyId) {
      setPageMessage({ type: 'error', text: 'اختر الشركة المالكة للمبنى' });
      return;
    }
    // منع تكرار رقم القطعة داخل نفس المنطقة
    const dup = companyBuildings.find(
      (b) => b.zoneId === newZoneId && b.plotNo === plotNo && (!activeCompanyId || b.companyId === activeCompanyId)
    );
    if (dup) {
      const label = zoneLabel(newZoneId);
      setPageMessage({
        type: 'error',
        text: `قطعة رقم ${plotNo} مسجلة بالفعل في ${label.parentName ? `${label.parentName} / ` : ''}${label.name}`,
      });
      return;
    }

    setAddingBuilding(true);
    setPageMessage(null);
    const res = await buildingService.createBuilding({
      companyId: isSuperAdmin ? activeCompanyId : undefined,
      zoneId: newZoneId,
      plotNo,
      landArea: newLandArea ? Number(newLandArea) : undefined,
      features: parseFeatures(newFeatures),
      notes: newNotes.trim() || undefined,
    });
    setAddingBuilding(false);
    if (res.success) {
      setNewPlotNo('');
      setNewZoneId('');
      setNewLandArea('');
      setNewFeatures('');
      setNewNotes('');
      setPageMessage({ type: 'success', text: 'تم إضافة المبنى بنجاح' });
      await refreshFromDatabase(undefined, true);
    } else {
      setPageMessage({ type: 'error', text: res.error || 'فشل إضافة المبنى' });
    }
  };



  const handleDeleteBuilding = async (b: Building) => {
    const linkedUnits = unitsOfBuilding(b.id);
    if (linkedUnits.length > 0) {
      setPageMessage({
        type: 'error',
        text: `لا يمكن حذف المبنى رقم ${b.plotNo} — به ${linkedUnits.length} وحدة. احذف الوحدات أولاً`,
      });
      return;
    }
    setDeletingBuildingId(b.id);
    setPageMessage(null);
    const res = await buildingService.deleteBuilding(b.id);
    setDeletingBuildingId(null);
    if (res.success) {
      setPageMessage({ type: 'success', text: `تم حذف المبنى رقم ${b.plotNo}` });
      await refreshFromDatabase(undefined, true);
    } else {
      setPageMessage({ type: 'error', text: res.error || 'فشل حذف المبنى' });
    }
  };

  /** صف/Card مبنى واحد */
  const BuildingRow = ({ b }: { b: Building }) => {
    const bUnits = unitsOfBuilding(b.id);
    const available = bUnits.filter((u) => u.status === 'available').length;
    const reserved = bUnits.filter((u) => u.status === 'reserved').length;
    const sold = bUnits.filter((u) => u.status === 'sold').length;
    const label = zoneLabel(b.zoneId);

    return (
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3 px-4 hover:bg-surface-container-low transition">
        <span className="min-w-[2.5rem] px-2 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-black flex items-center justify-center shrink-0">
          {b.plotNo}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="text-[11px] font-bold text-on-surface-variant">
              {label.isSub && label.parentName ? `${label.parentName} / ${label.name}` : label.name}
            </span>
            {b.landArea && (
              <span className="text-[11px] font-bold text-on-surface-variant">{b.landArea} م²</span>
            )}
            <span className="text-[11px] font-bold text-on-surface-variant">
              {bUnits.length} وحدة
            </span>
            {bUnits.length > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold">
                <span className="text-success">{available} متاح</span>
                {reserved > 0 && <span className="text-warning">{reserved} محجوز</span>}
                <span className="text-on-surface-variant">{sold} مباع</span>
              </span>
            )}
          </div>
          {(b.features || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {(b.features || []).slice(0, 4).map((f, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-semibold">
                  {f}
                </span>
              ))}
              {(b.features || []).length > 4 && (
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-semibold">
                  +{(b.features || []).length - 4}
                </span>
              )}
            </div>
          )}
          {b.notes && (
            <p className="text-[11px] text-outline font-semibold mt-1 truncate">{b.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/admin/buildings/${b.id}`}
            className="p-2 rounded-xl text-primary hover:bg-surface-container-high transition"
            aria-label="عرض التفاصيل والوحدات"
            title="عرض تفاصيل المبنى ووحداته"
          >
            <Building2 className="w-4 h-4" />
          </Link>
          <Link
            href={`/map?zoneId=${b.zoneId}`}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition"
            aria-label="معاينة على الخريطة"
            title="معاينة على الخريطة"
          >
            <MapIcon className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/buildings/${b.id}/edit`}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition"
            aria-label="تعديل"
            title="تعديل المبنى"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleDeleteBuilding(b)}
            disabled={deletingBuildingId === b.id || bUnits.length > 0}
            className="p-2 rounded-xl text-error hover:bg-error-container transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="حذف"
            title={
              bUnits.length > 0
                ? `لا يمكن الحذف — به ${bUnits.length} وحدة، احذف الوحدات أولاً`
                : 'حذف المبنى'
            }
          >
            {deletingBuildingId === b.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-outline-variant shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-on-surface">
              إدارة المباني والقطع
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              أضف المباني وعدِّلها وانقلها بين المناطق — لا يمكن حذف مبنى به وحدات
            </p>
          </div>
        </div>
        <Link
          href="/admin/buildings/new"
          className="btn-primary flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة عمارة وقطع جديدة</span>
        </Link>
      </div>

      {/* Company picker for super admin */}
      {isSuperAdmin && (
        <div className="p-6 rounded-3xl bg-white border border-outline-variant shadow-sm">
          <label className="block text-xs font-bold text-on-surface-variant mb-1">
            الشركة المالكة
          </label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full sm:w-72 border border-outline-variant bg-white rounded-xl py-2.5 px-3 text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary appearance-none cursor-pointer text-xs shadow-xs"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Add building */}
      <div className="p-6 rounded-3xl bg-white border border-outline-variant shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm text-on-surface">إضافة مبنى / قطعة جديدة</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              رقم القطعة *
            </label>
            <input
              type="number"
              min={1}
              value={newPlotNo}
              onChange={(e) => setNewPlotNo(e.target.value)}
              className="input-base text-xs"
              placeholder="مثال: 204"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              المنطقة *
            </label>
            <select
              value={newZoneId}
              onChange={(e) => setNewZoneId(e.target.value ? Number(e.target.value) : '')}
              className="input-base text-xs cursor-pointer"
            >
              <option value="">اختر المنطقة</option>
              {mainZones.map((mz) => (
                <React.Fragment key={mz.id}>
                  <option value={mz.id}>{mz.name}</option>
                  {subZonesOf(mz.id).map((sz) => (
                    <option key={sz.id} value={sz.id}>
                      — {sz.name}
                    </option>
                  ))}
                </React.Fragment>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              مساحة الأرض (م²)
            </label>
            <input
              type="number"
              min={0}
              value={newLandArea}
              onChange={(e) => setNewLandArea(e.target.value)}
              className="input-base text-xs"
              placeholder="مثال: 600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              المميزات (مفصولة بفاصلة)
            </label>
            <input
              type="text"
              value={newFeatures}
              onChange={(e) => setNewFeatures(e.target.value)}
              className="input-base text-xs"
              placeholder="مثال: أسانسير، جراج خاص، مدخل رخام"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              ملاحظات
            </label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="input-base text-xs"
              placeholder="مثال: قريبة من هايبر وان وطريق السويس"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddBuilding}
              disabled={addingBuilding}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-strong text-on-primary font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {addingBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>إضافة المبنى</span>
            </button>
          </div>
        </div>

        {pageMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
              pageMessage.type === 'success'
                ? 'bg-success-container text-on-success-container border-success'
                : 'bg-error-container text-on-error-container border-error'
            }`}
          >
            {pageMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{pageMessage.text}</span>
          </div>
        )}
      </div>

      {/* Buildings grouped by area → sub-area */}
      <div className="bg-white rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="p-5 border-b border-outline-variant">
          <h3 className="font-bold text-sm text-on-surface">
            مباني {isSuperAdmin
              ? companies.find((c) => c.id === activeCompanyId)?.name || 'الشركة'
              : 'الشركة'} ({companyBuildings.length})
          </h3>
        </div>

        {companyBuildings.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Building2 className="w-10 h-10 text-outline mx-auto" />
            <p className="text-sm font-bold text-on-surface">لا توجد مبانٍ بعد</p>
            <p className="text-xs text-on-surface-variant">
              {companyZones.length === 0
                ? 'أضف مناطق الشركة أولاً من صفحة المناطق ثم سجل المباني'
                : 'أضف أول مبنى من النموذج أعلاه'}
            </p>
            {companyZones.length === 0 && (
              <Link href="/admin/zones" className="inline-block text-xs font-bold text-primary underline">
                الانتقال إلى إدارة المناطق
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {mainZones.map((mz) => {
              const subs = subZonesOf(mz.id);
              const direct = companyBuildings.filter((b) => b.zoneId === mz.id);
              const total = direct.length +
                subs.reduce((acc, sz) => acc + companyBuildings.filter((b) => b.zoneId === sz.id).length, 0);
              if (total === 0) return null;
              return (
                <div key={mz.id} className="bg-surface-container-lowest">
                  {/* رأس المنطقة الرئيسية */}
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-container-low border-b border-outline-variant/60">
                    <span className="w-7 h-7 rounded-xl bg-warning text-white flex items-center justify-center text-[11px] font-black shrink-0">
                      {mz.id}
                    </span>
                    <h4 className="font-black text-xs text-on-surface">{mz.name}</h4>
                    <span className="text-[11px] font-bold text-on-surface-variant">
                      {total} مبنى
                    </span>
                  </div>

                  {/* مبانٍ مباشرة على الرئيسية */}
                  {direct.map((b) => (
                    <BuildingRow key={b.id} b={b} />
                  ))}

                  {/* مناطق فرعية ومبانيها */}
                  {subs.map((sz) => {
                    const subBuildings = companyBuildings.filter((b) => b.zoneId === sz.id);
                    if (subBuildings.length === 0) return null;
                    return (
                      <div key={sz.id}>
                        <div className="flex items-center gap-3 px-4 py-2 pr-16 bg-surface-container-lowest border-b border-outline-variant/40">
                          <span className="w-6 h-6 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center text-[10px] font-black shrink-0">
                            {sz.id}
                          </span>
                          <h5 className="font-bold text-[11px] text-on-surface-variant">
                            فرعية — {sz.name}
                          </h5>
                          <span className="text-[11px] font-bold text-on-surface-variant">
                            {subBuildings.length} مبنى
                          </span>
                        </div>
                        {subBuildings.map((b) => (
                          <BuildingRow key={b.id} b={b} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* مبانٍ في مناطق غير معروفة (حالة نادرة بعد حذف منطقة) */}
            {companyBuildings.filter((b) => !companyZones.find((z) => z.id === b.zoneId)).length > 0 && (
              <div>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-error-container border-b border-error/40">
                  <AlertCircle className="w-4 h-4 text-on-error-container" />
                  <h4 className="font-black text-xs text-on-error-container">
                    مبانٍ بمنطقة محذوفة — عدِّل المبنى واختر منطقة له
                  </h4>
                </div>
                {companyBuildings
                  .filter((b) => !companyZones.find((z) => z.id === b.zoneId))
                  .map((b) => (
                    <BuildingRow key={b.id} b={b} />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
