'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Unit, Zone, Customer, UNIT_KIND_LABELS, UNIT_STATUS_CONFIG, STAGE_CONFIG } from '@/lib/types';
import MapViewer from '@/components/MapViewer';
import ZoneDrawer from '@/components/ZoneDrawer';
import UnitCard from '@/components/UnitCard';
import UnitDetailModal from '@/components/UnitDetailModal';
import UnitFormModal from '@/components/UnitFormModal';
import CustomerModal from '@/components/CustomerModal';
import CustomerDetailModal from '@/components/CustomerDetailModal';
import LiveUnitsMap from '@/components/LiveUnitsMap';
import { exportUnitsToExcel } from '@/lib/excel';
import {
  Building2,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Plus,
  FileSpreadsheet,
  ArrowUpRight,
  Clock,
  MessageCircle,
  Phone,
  Sparkles,
  ChevronLeft,
  Search,
  Navigation,
  Layers,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    currentUser,
    zones,
    buildings,
    myUnits,
    services,
    myCustomers,
    addUnit,
    updateUnit,
    deleteUnit,
    addCustomer,
    updateCustomer,
    updateCustomerStage,
    addCustomerActivity,
    deleteCustomer,
    addBuilding,
  } = useApp();

  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [unitFormPresetZone, setUnitFormPresetZone] = useState<number | undefined>(undefined);
  
  // نمط عرض الخريطة: المخطط الهندسي أو الخريطة الحية الجغرافية
  const [mapMode, setMapMode] = useState<'blueprint' | 'live_gps'>('blueprint');

  // حساب مؤشرات الأداء الخاصة بالمستخدم النشط فقط (عزل البيانات)
  const totalUnits = myUnits.length;
  const availableUnits = myUnits.filter((u) => u.status === 'available').length;
  const totalPortfolioValue = myUnits
    .filter((u) => u.status === 'available')
    .reduce((sum, u) => sum + (u.price || 0), 0);

  const totalCustomers = myCustomers.length;
  const activeNegotiations = myCustomers.filter(
    (c) => c.stage === 'negotiating' || c.stage === 'viewed' || c.stage === 'reserved'
  ).length;

  const [urgentFollowups, setUrgentFollowups] = useState<Customer[]>([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    setUrgentFollowups(
      myCustomers.filter((c) => {
        if (!c.nextFollowupAt) return false;
        return new Date(c.nextFollowupAt) <= today;
      })
    );
  }, [myCustomers]);

  const handleAddUnitInZone = (zoneId: number) => {
    setUnitFormPresetZone(zoneId);
    setEditingUnit(null);
    setIsUnitFormOpen(true);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner - Warm Amber & Charcoal */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#2c1d0b] via-[#1a1c24] to-[#121620] text-white p-6 sm:p-8 shadow-2xl border border-amber-600/30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/60 border border-amber-600/40 text-amber-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>نظام الواحة الذكي – عقارات الحي المتميز بمدينة بدر</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              أهلاً بك، {currentUser.fullName}
            </h1>
            <p className="text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
              إدارة خاصة بوحداتك وعروضك العقارية عبر 16 منطقة، خرائط الـ GPS الحية، ومتابعة دقيقة للعملاء.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setEditingUnit(null);
                setUnitFormPresetZone(undefined);
                setIsUnitFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-extrabold text-xs shadow-lg shadow-amber-600/30 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة وحدة جديدة</span>
            </button>

            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs border border-amber-500/30 shadow-sm transition"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>تسجيل عميل جديد</span>
            </button>

            <button
              onClick={() => exportUnitsToExcel(myUnits)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-stone-900/80 hover:bg-stone-900 text-stone-300 font-bold text-xs border border-stone-700 shadow-sm transition"
              title="تصدير جدول وحداتي إلى Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>تصدير إكسيل</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards - Warm Amber Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Units */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#131a26] border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              الوحدات المتاحة للبيع
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#1c1917] dark:text-[#f5f5f4]">
                {availableUnits}
              </span>
              <span className="text-xs text-stone-400 font-semibold">من {totalUnits} وحدة</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100/70 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Portfolio Value */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#131a26] border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              قيمة المعروض الإجمالية
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-amber-700 dark:text-amber-400">
                {(totalPortfolioValue / 1000000).toFixed(1)}
              </span>
              <span className="text-xs font-bold text-stone-500">مليون ج.م</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100/70 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Active CRM Leads */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#131a26] border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              مفاوضات ومعاينات نشطة
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#1c1917] dark:text-[#f5f5f4]">
                {activeNegotiations}
              </span>
              <span className="text-xs text-stone-400 font-semibold">من {totalCustomers} عميل</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Urgent Follow-ups */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#131a26] border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              متابعات اليوم والمتأخرة
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-3xl font-black ${
                  urgentFollowups.length > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-[#1c1917] dark:text-[#f5f5f4]'
                }`}
              >
                {urgentFollowups.length}
              </span>
              <span className="text-xs text-stone-400 font-semibold">متابعة عاجلة</span>
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              urgentFollowups.length > 0
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 animate-pulse'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Interactive Map Section - Blueprint vs Free Live GPS Map */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-[#1c1917] dark:text-[#f5f5f4]">
                خريطة الحي المتميز (16 منطقة + خريطة GPS حية)
              </h2>
              <p className="text-xs text-stone-500">
                استعراض المخطط الهندسي المعتمد أو الانتقال للخريطة الجغرافية الحية المجانية
              </p>
            </div>
          </div>

          {/* Toggle Map Mode: Blueprint vs Live GPS */}
          <div className="flex items-center gap-2">
            <div className="bg-stone-100 dark:bg-stone-800/80 p-1 rounded-2xl flex items-center text-xs font-bold">
              <button
                onClick={() => setMapMode('blueprint')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  mapMode === 'blueprint'
                    ? 'bg-white dark:bg-[#131a26] text-amber-800 dark:text-amber-300 shadow-sm border border-stone-200 dark:border-stone-700'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                مخطط الجهاز
              </button>
              <button
                onClick={() => setMapMode('live_gps')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  mapMode === 'live_gps'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>الخريطة الحية (GPS)</span>
              </button>
            </div>

            <Link
              href="/map"
              className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline px-2"
            >
              <span>شاشة الخريطة الكاملة</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Map Rendering based on Mode */}
        {mapMode === 'blueprint' ? (
          <MapViewer
            zones={zones}
            buildings={buildings}
            units={myUnits}
            services={services}
            onSelectZone={(z) => setSelectedZone(z)}
            selectedZone={selectedZone}
            onSelectUnit={(u) => setSelectedUnit(u)}
            isAdmin={currentUser.role === 'admin'}
          />
        ) : (
          <LiveUnitsMap
            units={myUnits}
            onSelectUnit={(u) => setSelectedUnit(u)}
            selectedUnit={selectedUnit}
            height="520px"
          />
        )}
      </div>

      {/* Two Column Layout: Urgent Follow-ups & Recent Units Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Followups Card */}
        <div className="lg:col-span-1 bg-white dark:bg-[#131a26] rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4] flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                المتابعات المستحقة اليوم
              </h3>
              <Link
                href="/customers"
                className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-bold"
              >
                عرض كل العملاء
              </Link>
            </div>

            {urgentFollowups.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
                <p className="text-xs text-stone-500">رائع! لا توجد متابعات متأخرة اليوم 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentFollowups.slice(0, 4).map((c) => {
                  const waNum = c.whatsapp || (c.phone.startsWith('01') ? `2${c.phone}` : c.phone);
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 hover:border-amber-500 cursor-pointer transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-xs text-[#1c1917] dark:text-[#f5f5f4]">
                            {c.name}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${STAGE_CONFIG[c.stage].bg} ${STAGE_CONFIG[c.stage].color}`}
                          >
                            {STAGE_CONFIG[c.stage].label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`https://wa.me/${waNum}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition"
                            title="واتساب مباشر"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          <a
                            href={`tel:${c.phone}`}
                            className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950 transition"
                            title="اتصال"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      {c.notes && (
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 line-clamp-1">
                          {c.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-amber-500 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            إضافة عميل جديد
          </button>
        </div>

        {/* Available Units Showcase - My Units Only */}
        <div className="lg:col-span-2 bg-white dark:bg-[#131a26] rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-base text-[#1c1917] dark:text-[#f5f5f4]">
                أحدث وحداتي المعروضة بالحي المتميز
              </h3>
            </div>
            <Link
              href="/units"
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>عرض كل وحداتي ({myUnits.length})</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          {myUnits.length === 0 ? (
            <div className="p-10 text-center bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
              <Building2 className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
              <p className="text-xs text-stone-500 font-bold">لا توجد وحدات مسجلة بحسابك حالياً</p>
              <button
                onClick={() => {
                  setEditingUnit(null);
                  setUnitFormPresetZone(undefined);
                  setIsUnitFormOpen(true);
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                + إضافة أول وحدة
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myUnits.slice(0, 4).map((u) => (
                <UnitCard
                  key={u.id}
                  unit={u}
                  onView={(unit) => setSelectedUnit(unit)}
                  onEdit={(unit) => {
                    setEditingUnit(unit);
                    setIsUnitFormOpen(true);
                  }}
                  onDelete={(id) => deleteUnit(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Side Drawer: Zone Drill-down */}
      <ZoneDrawer
        zone={selectedZone}
        onClose={() => setSelectedZone(null)}
        units={myUnits}
        buildings={buildings}
        services={services}
        onSelectUnit={(u) => setSelectedUnit(u)}
        onAddUnitInZone={handleAddUnitInZone}
      />

      {/* Unit Detail Modal */}
      <UnitDetailModal
        unit={selectedUnit}
        onClose={() => setSelectedUnit(null)}
        onEdit={(unit) => {
          setSelectedUnit(null);
          setEditingUnit(unit);
          setIsUnitFormOpen(true);
        }}
        onDelete={(id) => deleteUnit(id)}
      />

      {/* Unit Form Modal */}
      <UnitFormModal
        isOpen={isUnitFormOpen}
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
        }}
        initialUnit={editingUnit}
        defaultZoneId={unitFormPresetZone}
        zones={zones}
        buildings={buildings}
        services={services}
        onAddBuilding={addBuilding}
      />

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={(cData) => addCustomer(cData)}
        units={myUnits}
      />

      {/* Customer Detail Dossier Modal */}
      <CustomerDetailModal
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onUpdateStage={updateCustomerStage}
        onAddActivity={addCustomerActivity}
        onUpdateCustomer={updateCustomer}
        onDeleteCustomer={deleteCustomer}
        units={myUnits}
        onSelectUnit={(u) => {
          setSelectedCustomer(null);
          setSelectedUnit(u);
        }}
      />
    </div>
  );
}
