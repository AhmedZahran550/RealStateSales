'use client';

import React, { useState, useEffect } from 'react';
import { Customer, CustomerStage, STAGE_CONFIG } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import {
  X,
  UserPlus,
  Phone,
  MessageCircle,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Check,
  Building2,
  Clock,
  UserCheck,
} from 'lucide-react';

export interface QuickCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomer?: Customer | null;
  onSaved?: (customer: Customer) => void;
}

const COMMON_SOURCES = [
  'إعلان فيسبوك وتيك توك',
  'إحالة من عميل سابق',
  'زيارة مقر الشركة',
  'موقع أوليكس ودوبيزل',
  'لافتة على موقع المشروع',
  'معارف وعلاقات شخصية',
  'أخرى',
];

export default function QuickCustomerModal({
  isOpen,
  onClose,
  initialCustomer,
  onSaved,
}: QuickCustomerModalProps) {
  const {
    currentUser,
    companyUsers,
    myUnits,
    addCustomer,
    updateCustomer,
  } = useApp();

  const isEdit = Boolean(initialCustomer?.id);

  // حالة النموذج
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // الحقول الأساسية
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<CustomerStage>('lead');

  // الحقول الإضافية
  const [whatsapp, setWhatsapp] = useState('');
  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [source, setSource] = useState(COMMON_SOURCES[0]);
  const [nextFollowupAt, setNextFollowupAt] = useState('');
  const [notes, setNotes] = useState('');
  const [interestedUnitIds, setInterestedUnitIds] = useState<string[]>([]);

  // تحويل ISO إلى datetime-local
  const toDatetimeLocal = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // تعيين سريع لموعد المتابعة
  const handlePresetFollowup = (preset: 'today' | 'tomorrow' | '3days' | 'nextweek' | 'clear') => {
    if (preset === 'clear') {
      setNextFollowupAt('');
      return;
    }
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
    setNextFollowupAt(toDatetimeLocal(d.toISOString()));
  };

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      if (initialCustomer) {
        setName(initialCustomer.name || '');
        setPhone(initialCustomer.phone || '');
        setStage(initialCustomer.stage || 'lead');
        setWhatsapp(initialCustomer.whatsapp || '');
        setBudget(initialCustomer.budget);
        setSource(initialCustomer.source || COMMON_SOURCES[0]);
        setNextFollowupAt(toDatetimeLocal(initialCustomer.nextFollowupAt));
        setNotes(initialCustomer.notes || '');
        setInterestedUnitIds(initialCustomer.interestedUnitIds || []);

        if (
          initialCustomer.whatsapp ||
          initialCustomer.budget ||
          initialCustomer.notes ||
          (initialCustomer.interestedUnitIds && initialCustomer.interestedUnitIds.length > 0)
        ) {
          setShowAdvanced(true);
        } else {
          setShowAdvanced(false);
        }
      } else {
        setName('');
        setPhone('');
        setStage('lead');
        setWhatsapp('');
        setBudget(undefined);
        setSource(COMMON_SOURCES[0]);
        // الافتراضي للمتابعة: غداً الساعة 12 ظهراً
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);
        setNextFollowupAt(toDatetimeLocal(tomorrow.toISOString()));
        setNotes('');
        setInterestedUnitIds([]);
        setShowAdvanced(false);
      }
    }
  }, [isOpen, initialCustomer, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim()) {
      setSubmitError('يرجى إدخال اسم العميل');
      return;
    }
    if (!phone.trim()) {
      setSubmitError('يرجى إدخال رقم هاتف العميل');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload: any = {
        name: name.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || undefined,
        budget: budget ? Number(budget) : undefined,
        source: source.trim() || undefined,
        stage,
        nextFollowupAt: nextFollowupAt ? new Date(nextFollowupAt).toISOString() : undefined,
        notes: notes.trim() || undefined,
        interestedUnitIds,
      };

      if (isEdit && initialCustomer) {
        const res = await updateCustomer(initialCustomer.id, payload);
        if (res.success) {
          if (onSaved) onSaved({ ...initialCustomer, ...payload });
          onClose();
        } else {
          setSubmitError(res.message || 'فشل تحديث بيانات العميل');
        }
      } else {
        const res = await addCustomer(payload);
        if (res.success) {
          if (onSaved) onSaved(payload);
          onClose();
        } else {
          setSubmitError(res.message || 'فشل إضافة العميل');
        }
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'حدث خطأ أثناء حفظ بيانات العميل');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl my-6 bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس النافذة */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant bg-surface-container-low shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-on-surface">
                {isEdit ? 'تعديل بيانات العميل والمتابعة' : 'إضافة عميل جديد للمنظومة'}
              </h2>
              <p className="text-xs text-on-surface-variant">
                سجل بيانات المشتري لمتابعة صفقات البيع ومواعيد المعاينات
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* جسم النموذج */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-error-container border border-error/30 text-on-error-container flex items-start gap-2 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* 1. الاسم ورقم الهاتف */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                اسم العميل بالكامل <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base w-full text-xs font-bold py-2.5"
                placeholder="مثال: أ/ محمد عبد الرحمن"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                رقم الهاتف الأساسي <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-base w-full text-xs font-bold py-2.5 pl-9 font-mono"
                  placeholder="01xxxxxxxxx"
                  required
                />
                <Phone className="w-4 h-4 text-on-surface-variant absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 2. المرحلة ومصدر العميل */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                مرحلة العميل في مسار المبيعات
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as CustomerStage)}
                className="input-base w-full text-xs font-bold py-2.5"
              >
                {Object.entries(STAGE_CONFIG).map(([stKey, cfg]) => (
                  <option key={stKey} value={stKey}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                مصدر التعرف على العميل
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="input-base w-full text-xs font-bold py-2.5"
              >
                {COMMON_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. موعد المتابعة القادم */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>موعد المتابعة أو المعاينة القادمة</span>
              </label>
              {nextFollowupAt && (
                <button
                  type="button"
                  onClick={() => handlePresetFollowup('clear')}
                  className="text-[11px] text-error hover:underline font-semibold"
                >
                  إلغاء الموعد
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handlePresetFollowup('today')}
                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-bold transition"
              >
                + ساعتين اليوم
              </button>
              <button
                type="button"
                onClick={() => handlePresetFollowup('tomorrow')}
                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-bold transition"
              >
                غداً 12 ظهراً
              </button>
              <button
                type="button"
                onClick={() => handlePresetFollowup('3days')}
                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-bold transition"
              >
                بعد 3 أيام
              </button>
              <button
                type="button"
                onClick={() => handlePresetFollowup('nextweek')}
                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-bold transition"
              >
                الأسبوع القادم
              </button>
            </div>

            <input
              type="datetime-local"
              value={nextFollowupAt}
              onChange={(e) => setNextFollowupAt(e.target.value)}
              className="input-base w-full text-xs font-mono py-2"
            />
          </div>

          {/* 4. تفاصيل إضافية قابلة للطي */}
          <div className="border border-outline-variant/60 rounded-2xl overflow-hidden bg-surface-container-low/40">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-on-surface hover:bg-surface-container-high/40 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>تفاصيل إضافية (الواتساب، الميزانية، المصدر، الملاحظات، الوحدات)</span>
              </span>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-on-surface-variant" />
              ) : (
                <ChevronDown className="w-4 h-4 text-on-surface-variant" />
              )}
            </button>

            {showAdvanced && (
              <div className="p-4 border-t border-outline-variant/50 space-y-3.5 bg-surface-container-lowest">
                {/* الواتساب والميزانية */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      رقم الواتساب (إن كان مختلفاً)
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="input-base w-full text-xs py-2 pl-9 font-mono"
                        placeholder="01xxxxxxxxx"
                      />
                      <MessageCircle className="w-4 h-4 text-success absolute left-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      الميزانية التقريبية (ج.م)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="50000"
                        value={budget || ''}
                        onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : undefined)}
                        className="input-base w-full text-xs py-2 pl-10 font-mono"
                        placeholder="مثال: 1500000"
                      />
                      <span className="absolute left-3 top-2 text-[11px] font-bold text-on-surface-variant">
                        ج.م
                      </span>
                    </div>
                  </div>
                </div>

                {/* الملاحظات */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    ملاحظات حول متطلبات العميل
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-base w-full text-xs py-2"
                    placeholder="مهتم بدور أرضي، يرغب في استلام خلال 6 شهور..."
                  />
                </div>

                {/* الوحدات المهتم بها */}
                {myUnits && myUnits.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1.5">
                      ربط بوحدات من المحفظة
                    </label>
                    <div className="max-h-36 overflow-y-auto p-2 bg-surface-container rounded-xl border border-outline-variant space-y-1">
                      {myUnits.slice(0, 15).map((u) => {
                        const checked = interestedUnitIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-container-high text-xs cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                if (checked) {
                                  setInterestedUnitIds((prev) => prev.filter((id) => id !== u.id));
                                } else {
                                  setInterestedUnitIds((prev) => [...prev, u.id]);
                                }
                              }}
                              className="rounded accent-primary"
                            />
                            <span className="font-bold text-on-surface">قطعة {u.plotNo}</span>
                            <span className="text-on-surface-variant">
                              ({u.area} م² - {u.price.toLocaleString('ar-EG')} ج.م)
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-tonal px-5 py-2.5 text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-2 min-w-[130px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEdit ? 'تحديث العميل' : 'حفظ العميل'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
