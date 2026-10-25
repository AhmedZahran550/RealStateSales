'use client';

import React, { useState } from 'react';
import { Customer } from '@/lib/types';
import { formatArabicFollowupDate } from '@/lib/date-utils';
import {
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  History,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  CalendarCheck,
  Search,
} from 'lucide-react';

interface BrokerAgendaTabProps {
  customers: Customer[];
  completedFollowups: Record<string, boolean>;
  onMarkDone: (id: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onNewCustomer: () => void;
}

export default function BrokerAgendaTab({
  customers,
  completedFollowups,
  onMarkDone,
  onSelectCustomer,
  onNewCustomer,
}: BrokerAgendaTabProps) {
  const [filter, setFilter] = useState<'all' | 'due' | 'investor'>('all');
  const [search, setSearch] = useState('');

  // ترشيح العملاء الذين لديهم متابعة محددة
  const followupsList = customers.filter((c) => {
    if (filter === 'investor' && (!c.budget || c.budget <= 0)) return false;
    if (filter === 'due') {
      if (!c.nextFollowupAt) return false;
      const todayStr = new Date().toISOString().split('T')[0];
      return c.nextFollowupAt.startsWith(todayStr);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchPhone = c.phone?.includes(q);
      const matchNotes = c.notes?.toLowerCase().includes(q);
      return matchName || matchPhone || matchNotes;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-on-surface">أجندة متابعات ومواعيد الاتصال</h2>
            <p className="text-[11px] text-on-surface-variant">
              تواصل فوري وسريع مع المشترين المحتملين وتحديث مراحل الصفقات
            </p>
          </div>
        </div>

        {/* Filter Pills and Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف…"
              className="input-base text-xs py-1.5 pr-8 pl-3 w-40 sm:w-48"
            />
            <Search className="w-3.5 h-3.5 text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-container-high/40">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              الكل ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('due')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === 'due'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => setFilter('investor')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === 'investor'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              مستثمرين
            </button>
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {followupsList.length > 0 ? (
          followupsList.map((lead) => {
            const isDone = completedFollowups[lead.id];
            const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
            const waGreeting = encodeURIComponent(
              `مرحباً أستاذ ${lead.name}، بخصوص اهتمامك بوحدات الحي المتميز بمدينة بدر، متى يناسبك موعد المعاينة أو تفاصيل الأسعار؟`
            );
            const waUrl = `https://wa.me/${cleanPhone.startsWith('2') ? cleanPhone : '2' + cleanPhone}?text=${waGreeting}`;

            return (
              <div
                key={lead.id}
                className={`card p-4 hover:shadow-md transition-all border border-surface-container-high/60 ${
                  isDone ? 'opacity-50 bg-surface-container-low' : 'bg-surface-container-lowest'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Lead Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0">
                      {lead.name ? lead.name.charAt(0) : 'ع'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectCustomer(lead)}
                          className="text-sm font-black text-on-surface hover:text-primary transition cursor-pointer text-right"
                        >
                          {lead.name}
                        </button>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-primary">
                          {lead.stage === 'lead'
                            ? 'عميل جديد'
                            : lead.stage === 'viewed'
                            ? 'تمت المعاينة'
                            : lead.stage === 'negotiating'
                            ? 'قيد التفاوض'
                            : lead.stage === 'reserved'
                            ? 'محجوز'
                            : 'استفسار'}
                        </span>

                        {lead.budget && lead.budget > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-container text-success">
                            الميزانية: {(lead.budget / 1_000_000).toFixed(1)} مليون ج.م
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                        {lead.notes || 'اهتمام بوحدات الحي المتميز والفرص الاستثمارية'}
                      </p>

                      {/* Last note summary */}
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-lg w-fit">
                        <History className="w-3 h-3 text-primary shrink-0" />
                        <span className="line-clamp-1">
                          <strong>آخر تفاعل:</strong>{' '}
                          {lead.activities?.[0]?.note || lead.notes || 'عميل مسجل في قاعدة البيانات'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time Badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-surface-container-high/40 text-xs font-bold text-on-surface shrink-0 self-start sm:self-auto">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {lead.nextFollowupAt
                        ? (() => {
                            const f = formatArabicFollowupDate(lead.nextFollowupAt);
                            return `${f.dayName} • ${f.formattedTime}`;
                          })()
                        : 'متابعة مرنة'}
                    </span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-4 pt-3 border-t border-surface-container-high/40">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold inline-flex items-center justify-center gap-1.5 transition min-h-[40px]"
                    >
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span dir="ltr">{lead.phone}</span>
                    </a>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-success-container hover:bg-success-container/70 text-success text-xs font-bold inline-flex items-center justify-center gap-1.5 transition min-h-[40px]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>واتساب مباشر</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isDone}
                      onClick={() => onMarkDone(lead.id)}
                      className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
                        isDone
                          ? 'bg-success-container text-success cursor-default'
                          : 'bg-primary text-on-primary hover:bg-primary-strong shadow-xs'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isDone ? 'تم التواصل وتحديث المرحلة' : 'تم الاتصال وتحديد موعد'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectCustomer(lead)}
                      className="px-2.5 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-bold transition cursor-pointer"
                      title="فتح ملف العميل الكامل"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 rounded-2xl bg-surface-container-low border border-surface-container-high/40 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-success-container text-success flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-on-surface">رائع! لا توجد متابعات متأخرة حالياً</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mt-1">
              أتممت مواعيد الاتصال بنجاح، يمكنك تسجيل عميل جديد أو مشاركة العروض المتاحة مع المشترين.
            </p>
            <button
              type="button"
              onClick={onNewCustomer}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary-strong transition cursor-pointer"
            >
              + تسجيل عميل جديد الآن
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
