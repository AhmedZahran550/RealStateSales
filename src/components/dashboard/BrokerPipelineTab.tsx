'use client';

import React from 'react';
import Link from 'next/link';
import { Customer } from '@/lib/types';
import {
  TrendingUp,
  FileCheck,
  ExternalLink,
  ArrowLeft,
  Kanban,
} from 'lucide-react';

interface BrokerPipelineTabProps {
  customers: Customer[];
}

export default function BrokerPipelineTab({ customers }: BrokerPipelineTabProps) {
  const newLeads = customers.filter((c) => c.stage === 'lead' || c.stage === 'asking');
  const viewedLeads = customers.filter((c) => c.stage === 'viewed');
  const negotiatingLeads = customers.filter((c) => c.stage === 'negotiating');
  const closedLeads = customers.filter((c) => c.stage === 'reserved' || c.stage === 'closed');

  const total = customers.length || 1;
  const leadPct = Math.round((newLeads.length / total) * 100);
  const viewedPct = Math.round((viewedLeads.length / total) * 100);
  const negPct = Math.round((negotiatingLeads.length / total) * 100);
  const closedPct = Math.round((closedLeads.length / total) * 100);

  const negotiatingTotalValue = negotiatingLeads.reduce((acc, c) => acc + (c.budget || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-on-surface">مسار الصفقات ومراحل الإغلاق (Pipeline)</h2>
            <p className="text-[11px] text-on-surface-variant">
              توزيع العملاء في المراحل البيعية ونسب التحويل من الاستفسار إلى التعاقد
            </p>
          </div>
        </div>

        <Link
          href="/customers?view=pipeline"
          className="btn-tonal px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto min-h-[38px]"
        >
          <Kanban className="w-3.5 h-3.5 text-primary" />
          <span>لوحة كانبان الكاملة</span>
          <ExternalLink className="w-3 h-3 text-on-surface-variant" />
        </Link>
      </div>

      {/* 4 Stages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Stage 1: New Leads */}
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 space-y-3 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-on-surface-variant">1. استفسارات وعملاء جدد</span>
              <span className="badge badge-neutral text-[10px] font-mono">
                {leadPct}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-primary tabular-nums">{newLeads.length}</span>
              <span className="text-xs text-on-surface-variant font-bold">عميل</span>
            </div>
          </div>
          <div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mb-2">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${leadPct}%` }} />
            </div>
            <p className="text-[11px] text-on-surface-variant">بانتظار تحديد موعد معاينة أولية</p>
          </div>
        </div>

        {/* Stage 2: Viewed */}
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 space-y-3 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-on-surface-variant">2. تمت المعاينة الميدانية</span>
              <span className="badge badge-accent-indigo text-[10px] font-mono">
                {viewedPct}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-on-surface tabular-nums">{viewedLeads.length}</span>
              <span className="text-xs text-on-surface-variant font-bold">عميل</span>
            </div>
          </div>
          <div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mb-2">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${viewedPct}%` }}
              />
            </div>
            <p className="text-[11px] text-on-surface-variant">تم فحص الموقع ومطالعة الوحدات</p>
          </div>
        </div>

        {/* Stage 3: Negotiating */}
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 space-y-3 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-on-surface-variant">3. مرحلة التفاوض والعروض</span>
              <span className="badge badge-accent-purple text-[10px] font-mono">
                {negPct}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-on-surface tabular-nums">{negotiatingLeads.length}</span>
              <span className="text-xs text-on-surface-variant font-bold">عميل</span>
            </div>
          </div>
          <div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mb-2">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-500"
                style={{ width: `${negPct}%` }}
              />
            </div>
            <p className="text-[11px] text-on-surface-variant">
              قيمة الصفقات: <strong className="text-on-surface font-mono">{(negotiatingTotalValue / 1_000_000).toFixed(1)}M ج.م</strong>
            </p>
          </div>
        </div>

        {/* Stage 4: Closed / Reserved */}
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 space-y-3 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-on-surface-variant">4. حجز مؤقت وإبرام عقود</span>
              <span className="badge badge-success text-[10px] font-mono">
                {closedPct}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-success tabular-nums">{closedLeads.length}</span>
              <span className="text-xs text-on-surface-variant font-bold">صفقة</span>
            </div>
          </div>
          <div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mb-2">
              <div
                className="bg-success h-full rounded-full transition-all duration-500"
                style={{ width: `${closedPct}%` }}
              />
            </div>
            <p className="text-[11px] text-on-surface-variant font-semibold">معدل الإغلاق الكلي للوسيط</p>
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="rounded-2xl p-4 sm:p-5 bg-surface-container-low border border-outline-variant/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileCheck className="w-5 h-5 text-primary shrink-0" />
          <span className="text-xs text-on-surface leading-relaxed">
            لديك <strong className="font-mono font-bold text-primary">{customers.length}</strong> عميلاً مسجلين في مسار الصفقات. العمولات المستحقة تُحسب تلقائياً بنسبة 2.5% فور الوصول لمرحلة التفاوض والحجز.
          </span>
        </div>

        <Link
          href="/matching"
          className="btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto min-h-[38px]"
        >
          <span>مطابقة سريعة مع الوحدات</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
