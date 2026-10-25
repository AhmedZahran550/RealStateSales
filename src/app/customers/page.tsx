'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Customer, CustomerStage, STAGE_CONFIG } from '@/lib/types';
import CrmKanban from '@/components/CrmKanban';
import { formatArabicFollowupDate } from '@/lib/date-utils';

function CustomersContent() {
  const router = useRouter();
  const {
    currentUser,
    myCustomers,
    myUnits,
    addCustomer,
    updateCustomer,
    updateCustomerStage,
    addCustomerActivity,
    deleteCustomer,
  } = useApp();

  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') === 'pipeline' ? 'kanban' : 'list';

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(initialView);
  const [selectedStage, setSelectedStage] = useState<CustomerStage | 'all'>('all');
  const [followupFilter, setFollowupFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming' | 'none'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [budgetFilter, setBudgetFilter] = useState<string>('all');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [todayStart, setTodayStart] = useState<number>(0);
  const [todayEnd, setTodayEnd] = useState<number>(0);

  React.useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    setTodayStart(start);
    setTodayEnd(start + 24 * 60 * 60 * 1000);
  }, []);

  // Follow-up accurate statistics
  const followupStats = useMemo(() => {
    let today = 0;
    let overdue = 0;
    let upcoming = 0;
    let none = 0;

    myCustomers.forEach((c) => {
      if (!c.nextFollowupAt) {
        none++;
        return;
      }
      const t = new Date(c.nextFollowupAt).getTime();
      if (todayStart > 0 && t < todayStart) {
        overdue++;
      } else if (todayStart > 0 && todayEnd > 0 && t >= todayStart && t < todayEnd) {
        today++;
      } else if (todayEnd > 0 && t >= todayEnd) {
        upcoming++;
      }
    });

    return { today, overdue, upcoming, none };
  }, [myCustomers, todayStart, todayEnd]);

  // Stage counts
  const stageCounts = useMemo(() => {
    return {
      all: myCustomers.length,
      lead: myCustomers.filter((c) => c.stage === 'lead').length,
      asking: myCustomers.filter((c) => c.stage === 'asking').length,
      viewed: myCustomers.filter((c) => c.stage === 'viewed').length,
      negotiating: myCustomers.filter((c) => c.stage === 'negotiating').length,
      reserved: myCustomers.filter((c) => c.stage === 'reserved').length,
      closed: myCustomers.filter((c) => c.stage === 'closed').length,
    };
  }, [myCustomers]);

  // Quick reschedule helper
  const handleQuickReschedule = (leadId: string, leadName: string, preset: 'today' | 'tomorrow' | '3days') => {
    const d = new Date();
    if (preset === 'today') {
      d.setHours(d.getHours() + 2);
    } else if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      d.setHours(12, 0, 0, 0);
    } else if (preset === '3days') {
      d.setDate(d.getDate() + 3);
      d.setHours(12, 0, 0, 0);
    }
    const iso = d.toISOString();
    updateCustomer(leadId, { nextFollowupAt: iso });
    const formatted = d.toLocaleString('ar-EG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    addCustomerActivity(leadId, 'call', `تم تأجيل موعد المتابعة إلى: ${formatted}`);
    showToast(`تم تحديث موعد متابعة ${leadName} إلى ${formatted}`);
  };

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return myCustomers.filter((c) => {
      // Stage
      if (selectedStage !== 'all' && c.stage !== selectedStage) return false;

      // Follow-up status filter
      if (followupFilter !== 'all') {
        if (followupFilter === 'none') {
          if (c.nextFollowupAt) return false;
        } else {
          if (!c.nextFollowupAt) return false;
          const t = new Date(c.nextFollowupAt).getTime();
          if (followupFilter === 'overdue' && todayStart > 0 && t >= todayStart) return false;
          if (followupFilter === 'today' && todayStart > 0 && todayEnd > 0 && (t < todayStart || t >= todayEnd)) return false;
          if (followupFilter === 'upcoming' && todayEnd > 0 && t < todayEnd) return false;
        }
      }

      // Budget
      if (budgetFilter !== 'all' && c.budget) {
        const [minStr, maxStr] = budgetFilter.split('-');
        const min = minStr ? parseFloat(minStr) * 1000000 : 0;
        const max = maxStr ? parseFloat(maxStr) * 1000000 : Infinity;
        if (c.budget < min || c.budget > max) return false;
      }

      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchNotes = c.notes?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchNotes) return false;
      }

      return true;
    });
  }, [myCustomers, selectedStage, followupFilter, budgetFilter, searchTerm, todayStart, todayEnd]);

  if (currentUser?.role === 'admin' || currentUser?.role === 'company_admin' || currentUser?.role === 'super_admin') {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-surface-container-lowest rounded-3xl border border-surface-container-high text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-warning-container text-warning flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[32px]">lock</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">خصوصية العملاء وجداول المواعيد</h2>
        <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
          سجل العملاء والمتابعات ومواعيد الاتصال مخصص حصرياً لكل وسيط عقاري على حدة. حفاظاً على أمان بيانات الصفقات وسريتها، لا يمكن لأي مدير شركة أو مدير المنصة الاطلاع على عملاء أو جداول مواعيد الوسطاء.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href={currentUser?.role === 'super_admin' ? '/super-admin' : '/'}
            className="px-5 py-2.5 rounded-xl bg-warning hover:bg-warning text-white font-bold text-xs shadow-md transition"
          >
            العودة للوحة الإدارة
          </Link>
          <Link
            href="/units"
            className="px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface font-bold text-xs hover:bg-surface-container-highest transition"
          >
            استعراض محفظة الوحدات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full space-y-space-lg animate-in fade-in duration-300">
      {/* 1. Header & Action Ribbon */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container-high/40">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-primary text-xs font-bold">
            <span className="material-symbols-outlined text-[18px]">hub</span>
            <span>منظومة إدارة علاقات العملاء الذكية (CRM)</span>
          </div>
          <h1 className="text-on-surface font-extrabold tracking-tight mt-0.5 text-2xl lg:text-3xl">
            إدارة العملاء والمتابعات
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            متابعة وتحديث مسار مشتري العقارات، تسجيل الملاحظات اليومية وتحديد مواعيد المعاينات بدقة.
          </p>
        </div>

        <div className="flex items-stretch sm:items-center flex-wrap gap-2 sm:gap-space-sm w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                viewMode === 'list'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">view_list</span>
              قائمة تفصيلية
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                viewMode === 'kanban'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">view_kanban</span>
              مسار الصفقات (Kanban)
            </button>
          </div>

          <Link
            href="/customers/new"
            className="flex items-center justify-center gap-space-xs w-full sm:w-auto px-space-lg py-2.5 rounded-xl bg-primary hover:bg-primary-strong text-on-primary font-bold transition-all shadow-md text-sm cursor-pointer min-h-[42px]"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>+ إضافة عميل جديد</span>
          </Link>
        </div>
      </div>

      {/* 2. Stats & Pipeline Quick Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/40">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-medium text-xs">
              متابعات اليوم المستحقة
            </span>
            <span className="text-secondary font-bold text-2xl">
              {followupStats.today} عملاء
            </span>
            {followupStats.overdue > 0 ? (
              <span className="text-error flex items-center gap-1 font-bold mt-0.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
                +{followupStats.overdue} متأخرة بحاجة لاتصال
              </span>
            ) : (
              <span className="text-secondary flex items-center gap-1 font-semibold mt-0.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                جاهزة للمتابعة الفورية
              </span>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[28px]">notification_important</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/40">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-medium text-xs">
              معاينات ميدانية نشطة
            </span>
            <span className="text-primary font-bold text-2xl">
              {stageCounts.viewed} زيارات
            </span>
            <span className="text-primary font-semibold mt-0.5 text-[11px]">
              مرحلة المعاينة الميدانية
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[28px]">travel_explore</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/40">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-medium text-xs">
              صفقات قيد التفاوض
            </span>
            <span className="text-tertiary font-bold text-2xl">
              {stageCounts.negotiating} صفقات
            </span>
            <span className="text-on-surface-variant mt-0.5 text-[11px]">
              في مرحلة تقديم العروض
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-tertiary-fixed/40 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-[28px]">payments</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/40">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-medium text-xs">
              نسبة تحويل الصفقات
            </span>
            <span className="text-primary-container font-bold text-2xl">
              {myCustomers.length > 0 ? Math.round(((stageCounts.reserved + stageCounts.closed) / myCustomers.length) * 100) : 0}%
            </span>
            <span className="text-primary font-semibold mt-0.5 text-[11px]">
              معدل الإغلاق والتعاقد
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[28px]">trending_up</span>
          </div>
        </div>
      </div>

      {/* View Mode Switching: Kanban or List */}
      {viewMode === 'kanban' ? (
        <CrmKanban
          customers={myCustomers}
          onSelectCustomer={(c) => router.push(`/customers/${c.id}`)}
          onMoveStage={(id, stage) => updateCustomerStage(id, stage)}
        />
      ) : (
        <div className="flex flex-col space-y-space-md">
          {/* 3. Filter & Stage Segment Controls */}
          <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex flex-col gap-space-md border border-surface-container-high/40">
            {/* Follow-up Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-surface-container-low">
              <span className="text-xs font-bold text-on-surface-variant shrink-0 ml-1">حالة المتابعة:</span>
              <button
                type="button"
                onClick={() => setFollowupFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  followupFilter === 'all'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <span>الكل</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">{myCustomers.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setFollowupFilter('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  followupFilter === 'today'
                    ? 'bg-warning text-white shadow-xs'
                    : 'bg-warning-container  hover:bg-warning-container text-warning  border border-warning '
                }`}
              >
                <span>🔔 مستحقة اليوم</span>
                <span className="px-1.5 py-0.2 rounded-full bg-warning/20 text-[10px] font-black">{followupStats.today}</span>
              </button>
              <button
                type="button"
                onClick={() => setFollowupFilter('overdue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  followupFilter === 'overdue'
                    ? 'bg-error text-white shadow-xs'
                    : 'bg-error-container  hover:bg-error-container text-on-error-container  border border-error '
                }`}
              >
                <span>⚠️ متأخرة</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-black">{followupStats.overdue}</span>
              </button>
              <button
                type="button"
                onClick={() => setFollowupFilter('upcoming')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  followupFilter === 'upcoming'
                    ? 'bg-success text-white shadow-xs'
                    : 'bg-success-container  hover:bg-success-container text-success  border border-success '
                }`}
              >
                <span>📅 قادمة</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-black">{followupStats.upcoming}</span>
              </button>
              <button
                type="button"
                onClick={() => setFollowupFilter('none')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  followupFilter === 'none'
                    ? 'bg-inverse-surface text-white shadow-xs'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant '
                }`}
              >
                <span>⏳ بدون موعد</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px]">{followupStats.none}</span>
              </button>
            </div>

            {/* Stage Tabs */}
            <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedStage('all')}
                className={`px-space-md py-space-sm rounded-xl transition-all flex items-center gap-space-xs text-xs cursor-pointer ${
                  selectedStage === 'all'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold'
                }`}
                type="button"
              >
                <span>الكل</span>
                <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary text-[11px]">
                  {stageCounts.all}
                </span>
              </button>

              <button
                onClick={() => setSelectedStage('lead')}
                className={`px-space-md py-space-sm rounded-xl transition-all flex items-center gap-space-xs text-xs cursor-pointer ${
                  selectedStage === 'lead'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold'
                }`}
                type="button"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>عميل محتمل</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-bold text-[11px]">
                  {stageCounts.lead}
                </span>
              </button>

              <button
                onClick={() => setSelectedStage('viewed')}
                className={`px-space-md py-space-sm rounded-xl transition-all flex items-center gap-space-xs text-xs cursor-pointer ${
                  selectedStage === 'viewed'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold'
                }`}
                type="button"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
                <span>تمت المعاينة</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-tertiary font-bold text-[11px]">
                  {stageCounts.viewed}
                </span>
              </button>

              <button
                onClick={() => setSelectedStage('negotiating')}
                className={`px-space-md py-space-sm rounded-xl transition-all flex items-center gap-space-xs text-xs cursor-pointer ${
                  selectedStage === 'negotiating'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold'
                }`}
                type="button"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
                <span>تفاوض وعروض</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary-container font-bold text-[11px]">
                  {stageCounts.negotiating}
                </span>
              </button>

              <button
                onClick={() => setSelectedStage('reserved')}
                className={`px-space-md py-space-sm rounded-xl transition-all flex items-center gap-space-xs text-xs cursor-pointer ${
                  selectedStage === 'reserved'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold'
                }`}
                type="button"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-outline" />
                <span>حجز مؤقت</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-outline font-bold text-[11px]">
                  {stageCounts.reserved}
                </span>
              </button>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm items-center pt-space-xs border-t border-surface-container-low pt-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute right-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث بالاسم، رقم الموبايل أو الملاحظات..."
                  className="w-full bg-white border border-outline-variant rounded-xl py-2.5 pr-11 pl-space-md font-semibold text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary text-xs shadow-xs"
                />
              </div>

              <div className="relative">
                <select
                  value={budgetFilter}
                  onChange={(e) => setBudgetFilter(e.target.value)}
                  className="w-full bg-white border border-outline-variant rounded-xl py-2.5 pr-space-md pl-8 font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary appearance-none cursor-pointer text-xs shadow-xs"
                >
                  <option value="all">نطاق الميزانية (الكل)</option>
                  <option value="1-3">1 - 3 مليون ج.م</option>
                  <option value="3-6">3 - 6 مليون ج.م</option>
                  <option value="6-10">6 - 10 مليون ج.م</option>
                  <option value="10-30">أكثر من 10 مليون ج.م</option>
                </select>
                <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* 4. Main CRM Client Cards */}
          <div className="flex flex-col gap-space-md">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((lead) => {
                const stageConfig = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.lead;
                const leadTimestamp = lead.nextFollowupAt ? new Date(lead.nextFollowupAt).getTime() : 0;
                const isLeadOverdue = leadTimestamp > 0 && todayStart > 0 && leadTimestamp < todayStart;
                const isLeadToday = leadTimestamp > 0 && todayStart > 0 && todayEnd > 0 && leadTimestamp >= todayStart && leadTimestamp < todayEnd;

                return (
                  <div
                    key={lead.id}
                    className="client-card bg-surface-container-lowest rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 border border-surface-container-high/50 hover:border-primary/40"
                  >
                    {/* 1. هوية العميل والحالة ورقم التليفون وموعد المتابعة */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      {/* الحرف الأول من الاسم */}
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-base sm:text-lg shrink-0 shadow-xs">
                        {lead.name.charAt(0)}
                      </div>

                      {/* البيانات الأساسية */}
                      <div className="flex flex-col min-w-0 flex-1 gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm sm:text-base text-on-surface truncate">
                            {lead.name}
                          </h3>
                          {/* الحالة */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${stageConfig.bg} ${stageConfig.color} ${stageConfig.border}`}>
                            {stageConfig.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-on-surface-variant">
                          {/* رقم التليفون وأيقونات التواصل */}
                          <div className="flex items-center gap-1.5 font-semibold bg-surface-container-low px-2 py-0.5 rounded-lg">
                            <a
                              href={`tel:${lead.phone}`}
                              className="flex items-center gap-1 hover:text-primary transition font-mono text-[12px]"
                              dir="ltr"
                              title="اتصال هاتفياً"
                            >
                              <span className="material-symbols-outlined text-[15px] text-primary">call</span>
                              <span>{lead.phone}</span>
                            </a>
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-success hover:text-success transition"
                              title="محادثة واتساب"
                            >
                              <span className="material-symbols-outlined text-[16px]">chat</span>
                            </a>
                          </div>

                          {/* موعد المتابعة مع اسم اليوم والوقت */}
                          {lead.nextFollowupAt ? (
                            (() => {
                              const followup = formatArabicFollowupDate(lead.nextFollowupAt);
                              return (
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                                  followup.isOverdue
                                    ? 'bg-error-container text-error   border-error  shadow-xs'
                                    : followup.isToday
                                    ? 'bg-warning-container text-warning   border-warning  shadow-xs'
                                    : 'bg-success-container text-success   border-success  shadow-xs'
                                }`}>
                                  <span className="material-symbols-outlined text-[15px]">alarm</span>
                                  <span>
                                    {followup.isOverdue ? '⚠️ متأخرة: ' : followup.isToday ? '🔔 اليوم: ' : '📅 '}
                                    <strong className="text-on-surface font-extrabold">{followup.dayName}</strong>
                                    {' '}
                                    <span>({followup.formattedDate})</span>
                                    {' • '}
                                    <span className="font-mono">{followup.formattedTime}</span>
                                  </span>
                                </div>
                              );
                            })()
                          ) : (
                            <span className="text-[11px] text-on-surface-variant font-medium">بدون موعد متابعة</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. شريط أزرار الإجراءات المنظم: عرض التفاصيل والمطابقة وتعديل وحذف */}
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-surface-container-high/30 w-full md:w-auto">
                      {/* زر عرض التفاصيل */}
                      <Link
                        href={`/customers/${lead.id}`}
                        className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface font-bold transition flex items-center justify-center gap-1.5 text-xs cursor-pointer min-h-[42px]"
                        title="عرض كافة التفاصيل والملاحظات وسجل العميل"
                      >
                        <span className="material-symbols-outlined text-[17px] text-primary">visibility</span>
                        <span>التفاصيل</span>
                      </Link>

                      {/* زر المطابقة */}
                      <Link
                        href={`/matching?customerId=${lead.id}`}
                        className="px-3 py-2 rounded-xl bg-primary hover:bg-primary-strong text-on-primary font-bold transition flex items-center justify-center gap-1.5 shadow-sm text-xs min-h-[42px]"
                        title="مطابقة الوحدات المعروضة لطلب العميل"
                      >
                        <span className="material-symbols-outlined text-[17px]">travel_explore</span>
                        <span>المطابقة</span>
                      </Link>

                      {/* زر التعديل */}
                      <Link
                        href={`/customers/${lead.id}/edit`}
                        className="px-3 py-2 rounded-xl bg-warning-container text-warning border border-warning hover:bg-warning hover:text-white transition-all flex items-center justify-center gap-1 font-bold text-xs shadow-xs cursor-pointer min-h-[42px]"
                        title="تعديل بيانات ومتابعة العميل"
                      >
                        <span className="material-symbols-outlined text-[17px]">edit_note</span>
                        <span>تعديل</span>
                      </Link>

                      {/* زر الحذف */}
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`هل أنت متأكد من حذف العميل "${lead.name}" نهائياً؟`)) {
                            const res = await deleteCustomer(lead.id);
                            if (res.success) {
                              showToast(`تم حذف العميل "${lead.name}" بنجاح`);
                            } else {
                              showToast(res.message || 'فشل حذف العميل');
                            }
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-error-container text-error border border-error hover:bg-error hover:text-white transition-all flex items-center justify-center gap-1 font-bold text-xs shadow-xs cursor-pointer min-h-[42px]"
                        title="حذف العميل"
                      >
                        <span className="material-symbols-outlined text-[17px]">delete_forever</span>
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-surface-container-high">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">group</span>
                <p className="text-on-surface font-bold text-base">لا يوجد عملاء في هذه المرحلة أو الفلتر حالياً.</p>
                <p className="text-xs text-on-surface-variant mt-1">جرّب اختيار فلتر آخر أو تسجيل عميل جديد.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-surface-container-low text-white font-bold text-xs shadow-2xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-on-surface-variant font-bold">جاري تحميل سجل العملاء...</div>}>
      <CustomersContent />
    </React.Suspense>
  );
}
