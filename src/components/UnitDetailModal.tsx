'use client';

import React, { useState } from 'react';
import { Unit, UNIT_KIND_LABELS, UNIT_STATUS_CONFIG } from '@/lib/types';
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
} from 'lucide-react';
import { downloadMediaFile } from '@/lib/cloudinary';
import { formatUnitFullDetails, createUnitWhatsAppUrl } from '@/lib/shareUtils';

interface UnitDetailModalProps {
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
  isOwner = true,
}: UnitDetailModalProps) {
  const { currentUser } = useApp();
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!unit) return null;

  const statusInfo = UNIT_STATUS_CONFIG[unit.status];
  const mediaList = unit.media || [];
  const currentMedia = mediaList[activeMediaIndex];

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

  // توليد نص التفاصيل الشامل متضمناً روابط الصور والفيديوهات
  const plainShareContent = formatUnitFullDetails(unit, currentUser);

  // رابط مشاركة الواتساب المتضمن لكافة الروابط
  const waShareUrl = createUnitWhatsAppUrl(unit, currentUser);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#131a26] rounded-3xl shadow-2xl border border-amber-200/80 dark:border-amber-900/50 overflow-hidden my-auto sm:my-8 max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-amber-100 dark:border-stone-800 bg-[#fbf9f6] dark:bg-[#18202e] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-amber-600/30 shrink-0">
              {unit.zoneId}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-[#1c1917] dark:text-[#f5f5f4]">
                  المنطقة {unit.zoneId} – قطعة {unit.plotNo}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {UNIT_KIND_LABELS[unit.unitKind]} • الدور {unit.floor === 0 ? 'الأرضي' : unit.floor || 'متكرر'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && onEdit && (
              <button
                onClick={() => onEdit(unit)}
                className="p-2 rounded-xl text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                title="تعديل بيانات الوحدة"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {isOwner && onDelete && (
              <button
                onClick={() => {
                  if (confirm('هل أنت متأكد من حذف هذه الوحدة؟')) {
                    onDelete(unit.id);
                    onClose();
                  }
                }}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                title="حذف الوحدة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-h-[78vh] overflow-y-auto flex-1">
          {/* Media Gallery / Lightbox */}
          {mediaList.length > 0 ? (
            <div className="space-y-3">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-stone-200 dark:border-stone-800 group flex items-center justify-center">
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
                    src={currentMedia?.externalUrl || currentMedia?.storagePath || '/placeholder.jpg'}
                    alt={currentMedia?.caption || 'صورة الوحدة'}
                    className="w-full h-full object-contain bg-black"
                  />
                )}

                {/* Save / Download Media Button */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadCurrentMedia}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/90 text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-lg transition cursor-pointer"
                    title={currentMedia?.kind === 'video' ? 'تحميل الفيديو' : 'حفظ الصورة'}
                  >
                    {downloadSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>تم الحفظ!</span>
                      </>
                    ) : isDownloading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>جاري التحميل...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-amber-400" />
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 text-white hover:bg-amber-600 transition z-10 cursor-pointer"
                      title="السابق"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveMediaIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0))
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 text-white hover:bg-amber-600 transition z-10 cursor-pointer"
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
                        idx === activeMediaIndex ? 'border-amber-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-90'
                      }`}
                    >
                      {m.kind === 'video' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-amber-400 bg-stone-900">
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
            <div className="p-8 text-center bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
              <Building2 className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
              <p className="text-xs text-stone-500">لا توجد صور مرفقة لهذه الوحدة بعد</p>
            </div>
          )}

          {/* Pricing Highlight Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/10 border border-amber-300/40 dark:border-amber-800/40 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">
                السعر الإجمالي المطلوب:
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-900 dark:text-amber-300">
                  {unit.price.toLocaleString('ar-EG')}
                </span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">جنيه مصري</span>
                {unit.negotiable && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                    قابل للتفاوض
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-1">
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
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition cursor-pointer"
                type="button"
                title="نسخ تفاصيل الوحدة"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ التفاصيل'}</span>
              </button>

              <a
                href={waShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition"
              >
                <MessageCircle className="w-4 h-4" />
                مشاركة عبر واتساب
              </a>
            </div>
          </div>

          {/* Real GPS Location Card */}
          {googleMapsUrl && (
            <div className="p-4 rounded-2xl bg-[#fdfbf7] dark:bg-[#18202e] border border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#1c1917] dark:text-[#f5f5f4] flex items-center gap-1.5">
                    <span>الموقع الجغرافي الحقيقي (GPS)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                      OpenStreetMap
                    </span>
                  </h4>
                  <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold mt-0.5">
                    {unit.lat?.toFixed(5)}, {unit.lng?.toFixed(5)}
                  </p>
                </div>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition"
              >
                <span>فتح في خرائط جوجل</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] text-stone-400 font-semibold">المساحة المبنية</span>
              <p className="text-sm font-bold text-stone-900 dark:text-white mt-0.5">
                {unit.area} م²
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] text-stone-400 font-semibold">مساحة الحديقة / التراس</span>
              <p className="text-sm font-bold text-stone-900 dark:text-white mt-0.5">
                {unit.gardenArea ? `${unit.gardenArea} م²` : 'بدون حديقة'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] text-stone-400 font-semibold">الواجهة والاتجاه</span>
              <p className="text-sm font-bold text-stone-900 dark:text-white mt-0.5">
                {unit.side || 'واجهة بحري'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] text-stone-400 font-semibold">ميعاد التسليم</span>
              <p className="text-sm font-bold text-stone-900 dark:text-white mt-0.5">
                {unit.deliveryNote}
              </p>
            </div>
          </div>

          {/* Payment Terms & Description */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
              <h4 className="text-xs font-bold uppercase text-stone-500 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-600" />
                شروط ونظام السداد
              </h4>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                {unit.paymentTerms}
              </p>
            </div>

            {unit.description && (
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                <h4 className="text-xs font-bold uppercase text-stone-500 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  وصف وتفاصيل العقار
                </h4>
                <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300 whitespace-pre-line">
                  {unit.description}
                </p>
              </div>
            )}
          </div>

          {/* Surrounding Services */}
          {unit.services && unit.services.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase text-stone-500 mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-600" />
                الخدمات والمرافق المرتبطة بالقطعة والمنطقة
              </h4>
              <div className="flex flex-wrap gap-2">
                {unit.services.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  >
                    {s}
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
