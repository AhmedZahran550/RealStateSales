'use client';

import React from 'react';
import Link from 'next/link';
import { Customer } from '@/lib/types';
import {
  Layers,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Calendar,
  FileCheck,
  ExternalLink,
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
          className="px-3.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold inline-flex items-center gap-1.5 transition border border-surface-container-high shadow-xs self-start sm:self-auto"
        >
          <span>لوحة كانبان الكاملة</span>
          <ExternalLink className="w-3.5 h-3.5 text-primary" />
        </Link>
      </div>

      {/* 4 Stages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Stage 1: New Leads */}
        <div className="card p-4 space-y-3 border border-surface-container-high/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">1. استفسارات وعملاء جدد</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-primary">
              {leadPct}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary">{newLeads.length}</span>
            <span className="text-xs text-on-surface-variant font-bold">عميل</span>
          </div>
          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${leadPct}%` }} />
          </div>
          <p className="text-[11px] text-on-surface-variant">بانتظار تحديد موعد معاينة أولية</p>
        </div>

        {/* Stage 2: Viewed */}
        <div className="card p-4 space-y-3 border border-surface-container-high/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">2. تمت المعاينة الميدانية</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-indigo-container text-on-accent-indigo-container">
              {viewedPct}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-on-surface">{viewedLeads.length}</span>
            <span className="text-xs text-on-surface-variant font-bold">عميل</span>
          </div>
          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${viewedPct}%` }}
            />
          </div>
          <p className="text-[11px] text-on-surface-variant">تم فحص الموقع ومطالعة الوحدات</p>
        </div>

        {/* Stage 3: Negotiating */}
        <div className="card p-4 space-y-3 border border-surface-container-high/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">3. مرحلة التفاوض والعروض</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary">
              {negPct}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-on-surface">{negotiatingLeads.length}</span>
            <span className="text-xs text-on-surface-variant font-bold">عميل</span>
          </div>
          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full transition-all duration-500"
              style={{ width: `${negPct}%` }}
            />
          </div>
          <p className="text-[11px] text-on-surface-variant">
            قيمة الصفقات: {(negotiatingTotalValue / 1_000_000).toFixed(1)}M ج.م
          </p>
        </div>

        {/* Stage 4: Closed / Reserved */}
        <div className="card p-4 space-y-3 border border-surface-container-high/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">4. حجز مؤقت وإبرام عقود</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-container text-success">
              {closedPct}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-success">{closedLeads.length}</span>
            <span className="text-xs text-on-surface-variant font-bold">صفقة</span>
          </div>
          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
            <div
              className="bg-success h-full rounded-full transition-all duration-500"
              style={{ width: `${closedPct}%` }}
            />
          </div>
          <p className="text-[11px] text-success font-bold">معدل الإغلاق الكلي للوسيط</p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="card p-4 bg-surface-container-low border border-surface-container-high/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs text-on-surface">
            لديك <strong>{customers.length}</strong> عميلاً مسجلين في مسار الصفقات. العمولات المستحقة تُحسب تلقائياً بنسبة 2.5% فور الوصول لمرحلة التفاوض والحجز.
          </span>
        </div>

        <Link
          href="/matching"
          className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-strong transition shadow-xs inline-flex items-center gap-1 shrink-0 self-start sm:self-auto"
        >
          <span>مطابقة سريعة مع الوحدات</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
