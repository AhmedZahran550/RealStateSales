'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Unit, Customer, CustomerStage, ActivityType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { formatArabicFollowupDate } from '@/lib/date-utils';
import { createUnitWhatsAppUrl } from '@/lib/shareUtils';
import { zoneDisplayName } from '@/lib/zone-utils';
import BrokerStatsBento from '@/components/dashboard/BrokerStatsBento';
import BrokerAgendaTab from '@/components/dashboard/BrokerAgendaTab';
import BrokerPipelineTab from '@/components/dashboard/BrokerPipelineTab';
import BrokerQuickShareTab from '@/components/dashboard/BrokerQuickShareTab';

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

  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (text: string) => {
    setToastMessage(text);
    window.setTimeout(() => setToastMessage(null), 3500);
  };
  const [completedFollowups, setCompletedFollowups] = useState<Record<string, boolean>>({});
  const [brokerTab, setBrokerTab] = useState<'agenda' | 'pipeline' | 'share'>('agenda');

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
                href="/admin/company"
                className="flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-xl bg-primary hover:bg-primary-strong text-on-primary font-bold transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs min-h-[42px]"
              >
                <span className="material-symbols-outlined text-[20px]">store</span>
                <span>ملف الشركة والشعار</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs min-h-[42px] border border-surface-container-high"
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
                    <Link
                      href={`/units/${unit.id}`}
                      className="w-full mt-1 py-1.5 rounded-xl bg-primary hover:bg-primary-strong text-on-primary font-bold text-xs transition flex items-center justify-center"
                    >
                      عرض التفاصيل الكاملة
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
    <div className="flex flex-col w-full space-y-space-md animate-in fade-in duration-300 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px] text-primary-fixed">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Greeting & Quick Command Actions Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-4 sm:p-6 shadow-sm border border-surface-container-high/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                لوحة عمليات الوسيط
              </span>
              <span className="text-on-surface-variant flex items-center gap-1 text-xs">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                {todayArabic}
              </span>
            </div>
            <h1 className="text-on-surface font-black text-xl sm:text-2xl mt-1">
              مرحباً {currentUser.fullName}، لديك{' '}
              <span className="text-primary font-black">{myCustomers.length} عملاء</span> و{' '}
              <span className="text-secondary font-black">{negotiatingCustomers.length} صفقات</span> قيد التفاوض
            </h1>
            <p className="text-on-surface-variant text-xs sm:text-sm">
              إدارة سريعة للمخزون العقاري، متابعة مواعيد الاتصال، ومشاركة عروض الحي المتميز فورياً.
            </p>
          </div>

          {/* Quick Action Commands */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/customers/new"
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-strong text-on-primary font-bold transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs min-h-[40px] inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>+ تسجيل عميل جديد</span>
            </Link>

            <Link
              href="/matching"
              className="px-3.5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold transition shadow-xs text-xs min-h-[40px] inline-flex items-center gap-1.5 border border-surface-container-high"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">handshake</span>
              <span>مطابقة سريعة</span>
            </Link>

            <Link
              href="/map"
              className="px-3.5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold transition shadow-xs text-xs min-h-[40px] inline-flex items-center gap-1.5 border border-surface-container-high"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">map</span>
              <span>الخريطة</span>
            </Link>

            <Link
              href="/units"
              className="px-3.5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold transition shadow-xs text-xs min-h-[40px] inline-flex items-center gap-1.5 border border-surface-container-high"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">apartment</span>
              <span>كل المحفظة</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row (4 Smart Bento Tiles) */}
      <BrokerStatsBento
        urgentFollowupsCount={myCustomers.filter((c) => c.nextFollowupAt).length}
        totalCustomersCount={myCustomers.length}
        negotiatingCustomersCount={negotiatingCustomers.length}
        negotiatingSumFormatted={formattedNegotiatingSum}
        negotiatingSumUnit={negotiatingSumUnit}
        expectedCommissionFormatted={expectedCommission.toLocaleString()}
        availableUnitsCount={availableUnitsCount}
        onSelectTab={setBrokerTab}
      />

      {/* 3. Streamlined Operation Hub (Navigation Tabs) */}
      <div className="card p-4 sm:p-5 space-y-4">
        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-surface-container-high/40">
          <button
            type="button"
            onClick={() => setBrokerTab('agenda')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              brokerTab === 'agenda'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">alarm</span>
            <span>متابعات ومواعيد اليوم</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                brokerTab === 'agenda'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-high text-primary'
              }`}
            >
              {myCustomers.filter((c) => c.nextFollowupAt).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setBrokerTab('pipeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              brokerTab === 'pipeline'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">view_kanban</span>
            <span>مسار الصفقات (Pipeline)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                brokerTab === 'pipeline'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-high text-secondary'
              }`}
            >
              {negotiatingCustomers.length} صفقات
            </span>
          </button>

          <button
            type="button"
            onClick={() => setBrokerTab('share')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              brokerTab === 'share'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span>عروض سريعة للمشاركة بالواتساب</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                brokerTab === 'share'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-high text-success'
              }`}
            >
              {availableUnitsCount} متاح
            </span>
          </button>
        </div>

        {/* Tab Content */}
        {brokerTab === 'agenda' && (
          <BrokerAgendaTab
            customers={myCustomers}
            completedFollowups={completedFollowups}
            onMarkDone={markFollowupDone}
            onSelectCustomer={(c) => router.push(`/customers/${c.id}`)}
            onNewCustomer={() => router.push('/customers/new')}
          />
        )}

        {brokerTab === 'pipeline' && <BrokerPipelineTab customers={myCustomers} />}

        {brokerTab === 'share' && (
          <BrokerQuickShareTab
            units={myUnits}
            zones={zones}
            currentUser={currentUser}
            onSelectUnit={(u) => router.push(`/units/${u.id}`)}
          />
        )}
      </div>
    </div>
  );
}
