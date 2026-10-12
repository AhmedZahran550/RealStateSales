'use client';

import React, { useState } from 'react';
import { Customer, CustomerStage, ActivityType, Unit, STAGE_CONFIG, UNIT_KIND_LABELS } from '@/lib/types';
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

interface CustomerDetailModalProps {
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
    const formatted = new Date(newDateIso).toLocaleString('ar-EG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    onAddActivity(customer.id, 'call', `تم تعديل موعد المتابعة القادمة إلى: ${formatted}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto sm:my-8 max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md shadow-amber-600/30 shrink-0">
              {customer.name.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  {customer.name}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${stageConfig.bg} ${stageConfig.color} ${stageConfig.border}`}
                >
                  {stageConfig.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                className="p-2 sm:px-3 rounded-xl text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 transition flex items-center gap-1.5 text-xs font-bold border border-amber-200 dark:border-amber-900/50"
                title="تعديل بيانات العميل"
              >
                <Edit className="w-4 h-4 text-amber-600" />
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
              className="p-2 sm:px-3 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 transition flex items-center gap-1.5 text-xs font-bold border border-rose-200 dark:border-rose-900/50"
              title="حذف العميل"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
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
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition"
            >
              <Phone className="w-4 h-4 text-amber-600" />
              <span>اتصال: {customer.phone}</span>
            </a>

            {/* WhatsApp */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>محادثة واتساب مباشرة</span>
            </a>

            {/* Budget */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold">
              <span>الميزانية:</span>
              <span className="font-black text-sm">
                {customer.budget ? `${customer.budget.toLocaleString('ar-EG')} ج.م` : 'غير محددة'}
              </span>
            </div>
          </div>

          {/* Stage Progression Selector */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="block text-xs font-bold text-slate-500 mb-2">
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
                        ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-2 ring-amber-500 shadow-sm`
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
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
                ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-200'
                : isToday
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-200'
                : customer.nextFollowupAt
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-950 dark:text-emerald-200'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isOverdue
                    ? 'bg-rose-500 text-white shadow-sm'
                    : isToday
                    ? 'bg-amber-500 text-white shadow-sm'
                    : customer.nextFollowupAt
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
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
                  <p className="text-xs mt-0.5 font-bold">
                    {customer.nextFollowupAt
                      ? new Date(customer.nextFollowupAt).toLocaleString('ar-EG', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'حدد موعداً لضمان عدم نسيان العميل'}
                  </p>
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
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Quick 1-Click Presets */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
              <span className="block text-[11px] font-bold opacity-75 mb-2">
                إعادة جدولة سريعة بنقرة واحدة:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleReschedule(getQuickDateIso('today'))}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600 transition shadow-xs"
                >
                  ⚡ اليوم (بعد ساعتين)
                </button>
                <button
                  type="button"
                  onClick={() => handleReschedule(getQuickDateIso('tomorrow'))}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600 transition shadow-xs"
                >
                  🌅 غداً (12 ظهراً)
                </button>
                <button
                  type="button"
                  onClick={() => handleReschedule(getQuickDateIso('3days'))}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600 transition shadow-xs"
                >
                  📆 بعد 3 أيام
                </button>
                <button
                  type="button"
                  onClick={() => handleReschedule(getQuickDateIso('nextweek'))}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600 transition shadow-xs"
                >
                  🗓️ الأسبوع القادم
                </button>
                {customer.nextFollowupAt && (
                  <button
                    type="button"
                    onClick={() => handleReschedule(undefined)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 hover:bg-rose-200 transition"
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
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" />
                الوحدات المهتم بها ({interestedUnits.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {interestedUnits.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => onSelectUnit && onSelectUnit(u)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-amber-500 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">
                        منطقة {u.zoneId} – قطعة {u.plotNo} ({UNIT_KIND_LABELS[u.unitKind]})
                      </p>
                      <p className="text-[11px] text-amber-600 font-bold mt-0.5">
                        {u.price.toLocaleString('ar-EG')} ج.م • {u.area} م²
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 transform rotate-180" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Activity Box */}
          <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-amber-600" />
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
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
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
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">تحديث المتابعة القادمة:</span>
                  <input
                    type="date"
                    value={newFollowupDate}
                    onChange={(e) => setNewFollowupDate(e.target.value)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition"
                >
                  حفظ النشاط
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              سجل الأنشطة والمتابعات ({customer.activities?.length || 0})
            </h4>

            <div className="relative border-r-2 border-slate-200 dark:border-slate-800 pr-5 mr-3 space-y-4">
              {customer.activities && customer.activities.length > 0 ? (
                customer.activities.map((act) => {
                  return (
                    <div key={act.id} className="relative group">
                      {/* Node bullet */}
                      <span className="absolute -right-[27px] top-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900" />

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
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
                        <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                          {act.note}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">لا توجد أنشطة مسجلة بعد لهذا العميل.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
