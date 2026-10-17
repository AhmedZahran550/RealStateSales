'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Unit, UnitKind, UnitStatus, UNIT_KIND_LABELS } from '@/lib/types';
import UnitDetailModal from '@/components/UnitDetailModal';
import UnitFormModal from '@/components/UnitFormModal';
import BuildingCard from '@/components/buildings/BuildingCard';
import AddBuildingWithUnitsModal from '@/components/buildings/AddBuildingWithUnitsModal';
import { Building2, Home, Plus } from 'lucide-react';
import { exportUnitsToExcel } from '@/lib/excel';
import { formatUnitFullDetails, createUnitWhatsAppUrl } from '@/lib/shareUtils';

export default function UnitsPage() {
  const {
    currentUser,
    isCompanyAdmin,
    isSuperAdmin,
    myUnits,
    users,
    zones,
    buildings,
    services,
    addBuilding,
    addBuildingWithUnits,
    addUnit,
    updateUnit,
    updateUnitStatus,
    deleteUnit,
  } = useApp();

  const [inventoryView, setInventoryView] = useState<'units' | 'buildings'>('units');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'sold'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [targetBuildingIdForUnit, setTargetBuildingIdForUnit] = useState<number | undefined>(undefined);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('brokers_inventory_view_mode');
      if (saved === 'buildings' || saved === 'units') {
        setInventoryView(saved);
      }
    } catch {}
  }, []);

  const handleToggleInventoryView = (mode: 'units' | 'buildings') => {
    setInventoryView(mode);
    try {
      localStorage.setItem('brokers_inventory_view_mode', mode);
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // KPI Calculations
  const totalAvailable = myUnits.filter((u) => u.status === 'available').length;
  const totalReserved = myUnits.filter((u) => u.status === 'reserved').length;
  const totalSold = myUnits.filter((u) => u.status === 'sold').length;

  const totalValue = myUnits
    .filter((u) => u.status === 'available')
    .reduce((acc, u) => acc + (u.price || 0), 0);

  // Filtered units
  const filteredUnits = useMemo(() => {
    return myUnits.filter((unit) => {
      // Status
      if (statusFilter !== 'all' && unit.status !== statusFilter) return false;

      // Zone
      if (zoneFilter !== 'all' && unit.zoneId.toString() !== zoneFilter) return false;

      // Type
      if (typeFilter !== 'all' && unit.unitKind !== typeFilter) return false;

      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchPlot = unit.plotNo.toString().includes(q);
        const matchZone = `منطقة ${unit.zoneId}`.toLowerCase().includes(q);
        const matchDesc = unit.description?.toLowerCase().includes(q);
        const matchCode = `bd-${unit.zoneId}-${unit.plotNo}`.toLowerCase().includes(q);
        const matchCompany = unit.companyName?.toLowerCase().includes(q);
        if (!matchPlot && !matchZone && !matchDesc && !matchCode && !matchCompany) return false;
      }

      return true;
    });
  }, [myUnits, statusFilter, zoneFilter, typeFilter, searchTerm]);

  // حساب بيانات المباني وإحصائيات وحداتها
  const buildingsWithStats = useMemo(() => {
    const userBuildings = isSuperAdmin
      ? buildings
      : buildings.filter((b) => !b.companyId || b.companyId === currentUser?.companyId);

    return userBuildings.map((b) => {
      const bUnits = myUnits.filter(
        (u) => u.buildingId === b.id || (u.zoneId === b.zoneId && u.plotNo === b.plotNo)
      );
      const availableCount = bUnits.filter((u) => u.status === 'available').length;
      const reservedCount = bUnits.filter((u) => u.status === 'reserved').length;
      const soldCount = bUnits.filter((u) => u.status === 'sold').length;
      const totalValue = bUnits
        .filter((u) => u.status === 'available')
        .reduce((acc, u) => acc + (u.price || 0), 0);

      return {
        ...b,
        units: bUnits,
        unitsCount: bUnits.length,
        availableCount,
        reservedCount,
        soldCount,
        totalValue,
      };
    });
  }, [buildings, myUnits, isSuperAdmin, currentUser?.companyId]);

  // تصفية المباني بناءً على معايير البحث والمنطقة والحالة
  const filteredBuildings = useMemo(() => {
    return buildingsWithStats.filter((b) => {
      if (zoneFilter !== 'all' && b.zoneId.toString() !== zoneFilter) return false;
      if (statusFilter === 'available' && b.availableCount === 0) return false;
      if (statusFilter === 'reserved' && b.reservedCount === 0) return false;
      if (statusFilter === 'sold' && b.soldCount === 0) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchPlot = b.plotNo.toString().includes(q);
        const matchZone = `منطقة ${b.zoneId}`.toLowerCase().includes(q);
        const matchNotes = b.notes?.toLowerCase().includes(q);
        const matchCompany = b.companyName?.toLowerCase().includes(q);
        const matchFeat = b.features?.some((f) => f.toLowerCase().includes(q));
        if (!matchPlot && !matchZone && !matchNotes && !matchCompany && !matchFeat) return false;
      }
      return true;
    });
  }, [buildingsWithStats, zoneFilter, statusFilter, searchTerm]);

  const copyUnitDetails = (unit: Unit) => {
    const text = formatUnitFullDetails(unit, currentUser);
    navigator.clipboard.writeText(text);
    showToast(`تم نسخ تفاصيل الوحدة #BD-${unit.zoneId}-${unit.plotNo} وروابط الوسائط بنجاح!`);
  };

  return (
    <div className="flex flex-col w-full space-y-space-lg animate-in fade-in duration-300">
      {/* Toast Notification Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-space-md py-space-sm bg-inverse-surface text-inverse-on-surface rounded-xl shadow-xl flex items-center gap-space-xs font-label-md text-label-md animate-in fade-in">
          <span className="material-symbols-outlined text-primary-fixed text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Top Header & Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tight text-2xl lg:text-3xl">
              سجل الوحدات والمخزون
            </h1>
            <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-bold text-xs">
              {myUnits.length} وحدة مسجلة
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 text-sm">
            تصفح وإدارة المحفظة العقارية الحالية، إرسال العروض الفورية، وتحديث حالات التعاقد.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-space-sm w-full md:w-auto">
          <button
            onClick={() => exportUnitsToExcel(filteredUnits)}
            className="flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low text-on-surface transition-all shadow-sm font-label-md text-label-md font-bold text-xs border border-surface-container-high cursor-pointer min-h-[40px]"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">file_download</span>
            تصدير Excel
          </button>
          {(isCompanyAdmin || isSuperAdmin) && (
            <>
              <button
                onClick={() => setIsBuildingModalOpen(true)}
                className="flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all shadow-xs font-label-md text-label-md font-bold text-xs border border-surface-container-high cursor-pointer min-h-[42px]"
                type="button"
              >
                <Building2 className="w-4 h-4 text-primary" />
                <span>+ إضافة عمارة وقطع</span>
              </button>

              <button
                onClick={() => {
                  setEditingUnit(null);
                  setTargetBuildingIdForUnit(undefined);
                  setIsUnitFormOpen(true);
                }}
                className="flex items-center justify-center gap-space-xs px-space-md sm:px-space-lg py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary transition-all shadow-md font-label-lg text-label-lg font-bold text-xs sm:text-sm cursor-pointer min-h-[42px]"
                type="button"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة وحدة عقارية</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Quick KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-lowest p-3.5 sm:p-space-md rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/40">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold text-xs">
              إجمالي المعروض المتاح
            </span>
            <span className="font-headline-lg text-headline-lg text-primary font-extrabold mt-0.5 text-xl sm:text-2xl">
              {totalAvailable} وحدة
            </span>
            <span className="font-label-sm text-label-sm text-outline mt-0.5 text-[11px]">
              بقيمة {(totalValue / 1000000).toFixed(1)}M ج.م
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[26px]">apartment</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-3.5 sm:p-space-md rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/40">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold text-xs">
              حجز مؤقت (مفاوضات)
            </span>
            <span className="font-headline-lg text-headline-lg text-tertiary font-extrabold mt-0.5 text-xl sm:text-2xl">
              {totalReserved} وحدات
            </span>
            <span className="font-label-sm text-label-sm text-tertiary mt-0.5 text-[11px]">
              متوقع إغلاقها قريباً
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-[26px]">hourglass_top</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-3.5 sm:p-space-md rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/40">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold text-xs">
              تم التعاقد والبيع
            </span>
            <span className="font-headline-lg text-headline-lg text-secondary font-extrabold mt-0.5 text-xl sm:text-2xl">
              {totalSold} وحدات
            </span>
            <span className="font-label-sm text-label-sm text-outline mt-0.5 text-[11px]">
              صفقات ناجحة
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[26px]">verified</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-3.5 sm:p-space-md rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/40">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold text-xs">
              استلام فوري
            </span>
            <span className="font-headline-lg text-headline-lg text-on-surface font-extrabold mt-0.5 text-xl sm:text-2xl">
              {myUnits.filter((u) => u.deliveryNote?.includes('فوري')).length} وحدة
            </span>
            <span className="font-label-sm text-label-sm text-primary font-bold mt-0.5 text-[11px]">
              أعلى طلب للمستثمرين
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[26px]">key</span>
          </div>
        </div>
      </div>

      {/* 3. Search, Filter & Tabs Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-space-md border border-surface-container-high/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-space-md py-space-xs rounded-xl font-label-md text-label-md font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                statusFilter === 'all'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              الكل ({myUnits.length})
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-space-md py-space-xs rounded-xl font-label-md text-label-md font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                statusFilter === 'available'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              متاحة للبيع ({totalAvailable})
            </button>
            <button
              onClick={() => setStatusFilter('reserved')}
              className={`px-space-md py-space-xs rounded-xl font-label-md text-label-md font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                statusFilter === 'reserved'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              حجز مؤقت ({totalReserved})
            </button>
            <button
              onClick={() => setStatusFilter('sold')}
              className={`px-space-md py-space-xs rounded-xl font-label-md text-label-md font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                statusFilter === 'sold'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              تم البيع ({totalSold})
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-2 self-end md:self-auto">
            {/* التبديل بين عرض الوحدات وعرض المباني */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container border border-surface-container-high">
              <button
                type="button"
                onClick={() => handleToggleInventoryView('units')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inventoryView === 'units'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>عرض الوحدات ({filteredUnits.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleInventoryView('buildings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inventoryView === 'buildings'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>عرض المباني ({filteredBuildings.length})</span>
              </button>
            </div>

            {/* عرض شبكة / جدول (خاص بنمط الوحدات فقط) */}
            {inventoryView === 'units' && (
              <div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1 px-space-sm py-1 rounded-lg font-label-sm text-label-sm font-bold transition-all text-xs cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  شبكة
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-space-sm py-1 rounded-lg font-label-sm text-label-sm font-bold transition-all text-xs cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">table_rows</span>
                  جدول
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute right-space-sm top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="كود الوحدة، رقم القطعة، الوصف..."
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151d2a] rounded-xl py-2.5 pr-10 pl-space-sm font-body-sm text-body-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold focus:outline-none focus:ring-2 focus:ring-primary text-xs shadow-xs"
            />
          </div>

          {/* Area / Zone Dropdown */}
          <div className="relative">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151d2a] rounded-xl py-2.5 pr-space-md pl-8 font-body-sm text-body-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer text-xs shadow-xs"
            >
              <option value="all" className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">كافة مناطق الحي المتميز (1-16)</option>
              {Array.from({ length: 16 }, (_, i) => i + 1).map((z) => (
                <option key={z} value={z.toString()} className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">
                  منطقة {z}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Unit Type Dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151d2a] rounded-xl py-2.5 pr-space-md pl-8 font-body-sm text-body-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer text-xs shadow-xs"
            >
              <option value="all" className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">نوع الوحدة (الكل)</option>
              <option value="duplex" className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">دوبلكس</option>
              <option value="ground_garden" className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">أرضي بحديقة</option>
              <option value="floor_1" className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">دور أول متكرر</option>
              <option value="floor_2" className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">دور ثاني</option>
              <option value="floor_3" className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">دور ثالث</option>
              <option value="roof" className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">رووف</option>
              <option value="other" className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">أخرى</option>
            </select>
            <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(zoneFilter !== 'all' || typeFilter !== 'all' || searchTerm) && (
          <div className="flex items-center flex-wrap gap-space-xs pt-1 border-t border-surface-container-low pt-2">
            <span className="font-label-sm text-label-sm text-outline text-xs">الفلاتر المطبقة:</span>
            {zoneFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm text-xs">
                المنطقة: منطقة {zoneFilter}
                <button onClick={() => setZoneFilter('all')} className="hover:text-error cursor-pointer">
                  ✕
                </button>
              </span>
            )}
            {typeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm text-xs">
                النوع: {UNIT_KIND_LABELS[typeFilter as UnitKind] || typeFilter}
                <button onClick={() => setTypeFilter('all')} className="hover:text-error cursor-pointer">
                  ✕
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setZoneFilter('all');
                setTypeFilter('all');
                setSearchTerm('');
              }}
              className="font-label-sm text-label-sm text-secondary hover:underline mr-space-xs font-bold text-xs cursor-pointer"
              type="button"
            >
              إعادة تعيين الكل
            </button>
          </div>
        )}
      </div>

      {/* 4. Inventory Showcase (Buildings View OR Units View) */}
      {inventoryView === 'buildings' ? (
        <div className="space-y-4">
          {filteredBuildings.length > 0 ? (
            filteredBuildings.map((building) => {
              const zone = zones.find((z) => z.id === building.zoneId);
              return (
                <BuildingCard
                  key={building.id}
                  building={building}
                  units={building.units}
                  zoneName={zone ? `${zone.name} - ${zone.direction}` : undefined}
                  canManage={isCompanyAdmin || isSuperAdmin}
                  onAddUnit={(buildingId) => {
                    setTargetBuildingIdForUnit(buildingId);
                    setEditingUnit(null);
                    setIsUnitFormOpen(true);
                  }}
                  onSelectUnit={(unit) => setSelectedUnit(unit)}
                  onEditUnit={(unit) => {
                    setEditingUnit(unit);
                    setIsUnitFormOpen(true);
                  }}
                  onStatusChange={(unitId, newStatus) => updateUnitStatus(unitId, newStatus)}
                  onCopyUnit={copyUnitDetails}
                  defaultExpanded={filteredBuildings.length <= 4}
                />
              );
            })
          ) : (
            <div className="p-12 text-center rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs">
              <Building2 className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-3" />
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface text-base">
                لا توجد مباني أو قطع مطابقة
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                لم يتم العثور على أي عمارة تطابق معايير البحث الحالية. يمكنك إعادة تعيين الفلاتر أو إضافة عمارة جديدة.
              </p>
              {(isCompanyAdmin || isSuperAdmin) && (
                <button
                  onClick={() => setIsBuildingModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container transition cursor-pointer"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                  + إضافة عمارة وقطع جديدة الآن
                </button>
              )}
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {filteredUnits.length > 0 ? (
            filteredUnits.map((unit) => {
              const img =
                unit.media?.[0]?.externalUrl ||
                unit.media?.[0]?.storagePath ||
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

              const statusBadge =
                unit.status === 'available'
                  ? { text: 'متاح للبيع', class: 'bg-primary text-on-primary' }
                  : unit.status === 'reserved'
                  ? { text: 'حجز مؤقت', class: 'bg-tertiary-container text-on-tertiary-container' }
                  : { text: 'تم البيع', class: 'bg-secondary text-on-secondary' };

              return (
                <div
                  key={unit.id}
                  className="bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group border border-surface-container-high/40"
                >
                  {/* Image & Tags Banner */}
                  <div className="relative h-52 w-full overflow-hidden">
                    <img
                      src={img}
                      alt={`قطعة ${unit.plotNo}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/70 via-transparent to-transparent" />

                    <div className="absolute top-space-sm right-space-sm flex flex-col gap-1">
                      <span className={`px-space-sm py-1 rounded-lg font-label-sm text-label-sm font-bold shadow-sm text-xs ${statusBadge.class}`}>
                        {statusBadge.text}
                      </span>
                      <span className="px-space-sm py-0.5 rounded-lg bg-surface-container-lowest/90 backdrop-blur-md text-primary font-label-sm text-label-sm font-bold shadow-sm text-xs">
                        {UNIT_KIND_LABELS[unit.unitKind] || 'شقة سكنية'}
                      </span>
                    </div>

                    <div className="absolute top-space-sm left-space-sm flex flex-col gap-1 items-end">
                      <span className="px-space-sm py-0.5 rounded-lg bg-surface-container-lowest/95 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold shadow-sm flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-[14px] text-tertiary">schedule</span>
                        {unit.deliveryNote || 'استلام فوري'}
                      </span>
                      {unit.companyName && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-900/90 text-white font-label-sm text-label-sm font-bold shadow-sm flex items-center gap-1 text-[11px]">
                          <span className="material-symbols-outlined text-[13px] text-amber-400">corporate_fare</span>
                          {unit.companyName}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-space-sm right-space-sm text-surface-container-lowest flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">location_on</span>
                      <span className="font-label-sm text-label-sm font-bold text-surface-container-lowest drop-shadow text-xs">
                        الحي المتميز • منطقة {unit.zoneId}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-space-md flex flex-col flex-1 justify-between gap-space-md">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between gap-space-xs mb-1">
                        <span className="font-label-sm text-label-sm text-primary font-bold text-xs">
                          كود: #BD-{unit.zoneId}-{unit.plotNo}
                        </span>
                        <span className="font-label-sm text-label-sm text-outline text-xs">
                          قطعة {unit.plotNo}
                        </span>
                      </div>

                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-snug line-clamp-1 text-base">
                        {unit.description || `وحدة فاخرة بالمنطقة ${unit.zoneId}`}
                      </h3>

                      {/* Quick Spec Grid */}
                      <div className="grid grid-cols-2 gap-space-xs bg-surface-container-low rounded-xl p-space-sm mt-space-sm text-center">
                        <div className="flex flex-col items-center">
                          <span className="material-symbols-outlined text-[18px] text-primary">square_foot</span>
                          <span className="font-label-sm text-label-sm text-on-surface font-bold mt-0.5 text-xs">
                            {unit.area} م²
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="material-symbols-outlined text-[18px] text-primary">layers</span>
                          <span className="font-label-sm text-label-sm text-on-surface font-bold mt-0.5 text-xs">
                            {UNIT_KIND_LABELS[unit.unitKind] || 'سكنية'}
                          </span>
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div className="mt-space-md bg-surface-container-lowest flex flex-col gap-1">
                        <div className="flex items-baseline justify-between">
                          <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                            السعر الإجمالي:
                          </span>
                          <span className="font-headline-md text-headline-md text-primary font-extrabold text-lg">
                            {unit.price.toLocaleString()}{' '}
                            <span className="font-label-sm text-label-sm text-on-surface-variant font-normal text-xs">
                              ج.م
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm text-[11px]">
                          <span>
                            المقدم (10%):{' '}
                            <strong className="text-on-surface">
                              {(unit.price * 0.1).toLocaleString()} ج.م
                            </strong>
                          </span>
                          <span>
                            نظام السداد:{' '}
                            <strong className="text-on-surface">
                              {unit.paymentTerms || 'كاش أو تقسيط'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Status Switcher (Brokers & Admins) */}
                    <div className="flex items-center justify-between gap-1 p-1.5 rounded-xl bg-surface-container-low/80 border border-surface-container-high/40 text-[11px]">
                      <span className="font-bold text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">tune</span>
                        الحالة:
                      </span>
                      <div className="flex items-center gap-1">
                        {(['available', 'reserved', 'sold'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              updateUnitStatus(unit.id, st);
                              showToast(`تم تغيير حالة الوحدة #BD-${unit.zoneId}-${unit.plotNo} إلى ${st === 'available' ? 'متاح للبيع' : st === 'reserved' ? 'حجز مؤقت' : 'تم البيع'}`);
                            }}
                            className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer text-[10px] ${
                              unit.status === st
                                ? st === 'available'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : st === 'reserved'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-rose-600 text-white shadow-xs'
                                : 'text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                          >
                            {st === 'available' ? 'متاح' : st === 'reserved' ? 'حجز' : 'مباع'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="pt-space-sm flex flex-col gap-space-xs border-t border-surface-container-low pt-2">
                      <div className="grid grid-cols-2 gap-space-xs">
                        <button
                          onClick={() => copyUnitDetails(unit)}
                          className="copy-unit-btn flex items-center justify-center gap-1 py-space-sm px-space-xs rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-colors font-label-sm text-label-sm font-bold text-xs cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                            content_copy
                          </span>
                          نسخ التفاصيل
                        </button>
                        <a
                          className="flex items-center justify-center gap-1 py-space-sm px-space-xs rounded-xl bg-primary-container hover:bg-primary text-on-primary transition-colors font-label-sm text-label-sm font-bold text-xs"
                          href={createUnitWhatsAppUrl(unit, currentUser)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="material-symbols-outlined text-[16px]">chat</span>
                          واتساب للعميل
                        </a>
                      </div>

                      <button
                        onClick={() => setSelectedUnit(unit)}
                        className="w-full py-space-xs text-center text-primary hover:text-primary-container font-label-sm text-label-sm font-bold transition-colors text-xs cursor-pointer"
                        type="button"
                      >
                        {isCompanyAdmin || isSuperAdmin ? 'تفاصيل كاملة وتعديل مواصفات الوحدة ←' : 'عرض كافة تفاصيل ومشاركة الوحدة ←'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-12 text-center bg-surface-container-lowest rounded-2xl border border-surface-container-high">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">apartment</span>
              <p className="text-on-surface font-bold text-base">لا توجد وحدات تطابق هذه المحددات.</p>
              <p className="text-xs text-on-surface-variant mt-1">جرّب تغيير فلاتر البحث أو اختيار وسيط آخر.</p>
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container-high/40">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-surface-container-high">
                <tr>
                  <th className="p-3.5">كود الوحدة</th>
                  <th className="p-3.5">الشركة العقارية</th>
                  <th className="p-3.5">المنطقة والقطعة</th>
                  <th className="p-3.5">نوع الوحدة</th>
                  <th className="p-3.5">المساحة</th>
                  <th className="p-3.5">السعر</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {filteredUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-3.5 font-bold text-primary">#BD-{u.zoneId}-{u.plotNo}</td>
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {u.companyName || 'محفظة الشركة'}
                    </td>
                    <td className="p-3.5">منطقة {u.zoneId} • قطعة {u.plotNo}</td>
                    <td className="p-3.5">{UNIT_KIND_LABELS[u.unitKind] || 'شقة'}</td>
                    <td className="p-3.5 font-bold">{u.area} م²</td>
                    <td className="p-3.5 font-bold text-on-surface">{u.price.toLocaleString()} ج.م</td>
                    <td className="p-3.5">
                      <select
                        value={u.status}
                        onChange={(e) => {
                          const newSt = e.target.value as UnitStatus;
                          updateUnitStatus(u.id, newSt);
                          showToast(`تم تغيير حالة الوحدة #BD-${u.zoneId}-${u.plotNo} إلى ${newSt === 'available' ? 'متاح للبيع' : newSt === 'reserved' ? 'حجز مؤقت' : 'تم البيع'}`);
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          u.status === 'available'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : u.status === 'reserved'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        }`}
                      >
                        <option value="available">متاحة للبيع</option>
                        <option value="reserved">حجز مؤقت</option>
                        <option value="sold">تم البيع</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedUnit(u)}
                          className="p-1 rounded-lg hover:bg-surface-container text-primary cursor-pointer"
                          title="عرض التفاصيل"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          onClick={() => copyUnitDetails(u)}
                          className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer"
                          title="نسخ التفاصيل"
                        >
                          <span className="material-symbols-outlined text-[18px]">content_copy</span>
                        </button>
                        <a
                          href={createUnitWhatsAppUrl(u, currentUser)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-lg hover:bg-surface-container text-primary cursor-pointer"
                          title="مشاركة عبر واتساب"
                        >
                          <span className="material-symbols-outlined text-[18px]">chat</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <UnitDetailModal
        unit={myUnits.find((u) => u.id === selectedUnit?.id) || selectedUnit}
        onClose={() => setSelectedUnit(null)}
        onEdit={(unit) => {
          setEditingUnit(unit);
          setSelectedUnit(null);
          setIsUnitFormOpen(true);
        }}
        onDelete={(id) => {
          deleteUnit(id);
          setSelectedUnit(null);
        }}
      />

      <UnitFormModal
        isOpen={isUnitFormOpen}
        initialUnit={editingUnit || undefined}
        defaultBuildingId={targetBuildingIdForUnit}
        zones={zones}
        buildings={buildings}
        onAddBuilding={addBuilding}
        onClose={() => {
          setIsUnitFormOpen(false);
          setEditingUnit(null);
          setTargetBuildingIdForUnit(undefined);
        }}
        onSubmit={(unitData) => {
          if (editingUnit) {
            updateUnit(editingUnit.id, unitData);
          } else {
            addUnit(unitData);
          }
          setIsUnitFormOpen(false);
          setEditingUnit(null);
          setTargetBuildingIdForUnit(undefined);
        }}
      />

      <AddBuildingWithUnitsModal
        isOpen={isBuildingModalOpen}
        onClose={() => setIsBuildingModalOpen(false)}
        zones={zones}
        buildings={buildings}
        onAddBuildingWithUnits={async (bData, unitsList) => {
          const res = await addBuildingWithUnits(bData, unitsList);
          if (res.success) {
            showToast(res.message || 'تم حفظ المبنى والوحدات بنجاح!');
          }
          return res;
        }}
        onAddUnitToExisting={async (unitData) => {
          const res = await addUnit(unitData);
          if (res.success) {
            showToast('تمت إضافة الوحدة للعمارة بنجاح!');
          }
          return res;
        }}
      />
    </div>
  );
}
