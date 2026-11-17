'use client';

import React, { useMemo } from 'react';
import { PaymentType, PAYMENT_TYPE_LABELS } from '@/lib/types';
import { DollarSign, Calendar, Calculator } from 'lucide-react';

export interface PaymentSectionProps {
  totalPrice: number;
  paymentType: PaymentType;
  onPaymentTypeChange: (type: PaymentType) => void;
  downPayment: number;
  onDownPaymentChange: (amount: number) => void;
  installmentMonths: number;
  onInstallmentMonthsChange: (months: number) => void;
}

const PERIOD_OPTIONS = [3, 6, 12, 18, 24, 36, 48, 60];

export default function PaymentSection({
  totalPrice,
  paymentType,
  onPaymentTypeChange,
  downPayment,
  onDownPaymentChange,
  installmentMonths,
  onInstallmentMonthsChange,
}: PaymentSectionProps) {
  // حساب النسبة المئوية للمقدم
  const downPaymentPercent = useMemo(() => {
    if (!totalPrice || totalPrice <= 0) return 0;
    return Math.round((downPayment / totalPrice) * 100);
  }, [downPayment, totalPrice]);

  // حساب القسط الشهري تلقائياً
  const monthlyPayment = useMemo(() => {
    if (!installmentMonths || installmentMonths <= 0) return 0;
    if (paymentType === 'cash_with_facilities') {
      return Math.ceil(totalPrice / installmentMonths);
    }
    // installment
    const remaining = totalPrice - downPayment;
    return remaining > 0 ? Math.ceil(remaining / installmentMonths) : 0;
  }, [totalPrice, downPayment, installmentMonths, paymentType]);

  // تحديث المقدم من المبلغ
  const handleDownPaymentAmount = (amount: number) => {
    onDownPaymentChange(Math.max(0, Math.min(amount, totalPrice)));
  };

  // تحديث المقدم من النسبة المئوية
  const handleDownPaymentPercent = (pct: number) => {
    const clamped = Math.max(0, Math.min(pct, 100));
    const amount = Math.round((clamped / 100) * totalPrice);
    onDownPaymentChange(amount);
  };

  return (
    <div className="space-y-3">
      {/* نوع السداد */}
      <div>
        <label className="block text-xs font-bold text-on-surface mb-1">
          نظام السداد والتقسيط
        </label>
        <select
          value={paymentType}
          onChange={(e) => {
            const newType = e.target.value as PaymentType;
            onPaymentTypeChange(newType);
            // إعادة ضبط القيم عند تغيير النوع
            if (newType === 'cash') {
              onDownPaymentChange(0);
              onInstallmentMonthsChange(0);
            } else if (newType === 'cash_with_facilities') {
              onDownPaymentChange(0);
              if (!installmentMonths) onInstallmentMonthsChange(12);
            } else {
              // installment
              if (!installmentMonths) onInstallmentMonthsChange(12);
            }
          }}
          className="input-base w-full text-xs font-bold py-2.5"
        >
          {Object.entries(PAYMENT_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* حقول التقسيط — تظهر عند اختيار قسط */}
      {paymentType === 'installment' && (
        <div className="space-y-3 p-3 rounded-xl bg-surface-container border border-outline-variant/60">
          {/* المقدم — مبلغ ونسبة مترابطان */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                المقدم (ج.م)
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  min={0}
                  max={totalPrice}
                  value={downPayment || ''}
                  onChange={(e) => handleDownPaymentAmount(Number(e.target.value) || 0)}
                  className="input-base w-full text-xs font-bold py-2 pr-8"
                  placeholder="مبلغ المقدم"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                المقدم (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={downPaymentPercent || ''}
                  onChange={(e) => handleDownPaymentPercent(Number(e.target.value) || 0)}
                  className="input-base w-full text-xs font-bold py-2 pr-3 pl-8"
                  placeholder="النسبة"
                  dir="ltr"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-on-surface-variant pointer-events-none">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* المدة والقسط الشهري */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                مدة التقسيط (شهر)
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={installmentMonths}
                  onChange={(e) => onInstallmentMonthsChange(Number(e.target.value))}
                  className="input-base w-full text-xs font-bold py-2 pr-8"
                >
                  <option value={0}>اختر المدة</option>
                  {PERIOD_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m} شهر {m >= 12 ? `(${(m / 12).toFixed(m % 12 === 0 ? 0 : 1)} سنة)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                القسط الشهري (تلقائي)
              </label>
              <div className="relative">
                <Calculator className="w-3.5 h-3.5 text-primary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  readOnly
                  value={monthlyPayment > 0 ? `${monthlyPayment.toLocaleString('ar-EG')} ج.م` : '—'}
                  className="input-base w-full text-xs font-black py-2 pr-8 bg-primary/5 text-primary border-primary/30 cursor-default"
                  dir="rtl"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* حقول كاش مع تسهيلات — المدة والقسط الشهري فقط */}
      {paymentType === 'cash_with_facilities' && (
        <div className="space-y-3 p-3 rounded-xl bg-surface-container border border-outline-variant/60">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                مدة التسهيلات (شهر)
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={installmentMonths}
                  onChange={(e) => onInstallmentMonthsChange(Number(e.target.value))}
                  className="input-base w-full text-xs font-bold py-2 pr-8"
                >
                  <option value={0}>اختر المدة</option>
                  {PERIOD_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m} شهر {m >= 12 ? `(${(m / 12).toFixed(m % 12 === 0 ? 0 : 1)} سنة)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                القسط الشهري (تلقائي)
              </label>
              <div className="relative">
                <Calculator className="w-3.5 h-3.5 text-primary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  readOnly
                  value={monthlyPayment > 0 ? `${monthlyPayment.toLocaleString('ar-EG')} ج.م` : '—'}
                  className="input-base w-full text-xs font-black py-2 pr-8 bg-primary/5 text-primary border-primary/30 cursor-default"
                  dir="rtl"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
