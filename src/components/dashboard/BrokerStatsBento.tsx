'use client';

import React from 'react';
import { Customer, Unit } from '@/lib/types';
import { PhoneCall, Users, Handshake, DollarSign, ArrowUpRight, Clock } from 'lucide-react';

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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {/* 1. متابعات اليوم المستحقة */}
      <div
        onClick={() => onSelectTab('agenda')}
        className="card p-4 hover:shadow-md transition-all cursor-pointer border border-surface-container-high/60 group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-on-surface-variant">متابعات اليوم المستحقة</span>
          <div className="w-8 h-8 rounded-xl bg-error-container text-on-error-container flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-on-surface">{urgentFollowupsCount}</span>
          <span className="text-xs text-on-surface-variant font-bold">عميل للاتصال</span>
        </div>
        <div className="mt-2 pt-2 border-t border-surface-container-high/30 flex items-center justify-between text-[11px]">
          <span className={urgentFollowupsCount > 0 ? 'text-error font-bold' : 'text-success font-bold'}>
            {urgentFollowupsCount > 0 ? 'يتطلب اتصال ومتابعة سريعة' : 'جميع المتابعات مكتملة'}
          </span>
          <span className="text-primary font-bold group-hover:underline inline-flex items-center gap-0.5">
            عرض
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* 2. قاعدة العملاء النشطة */}
      <div
        onClick={() => onSelectTab('agenda')}
        className="card p-4 hover:shadow-md transition-all cursor-pointer border border-surface-container-high/60 group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-on-surface-variant">العملاء النشطين</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-primary">{totalCustomersCount}</span>
          <span className="text-xs text-on-surface-variant font-bold">عميل مسجل</span>
        </div>
        <div className="mt-2 pt-2 border-t border-surface-container-high/30 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span>{availableUnitsCount} وحدة متاحة للعرض</span>
          <span className="text-primary font-bold group-hover:underline inline-flex items-center gap-0.5">
            تفاصيل
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* 3. صفقات قيد التفاوض */}
      <div
        onClick={() => onSelectTab('pipeline')}
        className="card p-4 hover:shadow-md transition-all cursor-pointer border border-surface-container-high/60 group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-on-surface-variant">صفقات قيد التفاوض</span>
          <div className="w-8 h-8 rounded-xl bg-secondary-container text-on-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Handshake className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-on-surface">{negotiatingSumFormatted}</span>
          <span className="text-xs text-on-surface-variant font-bold">{negotiatingSumUnit}</span>
        </div>
        <div className="mt-2 pt-2 border-t border-surface-container-high/30 flex items-center justify-between text-[11px]">
          <span className="text-on-surface-variant font-bold">{negotiatingCustomersCount} صفقات نشطة</span>
          <span className="text-primary font-bold group-hover:underline inline-flex items-center gap-0.5">
            المسار
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* 4. العمولات المتوقعة */}
      <div
        onClick={() => onSelectTab('pipeline')}
        className="card p-4 hover:shadow-md transition-all cursor-pointer border border-surface-container-high/60 group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-on-surface-variant">العمولات المتوقعة (2.5%)</span>
          <div className="w-8 h-8 rounded-xl bg-success-container text-success flex items-center justify-center group-hover:scale-110 transition-transform">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-success">{expectedCommissionFormatted}</span>
          <span className="text-xs text-on-surface-variant font-bold">ج.م</span>
        </div>
        <div className="mt-2 pt-2 border-t border-surface-container-high/30 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span>بناءً على صفقات التفاوض الحالية</span>
          <span className="text-primary font-bold group-hover:underline inline-flex items-center gap-0.5">
            حساب
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
