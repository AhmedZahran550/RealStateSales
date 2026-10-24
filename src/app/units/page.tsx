'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Unit, UnitKind, UnitStatus, UNIT_KIND_LABELS } from '@/lib/types';
import BuildingCard from '@/components/buildings/BuildingCard';
import UnitCard from '@/components/units/UnitCard';
import { Building2, Home, Plus, Edit, ArrowUpDown } from 'lucide-react';
import { exportUnitsToExcel } from '@/lib/excel';
import { formatUnitFullDetails, createUnitWhatsAppUrl } from '@/lib/shareUtils';
import { zoneDisplayName } from '@/lib/zone-utils';

function getZoneSortKey(zoneId: number, zones: any[]): number {
  const z = zones.find((item) => item.id === zoneId);
  if (!z) return zoneId;
  const match = z.name.match(/\d+/);
  if (match) return parseInt(match[0], 10);
  return z.id;
}

export default function UnitsPage() {
  const router = useRouter();
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'zone_asc' | 'plot_asc' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc' | 'newest'>('zone_asc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'sold'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('brokers_inventory_view_mode');
      if (saved === 'buildings' || saved === 'units') {
        setInventoryView(saved);
      }
      const savedViewMode = localStorage.getItem('brokers_units_view_mode');
      if (savedViewMode === 'grid' || savedViewMode === 'table') {
        setViewMode(savedViewMode);
      }
    } catch {}
  }, []);

  const handleToggleInventoryView = (mode: 'units' | 'buildings') => {
    setInventoryView(mode);
    try {
      localStorage.setItem('brokers_inventory_view_mode', mode);
    } catch {}
  };

  const handleToggleViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('brokers_units_view_mode', mode);
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

  // Filtered & sorted units (default order: per areas numbers, then plotNo, then floor)
  const filteredUnits = useMemo(() => {
    const list = myUnits.filter((unit) => {
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
        const matchZone = zoneDisplayName(unit.zoneId, zones).toLowerCase().includes(q);
        const matchDesc = unit.description?.toLowerCase().includes(q);
        const matchCode = `bd-${unit.zoneId}-${unit.plotNo}`.toLowerCase().includes(q);
        const matchCompany = unit.companyName?.toLowerCase().includes(q);
        if (!matchPlot && !matchZone && !matchDesc && !matchCode && !matchCompany) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'zone_asc') {
        const zoneA = getZoneSortKey(a.zoneId, zones);
        const zoneB = getZoneSortKey(b.zoneId, zones);
        if (zoneA !== zoneB) return zoneA - zoneB;
        if (a.plotNo !== b.plotNo) return a.plotNo - b.plotNo;
        return (a.floor ?? 0) - (b.floor ?? 0);
      }
      if (sortBy === 'plot_asc') {
        if (a.plotNo !== b.plotNo) return a.plotNo - b.plotNo;
        return a.zoneId - b.zoneId;
      }
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'area_desc') return b.area - a.area;
      if (sortBy === 'area_asc') return a.area - b.area;
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return 0;
    });
  }, [myUnits, zones, statusFilter, zoneFilter, typeFilter, searchTerm, sortBy]);

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

  // تصفية المباني بناءً على معايير البحث والمنطقة والحالة مع ترتيب افتراضي حسب أرقام المناطق
  const filteredBuildings = useMemo(() => {
    const list = buildingsWithStats.filter((b) => {
      if (zoneFilter !== 'all' && b.zoneId.toString() !== zoneFilter) return false;
      if (statusFilter === 'available' && b.availableCount === 0) return false;
      if (statusFilter === 'reserved' && b.reservedCount === 0) return false;
      if (statusFilter === 'sold' && b.soldCount === 0) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchPlot = b.plotNo.toString().includes(q);
        const matchZone = zoneDisplayName(b.zoneId, zones).toLowerCase().includes(q);
        const matchNotes = b.notes?.toLowerCase().includes(q);
        const matchCompany = b.companyName?.toLowerCase().includes(q);
        const matchFeat = b.features?.some((f) => f.toLowerCase().includes(q));
        if (!matchPlot && !matchZone && !matchNotes && !matchCompany && !matchFeat) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      const zoneA = getZoneSortKey(a.zoneId, zones);
      const zoneB = getZoneSortKey(b.zoneId, zones);
      if (zoneA !== zoneB) return zoneA - zoneB;
      return a.plotNo - b.plotNo;
    });
  }, [buildingsWithStats, zones, zoneFilter, statusFilter, searchTerm]);

  const copyUnitDetails = (unit: Unit) => {
    const text = formatUnitFullDetails(unit, currentUser, zones);
    navigator.clipboard.writeText(text);
    showToast(`تم نسخ تفاصيل الوحدة #BD-${unit.zoneId}-${unit.plotNo} وروابط الوسائط بنجاح!`);
  };

  return (
    <div className="flex flex-col w-full space-y-space-lg animate-in fade-in duration-300">
      {/* Toast Notification Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-space-md py-space-sm bg-inverse-surface text-inverse-on-surface rounded-xl shadow-xl flex items-center gap-space-xs animate-in fade-in">
          <span className="material-symbols-outlined text-primary-fixed text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Top Header & Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm">
            <h1 className="text-on-surface font-extrabold tracking-tight text-2xl lg:text-3xl">
              سجل الوحدات والمخزون
            </h1>
            <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary font-bold text-xs">
              {myUnits.length} وحدة مسجلة
            </span>
          </div>
          <p className="text-on-surface-variant mt-1 text-sm">
            تصفح وإدارة المحفظة العقارية الحالية، إرسال العروض الفورية، وتحديث حالات التعاقد.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-space-sm w-full md:w-auto">
          <button
            onClick={() => exportUnitsToExcel(filteredUnits)}
            className="flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low text-on-surface transition-all shadow-sm font-bold text-xs border border-surface-container-high cursor-pointer min-h-[40px]"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">file_download</span>
            تصدير Excel
          </button>
          {(isCompanyAdmin || isSuperAdmin) && (
            <>
              <Link
                href="/admin/buildings/new"
                className="flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all shadow-xs font-bold text-xs border border-surface-container-high cursor-pointer min-h-[42px]"
              >
                <Building2 className="w-4 h-4 text-primary" />
                <span>+ إضافة عمارة وقطع</span>
              </Link>

              <Link
                href="/units/new"
                className="flex items-center justify-center gap-space-xs px-space-md sm:px-space-lg py-2.5 rounded-xl bg-primary hover:bg-primary-strong text-on-primary transition-all shadow-md font-bold text-xs sm:text-sm cursor-pointer min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة وحدة عقارية</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 2. Quick KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-lowest p-3.5 sm:p-space-md rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/40">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-bold text-xs">
              إجمالي المعروض المتاح
            </span>
            <span className="text-primary font-extrabold mt-0.5 text-xl sm:text-2xl">
              {totalAvailable} وحدة
            </span>
            <span className="text-outline mt-0.5 text-[11px]">
              بقيمة {(totalValue / 1000000).toFixed(1)}M ج.م
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[26px]">apartment</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-3.5 sm:p-space-md rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/40">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-bold text-xs">
              حجز مؤقت (مفاوضات)
            </span>
            <span className="text-tertiary font-extrabold mt-0.5 text-xl sm:text-2xl">
              {totalReserved} وحدات
            </span>
            <span className="text-tertiary mt-0.5 text-[11px]">
              متوقع إغلاقها قريباً
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-[26px]">hourglass_top</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-3.5 sm:p-space-md rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/40">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-bold text-xs">
              تم التعاقد والبيع
            </span>
            <span className="text-secondary font-extrabold mt-0.5 text-xl sm:text-2xl">
              {totalSold} وحدات
            </span>
            <span className="text-outline mt-0.5 text-[11px]">
              صفقات ناجحة
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[26px]">verified</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-3.5 sm:p-space-md rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/40">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-bold text-xs">
              استلام فوري
            </span>
            <span className="text-on-surface font-extrabold mt-0.5 text-xl sm:text-2xl">
              {myUnits.filter((u) => u.deliveryNote?.includes('فوري')).length} وحدة
            </span>
            <span className="text-primary font-bold mt-0.5 text-[11px]">
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
              className={`px-space-md py-space-xs rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
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
              className={`px-space-md py-space-xs rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
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
              className={`px-space-md py-space-xs rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
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
              className={`px-space-md py-space-xs rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
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

            {/* عرض جدول / شبكة (خاص بنمط الوحدات فقط — الجدول هو العرض الافتراضي) */}
            {inventoryView === 'units' && (
              <div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-xl">
                <button
                  onClick={() => handleToggleViewMode('table')}
                  className={`flex items-center gap-1 px-space-sm py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">table_rows</span>
                  جدول
                </button>
                <button
                  onClick={() => handleToggleViewMode('grid')}
                  className={`flex items-center gap-1 px-space-sm py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  شبكة
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute right-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="كود الوحدة، رقم القطعة، الوصف..."
              className="w-full border border-outline-variant bg-white rounded-xl py-2.5 pr-10 pl-space-sm text-on-surface placeholder:text-outline font-semibold focus:outline-none focus:ring-2 focus:ring-primary text-xs shadow-xs"
            />
          </div>

          {/* Area / Zone Dropdown */}
          <div className="relative">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full border border-outline-variant bg-white rounded-xl py-2.5 pr-space-md pl-8 text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer text-xs shadow-xs"
            >
              <option value="all" className="bg-white text-on-surface">كافة المناطق</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id.toString()} className="bg-white text-on-surface">
                  منطقة {z.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Unit Type Dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border border-outline-variant bg-white rounded-xl py-2.5 pr-space-md pl-8 text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer text-xs shadow-xs"
            >
              <option value="all" className="bg-white text-on-surface">نوع الوحدة (الكل)</option>
              <option value="duplex" className="bg-white text-on-surface">دوبلكس</option>
              <option value="ground_garden" className="bg-white text-on-surface">أرضي بحديقة</option>
              <option value="floor_1" className="bg-white text-on-surface">دور أول متكرر</option>
              <option value="floor_2" className="bg-white text-on-surface">دور ثاني</option>
              <option value="floor_3" className="bg-white text-on-surface">دور ثالث</option>
              <option value="roof" className="bg-white text-on-surface">رووف</option>
              <option value="other" className="bg-white text-on-surface">أخرى</option>
            </select>
            <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full border border-outline-variant bg-white rounded-xl py-2.5 pr-space-md pl-8 text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer text-xs shadow-xs"
            >
              <option value="zone_asc" className="bg-white text-on-surface">أرقام المناطق (منطقة 1، 2...) — الافتراضي</option>
              <option value="plot_asc" className="bg-white text-on-surface">رقم القطعة (تصاعدي)</option>
              <option value="price_asc" className="bg-white text-on-surface">السعر (من الأقل للأعلى)</option>
              <option value="price_desc" className="bg-white text-on-surface">السعر (من الأعلى للأقل)</option>
              <option value="area_desc" className="bg-white text-on-surface">المساحة (من الأكبر للأصغر)</option>
              <option value="area_asc" className="bg-white text-on-surface">المساحة (من الأصغر للأكبر)</option>
              <option value="newest" className="bg-white text-on-surface">الأحدث تسجيلاً</option>
            </select>
            <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
              sort
            </span>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(zoneFilter !== 'all' || typeFilter !== 'all' || searchTerm) && (
          <div className="flex items-center flex-wrap gap-space-xs pt-1 border-t border-surface-container-low pt-2">
            <span className="text-outline text-xs">الفلاتر المطبقة:</span>
            {zoneFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-lg bg-surface-container-high text-on-surface text-xs">
                المنطقة: {zoneDisplayName(Number(zoneFilter), zones)}
                <button onClick={() => setZoneFilter('all')} className="hover:text-error cursor-pointer">
                  ✕
                </button>
              </span>
            )}
            {typeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-lg bg-surface-container-high text-on-surface text-xs">
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
              className="text-secondary hover:underline mr-space-xs font-bold text-xs cursor-pointer"
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
              return (
                <BuildingCard
                  key={building.id}
                  building={building}
                  units={building.units}
                  zones={zones}
                  canManage={isCompanyAdmin || isSuperAdmin}
                  onAddUnit={(buildingId) => router.push(`/units/new?buildingId=${buildingId}`)}
                  onSelectUnit={(unit) => router.push(`/units/${unit.id}`)}
                  onEditUnit={(unit) => router.push(`/units/${unit.id}/edit`)}
                  onStatusChange={(unitId, newStatus) => updateUnitStatus(unitId, newStatus)}
                  onCopyUnit={copyUnitDetails}
                  defaultExpanded={filteredBuildings.length <= 4}
                />
              );
            })
          ) : (
            <div className="p-12 text-center rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs">
              <Building2 className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-3" />
              <h3 className="font-bold text-on-surface text-base">
                لا توجد مباني أو قطع مطابقة
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                لم يتم العثور على أي عمارة تطابق معايير البحث الحالية. يمكنك إعادة تعيين الفلاتر أو إضافة عمارة جديدة.
              </p>
              {(isCompanyAdmin || isSuperAdmin) && (
                <Link
                  href="/admin/buildings/new"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-strong transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  + إضافة عمارة وقطع جديدة الآن
                </Link>
              )}
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {filteredUnits.length > 0 ? (
            filteredUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                zones={zones}
                currentUser={currentUser}
                onStatusChange={(unitId, newStatus) => updateUnitStatus(unitId, newStatus)}
                onCopy={copyUnitDetails}
              />
            ))
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
          {filteredUnits.length === 0 ? (
            <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-surface-container-high space-y-2">
              <span className="material-symbols-outlined text-4xl text-outline mb-1">apartment</span>
              <p className="text-on-surface font-bold text-base">لا توجد وحدات تطابق هذه المحددات.</p>
              <p className="text-xs text-on-surface-variant">جرّب تغيير فلاتر البحث أو اختيار منطقة أخرى.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-right text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-surface-container-high">
                  <tr>
                    <th className="p-3.5">الوحدة</th>
                    <th
                      onClick={() => setSortBy(sortBy === 'zone_asc' ? 'plot_asc' : 'zone_asc')}
                      className="p-3.5 cursor-pointer hover:text-primary transition select-none"
                      title="اضغط للترتيب حسب المنطقة أو القطعة"
                    >
                      <div className="flex items-center gap-1">
                        <span>المنطقة والقطعة</span>
                        {sortBy === 'zone_asc' ? (
                          <span className="text-[10px] text-primary font-bold">↑ منطقة</span>
                        ) : sortBy === 'plot_asc' ? (
                          <span className="text-[10px] text-primary font-bold">↑ قطعة</span>
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-outline" />
                        )}
                      </div>
                    </th>
                    <th className="p-3.5">نوع الوحدة والدور</th>
                    <th
                      onClick={() => setSortBy(sortBy === 'area_desc' ? 'area_asc' : 'area_desc')}
                      className="p-3.5 cursor-pointer hover:text-primary transition select-none"
                      title="اضغط للترتيب حسب المساحة"
                    >
                      <div className="flex items-center gap-1">
                        <span>المساحة</span>
                        {sortBy === 'area_desc' ? (
                          <span className="text-[10px] text-primary font-bold">↓</span>
                        ) : sortBy === 'area_asc' ? (
                          <span className="text-[10px] text-primary font-bold">↑</span>
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-outline" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => setSortBy(sortBy === 'price_asc' ? 'price_desc' : 'price_asc')}
                      className="p-3.5 cursor-pointer hover:text-primary transition select-none"
                      title="اضغط للترتيب حسب السعر"
                    >
                      <div className="flex items-center gap-1">
                        <span>السعر الإجمالي</span>
                        {sortBy === 'price_asc' ? (
                          <span className="text-[10px] text-primary font-bold">↑</span>
                        ) : sortBy === 'price_desc' ? (
                          <span className="text-[10px] text-primary font-bold">↓</span>
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-outline" />
                        )}
                      </div>
                    </th>
                    <th className="p-3.5">الشركة</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {filteredUnits.map((u) => {
                    const firstMedia = u.media && u.media[0];
                    return (
                      <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            {firstMedia ? (
                              <img
                                src={firstMedia.externalUrl || firstMedia.storagePath}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover border border-outline-variant shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0 border border-outline-variant">
                                <Home className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <div>
                              <Link
                                href={`/units/${u.id}`}
                                className="font-bold text-primary hover:underline block font-mono"
                              >
                                #BD-{u.zoneId}-{u.plotNo}
                              </Link>
                              <span className="text-[10px] text-on-surface-variant">
                                {u.deliveryNote || 'استلام فوري'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-md bg-primary text-on-primary text-[10px] font-black flex items-center justify-center shrink-0">
                                {u.zoneId}
                              </span>
                              <span className="font-bold text-on-surface">{zoneDisplayName(u.zoneId, zones)}</span>
                            </div>
                            <span className="text-[11px] text-on-surface-variant mt-0.5">قطعة {u.plotNo}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-on-surface block">
                            {UNIT_KIND_LABELS[u.unitKind] || 'شقة'}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {u.floor === 0 ? 'الأرضي' : u.floor ? `الدور ${u.floor}` : 'متكرر'} {u.side ? `• ${u.side}` : ''}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-on-surface block font-mono">{u.area} م²</span>
                          {u.gardenArea ? (
                            <span className="text-[10px] text-success font-semibold block">+ {u.gardenArea} م² حديقة</span>
                          ) : null}
                        </td>
                        <td className="p-3.5">
                          <span className="font-black text-on-surface block font-mono">{u.price.toLocaleString('ar-EG')} ج</span>
                          {u.area > 0 && (
                            <span className="text-[10px] text-on-surface-variant font-semibold block">
                              {Math.round(u.price / u.area).toLocaleString('ar-EG')} ج/م²
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-on-surface">
                          {u.companyName || 'محفظة الشركة'}
                        </td>
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
                                ? 'bg-success-container text-success border-success'
                                : u.status === 'reserved'
                                ? 'bg-warning-container text-warning border-warning'
                                : 'bg-error-container text-on-error-container border-error'
                            }`}
                          >
                            <option value="available">متاحة للبيع</option>
                            <option value="reserved">حجز مؤقت</option>
                            <option value="sold">تم البيع</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/units/${u.id}`}
                              className="p-1.5 rounded-lg hover:bg-surface-container text-primary transition"
                              title="عرض التفاصيل الكاملة"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </Link>
                            {(isCompanyAdmin || isSuperAdmin) && (
                              <Link
                                href={`/units/${u.id}/edit`}
                                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition"
                                title="تعديل بيانات الوحدة"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            )}
                            <button
                              type="button"
                              onClick={() => copyUnitDetails(u)}
                              className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition cursor-pointer"
                              title="نسخ التفاصيل"
                            >
                              <span className="material-symbols-outlined text-[18px]">content_copy</span>
                            </button>
                            <a
                              href={createUnitWhatsAppUrl(u, currentUser, undefined, zones)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg hover:bg-surface-container text-primary transition cursor-pointer"
                              title="مشاركة عبر واتساب"
                            >
                              <span className="material-symbols-outlined text-[18px]">chat</span>
                            </a>
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
      )}
    </div>
  );
}
