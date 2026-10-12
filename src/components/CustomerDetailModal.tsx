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
}: CustomerDetailModalProps) {
  const [newNote, setNewNote] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('call');
  const [newFollowupDate, setNewFollowupDate] = useState('');

  if (!customer) return null;

  const stageConfig = STAGE_CONFIG[customer.stage];
  const interestedUnits = units.filter((u) => customer.interestedUnitIds?.includes(u.id));

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

  const [todayTimestamp, setTodayTimestamp] = useState<number | null>(null);
  const [todayDateString, setTodayDateString] = useState<string>('');

  React.useEffect(() => {
    setTodayTimestamp(new Date().setHours(0, 0, 0, 0));
    setTodayDateString(new Date().toDateString());
  }, []);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-amber-600/30">
              {customer.name.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
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
            <button
              onClick={() => {
                if (confirm('هل ترغب في أرشفة/حذف هذا العميل؟')) {
                  onDeleteCustomer(customer.id);
                  onClose();
                }
              }}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
              title="حذف العميل"
            >
              <Trash2 className="w-4 h-4" />
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
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
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

          {/* Follow-up Alert Card */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              isOverdue
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                : isToday
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold">
                  {isOverdue
                    ? '⚠️ موعد المتابعة متأخر!'
                    : isToday
                    ? '🔔 موعد المتابعة اليوم!'
                    : 'تاريخ المتابعة القادمة:'}
                </p>
                <p className="text-xs mt-0.5">
                  {customer.nextFollowupAt
                    ? new Date(customer.nextFollowupAt).toLocaleDateString('ar-EG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'لم يتم تحديد موعد متابعة'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                onChange={(e) => {
                  if (e.target.value) {
                    onUpdateCustomer(customer.id, {
                      nextFollowupAt: new Date(e.target.value).toISOString(),
                    });
                  }
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              />
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
