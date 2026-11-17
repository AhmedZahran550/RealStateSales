'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Customer, CustomerStage, STAGE_CONFIG } from '@/lib/types';
import CrmKanban from '@/components/CrmKanban';
import QuickCustomerModal from '@/components/customers/QuickCustomerModal';
import { formatArabicFollowupDate } from '@/lib/date-utils';
import {
  Phone,
  MessageCircle,
  Calendar,
  DollarSign,
  Plus,
  Search,
  Filter,
  User,
  Edit,
  Trash2,
  Eye,
  Sparkles,
  Clock,
  Layers,
  ChevronDown,
  ArrowUpDown,
  Building2,
} from 'lucide-react';

function CustomersContent() {
  const router = useRouter();
  const {
    currentUser,
    myCustomers,
    myUnits,
    updateCustomer,
    updateCustomerStage,
    addCustomerActivity,
    deleteCustomer,
  } = useApp();

  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') === 'pipeline' ? 'kanban' : 'list';

  // أنماط العرض والنوافذ المنبثقة
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(initialView);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // الفلاتر
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

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    setTodayStart(start);
    setTodayEnd(start + 24 * 60 * 60 * 1000);
  }, []);

  // إحصائيات المتابعات المستحقة
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

  // إحصائيات المراحل
  const stageCounts = useMemo(() => {
    return {
      all: myCustomers.length,
      lead: myCustomers.filter((c) => c.stage === 'lead').length,
      asking: myCustomers.filter((c) => c.stage === 'asking').length,
      viewed: myCustomers.filter((c) => c.stage === 'viewed').length,
      negotiating: myCustomers.filter((c) => c.stage === 'negotiating').length,
      reserved: myCustomers.filter((c) => c.stage === 'reserved').length,
      closed: myCustomers.filter((c) => c.stage === 'closed').length,
      lost: myCustomers.filter((c) => c.stage === 'lost').length,
    };
  }, [myCustomers]);

  // تأجيل / إعادة جدولة سريعة للمتابعة
  const handleQuickReschedule = async (leadId: string, leadName: string, preset: 'today' | 'tomorrow' | '3days') => {
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
    await updateCustomer(leadId, { nextFollowupAt: iso });
    const formatted = d.toLocaleString('ar-EG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    await addCustomerActivity(leadId, 'call', `تم تأجيل موعد المتابعة إلى: ${formatted}`);
    showToast(`تم تحديث موعد متابعة ${leadName} إلى ${formatted}`);
  };

  // قائمة العملاء بعد تطبيق الفلاتر
  const filteredCustomers = useMemo(() => {
    return myCustomers.filter((c) => {
      // المرحلة
      if (selectedStage !== 'all' && c.stage !== selectedStage) return false;

      // حالة المتابعة
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

      // الميزانية
      if (budgetFilter !== 'all' && c.budget) {
        const [minStr, maxStr] = budgetFilter.split('-');
        const min = minStr ? parseFloat(minStr) * 1000000 : 0;
        const max = maxStr ? parseFloat(maxStr) * 1000000 : Infinity;
        if (c.budget < min || c.budget > max) return false;
      }

      // البحث النصي
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

  return (
    <div className="flex flex-col w-full space-y-5 animate-in fade-in duration-300">
      {/* 1. الشريط العلوي وإجراءات سريعة */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-3xl shadow-xs border border-outline-variant">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-primary text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>منظومة علاقات العملاء التشاركية (CRM Team)</span>
          </div>
          <h1 className="text-on-surface font-black tracking-tight mt-1 text-2xl lg:text-3xl">
            إدارة العملاء ومتابعات الفريق
          </h1>
          <p className="text-on-surface-variant mt-1 text-xs sm:text-sm">
            متابعة مشتركة لمشتري العقارات، تسجيل الملاحظات اليومية وتوزيع المهام بدقة وسرعة.
          </p>
        </div>

        <div className="flex items-stretch sm:items-center flex-wrap gap-2.5 w-full sm:w-auto">
          {/* تبديل العرض بين قائمة وكانبان */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-2xl border border-outline-variant/60 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>قائمة تفصيلية</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>مسار الصفقات (Kanban)</span>
            </button>
          </div>

          {/* زر إضافة عميل سريع */}
          <button
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setQuickModalOpen(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold shadow-md cursor-pointer w-full sm:w-auto min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة عميل سريع</span>
          </button>
        </div>
      </div>

      {/* 2. مؤشرات الأداء السريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-xs border border-outline-variant flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-bold text-xs">مستحقة اليوم</span>
            <span className="text-on-surface font-black text-2xl sm:text-3xl mt-1">
              {followupStats.today} <span className="text-xs text-on-surface-variant">عميل</span>
            </span>
            {followupStats.overdue > 0 ? (
              <span className="text-error font-bold text-[11px] mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
                +{followupStats.overdue} متأخرة عن موعدها
              </span>
            ) : (
              <span className="text-success font-semibold text-[11px] mt-1">
                لا توجد متابعات متأخرة
              </span>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-warning-container text-on-warning-container flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-xs border border-outline-variant flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-bold text-xs">معاينات ميدانية</span>
            <span className="text-on-surface font-black text-2xl sm:text-3xl mt-1">
              {stageCounts.viewed} <span className="text-xs text-on-surface-variant">معاينة</span>
            </span>
            <span className="text-primary font-semibold text-[11px] mt-1">
              مرحلة المعاينة على أرض الواقع
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-xs border border-outline-variant flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-bold text-xs">مرحلة التفاوض</span>
            <span className="text-on-surface font-black text-2xl sm:text-3xl mt-1">
              {stageCounts.negotiating} <span className="text-xs text-on-surface-variant">صفقة</span>
            </span>
            <span className="text-on-surface-variant font-semibold text-[11px] mt-1">
              عروض أسعار وشروط سداد
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-xs border border-outline-variant flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-bold text-xs">تم الحجز والتعاقد</span>
            <span className="text-success font-black text-2xl sm:text-3xl mt-1">
              {stageCounts.reserved + stageCounts.closed} <span className="text-xs text-on-surface-variant">صفقة</span>
            </span>
            <span className="text-success font-semibold text-[11px] mt-1">
              نسبة التحويل {myCustomers.length > 0 ? Math.round(((stageCounts.reserved + stageCounts.closed) / myCustomers.length) * 100) : 0}%
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-success-container text-on-success-container flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. شريط الفلاتر والتصنيفات */}
      <div className="bg-surface-container-lowest rounded-3xl p-4 sm:p-5 shadow-xs border border-outline-variant space-y-4">
        {/* أزرار الحالات (Tabs) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
          <button
            type="button"
            onClick={() => setSelectedStage('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedStage === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
          >
            الكل ({myCustomers.length})
          </button>
          {Object.entries(STAGE_CONFIG).map(([stKey, cfg]) => {
            const count = stageCounts[stKey as CustomerStage] || 0;
            const isSelected = selectedStage === stKey;
            return (
              <button
                key={stKey}
                type="button"
                onClick={() => setSelectedStage(stKey as CustomerStage)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <span>{cfg.label}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-bold">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* فلاتر البحث والمتابعة والميزانية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-outline-variant/60">
          {/* البحث */}
          <div className="relative">
            <Search className="w-4 h-4 text-on-surface-variant absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم، رقم الموبايل أو الملاحظات..."
              className="input-base w-full text-xs font-semibold py-2.5 pr-10"
            />
          </div>

          {/* فلتر حالة المتابعة */}
          <div>
            <select
              value={followupFilter}
              onChange={(e) => setFollowupFilter(e.target.value as any)}
              className="input-base w-full text-xs font-bold py-2.5"
            >
              <option value="all">كافة مواعيد المتابعة ({myCustomers.length})</option>
              <option value="today">🔔 مستحقة اليوم ({followupStats.today})</option>
              <option value="overdue">⚠️ متأخرة عن موعدها ({followupStats.overdue})</option>
              <option value="upcoming">📅 قادمة ومجدولة ({followupStats.upcoming})</option>
              <option value="none">⏳ بدون موعد متابعة ({followupStats.none})</option>
            </select>
          </div>

          {/* فلتر الميزانية */}
          <div>
            <select
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value)}
              className="input-base w-full text-xs font-bold py-2.5"
            >
              <option value="all">كافة الميزانيات</option>
              <option value="1-3">1 - 3 مليون ج.م</option>
              <option value="3-6">3 - 6 مليون ج.م</option>
              <option value="6-10">6 - 10 مليون ج.م</option>
              <option value="10-30">أكثر من 10 مليون ج.م</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. عرض البيانات: مسار الصفقات (كانبان) أو القائمة المدمجة */}
      {viewMode === 'kanban' ? (
        <CrmKanban
          customers={filteredCustomers}
          onSelectCustomer={(c) => {
            setEditingCustomer(c);
            setQuickModalOpen(true);
          }}
          onMoveStage={(id, stage) => {
            updateCustomerStage(id, stage);
            showToast('تم تحديث مرحلة العميل');
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((lead) => {
              const stageConfig = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.lead;
              const waClean = (lead.whatsapp || lead.phone).replace(/[^0-9]/g, '');
              const waLink = `https://wa.me/${waClean.startsWith('0') ? '2' + waClean : waClean}`;
              const followup = lead.nextFollowupAt ? formatArabicFollowupDate(lead.nextFollowupAt) : null;

              return (
                <div
                  key={lead.id}
                  className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md border border-outline-variant transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* بيانات العميل والتواصل */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shrink-0">
                      {lead.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-sm sm:text-base text-on-surface truncate">
                          {lead.name}
                        </h3>

                        {/* تغيير سريع للمرحلة من السطر */}
                        <select
                          value={lead.stage}
                          onChange={(e) => {
                            const newSt = e.target.value as CustomerStage;
                            updateCustomerStage(lead.id, newSt);
                            showToast(`تم تغيير مرحلة ${lead.name} إلى ${STAGE_CONFIG[newSt]?.label}`);
                          }}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${stageConfig.bg} ${stageConfig.color} ${stageConfig.border}`}
                        >
                          {Object.entries(STAGE_CONFIG).map(([stKey, cfg]) => (
                            <option key={stKey} value={stKey}>
                              {cfg.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap text-xs text-on-surface-variant">
                        {/* أزرار الاتصال والواتساب الفورية */}
                        <div className="flex items-center gap-1.5 bg-surface-container-low px-2 py-1 rounded-xl">
                          <a
                            href={`tel:${lead.phone}`}
                            className="flex items-center gap-1 font-mono font-bold text-on-surface hover:text-primary transition"
                            dir="ltr"
                            title="اتصال هاتفياً"
                          >
                            <Phone className="w-3.5 h-3.5 text-primary" />
                            <span>{lead.phone}</span>
                          </a>

                          <span className="text-outline">|</span>

                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-success hover:underline font-bold text-[11px]"
                            title="محادثة واتساب فورية"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>واتساب</span>
                          </a>
                        </div>

                        {/* الميزانية إن وجدت */}
                        {lead.budget && (
                          <span className="text-[11px] font-bold text-on-surface bg-surface-container px-2 py-1 rounded-lg">
                            الميزانية: {(lead.budget / 1000000).toFixed(1)} مليون ج.م
                          </span>
                        )}

                        {/* المصدر */}
                        {lead.source && (
                          <span className="text-[11px] text-on-surface-variant">
                            • المصدر: {lead.source}
                          </span>
                        )}
                      </div>

                      {/* موعد المتابعة وأزرار التأجيل السريع */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {followup ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                              followup.isOverdue
                                ? 'bg-error-container text-on-error-container border-error/30'
                                : followup.isToday
                                ? 'bg-warning-container text-on-warning-container border-warning/30'
                                : 'bg-success-container text-on-success-container border-success/30'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>
                              {followup.isOverdue ? '⚠️ متأخرة: ' : followup.isToday ? '🔔 اليوم: ' : '📅 '}
                              {followup.dayName} ({followup.formattedDate} - {followup.formattedTime})
                            </span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>بدون موعد متابعة</span>
                          </span>
                        )}

                        {/* أزرار سريعة لإعادة الجدولة */}
                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleQuickReschedule(lead.id, lead.name, 'today')}
                            className="px-2 py-0.5 rounded-md bg-surface-container hover:bg-surface-container-high font-bold transition cursor-pointer"
                            title="تأجيل ساعتين اليوم"
                          >
                            +ساعتين
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickReschedule(lead.id, lead.name, 'tomorrow')}
                            className="px-2 py-0.5 rounded-md bg-surface-container hover:bg-surface-container-high font-bold transition cursor-pointer"
                            title="تأجيل لغداً 12 ظهراً"
                          >
                            غداً
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickReschedule(lead.id, lead.name, '3days')}
                            className="px-2 py-0.5 rounded-md bg-surface-container hover:bg-surface-container-high font-bold transition cursor-pointer"
                            title="تأجيل بعد 3 أيام"
                          >
                            +3 أيام
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* إجراءات سريعة: مطابقة، تعديل، حذف، تفاصيل */}
                  <div className="flex items-center gap-1.5 self-end lg:self-center shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-outline-variant/50 w-full lg:w-auto justify-end">
                    {/* زر المطابقة العقارية */}
                    <Link
                      href={`/matching?customerId=${lead.id}`}
                      className="btn-tonal px-3 py-2 text-xs font-bold flex items-center gap-1"
                      title="مطابقة الوحدات المعروضة مع طلب العميل"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>المطابقة</span>
                    </Link>

                    {/* تعديل سريع بالنافذة المنبثقة */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCustomer(lead);
                        setQuickModalOpen(true);
                      }}
                      className="btn-tonal p-2.5 text-on-surface hover:text-primary"
                      title="تعديل سريع للعميل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* حذف مع تأكيد */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`هل أنت متأكد من حذف العميل "${lead.name}"؟`)) {
                          const res = await deleteCustomer(lead.id);
                          if (res.success) {
                            showToast(`تم حذف العميل "${lead.name}" بنجاح`);
                          } else {
                            showToast(res.message || 'فشل حذف العميل');
                          }
                        }
                      }}
                      className="btn-tonal p-2.5 text-error hover:bg-error-container hover:text-on-error-container"
                      title="حذف العميل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* تفاصيل كاملة */}
                    <Link
                      href={`/customers/${lead.id}`}
                      className="btn-tonal p-2.5 text-on-surface hover:text-primary"
                      title="عرض صفحة التفاصيل وسجل النشاط"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant">
              <User className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-2" />
              <p className="text-on-surface font-bold text-base">لا يوجد عملاء يطابقون هذه المعايير حالياً.</p>
              <p className="text-xs text-on-surface-variant mt-1">جرّب تغيير فلاتر البحث أو تسجيل عميل جديد بالزر أعلاه.</p>
            </div>
          )}
        </div>
      )}

      {/* نافذة إضافة وتعديل العميل السريعة */}
      <QuickCustomerModal
        isOpen={quickModalOpen}
        onClose={() => {
          setQuickModalOpen(false);
          setEditingCustomer(null);
        }}
        initialCustomer={editingCustomer}
        onSaved={() => {
          showToast(editingCustomer ? 'تم تحديث بيانات العميل بنجاح' : 'تم إضافة العميل بنجاح');
        }}
      />

      {/* إشعار عائم Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-inverse-surface text-inverse-on-surface font-bold text-xs shadow-2xl border border-outline-variant flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-on-surface-variant font-bold">
          جاري تحميل منظومة العملاء...
        </div>
      }
    >
      <CustomersContent />
    </Suspense>
  );
}
