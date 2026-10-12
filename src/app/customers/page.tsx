'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Customer, CustomerStage, STAGE_CONFIG } from '@/lib/types';
import CrmKanban from '@/components/CrmKanban';
import CustomerModal from '@/components/CustomerModal';
import CustomerDetailModal from '@/components/CustomerDetailModal';
import UnitDetailModal from '@/components/UnitDetailModal';
import {
  Users,
  Plus,
  Search,
  Kanban,
  List,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Filter,
} from 'lucide-react';

export default function CustomersPage() {
  const {
    currentUser,
    myCustomers,
    myUnits,
    addCustomer,
    updateCustomer,
    updateCustomerStage,
    addCustomerActivity,
    deleteCustomer,
  } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<CustomerStage | 'all'>('all');
  const [onlyUrgent, setOnlyUrgent] = useState(false);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [viewingUnit, setViewingUnit] = useState<any>(null);

  const [todayTimestamp, setTodayTimestamp] = useState<number | null>(null);
  const [todayString, setTodayString] = useState<string>('');
  const [urgentCount, setUrgentCount] = useState<number>(0);

  React.useEffect(() => {
    const now = new Date();
    setTodayTimestamp(new Date().setHours(0, 0, 0, 0));
    setTodayString(now.toDateString());

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    setUrgentCount(
      myCustomers.filter((c) => {
        if (!c.nextFollowupAt) return false;
        return new Date(c.nextFollowupAt) <= endOfToday;
      }).length
    );
  }, [myCustomers]);

  // Filtered leads - عزل بيانات العملاء بحسب المستخدم الحالي
  const filteredCustomers = useMemo(() => {
    return myCustomers.filter((c) => {
      // Search
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchName = c.name.toLowerCase().includes(query);
        const matchPhone = c.phone.includes(query);
        const matchNotes = c.notes?.toLowerCase().includes(query);
        if (!matchName && !matchPhone && !matchNotes) return false;
      }

      // Stage
      if (stageFilter !== 'all' && c.stage !== stageFilter) return false;

      // Urgent follow-ups only
      if (onlyUrgent) {
        if (!c.nextFollowupAt) return false;
        const fDate = new Date(c.nextFollowupAt);
        const endOfDay = todayTimestamp ? todayTimestamp + 86400000 - 1 : 0;
        if (fDate.getTime() > endOfDay) return false;
      }

      return true;
    });
  }, [myCustomers, searchTerm, stageFilter, onlyUrgent, todayTimestamp]);

  if (!currentUser) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#131a26] border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-600/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1c1917] dark:text-[#f5f5f4]">
              منظومة إدارة ومتابعة العملاء
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              متابعة العملاء المحتملين الخاصين بك، مواعيد المعاينات، وسجل المكالمات والتعاقدات
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCustomerModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500 hover:from-amber-800 hover:to-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-600/30 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل عميل جديد</span>
        </button>
      </div>

      {/* Control & Filter Strip */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#131a26] border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث بالاسم، رقم الهاتف، أو الملاحظات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-4 pr-10 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl self-end lg:self-auto">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-[#131a26] text-amber-900 dark:text-amber-300 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>لوحة المراحل المتتابعة</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#131a26] text-amber-900 dark:text-amber-300 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>جدول المتابعات</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
          <button
            onClick={() => {
              setStageFilter('all');
              setOnlyUrgent(false);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              stageFilter === 'all' && !onlyUrgent
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            كل العملاء ({myCustomers.length})
          </button>

          <button
            onClick={() => setOnlyUrgent(!onlyUrgent)}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              onlyUrgent
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>متابعات اليوم والمتأخرة ({urgentCount})</span>
          </button>

          <span className="text-stone-300 dark:text-stone-700 hidden sm:inline">|</span>

          {Object.entries(STAGE_CONFIG).map(([stgKey, cfg]) => {
            const count = myCustomers.filter((c) => c.stage === stgKey).length;
            const isSelected = stageFilter === stgKey;
            return (
              <button
                key={stgKey}
                onClick={() => {
                  setStageFilter(stgKey as any);
                  setOnlyUrgent(false);
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition border ${
                  isSelected
                    ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-2 ring-amber-500 font-bold`
                    : 'bg-white dark:bg-[#131a26] border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <span>{cfg.label}</span>
                <span className="mr-1 text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View: Kanban or Table */}
      {viewMode === 'kanban' ? (
        <CrmKanban
          customers={filteredCustomers}
          onSelectCustomer={(c) => setSelectedCustomer(c)}
          onMoveStage={(id, nextStage) => updateCustomerStage(id, nextStage)}
        />
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-[#131a26] rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#fbf9f6] dark:bg-[#18202e] border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">اسم العميل</th>
                  <th className="py-3.5 px-4">رقم الهاتف والتواصل</th>
                  <th className="py-3.5 px-4">المرحلة الحالية</th>
                  <th className="py-3.5 px-4">الميزانية</th>
                  <th className="py-3.5 px-4">المصدر</th>
                  <th className="py-3.5 px-4">موعد المتابعة</th>
                  <th className="py-3.5 px-4">آخر نشاط</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredCustomers.map((cust) => {
                  const cfg = STAGE_CONFIG[cust.stage];
                  const waNum = cust.whatsapp || (cust.phone.startsWith('01') ? `2${cust.phone}` : cust.phone);
                  const isOverdue =
                    todayTimestamp !== null &&
                    cust.nextFollowupAt &&
                    new Date(cust.nextFollowupAt).setHours(0, 0, 0, 0) < todayTimestamp;
                  const isToday =
                    todayString !== '' &&
                    cust.nextFollowupAt &&
                    new Date(cust.nextFollowupAt).toDateString() === todayString;

                  const lastActivity = cust.activities?.[0];

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className="hover:bg-amber-50/50 dark:hover:bg-amber-950/20 cursor-pointer transition"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                        {cust.name}
                      </td>

                      {/* Phone & WhatsApp */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{cust.phone}</span>
                          <a
                            href={`https://wa.me/${waNum}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700"
                            title="واتساب مباشر"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </td>

                      {/* Stage */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                      </td>

                      {/* Budget */}
                      <td className="py-3.5 px-4 font-bold text-amber-700 dark:text-amber-400">
                        {cust.budget ? `${cust.budget.toLocaleString('ar-EG')} ج.م` : '-'}
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4 text-stone-500">{cust.source || '-'}</td>

                      {/* Follow-up */}
                      <td className="py-3.5 px-4">
                        {cust.nextFollowupAt ? (
                          <span
                            className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-lg ${
                              isOverdue
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                : isToday
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'text-stone-600 dark:text-stone-300'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {new Date(cust.nextFollowupAt).toLocaleDateString('ar-EG')}
                          </span>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-4 text-stone-600 dark:text-stone-300 max-w-xs truncate">
                        {lastActivity ? lastActivity.note : '-'}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold hover:bg-amber-100 transition"
                        >
                          الملف الكامل
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Create Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={(cData) => addCustomer(cData)}
        units={myUnits}
      />

      {/* Customer Detail Dossier Modal */}
      <CustomerDetailModal
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onUpdateStage={updateCustomerStage}
        onAddActivity={addCustomerActivity}
        onUpdateCustomer={updateCustomer}
        onDeleteCustomer={deleteCustomer}
        units={myUnits}
        onSelectUnit={(u) => {
          setViewingUnit(u);
        }}
      />

      {/* Unit Detail Modal (if clicked from customer dossier) */}
      <UnitDetailModal
        unit={viewingUnit}
        onClose={() => setViewingUnit(null)}
      />
    </div>
  );
}
