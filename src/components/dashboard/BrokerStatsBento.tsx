'use client';

import React from 'react';
import { Users, Handshake, DollarSign, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react';

interface BrokerStatsBentoProps {
  urgentFollowupsCount: number;
  totalCustomersCount: number;
  negotiatingCustomersCount: number;
  negotiatingSumFormatted: string;
  negotiatingSumUnit: string;
  expectedCommissionFormatted: string;
  availableUnitsCount: number;
  onSelectTab: (tab: 'agenda' | 'pipeline' | 'share') => void;
}

export default function BrokerStatsBento({
  urgentFollowupsCount,
  totalCustomersCount,
  negotiatingCustomersCount,
  negotiatingSumFormatted,
  negotiatingSumUnit,
  expectedCommissionFormatted,
  availableUnitsCount,
  onSelectTab,
}: BrokerStatsBentoProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. متابعات اليوم المستحقة */}
      <div
        onClick={() => onSelectTab('agenda')}
        className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-sm"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelectTab('agenda')}
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant">متابعات اليوم المستحقة</span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                urgentFollowupsCount > 0
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-success-container text-success'
              }`}
            >
              {urgentFollowupsCount > 0 ? (
                <Clock className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-on-surface tabular-nums">
              {urgentFollowupsCount}
            </span>
            <span className="text-xs text-on-surface-variant font-bold">عميل للمتابعة</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-[11px]">
          <span
            className={
              urgentFollowupsCount > 0 ? 'text-error font-bold' : 'text-success font-bold'
            }
          >
            {urgentFollowupsCount > 0 ? 'يتطلب اتصال ومتابعة سريعة' : 'جميع المتابعات مكتملة'}
          </span>
          <span className="text-primary font-bold group-hover:underline inline-flex items-center gap-0.5">
            عرض
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* 2. قاعدة العملاء النشطة */}
      <div
        onClick={() => onSelectTab('agenda')}
        className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-sm"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelectTab('agenda')}
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant">العملاء النشطين</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-primary tabular-nums">
              {totalCustomersCount}
            </span>
            <span className="text-xs text-on-surface-variant font-bold">عميل مسجل</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span>{availableUnitsCount} وحدة متاحة للعرض</span>
          <span className="text-primary font-bold group-hover:underline inline-flex items-center gap-0.5">
            تفاصيل
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* 3. صفقات قيد التفاوض */}
      <div
        onClick={() => onSelectTab('pipeline')}
        className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-sm"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelectTab('pipeline')}
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant">صفقات قيد التفاوض</span>
            <div className="w-9 h-9 rounded-xl bg-accent-purple-container text-on-accent-purple-container flex items-center justify-center transition-transform group-hover:scale-105">
              <Handshake className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-on-surface tabular-nums">
              {negotiatingSumFormatted}
            </span>
            <span className="text-xs text-on-surface-variant font-bold">{negotiatingSumUnit}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-[11px]">
          <span className="text-on-surface-variant font-bold">
            {negotiatingCustomersCount} صفقات نشطة
          </span>
          <span className="text-primary font-bold group-hover:underline inline-flex items-center gap-0.5">
            المسار
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* 4. العمولات المتوقعة */}
      <div
        onClick={() => onSelectTab('pipeline')}
        className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-sm"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelectTab('pipeline')}
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant">العمولات المتوقعة (2.5%)</span>
            <div className="w-9 h-9 rounded-xl bg-success-container text-success flex items-center justify-center transition-transform group-hover:scale-105">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-success tabular-nums">
              {expectedCommissionFormatted}
            </span>
            <span className="text-xs text-on-surface-variant font-bold">ج.م</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span>بناءً على صفقات التفاوض الحالية</span>
          <span className="text-primary font-bold group-hover:underline inline-flex items-center gap-0.5">
            حساب
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
