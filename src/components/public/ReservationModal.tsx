'use client';

import React, { useState } from 'react';
import {
  PublicUnit,
  UNIT_KIND_LABELS,
  RESERVATION_PERIOD_LABELS,
  ReservationPeriod,
} from '@/lib/types';
import { publicPageService } from '@/services/publicPageService';
import { X, User, Phone, CalendarDays, Clock, StickyNote, CheckCircle2, Loader2 } from 'lucide-react';

export interface ReservationModalProps {
  unit: PublicUnit;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PERIODS: ReservationPeriod[] = ['morning', 'afternoon', 'evening'];

export default function ReservationModal({
  unit,
  companyId,
  isOpen,
  onClose,
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
      setError('يرجى إدخال الاسم بالكامل');
      return;
    }
    if (phone.trim().length < 7) {
      setError('يرجى إدخال رقم هاتف صحيح');
      return;
    }
    if (!preferredDate) {
      setError('يرجى اختيار أقرب تاريخ متاح فيه');
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
      setError(res.error || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مجدداً');
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

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#131a26] rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto"
      >
        {/* شريط العنوان */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-stone-200 dark:border-stone-800">
          <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100 truncate">
            {isSuccess ? 'تم إرسال الطلب' : 'حجز موعد للمعاينة'}
          </h3>
          <button
            type="button"
            onClick={close}
            className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 cursor-pointer shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-bold text-stone-900 dark:text-stone-100 mb-1">
              تم إرسال طلب الحجز بنجاح
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-6">
              سيتواصل معك أحد موظفي الشركة في أقرب وقت لتأكيد موعدك
              {preferredDate && ` (${preferredDate} - ${RESERVATION_PERIOD_LABELS[period]})`}
            </p>
            <button
              type="button"
              onClick={close}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 cursor-pointer"
            >
              حسناً
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* الوحدة المختارة */}
            <div className="rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-3">
              <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400">الوحدة المطلوب حجزها</p>
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                {UNIT_KIND_LABELS[unit.unitKind]} {unit.zoneName ? `- ${unit.zoneName}` : ''}
              </p>
            </div>

            {/* الاسم */}
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1.5">
                الاسم بالكامل *
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: أحمد محمود"
                  maxLength={100}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 py-2.5 pr-10 pl-3 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* الهاتف */}
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1.5">
                رقم الهاتف *
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  maxLength={20}
                  dir="ltr"
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 py-2.5 pr-10 pl-3 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary text-left"
                />
              </div>
            </div>

            {/* التاريخ */}
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1.5">
                أقرب تاريخ متاح فيه *
              </label>
              <div className="relative">
                <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <input
                  type="date"
                  value={preferredDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 py-2.5 pr-10 pl-3 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* الفترة */}
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1.5">
                الفترة المناسبة *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                      period === p
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-primary'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {p === 'morning' ? 'صباحي' : p === 'afternoon' ? 'بعد الظهر' : 'مسائي'}
                  </button>
                ))}
              </div>
            </div>

            {/* ملاحظات اختيارية */}
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1.5">
                ملاحظات إضافية (اختياري)
              </label>
              <div className="relative">
                <StickyNote className="absolute right-3 top-3 w-4 h-4 text-stone-400 pointer-events-none" />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="في المتوسط الميزانية، متطلبات معينة..."
                  maxLength={1000}
                  rows={3}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 py-2.5 pr-10 pl-3 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <p className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl px-3 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-60 text-on-primary text-sm font-black transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب الحجز'}
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
