'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Unit, Customer, CustomerStage, ActivityType } from '@/lib/types';
import UnitDetailModal from '@/components/UnitDetailModal';
import UnitFormModal from '@/components/UnitFormModal';
import CustomerModal from '@/components/CustomerModal';
import CustomerDetailModal from '@/components/CustomerDetailModal';
import { formatArabicFollowupDate } from '@/lib/date-utils';
import { createUnitWhatsAppUrl } from '@/lib/shareUtils';
import { zoneDisplayName } from '@/lib/zone-utils';

export default function DashboardPage() {
  const {
    currentUser,
    currentCompany,
    users,
    companyUsers,
    myUnits,
    myCustomers,
    zones,
    buildings,
    services,
    addBuilding,
    addUnit,
    updateUnit,
    deleteUnit,
    addCustomer,
    updateCustomer,
    updateCustomerStage,
    addCustomerActivity,
    deleteCustomer,
  } = useApp();

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (text: string) => {
    setToastMessage(text);
    window.setTimeout(() => setToastMessage(null), 3500);
  };
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [completedFollowups, setCompletedFollowups] = useState<Record<string, boolean>>({});

  if (!currentUser) return null;

  // توجيه مدير المنصة Super Admin تلقائياً للوحته المركزية
  if (currentUser.role === 'super_admin') {
    if (typeof window !== 'undefined') {
      window.location.href = '/super-admin';
    }
    return null;
  }

  // Formatted date in Arabic
  const todayArabic = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // ========================================================
  // لوحة تحكم مخصصة لمدير الشركة (Company Admin Dashboard)
  // إدارة مخزون وحدات ومباني ووسطاء الشركة - بدون عملاء أو مواعيد خاصة
  // ========================================================
  if (currentUser.role === 'company_admin' || currentUser.role === 'admin') {
    const availableUnits = myUnits.filter((u) => u.status === 'available');
    const totalInventoryValue = availableUnits.reduce((acc, u) => acc + (u.price || 0), 0);
    const totalReservedUnits = myUnits.filter((u) => u.status === 'reserved').length;
    const totalSoldUnits = myUnits.filter((u) => u.status === 'sold').length;
    const companyBrokers = companyUsers.filter((u) => u.role === 'user');

    return (
      <div className="flex flex-col w-full space-y-space-lg animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px] text-primary-fixed">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
        {/* 1. Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-4 sm:p-6 lg:p-space-lg shadow-sm border border-surface-container-high/40">
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-warning-container blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-sm">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-container text-warning font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                  لوحة إدارة شركة {currentCompany?.name || currentUser.companyName || 'العقارية'}
                </span>
                <span className="text-on-surface-variant flex items-center gap-1 text-xs">
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  {todayArabic}
                </span>
              </div>
              <h1 className="text-on-surface font-extrabold tracking-tight text-xl sm:text-2xl lg:text-3xl">
                مرحباً {currentUser.fullName}، لديك{' '}
                <span className="text-warning font-black">{companyBrokers.length} وسطاء</span> بشركتك و{' '}
                <span className="text-primary font-black">{myUnits.length} وحدة</span> عقارية مسجلة
              </h1>
              <p className="text-on-surface-variant text-xs sm:text-sm">
                أنت المسؤول عن إضافة وحذف وتعديل وحدات ومباني شركتك، وإدارة حسابات وسطاء وفريق مبيعات الشركة.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-space-sm w-full sm:w-auto shrink-0">
              <Link
                href="/admin/users"
                className="flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-xl bg-warning hover:bg-warning text-white font-bold transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs min-h-[42px]"
              >
                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                <span>إدارة وسطاء الشركة</span>
              </Link>
              <Link
                href="/units"
                className="flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs min-h-[42px] border border-surface-container-high"
              >
                <span className="material-symbols-outlined text-[20px]">apartment</span>
                <span>استعراض محفظة الوحدات</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Key Metrics Row (4 Admin Stats) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
          {/* Stat 1: Total Users */}
          <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-container-high/40">
            <div className="flex items-start justify-between mb-space-sm">
              <div className="w-12 h-12 rounded-xl bg-warning-container text-warning flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">manage_accounts</span>
              </div>
              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-warning-container text-warning font-bold text-xs">
                وسطاء الشركة
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant uppercase tracking-wider block mb-1 text-xs">
                فريق الوسطاء المسجلين
              </span>
              <div className="flex items-baseline gap-space-xs">
                <span className="text-on-surface font-extrabold tracking-tight text-3xl">
                  {companyBrokers.length}
                </span>
                <span className="text-on-surface-variant font-bold text-xs">وسيط</span>
              </div>
            </div>
            <div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface-variant border-t border-surface-container-low pt-2">
              <Link href="/admin/users" className="text-warning font-bold hover:underline text-xs flex items-center gap-1">
                <span>إدارة وإضافة وسطاء</span>
                <span className="material-symbols-outlined text-sm">arrow_back</span>
              </Link>
            </div>
          </div>

          {/* Stat 2: Total Units */}
          <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-container-high/40">
            <div className="flex items-start justify-between mb-space-sm">
              <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">apartment</span>
              </div>
              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs">
                محفظة الوحدات
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant uppercase tracking-wider block mb-1 text-xs">
                إجمالي الوحدات المسجلة
              </span>
              <div className="flex items-baseline gap-space-xs">
                <span className="text-on-surface font-extrabold tracking-tight text-3xl">
                  {myUnits.length}
                </span>
                <span className="text-on-surface-variant font-bold text-xs">وحدة</span>
              </div>
            </div>
            <div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface-variant border-t border-surface-container-low pt-2 text-xs">
              <span>تغطي مناطق الحي المتميز</span>
              <span className="material-symbols-outlined text-primary text-[18px]">domain</span>
            </div>
          </div>

          {/* Stat 3: Available Units & Value */}
          <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-container-high/40">
            <div className="flex items-start justify-between mb-space-sm">
              <div className="w-12 h-12 rounded-xl bg-success-container text-success flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">check_circle</span>
              </div>
              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-success-container text-success font-bold text-xs">
                متاح للبيع
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant uppercase tracking-wider block mb-1 text-xs">
                المعروض المتاح حالياً
              </span>
              <div className="flex items-baseline gap-space-xs">
                <span className="text-success font-extrabold tracking-tight text-3xl">
                  {availableUnits.length}
                </span>
                <span className="text-on-surface-variant font-bold text-xs">وحدة</span>
              </div>
            </div>
            <div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface-variant border-t border-surface-container-low pt-2 text-xs">
              <span>بقيمة: <strong className="text-on-surface">{(totalInventoryValue / 1_000_000).toFixed(1)} مليون ج.م</strong></span>
              <span className="material-symbols-outlined text-success text-[18px]">attach_money</span>
            </div>
          </div>

          {/* Stat 4: Reserved and Sold Units */}
          <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-container-high/40">
            <div className="flex items-start justify-between mb-space-sm">
              <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">handshake</span>
              </div>
              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed-dim text-on-secondary-fixed font-bold text-xs">
                حجز وتعاقد
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant uppercase tracking-wider block mb-1 text-xs">
                حجز مؤقت ومباع
              </span>
              <div className="flex items-baseline gap-space-xs">
                <span className="text-secondary font-extrabold tracking-tight text-3xl">
                  {totalReservedUnits + totalSoldUnits}
                </span>
                <span className="text-on-surface-variant font-bold text-xs">وحدة</span>
              </div>
            </div>
            <div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface-variant border-t border-surface-container-low pt-2 text-xs">
              <span>{totalReservedUnits} حجز مؤقت • {totalSoldUnits} مباعة</span>
              <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
            </div>
          </div>
        </div>

        {/* 3. Brokers Directory Section */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-xs mb-space-md pb-space-sm border-b border-surface-container-high/30">
            <div>
              <h2 className="text-on-surface font-bold text-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-warning">group</span>
                <span>وسطاء وفريق عمل الشركة ({companyBrokers.length})</span>
              </h2>
              <p className="text-on-surface-variant text-xs mt-0.5">
                فريق وسطاء شركة {currentCompany?.name || currentUser.companyName || ''} المصرح لهم بعرض ومشاركة وحدات محفظة الشركة وتحديث حالتها
              </p>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-bold text-warning hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>إدارة وتعديل الحسابات بالكامل</span>
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </Link>
          </div>

          {companyBrokers.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-surface-container-low border border-dashed border-surface-container-high">
              <span className="material-symbols-outlined text-4xl text-warning mb-2">person_add</span>
              <h3 className="font-bold text-sm text-on-surface mb-1">لا يوجد وسطاء مسجلين تحت شركتك بعد</h3>
              <p className="text-xs text-on-surface-variant mb-4">
                أضف وسطاء مبيعات لتمكينهم من الاطلاع على وحدات الشركة ومشاركتها مع عملائهم
              </p>
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-warning hover:bg-warning text-white font-bold text-xs shadow-sm transition"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>+ إضافة وسيط جديد للشركة</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
              {companyBrokers.map((u) => {
                const cleanPhone = (u.phone || '').replace(/\D/g, '');
                const whatsappUrl = cleanPhone
                  ? `https://wa.me/${cleanPhone.startsWith('2') ? cleanPhone : '2' + cleanPhone}`
                  : null;

                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/50 hover:border-warning/50 transition-all flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-warning text-white font-bold flex items-center justify-center text-sm shadow-sm">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-on-surface">{u.fullName}</h3>
                          <p className="text-xs text-warning font-mono font-semibold">@{u.username}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-container text-success border border-success">
                        وسيط معتمد
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-surface-container-high/40">
                      <div>
                        <span className="text-[11px] text-on-surface-variant block">رقم الهاتف:</span>
                        <span className="font-bold font-mono text-on-surface" dir="ltr">
                          {u.phone || 'غير مسجل'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-on-surface-variant block">حالة الحساب:</span>
                        <span className="font-bold text-success flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                          نشط بالمنظومة
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-surface-container-high/40">
                      <Link
                        href="/admin/users"
                        className="flex-1 py-1.5 px-2 rounded-lg bg-warning-container hover:bg-warning-container text-warning text-center text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                        <span>إدارة وتعديل</span>
                      </Link>
                      {whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1.5 px-2 rounded-lg bg-success-container hover:bg-success-container text-success text-center text-xs font-bold transition flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">chat</span>
                          <span>مراسلة واتساب</span>
                        </a>
                      ) : (
                        <span className="flex-1 py-1.5 px-2 rounded-lg bg-surface-container text-on-surface-variant text-center text-[11px]">
                          بدون هاتف
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Latest Units Overview */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-xs mb-space-md pb-space-sm border-b border-surface-container-high/30">
            <div>
              <h2 className="text-on-surface font-bold text-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">apartment</span>
                <span>أحدث وحدات محفظة الشركة</span>
              </h2>
              <p className="text-on-surface-variant text-xs mt-0.5">
                استعراض سريع للوحدات المتاحة والمعروضة تحت إدارة الشركة
              </p>
            </div>
            <Link
              href="/units"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>عرض كافة وحدات ومباني الشركة ({myUnits.length})</span>
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {myUnits.slice(0, 6).map((unit) => {
              const img =
                unit.media?.[0]?.externalUrl ||
                unit.media?.[0]?.storagePath ||
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

              const statusBadge =
                unit.status === 'available'
                  ? { text: 'متاح للبيع', bg: 'bg-success text-white' }
                  : unit.status === 'reserved'
                  ? { text: 'حجز مؤقت', bg: 'bg-warning text-white' }
                  : { text: 'تم البيع', bg: 'bg-error text-white' };

              return (
                <div
                  key={unit.id}
                  className="bg-surface-container-low rounded-2xl overflow-hidden border border-surface-container-high/60 shadow-xs flex flex-col justify-between"
                >
                  <div className="relative h-44 w-full">
                    <img src={img} alt={`قطعة ${unit.plotNo}`} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <span className="px-2 py-0.5 rounded-lg bg-surface-container-lowest/90 font-bold text-[11px] text-primary shadow-xs">
                        {zoneDisplayName(unit.zoneId, zones)} • قطعة {unit.plotNo}
                      </span>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 rounded-lg font-bold text-[11px] shadow-xs ${statusBadge.bg}`}>
                        {statusBadge.text}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary">#BD-{unit.zoneId}-{unit.plotNo}</span>
                      <span className="font-bold text-sm text-on-surface">{unit.price.toLocaleString()} ج.م</span>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-1">{unit.description || 'وحدة سكنية متميزة'}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-surface-container-high/50 text-[11px] text-on-surface-variant">
                      <span>المساحة: <strong>{unit.area} م²</strong></span>
                      <span>الاستلام: <strong>{unit.deliveryNote || 'استلام فوري'}</strong></span>
                    </div>
                    <button
                      onClick={() => setSelectedUnit(unit)}
                      className="w-full mt-1 py-1.5 rounded-xl bg-primary hover:bg-primary-strong text-on-primary font-bold text-xs transition cursor-pointer"
                    >
                      عرض التفاصيل الكاملة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal for unit details */}
        <UnitDetailModal
          unit={selectedUnit}
          onClose={() => setSelectedUnit(null)}
          onEdit={(unit) => {
            setSelectedUnit(null);
            setEditingUnit(unit);
            setIsUnitFormOpen(true);
          }}
          onDelete={async (id) => {
            const res = await deleteUnit(id);
            if (res.success) {
              setSelectedUnit(null);
              showToast('تم حذف الوحدة بنجاح');
            } else {
              showToast(res.message || 'فشل حذف الوحدة');
            }
          }}
        />

        {/* نموذج تعديل الوحدة (يعمل الآن في لوحة المدير أيضًا) */}
        <UnitFormModal
          isOpen={isUnitFormOpen}
          initialUnit={editingUnit || undefined}
          zones={zones}
          buildings={buildings}
          onAddBuilding={addBuilding}
          onClose={() => {
            setIsUnitFormOpen(false);
            setEditingUnit(null);
          }}
          onSubmit={async (unitData) => {
            const res = editingUnit
              ? await updateUnit(editingUnit.id, unitData)
              : await addUnit(unitData);
            if (res.success) {
              showToast(editingUnit ? 'تم تحديث الوحدة بنجاح' : 'تمت إضافة الوحدة بنجاح');
              setEditingUnit(null);
            }
            return res;
          }}
        />
      </div>
    );
  }

  // ========================================================
  // لوحة تحكم الوسيط العقاري العادي (Broker Dashboard)
  // ========================================================
  // Dynamic metrics derived purely from live state
  const availableUnitsCount = myUnits.filter((u) => u.status === 'available').length;
  const negotiatingCustomers = myCustomers.filter(
    (c) => c.stage === 'negotiating' || c.stage === 'reserved'
  );
  const negotiatingSum = negotiatingCustomers.reduce((acc, c) => acc + (c.budget || 0), 0);
  const formattedNegotiatingSum =
    negotiatingSum >= 1_000_000
      ? (negotiatingSum / 1_000_000).toFixed(1)
      : negotiatingSum > 0
      ? (negotiatingSum / 1_000).toFixed(0)
      : '0';
  const negotiatingSumUnit = negotiatingSum >= 1_000_000 ? 'مليون ج.م' : negotiatingSum > 0 ? 'ألف ج.م' : 'ج.م';
  const expectedCommission = Math.round(negotiatingSum * 0.025);

  // Urgent followups from actual customers
  const urgentFollowups = myCustomers.slice(0, 4);

  // Pipeline stage counts
  const newLeadsCount = myCustomers.filter((c) => c.stage === 'lead' || c.stage === 'asking').length;
  const viewedCount = myCustomers.filter((c) => c.stage === 'viewed').length;
  const inNegotiationCount = myCustomers.filter((c) => c.stage === 'negotiating').length;
  const closedCount = myCustomers.filter((c) => c.stage === 'reserved' || c.stage === 'closed').length;
  const totalInPipeline = myCustomers.length || 1;

  const leadPct = myCustomers.length > 0 ? Math.round((newLeadsCount / totalInPipeline) * 100) : 0;
  const viewedPct = myCustomers.length > 0 ? Math.round((viewedCount / totalInPipeline) * 100) : 0;
  const negPct = myCustomers.length > 0 ? Math.round((inNegotiationCount / totalInPipeline) * 100) : 0;
  const closedPct = myCustomers.length > 0 ? Math.round((closedCount / totalInPipeline) * 100) : 0;

  const markFollowupDone = (id: string) => {
    setCompletedFollowups((prev) => ({ ...prev, [id]: true }));
    updateCustomerStage(id, 'viewed', 'تم التواصل عبر الهاتف وتحديد موعد معاينة');
  };

  // Recent units from the user's inventory
  const recentUnits = myUnits.slice(0, 3);

  return (
    <div className="flex flex-col w-full space-y-space-lg animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px] text-primary-fixed">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
      {/* 1. Greeting & Quick Actions Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-4 sm:p-6 lg:p-space-lg shadow-sm border border-surface-container-high/40">
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-secondary-container/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-primary font-bold">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                متابعة فورية
              </span>
              <span className="text-on-surface-variant flex items-center gap-1 text-xs">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                {todayArabic}
              </span>
            </div>
            <h1 className="text-on-surface font-extrabold tracking-tight text-xl sm:text-2xl lg:text-3xl">
              مرحباً {currentUser.fullName}، لديك{' '}
              <span className="text-primary font-black">
                {myCustomers.length} عملاء مسجلين
              </span>{' '}
              و <span className="text-secondary font-black">{negotiatingCustomers.length} صفقات</span> قيد التفاوض والحجز
            </h1>
            <p className="text-on-surface-variant text-xs sm:text-sm">
              إدارة المخزون العقاري ومتابعة العملاء المحتملين لمدينة بدر والحي المتميز لحظياً.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-space-sm w-full sm:w-auto shrink-0">
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-xl bg-primary hover:bg-primary-strong text-on-primary font-bold transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs min-h-[42px]"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>+ تسجيل عميل جديد</span>
            </button>
            <Link
              href="/units"
              className="flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary font-bold transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs min-h-[42px]"
            >
              <span className="material-symbols-outlined text-[20px]">apartment</span>
              <span>استعراض ومشاركة الوحدات</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row (4 Stat Bento Tiles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Stat 1: Total Units */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between border border-surface-container-high/40">
          <div className="flex items-start justify-between mb-space-sm">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[26px]">apartment</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-xs">
              <span className="material-symbols-outlined text-[14px]">inventory_2</span>
              المخزون
            </span>
          </div>
          <div>
            <span className="text-on-surface-variant uppercase tracking-wider block mb-1 text-xs">
              إجمالي الوحدات المسجلة
            </span>
            <div className="flex items-baseline gap-space-xs">
              <span className="text-on-surface font-extrabold tracking-tight text-3xl">
                {myUnits.length}
              </span>
              <span className="text-on-surface-variant font-bold text-xs">وحدة</span>
            </div>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface-variant border-t border-surface-container-low pt-2">
            <span className="text-xs">
              منها <strong className="text-primary font-bold">{availableUnitsCount} وحدة متاحة</strong>
            </span>
            <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
          </div>
        </div>

        {/* Stat 2: Active Clients */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between border border-surface-container-high/40">
          <div className="flex items-start justify-between mb-space-sm">
            <div className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[26px]">groups</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-bold text-xs">
              قاعدة العملاء
            </span>
          </div>
          <div>
            <span className="text-on-surface-variant uppercase tracking-wider block mb-1 text-xs">
              العملاء المسجلين
            </span>
            <div className="flex items-baseline gap-space-xs">
              <span className="text-primary font-extrabold tracking-tight text-3xl">
                {myCustomers.length}
              </span>
              <span className="text-on-surface-variant font-bold text-xs">عميل</span>
            </div>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface-variant border-t border-surface-container-low pt-2">
            <span className="text-xs">جاري المتابعة والتنسيق</span>
            <span className="material-symbols-outlined text-primary-container text-[18px]">support_agent</span>
          </div>
        </div>

        {/* Stat 3: Ongoing Pipeline Deals */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between border border-surface-container-high/40">
          <div className="flex items-start justify-between mb-space-sm">
            <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[26px]">handshake</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed-dim text-on-secondary-fixed font-bold text-xs">
              {negotiatingCustomers.length} صفقات
            </span>
          </div>
          <div>
            <span className="text-on-surface-variant uppercase tracking-wider block mb-1 text-xs">
              حجم الصفقات قيد التفاوض
            </span>
            <div className="flex items-baseline gap-space-xs">
              <span className="text-secondary font-extrabold tracking-tight text-3xl">
                {formattedNegotiatingSum}
              </span>
              <span className="text-on-surface-variant font-bold text-xs">{negotiatingSumUnit}</span>
            </div>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface-variant border-t border-surface-container-low pt-2">
            <span className="text-xs">
              {negotiatingCustomers.length > 0 ? 'مراحل تفاوض وحجز جارية' : 'لا توجد مفاوضات حالياً'}
            </span>
            <span className="material-symbols-outlined text-secondary text-[18px]">hourglass_top</span>
          </div>
        </div>

        {/* Stat 4: Expected Commission */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between border border-surface-container-high/40">
          <div className="flex items-start justify-between mb-space-sm">
            <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[26px]">payments</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed font-bold text-xs">
              عمولة 2.5%
            </span>
          </div>
          <div>
            <span className="text-on-surface-variant uppercase tracking-wider block mb-1 text-xs">
              العمولات المتوقعة
            </span>
            <div className="flex items-baseline gap-space-xs">
              <span className="text-tertiary font-extrabold tracking-tight text-3xl">
                {expectedCommission.toLocaleString()}
              </span>
              <span className="text-on-surface-variant font-bold text-xs">ج.م</span>
            </div>
          </div>
          <div className="mt-space-sm pt-space-xs">
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-tertiary h-full rounded-full transition-all duration-700"
                style={{ width: negotiatingCustomers.length > 0 ? '100%' : '0%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Urgent Follow-ups (2 Cols) + Sales Pipeline Funnel (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* Urgent Follow-ups List (2 Columns on large screens) */}
        <div className="lg:col-span-2 flex flex-col bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-xs mb-space-md pb-space-sm border-b border-surface-container-high/30">
            <div className="flex items-center gap-space-xs">
              <span className="w-3 h-3 rounded-full bg-secondary animate-ping" />
              <h2 className="text-on-surface font-bold text-xl">
                متابعات اليوم العاجلة
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-surface-container-high text-primary font-bold text-xs">
                {urgentFollowups.length} مستحقة
              </span>
            </div>
            <span className="text-on-surface-variant text-xs">
              الترتيب حسب موعد الاتصال المحدد
            </span>
          </div>

          <div className="flex flex-col gap-space-md" id="followups-container">
            {urgentFollowups.length > 0 ? (
              urgentFollowups.map((lead, idx) => {
                const isDone = completedFollowups[lead.id];
                const initialLetter = lead.name.charAt(0);
                const tagColor =
                  idx % 3 === 0
                    ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                    : idx % 3 === 1
                    ? 'bg-surface-container text-primary'
                    : 'bg-secondary-fixed text-on-secondary-fixed-variant';

                return (
                  <div
                    key={lead.id}
                    className={`followup-card bg-surface-container-low rounded-xl p-space-md hover:bg-surface-container transition-all shadow-sm ${
                      isDone ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-sm mb-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-11 h-11 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold shrink-0">
                          {initialLetter}
                        </div>
                        <div>
                          <div className="flex items-center gap-space-xs">
                            <h3 className="text-on-surface font-bold text-base">
                              {lead.name}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${tagColor}`}>
                              {lead.budget ? 'مستثمر' : 'متابعة'}
                            </span>
                          </div>
                          <span className="text-on-surface-variant text-xs">
                            {lead.notes || 'اهتمام بوحدات الحي المتميز والموقع الاستراتيجي'} • الميزانية:{' '}
                            {lead.budget ? `${(lead.budget / 1000000).toFixed(1)}M ج.م` : 'غير محددة'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-start sm:self-auto bg-surface-container-lowest px-2.5 py-1 rounded-lg border border-surface-container-high/40 shadow-xs">
                        <span className="material-symbols-outlined text-secondary text-[16px]">alarm</span>
                        <span className="text-on-surface font-bold text-xs">
                          {lead.nextFollowupAt
                            ? (() => {
                                const f = formatArabicFollowupDate(lead.nextFollowupAt);
                                return `${f.dayName} • ${f.formattedTime}`;
                              })()
                            : 'غير محدد'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface-container-lowest rounded-lg p-space-sm mb-space-md">
                      <p className="text-on-surface-variant flex items-center gap-space-xs text-xs">
                        <span className="material-symbols-outlined text-primary text-[16px]">history</span>
                        <strong>آخر تحديث:</strong>{' '}
                        {lead.activities?.[0]?.note || lead.notes || 'عميل مسجل في قاعدة البيانات'}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-space-xs">
                      <div className="flex items-center gap-space-xs w-full sm:w-auto">
                        <a
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-bold transition-colors text-xs min-h-[38px]"
                          href={`tel:${lead.phone}`}
                        >
                          <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                          <span dir="ltr">{lead.phone}</span>
                        </a>
                        <a
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-primary-container text-on-primary font-bold hover:bg-primary transition-colors text-xs min-h-[38px]"
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="material-symbols-outlined text-[16px]">chat</span>
                          واتساب مباشر
                        </a>
                      </div>

                      <button
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-lg bg-surface-container hover:bg-primary hover:text-on-primary text-primary font-bold transition-all text-xs cursor-pointer min-h-[38px]"
                        disabled={isDone}
                        onClick={() => markFollowupDone(lead.id)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isDone ? 'check_circle' : 'check'}
                        </span>
                        {isDone ? 'تم بنجاح وتحديث المرحلة' : 'تم التواصل وتحديد موعد'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-on-surface-variant text-center py-6">لا توجد متابعات مسجلة لليوم.</p>
            )}
          </div>
        </div>

        {/* Sales Pipeline Funnel & Stage Distribution (1 Col) */}
        <div className="flex flex-col bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high/40">
          <div className="flex items-center justify-between mb-space-sm">
            <h2 className="text-on-surface font-bold text-xl">
              قمع المبيعات (Pipeline)
            </h2>
            <span className="material-symbols-outlined text-primary text-[24px]">filter_alt</span>
          </div>
          <p className="text-on-surface-variant mb-space-md text-xs">
            توزيع مراحل العملاء المحتملين ونسب التحويل الفعلية
          </p>

          {/* Visual Funnel Graphic with Stages */}
          <div className="flex flex-col gap-space-sm mb-space-md">
            <div className="relative bg-surface-container-low rounded-xl p-space-sm transition-all hover:bg-surface-container">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-space-xs">
                  <span className="w-3 h-3 rounded-full bg-primary-container" />
                  <span className="text-on-surface font-bold text-xs">
                    1. استفسارات وعملاء جدد
                  </span>
                </div>
                <span className="text-primary font-extrabold text-sm">{newLeadsCount}</span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${leadPct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1 text-on-surface-variant text-[11px]">
                <span>المرحلة الأولى</span>
                <span className="font-bold">{leadPct}%</span>
              </div>
            </div>

            <div className="relative bg-surface-container-low rounded-xl p-space-sm transition-all hover:bg-surface-container">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-space-xs">
                  <span className="w-3 h-3 rounded-full bg-surface-tint" />
                  <span className="text-on-surface font-bold text-xs">
                    2. معاينات وزيارات ميدانية
                  </span>
                </div>
                <span className="text-primary-container font-extrabold text-sm">{viewedCount}</span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div className="bg-primary-container h-full rounded-full" style={{ width: `${viewedPct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1 text-on-surface-variant text-[11px]">
                <span>معدل تحويل للمعاينة</span>
                <span className="font-bold">{viewedPct}%</span>
              </div>
            </div>

            <div className="relative bg-surface-container-low rounded-xl p-space-sm transition-all hover:bg-surface-container">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-space-xs">
                  <span className="w-3 h-3 rounded-full bg-tertiary-container" />
                  <span className="text-on-surface font-bold text-xs">
                    3. مرحلة التفاوض والعروض
                  </span>
                </div>
                <span className="text-tertiary font-extrabold text-sm">{inNegotiationCount}</span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div className="bg-tertiary-container h-full rounded-full" style={{ width: `${negPct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1 text-on-surface-variant text-[11px]">
                <span>معدل تقديم عروض أسعار</span>
                <span className="font-bold">{negPct}%</span>
              </div>
            </div>

            <div className="relative bg-surface-container-low rounded-xl p-space-sm transition-all hover:bg-surface-container">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-space-xs">
                  <span className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-on-surface font-bold text-xs">
                    4. حجز وإبرام عقود
                  </span>
                </div>
                <span className="text-secondary font-extrabold text-sm">{closedCount}</span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div className="bg-secondary-container h-full rounded-full" style={{ width: `${closedPct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1 text-on-surface-variant text-[11px]">
                <span>نسبة الإغلاق الكلية (Closing)</span>
                <span className="font-bold text-secondary">{closedPct}%</span>
              </div>
            </div>
          </div>

          <div className="mt-auto bg-surface-container rounded-xl p-space-md border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[22px]">insights</span>
                <span className="text-on-surface font-bold text-xs">
                  إجمالي العملاء في المسار
                </span>
              </div>
              <span className="text-primary font-black text-sm">{myCustomers.length} عملاء</span>
            </div>
            <p className="text-on-surface-variant mt-1 text-[11px]">
              مزامنة فورية مع قاعدة بيانات سحابية لحظياً.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Recently Added Units Showcase */}
      <div className="flex flex-col bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs mb-space-lg">
          <div>
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[24px]">domain_add</span>
              <h2 className="text-on-surface font-bold text-xl">
                أحدث الوحدات المضافة للمخزون
              </h2>
            </div>
            <p className="text-on-surface-variant text-xs">
              عروض جديدة جاهزة للترويج الفوري مع تفاصيل الأسعار والموقع
            </p>
          </div>
          <Link
            href="/units"
            className="flex items-center gap-1 text-primary hover:text-primary-container font-bold self-start sm:self-auto text-sm"
          >
            عرض جميع الوحدات ({myUnits.length})
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
        </div>

        {/* 3 Unit Showcase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {recentUnits.map((unit) => {
            const img =
              unit.media?.[0]?.externalUrl ||
              unit.media?.[0]?.storagePath ||
              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={unit.id}
                className="group bg-surface-container-low rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col border border-surface-container-high/40"
              >
                <div className="relative h-48 w-full overflow-hidden bg-surface-container">
                  <img
                    src={img}
                    alt={`وحدة ${unit.plotNo}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-space-sm right-space-sm px-2.5 py-1 rounded-lg bg-primary text-on-primary font-bold shadow-md text-xs">
                    {unit.status === 'available' ? 'متاح حصرياً' : unit.status === 'reserved' ? 'حجز مؤقت' : 'تم البيع'}
                  </span>
                  <span className="absolute bottom-space-sm right-space-sm px-2 py-0.5 rounded-md bg-inverse-surface/80 backdrop-blur-sm text-inverse-on-surface text-xs">
                    كود: BD-{unit.zoneId}-{unit.plotNo}
                  </span>
                </div>

                <div className="p-space-md flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-primary font-bold text-xs">
                        الحي المتميز • {zoneDisplayName(unit.zoneId, zones)}
                      </span>
                      <span className="text-on-surface-variant text-xs">
                        قطعة {unit.plotNo}
                      </span>
                    </div>
                    <h3 className="text-on-surface font-bold mb-space-xs line-clamp-1 text-base">
                      {unit.description || `وحدة فاخرة قطعة ${unit.plotNo}`}
                    </h3>

                    <div className="flex items-center gap-space-md my-space-sm text-on-surface-variant text-xs">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-primary">square_foot</span>
                        <span>{unit.area} م²</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-primary">layers</span>
                        <span>{unit.deliveryNote || 'فوري'}</span>
                      </div>
                    </div>

                    <div className="bg-surface-container-lowest rounded-lg p-space-xs mb-space-sm text-[11px] text-on-surface-variant">
                      <strong>نظام السداد:</strong> {unit.paymentTerms || 'كاش أو تقسيط ميسر'}
                    </div>
                  </div>

                  <div className="pt-space-xs flex items-center justify-between">
                    <div>
                      <span className="text-on-surface-variant block text-[11px]">
                        السعر الإجمالي
                      </span>
                      <span className="text-on-surface font-black text-base">
                        {unit.price.toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUnit(unit)}
                        className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-bold transition-all cursor-pointer"
                      >
                        تفاصيل
                      </button>
                      <a
                        href={createUnitWhatsAppUrl(unit, currentUser, undefined, zones)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-primary-container text-on-primary hover:bg-primary transition-all flex items-center justify-center shadow-sm cursor-pointer"
                        title="مشاركة العرض عبر واتساب"
                      >
                        <span className="material-symbols-outlined text-[18px]">share</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Modals */}
      <UnitDetailModal
        unit={selectedUnit}
        onClose={() => setSelectedUnit(null)}
        onEdit={(unit) => {
          setSelectedUnit(null);
          setEditingUnit(unit);
          setIsUnitFormOpen(true);
        }}
        onDelete={async (id) => {
          const res = await deleteUnit(id);
          if (res.success) {
            setSelectedUnit(null);
            showToast('تم حذف الوحدة بنجاح');
          } else {
            showToast(res.message || 'فشل حذف الوحدة');
          }
        }}
      />

      <CustomerDetailModal
        customer={selectedCustomer}
        units={myUnits}
        onClose={() => setSelectedCustomer(null)}
        onUpdateStage={(id, stage, note) => updateCustomerStage(id, stage, note)}
        onAddActivity={(id, type, note) => addCustomerActivity(id, type, note)}
        onUpdateCustomer={(id, data) => updateCustomer(id, data)}
        onDeleteCustomer={async (id) => {
          const res = await deleteCustomer(id);
          if (res.success) {
            setSelectedCustomer(null);
            showToast('تم حذف العميل بنجاح');
          } else {
            showToast(res.message || 'فشل حذف العميل');
          }
        }}
      />

      <UnitFormModal
        isOpen={isUnitFormOpen}
        initialUnit={editingUnit || undefined}
        zones={zones}
        buildings={buildings}
        onAddBuilding={addBuilding}
        onClose={() => {
          setIsUnitFormOpen(false);
          setEditingUnit(null);
        }}
        onSubmit={async (unitData) => {
          const res = editingUnit
            ? await updateUnit(editingUnit.id, unitData)
            : await addUnit(unitData);
          if (res.success) {
            showToast(editingUnit ? 'تم تحديث الوحدة بنجاح' : 'تمت إضافة الوحدة بنجاح');
            setEditingUnit(null);
          }
          return res;
        }}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        units={myUnits}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={(customerData) => addCustomer(customerData)}
      />
    </div>
  );
}
