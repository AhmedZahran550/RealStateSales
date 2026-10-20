'use client';

import React, { useState } from 'react';
import { Customer, CustomerStage, ActivityType, Unit, STAGE_CONFIG, UNIT_KIND_LABELS } from '@/lib/types';
import { formatArabicFollowupDate } from '@/lib/date-utils';
import { zoneDisplayName } from '@/lib/zone-utils';
import { useApp } from '@/context/AppContext';
import {
  X,
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
} from 'lucide-react';

export interface CustomerDetailModalProps {
  customer: Customer | null;
  onClose: () => void;
  onUpdateStage: (id: string, stage: CustomerStage, note?: string) => void;
  onAddActivity: (id: string, type: ActivityType, note: string) => void;
  onUpdateCustomer: (id: string, data: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
  units: Unit[];
  onSelectUnit?: (unit: Unit) => void;
  onEdit?: (customer: Customer) => void;
}

export default function CustomerDetailModal({
  customer,
  onClose,
  onUpdateStage,
  onAddActivity,
  onUpdateCustomer,
  onDeleteCustomer,
  units,
  onSelectUnit,
  onEdit,
}: CustomerDetailModalProps) {
  const { zones } = useApp();
  const [newNote, setNewNote] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('call');
  const [newFollowupDate, setNewFollowupDate] = useState('');
  const [todayTimestamp, setTodayTimestamp] = useState<number | null>(null);
  const [todayDateString, setTodayDateString] = useState<string>('');

  React.useEffect(() => {
    setTodayTimestamp(new Date().setHours(0, 0, 0, 0));
    setTodayDateString(new Date().toDateString());
  }, []);

  if (!customer) return null;

  const stageConfig = STAGE_CONFIG[customer.stage];
  const interestedUnits = (units || []).filter((u) => customer.interestedUnitIds?.includes(u.id));

  // WhatsApp click-to-chat URL
  const waNumber = customer.whatsapp || (customer.phone.startsWith('01') ? `2${customer.phone}` : customer.phone);
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(`أهلاً بك أستاذ ${customer.name}، معك من شركة الواحة لإدارة عقارات الحي المتميز.`)}`;

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    onAddActivity(customer.id, activityType, newNote.trim());
    if (newFollowupDate) {
      onUpdateCustomer(customer.id, {
        nextFollowupAt: new Date(newFollowupDate).toISOString(),
      });
    }

    setNewNote('');
    setNewFollowupDate('');
  };

  const handleStageChange = (newStage: CustomerStage) => {
    const note = `تم تغيير مرحلة العميل من [${stageConfig.label}] إلى [${STAGE_CONFIG[newStage].label}]`;
    onUpdateStage(customer.id, newStage, note);
  };

  const handleReschedule = (newDateIso?: string) => {
    if (!newDateIso) {
      onUpdateCustomer(customer.id, { nextFollowupAt: undefined });
      onAddActivity(customer.id, 'note', 'تم إلغاء موعد المتابعة الحالي');
      return;
    }
    onUpdateCustomer(customer.id, { nextFollowupAt: newDateIso });
    const fInfo = formatArabicFollowupDate(newDateIso);
    onAddActivity(customer.id, 'call', `تم تعديل موعد المتابعة القادمة إلى: ${fInfo.dayName} (${fInfo.formattedDate}) الساعة ${fInfo.formattedTime}`);
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

  const toDatetimeLocal = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Followup status
  const isOverdue =
    todayTimestamp !== null &&
    customer.nextFollowupAt &&
    new Date(customer.nextFollowupAt).setHours(0, 0, 0, 0) < todayTimestamp;
  const isToday =
    todayDateString !== '' &&
    customer.nextFollowupAt &&
    new Date(customer.nextFollowupAt).toDateString() === todayDateString;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-outline-variant overflow-hidden my-auto sm:my-8 max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-outline-variant bg-surface-container-low shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-warning text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md shadow-warning/30 shrink-0">
              {customer.name.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-on-surface ">
                  {customer.name}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${stageConfig.bg} ${stageConfig.color} ${stageConfig.border}`}
                >
                  {stageConfig.label}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                المصدر: {customer.source || 'غير محدد'} • البروكر: {customer.ownerName || 'حسام الشريف'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(customer);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-warning bg-warning-container hover:bg-warning hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold border border-warning shadow-xs cursor-pointer"
                title="تعديل بيانات العميل"
              >
                <Edit className="w-4 h-4 text-warning group-hover:text-white" />
                <span>تعديل</span>
              </button>
            )}
            <button
              onClick={() => {
                if (confirm(`هل أنت متأكد من حذف العميل "${customer.name}" نهائياً من قاعدة البيانات؟`)) {
                  onDeleteCustomer(customer.id);
                  onClose();
                }
              }}
              className="px-3.5 py-2 rounded-xl text-error bg-error-container hover:bg-error hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold border border-error shadow-xs cursor-pointer"
              title="حذف العميل"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface-variant hover:bg-surface-container "
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-h-[78vh] overflow-y-auto flex-1">
          {/* Quick Contact & Action Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Phone */}
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition"
            >
              <Phone className="w-4 h-4 text-warning" />
              <span>اتصال: {customer.phone}</span>
            </a>

            {/* WhatsApp */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-success hover:bg-success text-white text-xs font-bold shadow-md shadow-success/30 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>محادثة واتساب مباشرة</span>
            </a>

            {/* Budget */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-warning-container border border-warning text-warning text-xs font-bold">
              <span>الميزانية:</span>
              <span className="font-black text-sm">
                {customer.budget ? `${customer.budget.toLocaleString('ar-EG')} ج.م` : 'غير محددة'}
              </span>
            </div>
          </div>

          {/* Stage Progression Selector */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant ">
            <span className="block text-xs font-bold text-on-surface-variant mb-2">
              تحديث مرحلة العميل في دورة المبيعات:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(STAGE_CONFIG).map(([stgKey, cfg]) => {
                const isActive = customer.stage === stgKey;
                return (
                  <button
                    key={stgKey}
                    onClick={() => handleStageChange(stgKey as CustomerStage)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      isActive
                        ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-2 ring-warning shadow-sm`
                        : 'bg-white  border-outline-variant  text-on-surface-variant  hover:border-outline-variant'
                    }`}
                  >
                    {isActive && <UserCheck className="w-3.5 h-3.5" />}
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Follow-up Scheduling & Alert Card */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 transition-all ${
              isOverdue
                ? 'bg-error-container/90  border-error  text-on-error-container '
                : isToday
                ? 'bg-warning-container/90  border-warning  text-on-warning-container '
                : customer.nextFollowupAt
                ? 'bg-success-container/70  border-success  text-on-success-container '
                : 'bg-surface-container-low  border-outline-variant  text-on-surface-variant '
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isOverdue
                    ? 'bg-error text-white shadow-sm'
                    : isToday
                    ? 'bg-warning text-white shadow-sm'
                    : customer.nextFollowupAt
                    ? 'bg-success text-white shadow-sm'
                    : 'bg-surface-container-highest  text-on-surface-variant '
                }`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black flex items-center gap-1.5">
                    {isOverdue
                      ? '⚠️ موعد المتابعة متأخر!'
                      : isToday
                      ? '🔔 موعد المتابعة اليوم!'
                      : customer.nextFollowupAt
                      ? '📅 موعد المتابعة القادمة مجدول:'
                      : '⏳ لم يتم تحديد موعد متابعة بعد'}
                  </p>
                  {customer.nextFollowupAt ? (
                    (() => {
                      const fInfo = formatArabicFollowupDate(customer.nextFollowupAt);
                      return (
                        <div className="flex items-center flex-wrap gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded-lg bg-warning/15 text-warning font-black text-xs">
                            {fInfo.dayName}
                          </span>
                          <span className="font-bold text-xs">{fInfo.formattedDate}</span>
                          <span className="opacity-50">•</span>
                          <span className="font-bold font-mono text-xs">{fInfo.formattedTime}</span>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-xs mt-0.5 font-bold">حدد موعداً لضمان عدم نسيان العميل</p>
                  )}
                </div>
              </div>

              {/* Exact Datetime Input */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold shrink-0 opacity-80">تحديد دقيق:</label>
                <input
                  type="datetime-local"
                  value={toDatetimeLocal(customer.nextFollowupAt)}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleReschedule(new Date(e.target.value).toISOString());
                    } else {
                      handleReschedule(undefined);
                    }
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-outline-variant bg-white font-mono font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-warning shadow-xs"
                />
              </div>
            </div>

            {/* Quick 1-Click Presets */}
            <div className="pt-2 border-t border-outline-variant/60 ">
              <span className="block text-[11px] font-bold opacity-75 mb-2">
                إعادة جدولة سريعة بنقرة واحدة:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleReschedule(getQuickDateIso('today'))}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-on-surface border border-outline-variant hover:border-warning hover:text-warning transition shadow-xs"
                >
                  ⚡ اليوم (بعد ساعتين)
                </button>
                <button
                  type="button"
                  onClick={() => handleReschedule(getQuickDateIso('tomorrow'))}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-on-surface border border-outline-variant hover:border-warning hover:text-warning transition shadow-xs"
                >
                  🌅 غداً (12 ظهراً)
                </button>
                <button
                  type="button"
                  onClick={() => handleReschedule(getQuickDateIso('3days'))}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-on-surface border border-outline-variant hover:border-warning hover:text-warning transition shadow-xs"
                >
                  📆 بعد 3 أيام
                </button>
                <button
                  type="button"
                  onClick={() => handleReschedule(getQuickDateIso('nextweek'))}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-on-surface border border-outline-variant hover:border-warning hover:text-warning transition shadow-xs"
                >
                  🗓️ الأسبوع القادم
                </button>
                {customer.nextFollowupAt && (
                  <button
                    type="button"
                    onClick={() => handleReschedule(undefined)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-error-container text-error hover:bg-error-container transition"
                  >
                    ❌ إلغاء الموعد
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interested Units */}
          {interestedUnits.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase text-on-surface-variant mb-2.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-warning" />
                الوحدات المهتم بها ({interestedUnits.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {interestedUnits.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => onSelectUnit && onSelectUnit(u)}
                    className="p-3 rounded-xl border border-outline-variant bg-surface-container-low hover:border-warning cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-on-surface ">
                        {zoneDisplayName(u.zoneId, zones)} – قطعة {u.plotNo} ({UNIT_KIND_LABELS[u.unitKind]})
                      </p>
                      <p className="text-[11px] text-warning font-bold mt-0.5">
                        {u.price.toLocaleString('ar-EG')} ج.م • {u.area} م²
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-on-surface-variant transform rotate-180" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Activity Box */}
          <div className="p-4 rounded-2xl border border-warning bg-warning-container/50 ">
            <h4 className="text-xs font-bold text-warning mb-2 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-warning" />
              تسجيل نشاط جديد (مكالمة، واتساب، معاينة، ملاحظة)
            </h4>
            <form onSubmit={handleAddActivity} className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(['call', 'whatsapp', 'visit', 'note'] as ActivityType[]).map((type) => {
                  const labels: Record<ActivityType, string> = {
                    call: '📞 مكالمة هاتفية',
                    whatsapp: '💬 محادثة واتساب',
                    visit: '🚗 نزول معاينة موقعية',
                    note: '📝 ملاحظة إدارية',
                    stage_change: 'تغيير مرحلة',
                  };
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setActivityType(type)}
                      className={`text-xs px-3 py-1 rounded-lg font-bold transition ${
                        activityType === type
                          ? 'bg-warning text-white shadow-sm'
                          : 'bg-white  border border-outline-variant  text-on-surface-variant '
                      }`}
                    >
                      {labels[type]}
                    </button>
                  );
                })}
              </div>

              <textarea
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="اكتب خلاصة المكالمة أو تفاصيل الزيارة أو متطلبات العميل..."
                className="w-full text-xs p-2.5 rounded-xl border border-outline-variant bg-white text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary shadow-xs"
                required
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-on-surface-variant font-bold">تحديث المتابعة القادمة:</span>
                  <input
                    type="date"
                    value={newFollowupDate}
                    onChange={(e) => setNewFollowupDate(e.target.value)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-outline-variant bg-white text-on-surface font-mono font-semibold shadow-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-warning hover:bg-warning active:bg-warning text-white text-xs font-bold shadow-md shadow-warning/30 transition-all cursor-pointer"
                >
                  حفظ النشاط
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase text-on-surface-variant mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-warning" />
              سجل الأنشطة والمتابعات ({customer.activities?.length || 0})
            </h4>

            <div className="relative border-r-2 border-outline-variant pr-5 mr-3 space-y-4">
              {customer.activities && customer.activities.length > 0 ? (
                customer.activities.map((act) => {
                  return (
                    <div key={act.id} className="relative group">
                      {/* Node bullet */}
                      <span className="absolute -right-[27px] top-1.5 w-3 h-3 rounded-full bg-warning border-2 border-white " />

                      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/80 text-xs">
                        <div className="flex items-center justify-between text-on-surface-variant mb-1">
                          <span className="font-bold text-on-surface-variant ">
                            {act.authorName || 'البروكر'}
                          </span>
                          <span>
                            {new Date(act.createdAt).toLocaleString('ar-EG', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-on-surface font-medium leading-relaxed">
                          {act.note}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-on-surface-variant">لا توجد أنشطة مسجلة بعد لهذا العميل.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
