'use client';

import React, { useState } from 'react';
import {
  PublicUnit,
  UNIT_KIND_LABELS,
  RESERVATION_PERIOD_LABELS,
  ReservationPeriod,
} from '@/lib/types';
import { publicPageService } from '@/services/publicPageService';
import {
  X,
  User,
  Phone,
  CalendarDays,
  Clock,
  StickyNote,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Building,
} from 'lucide-react';

export interface ReservationModalProps {
  unit: PublicUnit;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  companyPhone?: string;
  companyName?: string;
}

const PERIODS: Array<{ id: ReservationPeriod; label: string; timeHint: string }> = [
  { id: 'morning', label: 'صباحي', timeHint: '10 ص - 1 م' },
  { id: 'afternoon', label: 'بعد الظهر', timeHint: '1 م - 5 م' },
  { id: 'evening', label: 'مسائي', timeHint: '5 م - 9 م' },
];

export default function ReservationModal({
  unit,
  companyId,
  isOpen,
  onClose,
  companyPhone,
  companyName,
}: ReservationModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [period, setPeriod] = useState<ReservationPeriod>('morning');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (customerName.trim().length < 2) {
      setError('يرجى إدخال الاسم بالكامل للتواصل');
      return;
    }
    if (phone.trim().length < 8) {
      setError('يرجى إدخال رقم هاتف صحيح للتواصل');
      return;
    }
    if (!preferredDate) {
      setError('يرجى اختيار التاريخ المناسب للمعاينة');
      return;
    }

    setIsSubmitting(true);
    const res = await publicPageService.submitReservation({
      companyId,
      unitId: unit.id,
      customerName: customerName.trim(),
      phone: phone.trim(),
      preferredDate,
      period,
      note: note.trim() || undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsSuccess(true);
    } else {
      setError(res.error || 'تعذر إرسال طلب الحجز حالياً، يرجى التحقق من اتصالك والمحاولة مجدداً');
    }
  };

  const close = () => {
    setCustomerName('');
    setPhone('');
    setPreferredDate('');
    setPeriod('morning');
    setNote('');
    setError(null);
    setIsSuccess(false);
    onClose();
  };

  // رابط واتساب للمتابعة الفورية بعد الحجز
  const followUpWaUrl = React.useMemo(() => {
    if (!companyPhone) return '';
    let clean = companyPhone.replace(/[^0-9]/g, '');
    if (clean.startsWith('01')) {
      clean = '2' + clean;
    }
    const unitTitle = UNIT_KIND_LABELS[unit.unitKind] || 'الوحدة';
    const msg = `مرحباً${companyName ? ` ${companyName}` : ''}، قمت للتو بتسجيل طلب معاينة لـ ${unitTitle} باسم (${customerName || 'عميل'}) بتاريخ ${preferredDate || 'المحدد'}. أود المتابعة معكم.`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  }, [companyPhone, companyName, unit, customerName, preferredDate]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md transition-opacity"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card card-bordered shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto bg-surface-container-lowest"
      >
        {/* شريط العنوان */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h3 className="font-black text-lg text-on-surface">
              {isSuccess ? 'تم تأكيد استلام الطلب' : 'طلب حجز موعد معاينة'}
            </h3>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              {isSuccess
                ? 'فريق المبيعات سيتواصل معك سريعاً'
                : 'حدد موعداً مناسباً لزيارة الوحدة مع مندوبنا'}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-success-container flex items-center justify-center shadow-xs border border-success/30">
              <CheckCircle2 className="w-9 h-9 text-success" />
            </div>
            <div>
              <h4 className="font-black text-lg text-on-surface">
                تم تسجيل طلب المعاينة بنجاح
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-1.5 max-w-xs mx-auto">
                شكراً لتواصلك! تم إرسال بيانات رغبتك في المعاينة
                {preferredDate && ` ليوم (${preferredDate} - ${RESERVATION_PERIOD_LABELS[period]})`}
                ، وسيتصل بك أحد مسؤولي المبيعات لتأكيد الحضور.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {followUpWaUrl && (
                <a
                  href={followUpWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-success-container hover:bg-success text-on-success-container hover:text-on-success border border-success/40 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>تأكيد الموعد فوراً عبر واتساب</span>
                </a>
              )}
              <button
                type="button"
                onClick={close}
                className="btn-primary w-full py-3 text-xs sm:text-sm"
              >
                العودة لتصفح الوحدات
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* بطاقة ملخص الوحدة */}
            <div className="panel-section p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-on-surface-variant block">الوحدة المحددة</span>
                <p className="text-sm font-black text-on-surface truncate">
                  {UNIT_KIND_LABELS[unit.unitKind]} {unit.zoneName ? `— ${unit.zoneName}` : ''}
                  {unit.plotNo ? ` (قطعة ${unit.plotNo})` : ''}
                </p>
              </div>
            </div>

            {/* حقل الاسم */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                الاسم بالكامل <span className="text-error">*</span>
              </label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: محمد عبد الرحمن"
                  maxLength={100}
                  className="input-base w-full py-2.5 pr-10 pl-3 text-sm"
                />
              </div>
            </div>

            {/* حقل الهاتف */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                رقم الهاتف المحمول <span className="text-error">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  maxLength={20}
                  dir="ltr"
                  className="input-base w-full py-2.5 pr-10 pl-3 text-sm text-left font-mono"
                />
              </div>
            </div>

            {/* تاريخ المعاينة المفضل */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                تاريخ المعاينة المفضل <span className="text-error">*</span>
              </label>
              <div className="relative">
                <CalendarDays className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
                <input
                  type="date"
                  required
                  value={preferredDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="input-base w-full py-2.5 pr-10 pl-3 text-sm"
                />
              </div>
            </div>

            {/* فترة المعاينة */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                الفترة الزمنية الأنسب لك <span className="text-error">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PERIODS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer border ${
                      period === p.id
                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{p.label}</span>
                    </div>
                    <span className="text-[10px] opacity-80 mt-0.5">{p.timeHint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ملاحظات إضافية */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                ملاحظات أو استفسارات إضافية (اختياري)
              </label>
              <div className="relative">
                <StickyNote className="absolute right-3.5 top-3 w-4 h-4 text-outline pointer-events-none" />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ملاحظات حول طريقة السداد، وقت محدد، أو أي تفاصيل تفضلها..."
                  maxLength={1000}
                  rows={2}
                  className="input-base w-full py-2.5 pr-10 pl-3 text-xs leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div className="p-3 rounded-xl bg-error-container border border-error text-on-error-container text-xs font-bold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3.5 text-sm font-bold shadow-md hover:shadow-xl transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل طلب المعاينة...</span>
                </>
              ) : (
                <span>إرسال طلب المعاينة</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
