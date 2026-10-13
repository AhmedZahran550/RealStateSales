'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Unit, UnitKind, UnitStatus, UNIT_KIND_LABELS } from '@/lib/types';
import UnitDetailModal from '@/components/UnitDetailModal';
import UnitFormModal from '@/components/UnitFormModal';
import { exportUnitsToExcel } from '@/lib/excel';

export default function UnitsPage() {
  const {
    currentUser,
    myUnits,
    users,
    zones,
    buildings,
    services,
    addBuilding,
    addUnit,
    updateUnit,
    deleteUnit,
  } = useApp();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'reserved' | 'sold'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [brokerFilter, setBrokerFilter] = useState<string>('all');

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      // فلترة بحسب الوسيط (للمدير العام فقط)
      if (currentUser?.role === 'admin' && brokerFilter !== 'all') {
        if (unit.ownerId !== brokerFilter) return false;
      }

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
        const ownerUser = users.find((u) => u.id === unit.ownerId);
        const matchOwner = ownerUser
          ? ownerUser.username.toLowerCase().includes(q) || ownerUser.fullName.toLowerCase().includes(q)
          : false;
        if (!matchPlot && !matchZone && !matchDesc && !matchCode && !matchOwner) return false;
      }

      return true;
    });
  }, [myUnits, currentUser, users, brokerFilter, statusFilter, zoneFilter, typeFilter, searchTerm]);

  const copyUnitDetails = (unit: Unit) => {
    const consultantName = currentUser?.fullName || 'المستشار العقاري';
    const phoneLine = currentUser?.phone ? `\nللتواصل والاستفسار (هاتف / واتساب): ${currentUser.phone}` : '';
    const servicesLine = unit.services && unit.services.length > 0 ? `\nالمعالم والخدمات المحيطة: ${unit.services.join('، ')}` : '';
    const text = `وحدة عقارية مميزة - الحي المتميز بمدينة بدر
كود الوحدة: #BD-${unit.zoneId}-${unit.plotNo}
المنطقة: منطقة ${unit.zoneId} | قطعة رقم ${unit.plotNo}
النوع: ${UNIT_KIND_LABELS[unit.unitKind] || 'شقة سكنية'}
المساحة: ${unit.area} م² ${unit.gardenArea ? `+ حديقة ${unit.gardenArea} م²` : ''}
السعر: ${unit.price.toLocaleString()} ج.م
نظام السداد: ${unit.paymentTerms || 'كاش أو تقسيط ميسر'}
ميعاد الاستلام: ${unit.deliveryNote || 'استلام فوري'}${servicesLine}
المستشار العقاري: ${consultantName}${phoneLine}`;

    navigator.clipboard.writeText(text);
    showToast(`تم نسخ تفاصيل الوحدة #BD-${unit.zoneId}-${unit.plotNo} بنجاح!`);
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
          {currentUser?.role !== 'admin' && (
            <button
              onClick={() => {
                setEditingUnit(null);
                setIsUnitFormOpen(true);
              }}
              className="flex items-center justify-center gap-space-xs px-space-lg py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary transition-all shadow-md font-label-lg text-label-lg font-bold text-sm cursor-pointer min-h-[42px]"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">add_home_work</span>
              + إضافة وحدة عقارية جديدة
            </button>
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

          <div className="flex items-center gap-space-xs self-end md:self-auto bg-surface-container-low p-1 rounded-xl">
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
        </div>

        {/* Filter Inputs Grid */}
        <div className={`grid grid-cols-1 ${currentUser?.role === 'admin' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-space-sm`}>
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

          {/* Broker Filter (For Admin Only) */}
          {currentUser?.role === 'admin' && (
            <div className="relative">
              <select
                value={brokerFilter}
                onChange={(e) => setBrokerFilter(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151d2a] rounded-xl py-2.5 pr-space-md pl-8 font-body-sm text-body-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer text-xs shadow-xs"
              >
                <option value="all" className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">
                  فلترة بالوسيط (كافة الوسطاء)
                </option>
                {users.map((u) => {
                  const uUnitsCount = myUnits.filter((un) => un.ownerId === u.id).length;
                  return (
                    <option key={u.id} value={u.id} className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">
                      {u.fullName} ({uUnitsCount} وحدة)
                    </option>
                  );
                })}
              </select>
              <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                person
              </span>
            </div>
          )}
        </div>

        {/* Active Filter Chips */}
        {(zoneFilter !== 'all' || typeFilter !== 'all' || brokerFilter !== 'all' || searchTerm) && (
          <div className="flex items-center flex-wrap gap-space-xs pt-1 border-t border-surface-container-low pt-2">
            <span className="font-label-sm text-label-sm text-outline text-xs">الفلاتر المطبقة:</span>
            {currentUser?.role === 'admin' && brokerFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm text-xs">
                الوسيط: {users.find((u) => u.id === brokerFilter)?.fullName || brokerFilter}
                <button onClick={() => setBrokerFilter('all')} className="hover:text-error cursor-pointer">
                  ✕
                </button>
              </span>
            )}
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
                setBrokerFilter('all');
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

      {/* 4. Units Showcase (Grid or Table) */}
      {viewMode === 'grid' ? (
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
                      {currentUser?.role === 'admin' && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-900/90 text-white font-label-sm text-label-sm font-bold shadow-sm flex items-center gap-1 text-[11px]">
                          <span className="material-symbols-outlined text-[13px] text-amber-400">person</span>
                          {users.find((u) => u.id === unit.ownerId)?.fullName || 'غير محدد'}
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
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `مرحباً، إليك تفاصيل الوحدة #BD-${unit.zoneId}-${unit.plotNo} في الحي المتميز:\nالمساحة: ${unit.area} م²\nالسعر: ${unit.price.toLocaleString()} ج.م\nالاستلام: ${unit.deliveryNote || 'استلام فوري'}\nنظام السداد: ${unit.paymentTerms || 'كاش أو تقسيط'}\nللتواصل والمعاينة: ${currentUser?.fullName || 'المستشار العقاري'}${currentUser?.phone ? ` - ${currentUser.phone}` : ''}`
                          )}`}
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
                        {currentUser?.role === 'admin' ? 'عرض كافة تفاصيل ومواصفات الوحدة ←' : 'تفاصيل كاملة وتعديل الوحدة ←'}
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
                  {currentUser?.role === 'admin' && <th className="p-3.5">الوسيط المسؤول</th>}
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
                    {currentUser?.role === 'admin' && (
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {users.find((user) => user.id === u.ownerId)?.fullName || 'غير محدد'}
                      </td>
                    )}
                    <td className="p-3.5">منطقة {u.zoneId} • قطعة {u.plotNo}</td>
                    <td className="p-3.5">{UNIT_KIND_LABELS[u.unitKind] || 'شقة'}</td>
                    <td className="p-3.5 font-bold">{u.area} م²</td>
                    <td className="p-3.5 font-bold text-on-surface">{u.price.toLocaleString()} ج.م</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'available' ? 'bg-primary-fixed text-primary' :
                        u.status === 'reserved' ? 'bg-tertiary-fixed text-tertiary' : 'bg-secondary-fixed text-secondary'
                      }`}>
                        {u.status === 'available' ? 'متاحة' : u.status === 'reserved' ? 'حجز مؤقت' : 'تم البيع'}
                      </span>
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
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `تفاصيل وحدة #BD-${u.zoneId}-${u.plotNo} بالحي المتميز\nالمساحة: ${u.area} م² | السعر: ${u.price.toLocaleString()} ج.م\nللتواصل والاستفسار: ${currentUser?.fullName || 'المستشار العقاري'}${currentUser?.phone ? ` - ${currentUser.phone}` : ''}`
                          )}`}
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
        unit={selectedUnit}
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
        zones={zones}
        buildings={buildings}
        services={services}
        onAddBuilding={addBuilding}
        onClose={() => {
          setIsUnitFormOpen(false);
          setEditingUnit(null);
        }}
        onSubmit={(unitData) => {
          if (editingUnit) {
            updateUnit(editingUnit.id, unitData);
          } else {
            addUnit(unitData);
          }
          setIsUnitFormOpen(false);
          setEditingUnit(null);
        }}
      />
    </div>
  );
}
