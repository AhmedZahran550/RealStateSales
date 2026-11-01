'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Unit, Customer, CustomerStage, ActivityType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { formatArabicFollowupDate } from '@/lib/date-utils';
import { createUnitWhatsAppUrl } from '@/lib/shareUtils';
import { zoneDisplayName } from '@/lib/zone-utils';
import { firstImageUrl } from '@/lib/public-utils';
import BrokerStatsBento from '@/components/dashboard/BrokerStatsBento';
import BrokerAgendaTab from '@/components/dashboard/BrokerAgendaTab';
import BrokerPipelineTab from '@/components/dashboard/BrokerPipelineTab';
import BrokerQuickShareTab from '@/components/dashboard/BrokerQuickShareTab';
import {
  Building2,
  Users,
  CheckCircle2,
  Handshake,
  Store,
  MapPin,
  Calendar,
  DollarSign,
  Layers,
  ExternalLink,
  MessageCircle,
  Plus,
  Compass,
  ArrowLeft,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  Phone,
  CheckCircle,
  UserPlus,
  Share2,
  Map,
} from 'lucide-react';

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

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href="/admin/company"
                className="btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 min-h-[40px]"
              >
                <Store className="w-4 h-4" />
                <span>ملف الشركة والشعار</span>
              </Link>
              <Link
                href="/admin/users"
                className="btn-tonal px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 min-h-[40px]"
              >
                <Users className="w-4 h-4" />
                <span>إدارة وسطاء الشركة</span>
              </Link>
              <Link
                href="/admin/zones"
                className="btn-tonal px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 min-h-[40px]"
              >
                <Compass className="w-4 h-4" />
                <span>المناطق والمجاورات</span>
              </Link>
              <Link
                href="/units"
                className="btn-tonal px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 min-h-[40px]"
              >
                <Building2 className="w-4 h-4" />
                <span>استعراض المحفظة</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Key Metrics Row (4 Admin Stats) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {/* Stat 1: Total Users */}
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 hover:border-primary/50 transition-all flex flex-col justify-between group shadow-xs hover:shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-on-surface-variant">فريق الوسطاء المسجلين</span>
                <div className="w-9 h-9 rounded-xl bg-warning-container text-on-warning-container flex items-center justify-center transition-transform group-hover:scale-105">
                  <Users className="w-4 h-4 text-warning" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-on-surface tabular-nums">
                  {companyBrokers.length}
                </span>
                <span className="text-xs text-on-surface-variant font-bold">وسيط معتمد</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-xs">
              <Link href="/admin/users" className="text-warning font-bold hover:underline flex items-center gap-1">
                <span>إدارة وإضافة وسطاء</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Stat 2: Total Units */}
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 hover:border-primary/50 transition-all flex flex-col justify-between group shadow-xs hover:shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-on-surface-variant">محفظة الوحدات المسجلة</span>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-105">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-primary tabular-nums">
                  {myUnits.length}
                </span>
                <span className="text-xs text-on-surface-variant font-bold">وحدة</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-xs">
              <Link href="/admin/zones" className="text-primary font-bold hover:underline flex items-center gap-1">
                <span>{zones.length} منطقة ومجاورة مسجلة</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Stat 3: Available Units & Value */}
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 hover:border-primary/50 transition-all flex flex-col justify-between group shadow-xs hover:shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-on-surface-variant">المعروض المتاح حالياً</span>
                <div className="w-9 h-9 rounded-xl bg-success-container text-success flex items-center justify-center transition-transform group-hover:scale-105">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-success tabular-nums">
                  {availableUnits.length}
                </span>
                <span className="text-xs text-on-surface-variant font-bold">وحدة متاحة</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
              <span>بقيمة: <strong className="text-on-surface">{(totalInventoryValue / 1_000_000).toFixed(1)} مليون ج.م</strong></span>
              <DollarSign className="w-3.5 h-3.5 text-success" />
            </div>
          </div>

          {/* Stat 4: Reserved and Sold Units */}
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 hover:border-primary/50 transition-all flex flex-col justify-between group shadow-xs hover:shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-on-surface-variant">حركات الحجز والتعاقد</span>
                <div className="w-9 h-9 rounded-xl bg-accent-purple-container text-on-accent-purple-container flex items-center justify-center transition-transform group-hover:scale-105">
                  <Handshake className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-on-surface tabular-nums">
                  {totalReservedUnits + totalSoldUnits}
                </span>
                <span className="text-xs text-on-surface-variant font-bold">وحدة</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
              <span>{totalReservedUnits} حجز مؤقت • {totalSoldUnits} مباعة</span>
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>
        </div>

        {/* 3. Brokers Directory Section */}
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-outline-variant/40">
            <div>
              <h2 className="text-on-surface font-black text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-warning" />
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
              <span>إدارة وتعديل الحسابات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {companyBrokers.length === 0 ? (
            <div className="empty-state p-8 text-center rounded-2xl bg-surface-container-low border border-dashed border-outline-variant">
              <div className="empty-state-icon mx-auto w-12 h-12 rounded-2xl bg-warning-container text-on-warning-container flex items-center justify-center mb-3">
                <UserPlus className="w-6 h-6 text-warning" />
              </div>
              <h3 className="empty-state-title font-bold text-sm text-on-surface mb-1">
                لا يوجد وسطاء مسجلين تحت شركتك بعد
              </h3>
              <p className="empty-state-hint text-xs text-on-surface-variant mb-4">
                أضف وسطاء مبيعات لتمكينهم من الاطلاع على وحدات الشركة ومشاركتها مع عملائهم
              </p>
              <Link
                href="/admin/users"
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة وسيط جديد للشركة</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {companyBrokers.map((u) => {
                const cleanPhone = (u.phone || '').replace(/\D/g, '');
                const whatsappUrl = cleanPhone
                  ? `https://wa.me/${cleanPhone.startsWith('2') ? cleanPhone : '2' + cleanPhone}`
                  : null;

                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 hover:border-warning/50 transition-all flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-warning text-on-warning font-black flex items-center justify-center text-sm shadow-xs">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-on-surface">{u.fullName}</h3>
                          <p className="text-xs text-on-surface-variant font-mono font-semibold">@{u.username}</p>
                        </div>
                      </div>
                      <span className="badge badge-success text-[10px]">
                        وسيط معتمد
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-outline-variant/40">
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

                    <div className="flex items-center gap-2 pt-2.5 border-t border-outline-variant/40">
                      <Link
                        href="/admin/users"
                        className="btn-tonal flex-1 py-1.5 px-2 text-center text-xs font-bold inline-flex items-center justify-center gap-1 min-h-[36px]"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>إدارة وتعديل</span>
                      </Link>
                      {whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1.5 px-2 rounded-xl bg-success-container hover:bg-success-container text-on-success-container text-center text-xs font-bold transition inline-flex items-center justify-center gap-1 min-h-[36px]"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-success" />
                          <span>مراسلة واتساب</span>
                        </a>
                      ) : (
                        <span className="flex-1 py-1.5 px-2 rounded-xl bg-surface-container text-on-surface-variant text-center text-[11px] min-h-[36px] flex items-center justify-center">
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
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-outline-variant/40">
            <div>
              <h2 className="text-on-surface font-black text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
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
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {myUnits.slice(0, 6).map((unit) => {
              const img = firstImageUrl(unit.media);
              const statusClass =
                unit.status === 'available'
                  ? 'badge-success'
                  : unit.status === 'reserved'
                  ? 'badge-warning'
                  : 'badge-error';
              const statusLabel =
                unit.status === 'available'
                  ? 'متاح للبيع'
                  : unit.status === 'reserved'
                  ? 'حجز مؤقت'
                  : 'تم البيع';

              return (
                <div
                  key={unit.id}
                  className="rounded-2xl overflow-hidden border border-outline-variant/60 bg-surface-container-low shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
                    {img ? (
                      <img
                        src={img}
                        alt={`قطعة ${unit.plotNo}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full hero-gradient flex flex-col items-center justify-center gap-1.5 text-white/90">
                        <Building2 className="w-8 h-8 opacity-80" />
                        <span className="text-[11px] font-bold opacity-80">معاينة معمارية</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                    <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 max-w-[70%]">
                      <span className="px-2.5 py-1 rounded-lg bg-black/70 text-white font-bold text-[11px] backdrop-blur-md shadow-xs truncate block">
                        {zoneDisplayName(unit.zoneId, zones)} • قطعة {unit.plotNo}
                      </span>
                    </div>
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`badge ${statusClass} text-[10px]`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 left-2.5 flex items-center justify-between text-white">
                      <span className="font-mono text-xs font-bold text-white/90">
                        #BD-{unit.zoneId}-{unit.plotNo}
                      </span>
                      <span className="price-pill text-xs">
                        {unit.price.toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-2.5">
                    <p className="text-xs text-on-surface-variant line-clamp-1 break-words">
                      {unit.description || 'وحدة سكنية متميزة بالحي المتميز'}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40 text-[11px] text-on-surface-variant">
                      <span>
                        المساحة: <strong className="text-on-surface font-mono">{unit.area} م²</strong>
                      </span>
                      <span>
                        الاستلام: <strong className="text-on-surface">{unit.deliveryNote || 'استلام فوري'}</strong>
                      </span>
                    </div>
                    <Link
                      href={`/units/${unit.id}`}
                      className="btn-primary w-full mt-1 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 min-h-[38px]"
                    >
                      <span>عرض التفاصيل الكاملة</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
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
          <CheckCircle2 className="w-4 h-4 text-primary-fixed" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Greeting & Quick Command Actions Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-5 sm:p-6 shadow-xs border border-outline-variant/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                لوحة عمليات الوسيط
              </span>
              <span className="text-on-surface-variant flex items-center gap-1 text-xs">
                <Calendar className="w-3.5 h-3.5" />
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
              className="btn-primary px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 min-h-[40px]"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ تسجيل عميل جديد</span>
            </Link>

            <Link
              href="/matching"
              className="btn-tonal px-3.5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 min-h-[40px]"
            >
              <Handshake className="w-4 h-4 text-primary" />
              <span>مطابقة سريعة</span>
            </Link>

            <Link
              href="/map"
              className="btn-tonal px-3.5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 min-h-[40px]"
            >
              <Map className="w-4 h-4 text-primary" />
              <span>الخريطة</span>
            </Link>

            <Link
              href="/units"
              className="btn-tonal px-3.5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 min-h-[40px]"
            >
              <Building2 className="w-4 h-4 text-primary" />
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
      <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 space-y-4 shadow-xs">
        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-outline-variant/40">
          <button
            type="button"
            onClick={() => setBrokerTab('agenda')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              brokerTab === 'agenda'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <Clock className="w-4 h-4" />
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
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
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
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <Share2 className="w-4 h-4" />
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
