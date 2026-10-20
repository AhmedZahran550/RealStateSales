'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { PublicReservation, RESERVATION_PERIOD_LABELS, STAGE_CONFIG } from '@/lib/types';
import { publicPageService } from '@/services/publicPageService';
import { formatArabicFollowupDate } from '@/lib/date-utils';
import { CalendarCheck, Loader2, HandHeart, UserPlus, SearchX, RefreshCw } from 'lucide-react';

export default function PublicReservationsPage() {
  const { currentUser, refreshFromDatabase } = useApp();
  const [reservations, setReservations] = useState<PublicReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<'new' | 'claimed'>('new');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    (async () => {
      const res = await publicPageService.fetchReservations();
      if (cancelled) return;
      if (res.success && res.data) {
        setReservations(res.data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser, refreshKey]);

  const load = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleClaim = async (id: string) => {
    setClaimingId(id);
    setMessage(null);
    const res = await publicPageService.claimReservation(id);
    setClaimingId(null);
    if (res.success) {
      setMessage({ type: 'success', text: res.message || 'تم استلام متابعة الحجز بنجاح' });
      await load();
      refreshFromDatabase();
    } else {
      setMessage({ type: 'error', text: res.error || 'فشل استلام الحجز' });
    }
  };

  const filtered = reservations.filter((r) =>
    filter === 'new' ? r.status === 'new' : r.status === 'claimed'
  );

  const newCount = reservations.filter((r) => r.status === 'new').length;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* الترويسة */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-on-surface ">
              حجوزات الصفحة العامة
            </h1>
            <p className="text-xs text-on-surface-variant font-semibold">
              الطلبات الجديدة من زوار الصفحة العامة — استلم متابعتها قبل زملائك
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container-low cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {/* رسائل */}
      {message && (
        <p
          className={`text-xs font-bold rounded-xl px-4 py-3 ${
            message.type === 'success'
              ? 'text-success  bg-success-container '
              : 'text-error  bg-error-container '
          }`}
        >
          {message.text}
        </p>
      )}

      {/* التبويبات */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter('new')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            filter === 'new'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          طلبات جديدة ({newCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('claimed')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            filter === 'claimed'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          تحت المتابعة ({reservations.length - newCount})
        </button>
      </div>

      {/* القائمة */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-container-low flex items-center justify-center mb-3">
            <SearchX className="w-7 h-7 text-on-surface-variant" />
          </div>
          <p className="font-bold text-on-surface-variant ">
            {filter === 'new' ? 'لا توجد طلبات حجز جديدة' : 'لا توجد طلبات تحت المتابعة'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* بيانات العميل الزائر */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-on-surface text-sm">
                    {r.customerName}
                  </span>
                  <a
                    href={`tel:${r.phone}`}
                    dir="ltr"
                    className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    {r.phone}
                  </a>
                </div>
                <p className="text-xs text-on-surface-variant font-semibold">
                  {r.unitLabel || 'وحدة'} {r.unitArea ? `• ${r.unitArea} م²` : ''}
                </p>
                <p className="text-[11px] text-on-surface-variant font-semibold">
                  يرجى التواصل:{' '}
                  {formatArabicFollowupDate(`${r.preferredDate}T12:00:00`).dayName} —{' '}
                  {RESERVATION_PERIOD_LABELS[r.period]}
                </p>
                {r.note && (
                  <p className="text-xs text-on-surface-variant bg-surface-container/80 rounded-lg px-3 py-2 mt-1 line-clamp-2">
                    ملاحظة الزائر: {r.note}
                  </p>
                )}
              </div>

              {/* الحالة / زر الاستلام */}
              <div className="shrink-0 sm:w-64 space-y-2">
                {r.status === 'new' ? (
                  <button
                    type="button"
                    onClick={() => handleClaim(r.id)}
                    disabled={claimingId === r.id}
                    className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 text-on-primary text-xs font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {claimingId === r.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <HandHeart className="w-4 h-4" />
                    )}
                    متابعة العميل (استلام)
                  </button>
                ) : (
                  <div className="rounded-xl bg-surface-container border border-outline-variant px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                      <span className="flex items-center gap-1.5 text-on-surface-variant ">
                        <UserPlus className="w-3.5 h-3.5 text-success" />
                        {r.claimedByName || 'موظف'}
                      </span>
                      {r.claimedCustomerStage && (
                        <span
                          className={`px-2 py-0.5 rounded-lg border text-[10px] ${STAGE_CONFIG[r.claimedCustomerStage].bg} ${STAGE_CONFIG[r.claimedCustomerStage].color} ${STAGE_CONFIG[r.claimedCustomerStage].border}`}
                        >
                          {STAGE_CONFIG[r.claimedCustomerStage].label}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      أُضيف العميل إلى CRM الموظف المتابع
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
