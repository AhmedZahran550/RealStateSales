'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Customer,
  CustomerStage,
  ActivityType,
  Unit,
  STAGE_CONFIG,
  UNIT_KIND_LABELS,
} from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { customerService } from '@/services/customerService';
import { formatArabicFollowupDate } from '@/lib/date-utils';
import { zoneDisplayName } from '@/lib/zone-utils';
import {
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  Sparkles,
  Building2,
  Send,
  AlertCircle,
  Edit,
  Trash2,
  ExternalLink,
  ChevronRight,
  UserCheck,
  ArrowRight,
  DollarSign,
  FileText,
  Loader2,
  CheckCircle2,
  Info,
  Check,
} from 'lucide-react';
import UnitCard from '@/components/units/UnitCard';

const STAGE_STEPS: CustomerStage[] = ['lead', 'asking', 'viewed', 'negotiating', 'reserved', 'closed', 'lost'];

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  const {
    customers,
    myUnits,
    units: allUnits,
    zones,
    currentUser,
    updateCustomerStage,
    addCustomerActivity,
    updateCustomer,
    deleteCustomer,
    updateUnitStatus,
  } = useApp();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('call');
  const [newFollowupDate, setNewFollowupDate] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [submittingActivity, setSubmittingActivity] = useState(false);

  const availableUnits = (myUnits && myUnits.length > 0) ? myUnits : allUnits;

  // Sync customer from context or fetch via API
  useEffect(() => {
    const found = customers.find((c) => c.id === customerId);
    if (found) {
      setCustomer(found);
      setLoading(false);
    } else {
      customerService.getCustomerById(customerId).then((fetched) => {
        setCustomer(fetched);
        setLoading(false);
      });
    }
  }, [customers, customerId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-error-container text-error flex items-center justify-center mx-auto">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">العميل غير موجود</h2>
        <p className="text-sm text-on-surface-variant">قد يكون العميل قد حُذف أو لا تملك صلاحية الوصول لملفه.</p>
        <Link href="/customers" className="btn-primary inline-flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة العملاء
        </Link>
      </div>
    );
  }

  const stageConfig = STAGE_CONFIG[customer.stage];
  const interestedUnits = availableUnits.filter((u) => customer.interestedUnitIds?.includes(u.id));

  // WhatsApp click-to-chat URL
  const waNumber = customer.whatsapp || (customer.phone.startsWith('01') ? `2${customer.phone}` : customer.phone);
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `أهلاً بك أستاذ ${customer.name}، معك من شركة الواحة لإدارة عقارات الحي المتميز.`
  )}`;

  const handleStageChange = async (newStage: CustomerStage) => {
    if (newStage === customer.stage) return;
    const note = `تم تغيير مرحلة العميل من [${stageConfig.label}] إلى [${STAGE_CONFIG[newStage].label}]`;
    await updateCustomerStage(customer.id, newStage, note);
    setCustomer((prev) => (prev ? { ...prev, stage: newStage } : null));
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || submittingActivity) return;

    setSubmittingActivity(true);
    try {
      await addCustomerActivity(customer.id, activityType, newNote.trim());
      if (newFollowupDate) {
        const nextIso = new Date(newFollowupDate).toISOString();
        await updateCustomer(customer.id, { nextFollowupAt: nextIso });
        setCustomer((prev) => (prev ? { ...prev, nextFollowupAt: nextIso } : null));
      }
      setNewNote('');
      setNewFollowupDate('');
    } finally {
      setSubmittingActivity(false);
    }
  };

  const handleReschedule = async (newDateIso?: string) => {
    if (!newDateIso) {
      await updateCustomer(customer.id, { nextFollowupAt: undefined });
      await addCustomerActivity(customer.id, 'note', 'تم إلغاء موعد المتابعة الحالي');
      setCustomer((prev) => (prev ? { ...prev, nextFollowupAt: undefined } : null));
      return;
    }
    await updateCustomer(customer.id, { nextFollowupAt: newDateIso });
    const fInfo = formatArabicFollowupDate(newDateIso);
    await addCustomerActivity(
      customer.id,
      'call',
      `تم تعديل موعد المتابعة القادمة إلى: ${fInfo.dayName} (${fInfo.formattedDate}) الساعة ${fInfo.formattedTime}`
    );
    setCustomer((prev) => (prev ? { ...prev, nextFollowupAt: newDateIso } : null));
  };

  const getQuickDateIso = (preset: 'today' | 'tomorrow' | '3days' | 'nextweek') => {
    const d = new Date();
    if (preset === 'today') {
      d.setHours(d.getHours() + 2);
    } else if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      d.setHours(12, 0, 0, 0);
    } else if (preset === '3days') {
      d.setDate(d.getDate() + 3);
      d.setHours(12, 0, 0, 0);
    } else if (preset === 'nextweek') {
      d.setDate(d.getDate() + 7);
      d.setHours(12, 0, 0, 0);
    }
    return d.toISOString();
  };

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف العميل "${customer.name}" نهائياً من قاعدة البيانات؟`)) return;
    setIsDeleting(true);
    try {
      await deleteCustomer(customer.id);
      router.push('/customers');
    } catch {
      setIsDeleting(false);
    }
  };

  const followupInfo = customer.nextFollowupAt ? formatArabicFollowupDate(customer.nextFollowupAt) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="p-2.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container text-on-surface-variant transition"
            title="العودة لقائمة العملاء"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-black text-xl shadow-md">
            {customer.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-on-surface">{customer.name}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${stageConfig.color}`}>
                {stageConfig.label}
              </span>
              {customer.source && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant">
                  {customer.source}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant flex items-center gap-3 mt-0.5">
              <span>مسجل بواسطة: {customer.ownerName || 'الوسيط'}</span>
              <span>•</span>
              <span>تاريخ الإضافة: {new Date(customer.createdAt).toLocaleDateString('ar-EG')}</span>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-success text-on-success font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-success/90 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>مراسلة واتساب</span>
          </a>

          <a
            href={`tel:${customer.phone}`}
            className="px-3.5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-primary-strong transition"
          >
            <Phone className="w-4 h-4" />
            <span>اتصال هاتفي</span>
          </a>

          <Link
            href={`/customers/${customer.id}/edit`}
            className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs border border-outline-variant flex items-center gap-1.5 transition"
          >
            <Edit className="w-4 h-4 text-primary" />
            <span>تعديل</span>
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-2 rounded-xl bg-error-container hover:bg-error-container/80 text-error font-bold text-xs border border-error/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>حذف</span>
          </button>
        </div>
      </div>

      {/* Sales Pipeline Stepper Card */}
      <div className="card p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            مسار تقدم العميل في قمع المبيعات
          </h2>
          <span className="text-[11px] text-on-surface-variant font-medium">
            انقر على أي مرحلة لنقل العميل إليها مباشرة
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {STAGE_STEPS.map((st) => {
            const isCurrent = customer.stage === st;
            const cfg = STAGE_CONFIG[st];
            return (
              <button
                key={st}
                type="button"
                onClick={() => handleStageChange(st)}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                  isCurrent
                    ? 'border-primary bg-primary text-on-primary shadow-sm font-black'
                    : 'border-outline-variant bg-surface hover:bg-surface-container text-on-surface font-semibold text-xs'
                }`}
              >
                <span className="text-xs">{cfg.label}</span>
                {isCurrent && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Info & Reschedule */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick Reschedule & Followup Card */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-2">
              <Clock className="w-4 h-4 text-primary" />
              حالة موعد المتابعة القادمة
            </h2>

            {followupInfo ? (
              <div
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                  followupInfo.isOverdue
                    ? 'bg-error-container text-error border-error/30'
                    : followupInfo.isToday
                    ? 'bg-warning-container text-warning border-warning/30'
                    : 'bg-surface-container text-on-surface border-outline-variant'
                }`}
              >
                <div>
                  <span className="text-[11px] font-bold block">
                    {followupInfo.isOverdue ? '⚠️ متابعة متأخرة واجبة الآن' : followupInfo.isToday ? '🔔 موعد المتابعة اليوم' : '📅 موعد مجدول'}
                  </span>
                  <p className="text-sm font-black mt-0.5">
                    {followupInfo.dayName}، {followupInfo.formattedDate}
                  </p>
                  <p className="text-xs font-mono mt-0.5">الساعة {followupInfo.formattedTime}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleReschedule(undefined)}
                  className="text-xs underline hover:opacity-80 shrink-0 font-bold"
                >
                  إلغاء الموعد
                </button>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant py-1">لا يوجد موعد متابعة مجدول لهذا العميل حالياً.</p>
            )}

            {/* Quick Reschedule Presets */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-on-surface block">تحديد موعد جديد سريعاً:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleReschedule(getQuickDateIso('today'))}
                  className="btn-tonal py-2 text-xs font-bold"
                >
                  اليوم بعد ساعتين
                </button>
                <button
                  type="button"
                  onClick={() => handleReschedule(getQuickDateIso('tomorrow'))}
                  className="btn-tonal py-2 text-xs font-bold"
                >
                  غداً 12:00 ظهراً
                </button>
                <button
                  type="button"
                  onClick={() => handleReschedule(getQuickDateIso('3days'))}
                  className="btn-tonal py-2 text-xs font-bold"
                >
                  بعد 3 أيام
                </button>
                <button
                  type="button"
                  onClick={() => handleReschedule(getQuickDateIso('nextweek'))}
                  className="btn-tonal py-2 text-xs font-bold"
                >
                  الأسبوع القادم
                </button>
              </div>
            </div>
          </div>

          {/* Client Details Summary Card */}
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-2">
              <UserCheck className="w-4 h-4 text-primary" />
              البيانات والميزانية
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">رقم الهاتف:</span>
                <span className="font-mono font-bold text-on-surface" dir="ltr">
                  {customer.phone}
                </span>
              </div>
              {customer.whatsapp && (
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">واتساب:</span>
                  <span className="font-mono font-bold text-on-surface" dir="ltr">
                    {customer.whatsapp}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">الميزانية المتوقعة:</span>
                <span className="font-mono font-black text-primary text-sm">
                  {customer.budget ? `${customer.budget.toLocaleString('ar-EG')} ج.م` : 'غير محددة'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">مصدر العميل:</span>
                <span className="font-bold text-on-surface">{customer.source || 'غير محدد'}</span>
              </div>
            </div>

            {customer.notes && (
              <div className="pt-3 border-t border-outline-variant">
                <span className="text-xs font-bold text-on-surface block mb-1">ملاحظات العميل:</span>
                <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap bg-surface-container p-3 rounded-xl">
                  {customer.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Activities Log & Interested Units */}
        <div className="lg:col-span-7 space-y-6">
          {/* Add Activity Form */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-2">
              <Send className="w-4 h-4 text-primary" />
              تسجيل نشاط ومتابعة جديدة
            </h2>

            <form onSubmit={handleAddActivity} className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {(
                  [
                    { type: 'call', label: 'مكالمة هاتفية' },
                    { type: 'whatsapp', label: 'مراسلة واتساب' },
                    { type: 'visit', label: 'معاينة / مقابلة' },
                    { type: 'note', label: 'ملاحظة خاصة' },
                  ] as const
                ).map((act) => (
                  <button
                    key={act.type}
                    type="button"
                    onClick={() => setActivityType(act.type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      activityType === act.type
                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                        : 'border-outline-variant bg-surface hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                required
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="اكتب تفاصيل المكالمة أو المقابلة والاتفاق الذي تم مع العميل..."
                className="input-base w-full text-xs sm:text-sm"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant shrink-0">جدولة متابعة قادمة:</span>
                  <input
                    type="datetime-local"
                    value={newFollowupDate}
                    onChange={(e) => setNewFollowupDate(e.target.value)}
                    className="input-base py-1 px-2.5 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingActivity || !newNote.trim()}
                  className="btn-primary flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold shadow-sm"
                >
                  {submittingActivity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>حفظ النشاط</span>
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-2">
              <Clock className="w-4 h-4 text-primary" />
              سجل أنشطة ومتابعات العميل ({customer.activities?.length || 0})
            </h2>

            {(!customer.activities || customer.activities.length === 0) ? (
              <p className="text-xs text-on-surface-variant py-4 text-center">لا توجد أنشطة سابقة مسجلة لهذا العميل.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {customer.activities.map((act) => (
                  <div key={act.id} className="p-3.5 rounded-xl bg-surface-container flex items-start gap-3 text-xs">
                    <div className="p-2 rounded-lg bg-surface border border-outline-variant text-primary shrink-0 mt-0.5">
                      {act.type === 'call' ? (
                        <Phone className="w-3.5 h-3.5" />
                      ) : act.type === 'whatsapp' ? (
                        <MessageCircle className="w-3.5 h-3.5" />
                      ) : act.type === 'visit' ? (
                        <Building2 className="w-3.5 h-3.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface leading-relaxed">{act.note}</p>
                      <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-1.5 font-mono">
                        <span>بواسطة: {act.authorName || 'الوسيط'}</span>
                        <span>•</span>
                        <span>
                          {new Date(act.createdAt).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matched / Interested Units */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                الوحدات العقارية المهتم بها العميل ({interestedUnits.length})
              </h2>
              <Link
                href={`/customers/${customer.id}/edit`}
                className="text-xs text-primary font-bold hover:underline"
              >
                تعديل الوحدات المهتم بها
              </Link>
            </div>

            {interestedUnits.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-4 text-center">
                لم يتم تحديد وحدات عقارية مفضلة لهذا العميل حتى الآن. يمكنك تعديل العميل لاختيار وحدات.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {interestedUnits.map((u) => (
                  <UnitCard
                    key={u.id}
                    unit={u}
                    zones={zones}
                    currentUser={currentUser}
                    onStatusChange={(unitId, newStatus) => updateUnitStatus(unitId, newStatus)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
