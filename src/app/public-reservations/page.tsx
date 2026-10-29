'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { PublicReservation, RESERVATION_PERIOD_LABELS, STAGE_CONFIG } from '@/lib/types';
import { publicPageService } from '@/services/publicPageService';
import { formatArabicFollowupDate } from '@/lib/date-utils';
import {
  CalendarCheck,
  Loader2,
  HandHeart,
  UserPlus,
  SearchX,
  RefreshCw,
  Trash2,
  UserCheck,
  X,
  AlertCircle,
  Building,
} from 'lucide-react';

export default function PublicReservationsPage() {
  const { currentUser, isCompanyAdmin, isSuperAdmin, companyUsers, refreshFromDatabase } = useApp();
  const [reservations, setReservations] = useState<PublicReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<'new' | 'claimed'>('new');
  const [refreshKey, setRefreshKey] = useState(0);

  // حالة مودال الإسناد لموظف
  const [assignModalReservation, setAssignModalReservation] = useState<PublicReservation | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // حالة مودال تأكيد الحذف
  const [deleteModalReservation, setDeleteModalReservation] = useState<PublicReservation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = isCompanyAdmin || isSuperAdmin;

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

  // استلام شخصي مباشر
  const handleSelfClaim = async (id: string) => {
    setActionId(id);
    setMessage(null);
    const res = await publicPageService.claimReservation(id);
    setActionId(null);
    if (res.success) {
      setMessage({ type: 'success', text: res.message || 'تم استلام متابعة الحجز بنجاح' });
      await load();
      refreshFromDatabase();
    } else {
      setMessage({ type: 'error', text: res.error || 'فشل استلام الحجز' });
    }
  };

  // فتح نافذة الإسناد لموظف
  const openAssignModal = (r: PublicReservation) => {
    setAssignModalReservation(r);
    // افتراضياً: إذا كان مسنداً مسبقاً نحدده، وإلا أول موظف بالقائمة
    setSelectedAssigneeId(r.claimedBy || companyUsers[0]?.id || currentUser?.id || '');
  };

  // تأكيد إسناد الحجز للموظف
  const handleConfirmAssign = async () => {
    if (!assignModalReservation || !selectedAssigneeId) return;

    setIsAssigning(true);
    setMessage(null);
    const res = await publicPageService.claimReservation(
      assignModalReservation.id,
      selectedAssigneeId
    );
    setIsAssigning(false);

    if (res.success) {
      setMessage({ type: 'success', text: res.message || 'تم إسناد الحجز للموظف بنجاح' });
      setAssignModalReservation(null);
      await load();
      refreshFromDatabase();
    } else {
      setMessage({ type: 'error', text: res.error || 'فشل إسناد الحجز' });
    }
  };

  // فتح نافذة تأكيد الحذف
  const openDeleteModal = (r: PublicReservation) => {
    setDeleteModalReservation(r);
  };

  // تأكيد الحذف
  const handleConfirmDelete = async () => {
    if (!deleteModalReservation) return;

    setIsDeleting(true);
    setMessage(null);
    const res = await publicPageService.deleteReservation(deleteModalReservation.id);
    setIsDeleting(false);

    if (res.success) {
      setMessage({ type: 'success', text: res.message || 'تم حذف طلب الحجز بنجاح' });
      setDeleteModalReservation(null);
      await load();
    } else {
      setMessage({ type: 'error', text: res.error || 'فشل حذف الحجز' });
    }
  };

  const filtered = reservations.filter((r) =>
    filter === 'new' ? r.status === 'new' : r.status === 'claimed'
  );

  const newCount = reservations.filter((r) => r.status === 'new').length;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      {/* الترويسة */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-on-surface">
              حجوزات الصفحة العامة
            </h1>
            <p className="text-xs text-on-surface-variant font-semibold">
              {canManage
                ? 'إدارة وتوزيع وحذف طلبات المعاينة الجديدة الواردة من الصفحة العامة'
                : 'الطلبات الجديدة من زوار الصفحة العامة — استلم متابعتها لخدمة العميل'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container-low cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {/* رسائل التنبيه والنجاح */}
      {message && (
        <div
          className={`text-xs font-bold rounded-xl px-4 py-3 flex items-center gap-2 border ${
            message.type === 'success'
              ? 'text-on-success-container bg-success-container border-success/30'
              : 'text-on-error-container bg-error-container border-error/30'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* التبويبات */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter('new')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            filter === 'new'
              ? 'bg-primary text-on-primary shadow-xs'
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
              ? 'bg-primary text-on-primary shadow-xs'
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
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline-variant">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-container-low flex items-center justify-center mb-3">
            <SearchX className="w-7 h-7 text-on-surface-variant" />
          </div>
          <p className="font-bold text-on-surface-variant text-sm">
            {filter === 'new' ? 'لا توجد طلبات حجز جديدة حالياً' : 'لا توجد طلبات تحت المتابعة'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:shadow-md transition-shadow"
            >
              {/* بيانات العميل الزائر */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-on-surface text-sm sm:text-base">
                    {r.customerName}
                  </span>
                  <a
                    href={`tel:${r.phone}`}
                    dir="ltr"
                    className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg hover:bg-primary/20 transition-colors font-mono"
                  >
                    {r.phone}
                  </a>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-bold">
                    {formatArabicFollowupDate(`${r.preferredDate}T12:00:00`).dayName} • {RESERVATION_PERIOD_LABELS[r.period]}
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant font-semibold flex items-center gap-1.5 pt-0.5">
                  <Building className="w-3.5 h-3.5 text-primary" />
                  <span>{r.unitLabel || 'وحدة عقارية'} {r.unitArea ? `• ${r.unitArea} م²` : ''}</span>
                </p>

                {r.note && (
                  <p className="text-xs text-on-surface-variant bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 mt-1.5 line-clamp-2">
                    <span className="font-bold text-on-surface">ملاحظة الزائر:</span> {r.note}
                  </p>
                )}
              </div>

              {/* أزرار الإجراءات */}
              <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-outline-variant/60">
                {r.status === 'new' ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* إذا كان مدير شركة: زر الإسناد لموظف وزر استلام شخصي وزر حذف */}
                    {canManage ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openAssignModal(r)}
                          className="btn-primary min-h-[40px] py-2 px-3 text-xs flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                          title="إسناد الحجز إلى موظف أو وسيط بالشركة"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>إسناد لموظف</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelfClaim(r.id)}
                          disabled={actionId === r.id}
                          className="btn-tonal min-h-[40px] py-2 px-3 text-xs flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                          title="استلام الحجز ومتابعته شخصياً"
                        >
                          {actionId === r.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <HandHeart className="w-4 h-4" />
                          )}
                          <span>استلام شخصي</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(r)}
                          className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-error hover:bg-error-container border border-transparent hover:border-error/20 transition cursor-pointer flex items-center justify-center"
                          title="حذف هذا الحجز"
                          aria-label="حذف الحجز"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      /* الوسيط العادي: مسموح له بالاستلام الشخصي السريع */
                      <button
                        type="button"
                        onClick={() => handleSelfClaim(r.id)}
                        disabled={actionId === r.id}
                        className="btn-primary min-h-[42px] py-2.5 px-4 text-xs font-black flex items-center justify-center gap-2 w-full"
                      >
                        {actionId === r.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <HandHeart className="w-4 h-4" />
                        )}
                        <span>متابعة العميل (استلام)</span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* في حالة الحجز المستلم (claimed) */
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="rounded-xl bg-surface-container-low border border-outline-variant px-3 py-2 flex-1 sm:flex-none">
                      <div className="flex items-center gap-2 text-[11px] font-bold">
                        <span className="flex items-center gap-1 text-on-surface">
                          <UserPlus className="w-3.5 h-3.5 text-success" />
                          <span>{r.claimedByName || 'موظف متابع'}</span>
                        </span>
                        {r.claimedCustomerStage && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${STAGE_CONFIG[r.claimedCustomerStage].bg} ${STAGE_CONFIG[r.claimedCustomerStage].color}`}
                          >
                            {STAGE_CONFIG[r.claimedCustomerStage].label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* مدير الشركة يمكنه إعادة الإسناد أو الحذف */}
                    {canManage && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openAssignModal(r)}
                          className="btn-tonal min-h-[38px] py-1.5 px-2.5 text-xs flex items-center gap-1"
                          title="إعادة إسناد الحجز لموظف آخر"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>إعادة إسناد</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(r)}
                          className="min-h-[38px] min-w-[38px] p-2 rounded-xl text-error hover:bg-error-container transition cursor-pointer flex items-center justify-center"
                          title="حذف هذا الحجز"
                          aria-label="حذف الحجز"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نافذة مودال إسناد الحجز لموظف (مدير الشركة فقط) */}
      {assignModalReservation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => !isAssigning && setAssignModalReservation(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card card-bordered shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4 bg-surface-container-lowest rounded-3xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm sm:text-base text-on-surface">
                  إسناد الحجز إلى موظف
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalReservation(null)}
                disabled={isAssigning}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* تفاصيل الحجز */}
            <div className="panel-section p-3 space-y-1 text-xs">
              <p className="font-bold text-on-surface">
                العميل: <span className="font-normal">{assignModalReservation.customerName}</span> ({assignModalReservation.phone})
              </p>
              <p className="font-bold text-on-surface">
                الوحدة: <span className="font-normal">{assignModalReservation.unitLabel || 'وحدة عقارية'}</span>
              </p>
            </div>

            {/* اختيار الموظف من قائمة موظفي الشركة */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface-variant">
                اختر الموظف / الوسيط المسؤول عن المتابعة:
              </label>
              <select
                value={selectedAssigneeId}
                onChange={(e) => setSelectedAssigneeId(e.target.value)}
                disabled={isAssigning}
                className="input-base w-full min-h-[44px] py-2.5 px-3 text-xs sm:text-sm font-semibold"
              >
                {companyUsers.map((u) => {
                  const roleLabel =
                    u.role === 'company_admin' || u.role === 'admin'
                      ? 'مدير شركة'
                      : u.role === 'super_admin'
                      ? 'مدير عام'
                      : 'وسيط عقاري';
                  return (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({roleLabel})
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-on-surface-variant">
                سيتم إنشاء العميل تلقائياً في محفظة CRM الخاصة بالموظف المختار وإسناد متابعة الموعد إليه.
              </p>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmAssign}
                disabled={isAssigning || !selectedAssigneeId}
                className="btn-primary flex-1 min-h-[44px] text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
              >
                {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                <span>تأكيد الإسناد</span>
              </button>
              <button
                type="button"
                onClick={() => setAssignModalReservation(null)}
                disabled={isAssigning}
                className="btn-tonal min-h-[44px] px-4 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة مودال تأكيد الحذف (مدير الشركة فقط) */}
      {deleteModalReservation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => !isDeleting && setDeleteModalReservation(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card card-bordered shadow-2xl w-full max-w-sm p-5 space-y-4 bg-surface-container-lowest rounded-3xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-error-container text-error flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-on-surface">
                حذف طلب الحجز العام
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                هل أنت متأكد من حذف طلب الحجز الخاص بالعميل <strong className="text-on-surface">{deleteModalReservation.customerName}</strong>؟
              </p>
              <span className="text-[11px] text-error font-semibold block pt-1">
                لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 min-h-[44px] rounded-xl bg-error hover:bg-error/90 text-on-error font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>نعم، حذف الحجز</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalReservation(null)}
                disabled={isDeleting}
                className="btn-tonal min-h-[44px] px-4 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
