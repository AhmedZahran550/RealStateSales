'use client';

import React, { useState, useEffect } from 'react';
import { Unit, UnitHistory, UNIT_KIND_LABELS, UNIT_STATUS_CONFIG } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import {
  X,
  Building2,
  Calendar,
  CreditCard,
  Layers,
  MapPin,
  Share2,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit,
  Trash2,
  Navigation,
  Copy,
  Check,
  Download,
  Loader2,
  Film,
  History,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { downloadMediaFile } from '@/lib/cloudinary';
import { formatUnitFullDetails, createUnitWhatsAppUrl } from '@/lib/shareUtils';
import { zoneDisplayName } from '@/lib/zone-utils';
import { unitService } from '@/services/unitService';

export interface UnitDetailModalProps {
  unit: Unit | null;
  onClose: () => void;
  onEdit?: (unit: Unit) => void;
  onDelete?: (unitId: string) => void;
  isOwner?: boolean;
}

export default function UnitDetailModal({
  unit,
  onClose,
  onEdit,
  onDelete,
}: UnitDetailModalProps) {
  const { currentUser, isCompanyAdmin, isSuperAdmin, updateUnitStatus, buildings, zones } = useApp();
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Unit History state
  const [historyList, setHistoryList] = useState<UnitHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch unit history
  const loadHistory = async (unitId: string) => {
    setLoadingHistory(true);
    try {
      const data = await unitService.fetchUnitHistory(unitId);
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

  if (!unit) return null;

  const canManage = isCompanyAdmin || isSuperAdmin;
  const statusInfo = UNIT_STATUS_CONFIG[unit.status];
  const mediaList = unit.media || [];
  const currentMedia = mediaList[activeMediaIndex];

  // البحث عن المبنى المرتبط لحساب التوريث الذكي للمميزات
  const building = buildings.find(
    (b) => b.id === unit.buildingId || (b.zoneId === unit.zoneId && b.plotNo === unit.plotNo)
  );

  // منطق التوريث: إذا لم تحتوِ الوحدة على مميزات خاصة، ترث تلقائياً من المبنى
  const hasCustomFeatures = Boolean(unit.features && unit.features.length > 0);
  const displayFeatures = hasCustomFeatures
    ? unit.features!
    : (building?.features || []);
  const isInherited = !hasCustomFeatures && (building?.features || []).length > 0;

  // رابط وموقع خرائط جوجل
  const googleMapsUrl = unit.lat && unit.lng ? `https://www.google.com/maps?q=${unit.lat},${unit.lng}` : null;

  // تنزيل وحفظ الصورة أو الفيديو الحالي
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
    loadHistory(unit.id);
  };

  // توليد نص التفاصيل الشامل متضمناً روابط الصور والفيديوهات (باسم المنطقة بدل رقمها)
  const plainShareContent = formatUnitFullDetails(unit, currentUser, zones);

  // رابط مشاركة الواتساب المتضمن لكافة الروابط
  const waShareUrl = createUnitWhatsAppUrl(unit, currentUser, undefined, zones);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-warning/80 overflow-hidden my-auto sm:my-8 max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-warning/25 bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-strong via-primary to-primary text-white flex items-center justify-center font-black shadow-md shadow-warning/30 shrink-0">
              {unit.zoneId}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-on-surface ">
                  {zoneDisplayName(unit.zoneId, zones)} - قطعة {unit.plotNo}
                </h3>
                {unit.companyName && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-semibold border border-outline-variant ">
                    {unit.companyName}
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant ">
                {UNIT_KIND_LABELS[unit.unitKind]} • الدور {unit.floor === 0 ? 'الأرضي' : unit.floor || 'متكرر'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory((prev) => !prev)}
              className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                showHistory
                  ? 'bg-warning text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-warning hover:bg-surface-container '
              }`}
              title="سجل تعديلات وحالات الوحدة"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">سجل التعديلات</span>
            </button>
            {canManage && onEdit && (
              <button
                onClick={() => onEdit(unit)}
                className="p-2 rounded-xl text-on-surface-variant hover:text-warning hover:bg-surface-container transition cursor-pointer"
                title="تعديل بيانات ومواصفات الوحدة"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canManage && onDelete && (
              <button
                onClick={() => {
                  if (confirm('هل أنت متأكد من حذف هذه الوحدة؟')) {
                    onDelete(unit.id);
                    onClose();
                  }
                }}
                className="p-2 rounded-xl text-error hover:bg-error-container transition cursor-pointer"
                title="حذف الوحدة من مخزون الشركة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface-variant hover:bg-surface-container transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-h-[78vh] overflow-y-auto flex-1">
          {/* Quick Status Bar for Brokers and Admins */}
          <div className="p-3 rounded-2xl bg-warning-container/70 border border-warning flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse" />
              <span className="text-xs font-bold text-on-surface-variant ">
                تحديث حالة الوحدة:
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-surface-container-high/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleStatusChange('available')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  unit.status === 'available'
                    ? 'bg-success text-white shadow-sm'
                    : 'text-on-surface-variant  hover:text-on-surface '
                }`}
              >
                متاح للبيع
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('reserved')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  unit.status === 'reserved'
                    ? 'bg-warning text-white shadow-sm'
                    : 'text-on-surface-variant  hover:text-on-surface '
                }`}
              >
                حجز مؤقت
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('sold')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  unit.status === 'sold'
                    ? 'bg-error text-white shadow-sm'
                    : 'text-on-surface-variant  hover:text-on-surface '
                }`}
              >
                تم البيع
              </button>
            </div>
          </div>

          {/* Unit History Panel (Toggleable) */}
          {showHistory && (
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-warning" />
                  <h4 className="text-xs font-bold text-on-surface ">
                    سجل التغييرات والحالات (Audit History)
                  </h4>
                </div>
                <span className="text-[11px] text-on-surface-variant font-semibold">
                  {historyList.length} حركة مسجلة
                </span>
              </div>

              {loadingHistory ? (
                <div className="py-4 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-warning" />
                  <span>جاري تحميل سجل الحركات...</span>
                </div>
              ) : historyList.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-3 text-center">
                  لا توجد حركات مسجلة لهذه الوحدة حتى الآن.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {historyList.map((h) => (
                    <div
                      key={h.id}
                      className="p-2.5 rounded-xl bg-white border border-outline-variant/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface ">
                            {h.changedByName || 'مستخدم'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning-container text-warning font-semibold">
                            {h.changeType === 'status_change'
                              ? 'تغيير حالة'
                              : h.changeType === 'created'
                              ? 'إضافة وحدة'
                              : 'تحديث بيانات'}
                          </span>
                        </div>
                        <p className="text-on-surface-variant text-[11px]">
                          {h.details || 'تم إجراء تعديل على الوحدة'}
                        </p>
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-mono shrink-0">
                        {new Date(h.createdAt).toLocaleDateString('ar-EG', {
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

          {/* Media Gallery / Lightbox */}
          {mediaList.length > 0 ? (
            <div className="space-y-3">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-outline-variant group flex items-center justify-center">
                {currentMedia?.kind === 'video' ? (
                  <video
                    key={currentMedia.externalUrl || currentMedia.storagePath}
                    src={currentMedia.externalUrl || currentMedia.storagePath}
                    controls
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <img
                    key={currentMedia?.id || activeMediaIndex}
                    src={currentMedia?.externalUrl || currentMedia?.storagePath}
                    alt={currentMedia?.caption || `صورة وحدة ${unit.plotNo}`}
                    className="w-full h-full object-contain"
                  />
                )}

                {/* Download Button on Preview */}
                <div className="absolute top-3 left-3 z-20">
                  <button
                    onClick={handleDownloadCurrentMedia}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-bold backdrop-blur-md shadow-md transition disabled:opacity-50 cursor-pointer"
                    title="تحميل الملف الحالي بجودته الكاملة"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-warning" />
                        <span>جاري التحميل...</span>
                      </>
                    ) : downloadSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-success" />
                        <span className="text-success">تم الحفظ!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-warning" />
                        <span>{currentMedia?.kind === 'video' ? 'تحميل الفيديو' : 'حفظ الصورة'}</span>
                      </>
                    )}
                  </button>
                </div>

                {currentMedia?.caption && (
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white text-xs font-semibold pointer-events-none">
                    {currentMedia.caption}
                  </div>
                )}
                {mediaList.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 text-white hover:bg-warning transition z-10 cursor-pointer"
                      title="السابق"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveMediaIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0))
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 text-white hover:bg-warning transition z-10 cursor-pointer"
                      title="التالي"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {mediaList.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {mediaList.map((m, idx) => (
                    <button
                      key={m.id || idx}
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition bg-black cursor-pointer ${
                        idx === activeMediaIndex ? 'border-warning scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-90'
                      }`}
                    >
                      {m.kind === 'video' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-warning-container bg-inverse-surface">
                          <Film className="w-4 h-4" />
                          <span className="text-[9px] font-bold">فيديو</span>
                        </div>
                      ) : (
                        <img
                          src={m.externalUrl || m.storagePath}
                          alt="thumb"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant ">
              <Building2 className="w-12 h-12 text-on-surface-variant mx-auto mb-2" />
              <p className="text-xs text-on-surface-variant">لا توجد صور مرفقة لهذه الوحدة بعد</p>
            </div>
          )}

          {/* Pricing Highlight Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-warning/10 via-primary/10 to-primary/10 border border-warning/40 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-on-surface-variant font-semibold">
                السعر الإجمالي المطلوب:
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-warning ">
                  {unit.price.toLocaleString('ar-EG')}
                </span>
                <span className="text-sm font-bold text-warning ">جنيه مصري</span>
                {unit.negotiable && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-warning-container text-warning font-bold border border-warning ">
                    قابل للتفاوض
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                سعر المتر التقريبي: {Math.round(unit.price / (unit.area || 1)).toLocaleString('ar-EG')} ج.م / م²
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(plainShareContent);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs transition cursor-pointer"
                type="button"
                title="نسخ تفاصيل الوحدة"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ التفاصيل'}</span>
              </button>

              <a
                href={waShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success hover:bg-success text-white font-bold text-xs shadow-md shadow-success/30 transition"
              >
                <MessageCircle className="w-4 h-4" />
                مشاركة عبر واتساب
              </a>
            </div>
          </div>

          {/* Real GPS Location Card */}
          {googleMapsUrl && (
            <div className="p-4 rounded-2xl bg-surface border border-warning flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning text-white flex items-center justify-center shadow-sm">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#1c1917] flex items-center gap-1.5">
                    <span>الموقع الجغرافي الحقيقي (GPS)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning-container text-warning font-bold">
                      OpenStreetMap
                    </span>
                  </h4>
                  <p className="text-[11px] font-mono text-warning font-bold mt-0.5">
                    {unit.lat?.toFixed(5)}, {unit.lng?.toFixed(5)}
                  </p>
                </div>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-warning hover:bg-warning text-white font-bold text-xs shadow-sm transition"
              >
                <span>فتح في خرائط جوجل</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant ">
              <span className="text-[11px] text-on-surface-variant font-semibold">المساحة المبنية</span>
              <p className="text-sm font-bold text-on-surface mt-0.5">
                {unit.area} م²
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant ">
              <span className="text-[11px] text-on-surface-variant font-semibold">مساحة الحديقة / التراس</span>
              <p className="text-sm font-bold text-on-surface mt-0.5">
                {unit.gardenArea ? `${unit.gardenArea} م²` : 'بدون حديقة'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant ">
              <span className="text-[11px] text-on-surface-variant font-semibold">الواجهة والاتجاه</span>
              <p className="text-sm font-bold text-on-surface mt-0.5">
                {unit.side || 'واجهة بحري'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant ">
              <span className="text-[11px] text-on-surface-variant font-semibold">ميعاد التسليم</span>
              <p className="text-sm font-bold text-on-surface mt-0.5">
                {unit.deliveryNote}
              </p>
            </div>
          </div>

          {/* Payment Terms & Description */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant ">
              <h4 className="text-xs font-bold uppercase text-on-surface-variant mb-1 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-warning" />
                شروط ونظام السداد
              </h4>
              <p className="text-sm font-medium text-on-surface ">
                {unit.paymentTerms}
              </p>
            </div>

            {unit.description && (
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant ">
                <h4 className="text-xs font-bold uppercase text-on-surface-variant mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-warning" />
                  وصف وتفاصيل العقار
                </h4>
                <p className="text-sm leading-relaxed text-on-surface-variant whitespace-pre-line">
                  {unit.description}
                </p>
              </div>
            )}
          </div>

          {/* المميزات والمواصفات (مع التوريث الذكي من المبنى) */}
          {displayFeatures.length > 0 && (
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-on-surface-variant flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-warning" />
                  مميزات ومواصفات العقار
                </h4>

                {isInherited ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-info-container text-info border border-info font-bold flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    موروثة تلقائياً من مواصفات المبنى (قطعة #{unit.plotNo})
                  </span>
                ) : (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-success-container text-success border border-success font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    مميزات خاصة بالوحدة
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {displayFeatures.map((f, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-warning-container text-warning border border-warning flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
