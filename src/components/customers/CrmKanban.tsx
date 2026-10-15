'use client';

import React from 'react';
import { Customer, CustomerStage, STAGE_CONFIG } from '@/lib/types';
import {
  Phone,
  MessageCircle,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  User,
} from 'lucide-react';
import { formatArabicFollowupDate } from '@/lib/date-utils';

export interface CrmKanbanProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onMoveStage: (customerId: string, nextStage: CustomerStage) => void;
}

const STAGES_ORDER: CustomerStage[] = [
  'lead',
  'asking',
  'viewed',
  'negotiating',
  'reserved',
  'closed',
  'lost',
];

export default function CrmKanban({
  customers,
  onSelectCustomer,
  onMoveStage,
}: CrmKanbanProps) {
  const [todayTimestamp, setTodayTimestamp] = React.useState<number | null>(null);
  const [todayDateString, setTodayDateString] = React.useState<string>('');

  React.useEffect(() => {
    setTodayTimestamp(new Date().setHours(0, 0, 0, 0));
    setTodayDateString(new Date().toDateString());
  }, []);
  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-6 pt-2 select-none min-h-[520px] snap-x snap-mandatory scroll-smooth">
      {STAGES_ORDER.map((stageKey, stageIdx) => {
        const stageConfig = STAGE_CONFIG[stageKey];
        const stageCustomers = customers.filter((c) => c.stage === stageKey);

        const prevStage = stageIdx > 0 ? STAGES_ORDER[stageIdx - 1] : null;
        const nextStage = stageIdx < STAGES_ORDER.length - 1 ? STAGES_ORDER[stageIdx + 1] : null;

        return (
          <div
            key={stageKey}
            className="w-[85vw] max-w-xs sm:w-80 snap-center sm:snap-align-none flex-shrink-0 flex flex-col bg-slate-100/70 dark:bg-slate-900/60 rounded-3xl p-3.5 border border-slate-200/80 dark:border-slate-800"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${stageConfig.bg} border-2 ${stageConfig.border}`} />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {stageConfig.label}
                </h4>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {stageCustomers.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[680px] pr-0.5">
              {stageCustomers.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-400">لا يوجد عملاء في هذه المرحلة</p>
                </div>
              ) : (
                stageCustomers.map((cust) => {
                  const isOverdue =
                    todayTimestamp !== null &&
                    cust.nextFollowupAt &&
                    new Date(cust.nextFollowupAt).setHours(0, 0, 0, 0) < todayTimestamp;
                  const isToday =
                    todayDateString !== '' &&
                    cust.nextFollowupAt &&
                    new Date(cust.nextFollowupAt).toDateString() === todayDateString;

                  const waNum = cust.whatsapp || (cust.phone.startsWith('01') ? `2${cust.phone}` : cust.phone);

                  return (
                    <div
                      key={cust.id}
                      onClick={() => onSelectCustomer(cust)}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-amber-500 transition-all cursor-pointer group"
                    >
                      {/* Customer Name & Budget */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 transition">
                            {cust.name}
                          </h5>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            {cust.source || 'إعلان'}
                          </span>
                        </div>
                        {cust.budget && (
                          <span className="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                            {(cust.budget / 1000000).toFixed(1)} م
                          </span>
                        )}
                      </div>

                      {/* Phone & WhatsApp */}
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-mono text-[11px]">{cust.phone}</span>
                        <a
                          href={`https://wa.me/${waNum}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition"
                          title="واتساب مباشر"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>

                      {/* Followup notice with Arabic Day Name */}
                      {cust.nextFollowupAt ? (
                        (() => {
                          const followup = formatArabicFollowupDate(cust.nextFollowupAt);
                          return (
                            <div
                              className={`mt-2.5 flex items-center justify-between text-[10px] font-bold px-2 py-1.5 rounded-lg ${
                                followup.isOverdue
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                  : followup.isToday
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              }`}
                            >
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  <strong>{followup.dayName}</strong> ({followup.formattedDate}) • {followup.formattedTime}
                                </span>
                              </div>
                              <span>{followup.isOverdue ? '⚠️ متأخرة' : followup.isToday ? '🔔 اليوم' : 'مجدولة'}</span>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="mt-2 text-[10px] text-slate-400 font-medium px-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>بدون موعد متابعة</span>
                        </div>
                      )}

                      {/* Stage Shift Buttons */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                        {prevStage ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveStage(cust.id, prevStage);
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center gap-0.5 font-semibold"
                            title={`رجوع إلى ${STAGE_CONFIG[prevStage].label}`}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                            السابق
                          </button>
                        ) : (
                          <span />
                        )}

                        {nextStage && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveStage(cust.id, nextStage);
                            }}
                            className="text-[10px] text-amber-600 dark:text-amber-400 hover:text-amber-700 font-bold flex items-center gap-0.5"
                            title={`نقل إلى ${STAGE_CONFIG[nextStage].label}`}
                          >
                            التالي
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
