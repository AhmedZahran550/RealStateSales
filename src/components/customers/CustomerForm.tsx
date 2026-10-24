'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Customer, CustomerStage, Unit, STAGE_CONFIG, UNIT_KIND_LABELS } from '@/lib/types';
import { zoneDisplayName } from '@/lib/zone-utils';
import { useApp } from '@/context/AppContext';
import {
  UserPlus,
  Phone,
  Calendar,
  DollarSign,
  Check,
  Save,
  MessageCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  Building2,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface CustomerFormProps {
  initialCustomer?: Customer | null;
  isEdit?: boolean;
}

const LEAD_SOURCES = [
  'إعلان فيسبوك وتيك توك',
  'إحالة من عميل سابق',
  'زيارة مقر الشركة',
  'موقع أوليكس ودوبيزل',
  'لافتة على العمارة بالحي المتميز',
  'معارف وعلاقات شخصية',
  'أخرى',
];

export default function CustomerForm({ initialCustomer, isEdit = false }: CustomerFormProps) {
  const router = useRouter();
  const { myUnits, units: allUnits, zones, currentUser, addCustomer, updateCustomer } = useApp();
  const availableUnits = (myUnits && myUnits.length > 0) ? myUnits : allUnits;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [source, setSource] = useState('إعلان فيسبوك وتيك توك');
  const [stage, setStage] = useState<CustomerStage>('lead');
  const [nextFollowupAt, setNextFollowupAt] = useState('');
  const [notes, setNotes] = useState('');
  const [interestedUnitIds, setInterestedUnitIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toDatetimeLocal = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const setPresetFollowup = (preset: 'today' | 'tomorrow' | '3days' | 'nextweek' | 'clear') => {
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
    if (initialCustomer) {
      setName(initialCustomer.name);
      setPhone(initialCustomer.phone);
      setWhatsapp(initialCustomer.whatsapp || '');
      setBudget(initialCustomer.budget);
      setSource(initialCustomer.source || 'إعلان فيسبوك وتيك توك');
      setStage(initialCustomer.stage);
      setNextFollowupAt(toDatetimeLocal(initialCustomer.nextFollowupAt));
      setNotes(initialCustomer.notes || '');
      setInterestedUnitIds(initialCustomer.interestedUnitIds || []);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      setNextFollowupAt(toDatetimeLocal(tomorrow.toISOString()));
    }
  }, [initialCustomer]);

  const toggleUnitInterest = (unitId: string) => {
    setInterestedUnitIds((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم العميل');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم هاتف العميل');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || undefined,
      budget: budget ? Number(budget) : undefined,
      source: source || undefined,
      stage,
      nextFollowupAt: nextFollowupAt ? new Date(nextFollowupAt).toISOString() : undefined,
      notes: notes.trim() || undefined,
      interestedUnitIds,
      ownerId: currentUser?.id || '',
      ownerName: currentUser?.fullName || '',
    };

    try {
      if (isEdit && initialCustomer) {
        const res = await updateCustomer(initialCustomer.id, payload);
        if (res && res.success === false) {
          setErrorMsg(res.message || 'حدث خطأ أثناء حفظ التعديلات');
          setSubmitting(false);
          return;
        }
        router.push(`/customers/${initialCustomer.id}`);
      } else {
        const res = await addCustomer(payload);
        if (res && res.success === false) {
          setErrorMsg(res.message || 'حدث خطأ أثناء إضافة العميل');
          setSubmitting(false);
          return;
        }
        router.push('/customers');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت عملية الحفظ');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={isEdit && initialCustomer ? `/customers/${initialCustomer.id}` : '/customers'}
            className="p-2.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container text-on-surface-variant transition"
            title="رجوع"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-on-surface flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-primary" />
              {isEdit ? 'تعديل بيانات العميل' : 'تسجيل عميل جديد'}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {isEdit
                ? `تحديث بيانات ومتابعات العميل: ${initialCustomer?.name}`
                : 'أضف عميلاً جديداً إلى مسار مبيعاتك العقارية مع جدولة المتابعة القادمة'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 shadow-md"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isEdit ? 'حفظ التعديلات' : 'تسجيل العميل'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-error-container text-error flex items-center gap-3 border border-error/20 text-xs sm:text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Info Card */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-2">
            <UserPlus className="w-4 h-4 text-primary" />
            بيانات الاتصال والهوية
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                اسم العميل <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: م. أحمد عبد الرحمن"
                className="input-base w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                رقم الهاتف (الأساسي) <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="input-base w-full pr-10 text-right"
                />
                <Phone className="w-4 h-4 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                رقم واتساب (إذا كان مختلفاً)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="input-base w-full pr-10 text-right"
                />
                <MessageCircle className="w-4 h-4 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                الميزانية المتوقعة (جنيه مصري)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={budget || ''}
                  onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="مثال: 3500000"
                  className="input-base w-full pr-10"
                />
                <DollarSign className="w-4 h-4 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Lead Source & Stage Card */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            المسار ومصدر العميل
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                مصدر العميل (Lead Source)
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="input-base w-full"
              >
                {LEAD_SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                المرحلة الحالية في قمع البيع
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as CustomerStage)}
                className="input-base w-full"
              >
                {Object.entries(STAGE_CONFIG).map(([stKey, stVal]) => (
                  <option key={stKey} value={stKey}>
                    {stVal.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Followup Scheduling Card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              موعد المتابعة القادمة
            </h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setPresetFollowup('today')}
                className="chip px-2.5 py-1 text-[11px] font-bold bg-surface-container hover:bg-surface-container-high text-on-surface"
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => setPresetFollowup('tomorrow')}
                className="chip px-2.5 py-1 text-[11px] font-bold bg-surface-container hover:bg-surface-container-high text-on-surface"
              >
                غداً 12م
              </button>
              <button
                type="button"
                onClick={() => setPresetFollowup('3days')}
                className="chip px-2.5 py-1 text-[11px] font-bold bg-surface-container hover:bg-surface-container-high text-on-surface"
              >
                بعد 3 أيام
              </button>
              <button
                type="button"
                onClick={() => setPresetFollowup('nextweek')}
                className="chip px-2.5 py-1 text-[11px] font-bold bg-surface-container hover:bg-surface-container-high text-on-surface"
              >
                الأسبوع القادم
              </button>
              <button
                type="button"
                onClick={() => setPresetFollowup('clear')}
                className="chip px-2 py-1 text-[10px] text-on-surface-variant hover:text-error"
              >
                مسح
              </button>
            </div>
          </div>

          <div>
            <div className="relative max-w-sm">
              <input
                type="datetime-local"
                value={nextFollowupAt}
                onChange={(e) => setNextFollowupAt(e.target.value)}
                className="input-base w-full pr-10"
              />
              <Calendar className="w-4 h-4 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1.5">
              سيظهر العميل تلقائياً في أجندة المتابعات اليومية على لوحة التحكم عندما يحين الموعد.
            </p>
          </div>
        </div>

        {/* Interested Units Selector */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              الوحدات العقارية المهتم بها العميل ({interestedUnitIds.length})
            </h2>
            <span className="text-[11px] text-on-surface-variant">
              اضغط على أي وحدة لربطها باهتمام هذا العميل
            </span>
          </div>

          {availableUnits.length === 0 ? (
            <p className="text-xs text-on-surface-variant py-4">لا توجد وحدات مسجلة بمخزونك حالياً.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
              {availableUnits.map((u) => {
                const selected = interestedUnitIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUnitInterest(u.id)}
                    className={`p-3 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between gap-2 ${
                      selected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-outline-variant bg-surface hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-on-surface">
                        {zoneDisplayName(u.zoneId, zones)} • ق {u.plotNo}
                      </span>
                      {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span>{UNIT_KIND_LABELS[u.unitKind]}</span>
                      <strong className="text-primary font-mono">{u.price.toLocaleString('ar-EG')} ج</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes & Comments */}
        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-2">
            <FileText className="w-4 h-4 text-primary" />
            ملاحظات وتفاصيل متطلبات العميل
          </h2>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب ملاحظات حول متطلبات العميل (نوع الوحدة المفضلة، طريقة السداد، الموعد المناسب للاتصال، إلخ)..."
            className="input-base w-full resize-y text-xs sm:text-sm"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={isEdit && initialCustomer ? `/customers/${initialCustomer.id}` : '/customers'}
            className="btn-tonal px-6 py-2.5 text-xs sm:text-sm font-bold"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex items-center gap-2 px-8 py-2.5 shadow-md text-xs sm:text-sm font-bold"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isEdit ? 'حفظ التعديلات' : 'تسجيل العميل'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
