'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Unit,
  UnitHistory,
  UNIT_KIND_LABELS,
  UNIT_STATUS_CONFIG,
} from '@/lib/types';
import { useApp } from '@/context/AppContext';
import {
  Building2,
  Calendar,
  CreditCard,
  Layers,
  MapPin,
  Share2,
  MessageCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit,
  Trash2,
  Copy,
  Check,
  Download,
  Loader2,
  Film,
  History,
  ShieldCheck,
  Info,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { downloadMediaFile } from '@/lib/cloudinary';
import { formatUnitFullDetails, createUnitWhatsAppUrl } from '@/lib/shareUtils';
import { zoneDisplayName } from '@/lib/zone-utils';
import { unitService } from '@/services/unitService';

export default function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const unitId = resolvedParams.id;

  const {
    units,
    currentUser,
    isCompanyAdmin,
    isSuperAdmin,
    updateUnitStatus,
    deleteUnit,
    buildings,
    zones,
  } = useApp();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [historyList, setHistoryList] = useState<UnitHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync unit from context or fetch via API if needed
  useEffect(() => {
    const found = units.find((u) => u.id === unitId);
    if (found) {
      setUnit(found);
      setLoading(false);
    } else {
      unitService.getUnitById(unitId).then((fetched) => {
        setUnit(fetched);
        setLoading(false);
      });
    }
  }, [units, unitId]);

  // Load history
  const loadHistory = async (id: string) => {
    setLoadingHistory(true);
    try {
      const data = await unitService.fetchUnitHistory(id);
      setHistoryList(data);
    } catch (e) {
      console.warn('Could not load unit history', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (unit?.id) {
      loadHistory(unit.id);
    }
  }, [unit?.id, unit?.status]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-error-container text-error flex items-center justify-center mx-auto">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">الوحدة غير موجودة</h2>
        <p className="text-sm text-on-surface-variant">قد تكون الوحدة قد حُذفت أو لا تملك صلاحية الوصول إليها.</p>
        <Link href="/units" className="btn-primary inline-flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة الوحدات
        </Link>
      </div>
    );
  }

  const canManage = isCompanyAdmin || isSuperAdmin;
  const statusInfo = UNIT_STATUS_CONFIG[unit.status];
  const mediaList = unit.media || [];
  const currentMedia = mediaList[activeMediaIndex];

  const building = buildings.find(
    (b) => b.id === unit.buildingId || (b.zoneId === unit.zoneId && b.plotNo === unit.plotNo)
  );

  const hasCustomFeatures = Boolean(unit.features && unit.features.length > 0);
  const displayFeatures = hasCustomFeatures
    ? unit.features!
    : (building?.features || []);
  const isInherited = !hasCustomFeatures && (building?.features || []).length > 0;

  const googleMapsUrl = unit.lat && unit.lng ? `https://www.google.com/maps?q=${unit.lat},${unit.lng}` : null;

  const handleDownloadCurrentMedia = async () => {
    if (!currentMedia) return;
    const url = currentMedia.externalUrl || currentMedia.storagePath;
    if (!url) return;

    setIsDownloading(true);
    setDownloadSuccess(false);

    const ext = currentMedia.kind === 'video' ? 'mp4' : 'jpg';
    const filename = `unit_${unit.zoneId}_${unit.plotNo}_media_${activeMediaIndex + 1}.${ext}`;
    const success = await downloadMediaFile(url, filename);

    setIsDownloading(false);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    }
  };

  const handleStatusChange = async (newStatus: typeof unit.status) => {
    if (newStatus === unit.status) return;
    await updateUnitStatus(unit.id, newStatus);
    setUnit((prev) => (prev ? { ...prev, status: newStatus } : null));
    loadHistory(unit.id);
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة نهائياً؟')) return;
    setIsDeleting(true);
    try {
      await deleteUnit(unit.id);
      router.push('/units');
    } catch {
      setIsDeleting(false);
    }
  };

  const plainShareContent = formatUnitFullDetails(unit, currentUser, zones);
  const waShareUrl = createUnitWhatsAppUrl(unit, currentUser, undefined, zones);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/units"
            className="p-2.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container text-on-surface-variant transition"
            title="العودة لقائمة الوحدات"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-black text-xl shadow-md">
            {unit.zoneId}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-on-surface">
                {zoneDisplayName(unit.zoneId, zones)} - قطعة {unit.plotNo}
              </h1>
              {unit.companyName && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-semibold border border-outline-variant">
                  {unit.companyName}
                </span>
              )}
            </div>
            <p className="text-sm text-on-surface-variant">
              {UNIT_KIND_LABELS[unit.unitKind]} • الدور {unit.floor === 0 ? 'الأرضي' : unit.floor || 'متكرر'} {unit.side ? `(${unit.side})` : ''}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border ${
              showHistory
                ? 'bg-primary text-on-primary border-primary'
                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل التعديلات</span>
          </button>

          {canManage && (
            <Link
              href={`/units/${unit.id}/edit`}
              className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs border border-outline-variant flex items-center gap-1.5 transition"
            >
              <Edit className="w-4 h-4 text-primary" />
              <span>تعديل الوحدة</span>
            </Link>
          )}

          {canManage && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3.5 py-2 rounded-xl bg-error-container hover:bg-error-container/80 text-error font-bold text-xs border border-error/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>حذف</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold text-on-surface-variant">حالة الوحدة الحالية:</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.badgeClass}`}>
            {statusInfo.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-outline-variant">
          <button
            type="button"
            onClick={() => handleStatusChange('available')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              unit.status === 'available'
                ? 'bg-success text-on-success shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            متاح للبيع
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange('reserved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              unit.status === 'reserved'
                ? 'bg-warning text-on-warning shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            حجز مؤقت
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange('sold')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              unit.status === 'sold'
                ? 'bg-error text-on-error shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            تم البيع
          </button>
        </div>
      </div>

      {/* History Slide-Down Panel */}
      {showHistory && (
        <div className="p-5 rounded-2xl bg-surface border border-outline-variant space-y-3">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            سجل حركة وتعديلات الوحدة
          </h3>
          {loadingHistory ? (
            <div className="py-6 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              جاري تحميل السجل...
            </div>
          ) : historyList.length === 0 ? (
            <p className="text-xs text-on-surface-variant py-2">لا يوجد سجل تعديلات سابق لهذه الوحدة حتى الآن.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {historyList.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-surface-container text-xs flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-on-surface">{item.details || item.changeType}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      بواسطة: {item.changedByName || 'مستخدم النظام'}
                    </p>
                  </div>
                  <span className="text-[11px] text-on-surface-variant shrink-0 font-mono">
                    {new Date(item.createdAt).toLocaleDateString('ar-EG', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Media & Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Media Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-2xl bg-surface-container overflow-hidden border border-outline-variant aspect-[4/3] flex items-center justify-center">
            {currentMedia ? (
              currentMedia.kind === 'video' ? (
                <video
                  src={currentMedia.externalUrl || currentMedia.storagePath}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={currentMedia.externalUrl || currentMedia.storagePath}
                  alt={currentMedia.caption || `وحدة قطعة ${unit.plotNo}`}
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="text-center p-6 space-y-2">
                <Building2 className="w-12 h-12 text-on-surface-variant/40 mx-auto" />
                <p className="text-xs text-on-surface-variant">لا توجد صور أو فيديوهات مرفوعة لهذه الوحدة</p>
              </div>
            )}

            {/* Media Navigation Controls */}
            {mediaList.length > 1 && (
              <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
                <button
                  type="button"
                  onClick={() => setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1))}
                  className="p-2 rounded-xl bg-black/60 text-white backdrop-blur-sm pointer-events-auto hover:bg-black/80 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0))}
                  className="p-2 rounded-xl bg-black/60 text-white backdrop-blur-sm pointer-events-auto hover:bg-black/80 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Download Button */}
            {currentMedia && (
              <button
                type="button"
                onClick={handleDownloadCurrentMedia}
                disabled={isDownloading}
                className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-sm flex items-center gap-1.5 transition"
              >
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : downloadSuccess ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{downloadSuccess ? 'تم التحميل' : 'تحميل'}</span>
              </button>
            )}
          </div>

          {/* Thumbnails */}
          {mediaList.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {mediaList.map((m, idx) => (
                <button
                  key={m.id || idx}
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                    activeMediaIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant opacity-70'
                  }`}
                >
                  {m.kind === 'video' ? (
                    <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                      <Film className="w-5 h-5" />
                    </div>
                  ) : (
                    <img
                      src={m.externalUrl || m.storagePath}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Quick Share Card */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-bold text-on-surface flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              مشاركة تفاصيل الوحدة
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={waShareUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary py-2 text-xs flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                واتساب
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(plainShareContent);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="btn-tonal py-2 text-xs flex items-center justify-center gap-1.5"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                {copied ? 'تم النسخ' : 'نسخ النص'}
              </button>
            </div>
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl border border-outline-variant hover:bg-surface-container text-xs font-bold text-on-surface flex items-center justify-center gap-1.5 transition"
              >
                <MapPin className="w-4 h-4 text-primary" />
                عرض الموقع على خرائط جوجل
              </a>
            )}
          </div>
        </div>

        {/* Right Column: Pricing & Specs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Price & Payment Banner */}
          <div className="card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-on-surface-variant font-medium">السعر الإجمالي المطلوب:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-primary font-mono">
                    {unit.price.toLocaleString('ar-EG')}
                  </span>
                  <span className="text-xs font-bold text-on-surface-variant">جنيه مصري</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unit.area > 0 && (
                  <div className="px-3 py-1.5 rounded-xl bg-surface-container text-xs font-bold text-on-surface border border-outline-variant">
                    سعر المتر: {Math.round(unit.price / unit.area).toLocaleString('ar-EG')} ج/م²
                  </div>
                )}
                {unit.negotiable && (
                  <span className="px-2.5 py-1 rounded-xl bg-success-container text-success text-xs font-bold border border-success/20">
                    قابل للتفاوض
                  </span>
                )}
              </div>
            </div>

            {/* Payment & Delivery Terms */}
            {(unit.paymentTerms || unit.deliveryNote) && (
              <div className="pt-3 border-t border-outline-variant grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {unit.paymentTerms && (
                  <div className="p-3 rounded-xl bg-surface-container">
                    <span className="font-bold text-on-surface flex items-center gap-1.5 mb-1">
                      <CreditCard className="w-3.5 h-3.5 text-primary" />
                      شروط وأنظمة السداد
                    </span>
                    <p className="text-on-surface-variant leading-relaxed">{unit.paymentTerms}</p>
                  </div>
                )}
                {unit.deliveryNote && (
                  <div className="p-3 rounded-xl bg-surface-container">
                    <span className="font-bold text-on-surface flex items-center gap-1.5 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      موعد وحالة الاستلام
                    </span>
                    <p className="text-on-surface-variant leading-relaxed">{unit.deliveryNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detailed Specifications Grid */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              المواصفات الفنية للوحدة
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-surface-container">
                <span className="text-[11px] text-on-surface-variant">المساحة الإجمالية</span>
                <p className="text-base font-black text-on-surface font-mono mt-0.5">{unit.area} م²</p>
              </div>

              {unit.gardenArea ? (
                <div className="p-3 rounded-xl bg-surface-container">
                  <span className="text-[11px] text-on-surface-variant">مساحة الحديقة</span>
                  <p className="text-base font-black text-on-surface font-mono mt-0.5">{unit.gardenArea} م²</p>
                </div>
              ) : null}

              <div className="p-3 rounded-xl bg-surface-container">
                <span className="text-[11px] text-on-surface-variant">الدور</span>
                <p className="text-base font-black text-on-surface mt-0.5">
                  {unit.floor === 0 ? 'الأرضي' : unit.floor ? `الدور ${unit.floor}` : 'متكرر'}
                </p>
              </div>

              {unit.side && (
                <div className="p-3 rounded-xl bg-surface-container">
                  <span className="text-[11px] text-on-surface-variant">الواجهة / الاتجاه</span>
                  <p className="text-base font-black text-on-surface mt-0.5">{unit.side}</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-surface-container">
                <span className="text-[11px] text-on-surface-variant">المنطقة والحي</span>
                <p className="text-base font-black text-on-surface mt-0.5">{zoneDisplayName(unit.zoneId, zones)}</p>
              </div>

              <div className="p-3 rounded-xl bg-surface-container">
                <span className="text-[11px] text-on-surface-variant">رقم القطعة</span>
                <p className="text-base font-black text-on-surface font-mono mt-0.5">{unit.plotNo}</p>
              </div>
            </div>
          </div>

          {/* Building Details & Edit for Company Admins */}
          <div className="card p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-black text-sm shadow-xs">
                  {unit.plotNo}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    بيانات العمارة قطعة {unit.plotNo} ({zoneDisplayName(unit.zoneId, zones)})
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {building?.landArea ? `مساحة الأرض: ${building.landArea} م² • ` : ''}
                    {building?.features && building.features.length > 0
                      ? `${building.features.length} مميزة مسجلة للعمارة`
                      : 'المواصفات العامة للمبنى'}
                  </p>
                </div>
              </div>

              {building && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/admin/buildings/${building.id}`}
                    className="btn-tonal px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span>عرض العمارة ({units.filter((u) => u.buildingId === building.id).length} وحدة)</span>
                  </Link>
                  {canManage && (
                    <Link
                      href={`/admin/buildings/${building.id}/edit`}
                      className="btn-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>تعديل بيانات المبنى</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {building?.notes && (
              <p className="text-xs text-on-surface-variant bg-surface-container p-3 rounded-xl">
                <span className="font-bold text-on-surface block mb-0.5">ملاحظات المبنى العامة:</span>
                {building.notes}
              </p>
            )}
          </div>

          {/* Features List */}
          {displayFeatures.length > 0 && (
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  المميزات والمرافق
                </h2>
                {isInherited && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium border border-outline-variant">
                    مورثة تلقائياً من مواصفات المبنى
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {displayFeatures.map((feat, idx) => (
                  <span
                    key={idx}
                    className="chip px-3 py-1.5 text-xs font-semibold bg-surface-container text-on-surface border border-outline-variant"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description / Additional Notes */}
          {unit.description && (
            <div className="card p-5 space-y-2">
              <h2 className="text-sm font-bold text-on-surface">وصف وملاحظات إضافية</h2>
              <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">{unit.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
