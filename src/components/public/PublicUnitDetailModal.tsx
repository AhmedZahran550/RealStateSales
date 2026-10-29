'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PublicUnit,
  UNIT_KIND_LABELS,
  CompanyPublicSettings,
} from '@/lib/types';
import { allImageUrls } from '@/lib/public-utils';
import {
  X,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Maximize2,
  Trees,
  Layers,
  Compass,
  CheckCircle2,
  CalendarDays,
  CreditCard,
  FileText,
  Tag,
  MessageCircle,
  Phone,
  Video,
  Camera,
  Share2,
  Check,
} from 'lucide-react';

export interface PublicUnitDetailModalProps {
  unit?: PublicUnit | null;
  settings: CompanyPublicSettings;
  isOpen: boolean;
  onClose: () => void;
  onReserve: (unit: PublicUnit) => void;
  companyPhone?: string;
  companyName?: string;
}

export default function PublicUnitDetailModal({
  unit,
  settings,
  isOpen,
  onClose,
  onReserve,
  companyPhone,
  companyName,
}: PublicUnitDetailModalProps) {
  const images = useMemo(() => (unit ? allImageUrls(unit.media) : []), [unit]);
  const videos = useMemo(
    () =>
      unit
        ? unit.media
            .filter((m) => m.kind === 'video')
            .map((m) => m.externalUrl || m.storagePath)
            .filter((u): u is string => Boolean(u))
        : [],
    [unit]
  );

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'images' | 'video'>('images');
  const [copiedLink, setCopiedLink] = useState(false);

  // إغلاق المودال بمفتاح Escape والتنقل بالأسهم
  const nextMedia = useCallback(() => {
    if (images.length === 0) return;
    setActiveMediaIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const prevMedia = useCallback(() => {
    if (images.length === 0) return;
    setActiveMediaIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') nextMedia();
      if (e.key === 'ArrowRight') prevMedia();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, nextMedia, prevMedia]);

  // إعادة ضبط المؤشر عند فتح وحدة جديدة
  useEffect(() => {
    if (isOpen) {
      setActiveMediaIndex(0);
      setActiveTab('images');
      setCopiedLink(false);
    }
  }, [isOpen, unit?.id]);

  // تجهيز رابط واتساب المباشر للوحدة
  const waUrl = useMemo(() => {
    if (!companyPhone || !unit) return '';
    let clean = companyPhone.replace(/[^0-9]/g, '');
    if (clean.startsWith('01')) {
      clean = '2' + clean;
    }
    const unitTitle = UNIT_KIND_LABELS[unit.unitKind] || 'وحدة عقارية';
    const zoneStr = unit.zoneName ? ` في ${unit.zoneName}` : '';
    const plotStr = unit.plotNo ? ` قطعة ${unit.plotNo}` : '';
    const priceStr = settings.showPrice ? ` بسعر ${unit.price.toLocaleString('ar-EG')} ج.م` : '';
    const message = `مرحباً${companyName ? ` ${companyName}` : ''}، أود الاستفسار وحجز موعد معاينة لـ ${unitTitle}${zoneStr}${plotStr}${priceStr}.`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  }, [companyPhone, companyName, unit, settings.showPrice]);

  const handleCopyShare = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!isOpen || !unit) return null;

  const specs = [
    settings.showArea && {
      icon: Maximize2,
      label: 'المساحة الإجمالية',
      value: `${unit.area} م²`,
    },
    settings.showGarden &&
      unit.gardenArea && {
        icon: Trees,
        label: 'مساحة الحديقة الخاصة',
        value: `${unit.gardenArea} م²`,
      },
    settings.showFloor && {
      icon: Layers,
      label: 'الدور',
      value: unit.floor === 0 || unit.floor === undefined ? 'طابق أرضي' : `الدور ${unit.floor}`,
    },
    unit.side && {
      icon: Compass,
      label: 'الواجهة والاتجاه',
      value: unit.side,
    },
  ].filter(Boolean) as Array<{ icon: any; label: string; value: string }>;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card card-bordered shadow-2xl w-full max-w-4xl max-h-[94vh] overflow-y-auto bg-surface-container-lowest"
      >
        {/* شريط العنوان التفاعلي */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-5 py-4 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary-container text-on-primary-container">
                متاح للتعاقد
              </span>
              <h3 className="font-black text-lg text-on-surface truncate">
                {UNIT_KIND_LABELS[unit.unitKind]}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-on-surface-variant font-semibold mt-1">
              {unit.zoneName && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {unit.zoneName}
                </span>
              )}
              {unit.plotNo && <span>قطعة {unit.plotNo}</span>}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyShare}
              className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
              title="مشاركة رابط الصفحة"
              aria-label="مشاركة رابط الصفحة"
            >
              {copiedLink ? <Check className="w-5 h-5 text-success" /> : <Share2 className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* أزرار التبديل بين الصور والفيديو إن وجد */}
        {videos.length > 0 && images.length > 0 && (
          <div className="px-5 pt-3 flex gap-2 border-b border-outline-variant/40 bg-surface-container-low">
            <button
              type="button"
              onClick={() => setActiveTab('images')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'images'
                  ? 'bg-surface text-primary border-t-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>معرض الصور ({images.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'video'
                  ? 'bg-surface text-primary border-t-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>فيديو المعاينة ({videos.length})</span>
            </button>
          </div>
        )}

        {/* عرض الفيديو المباشر إن كان التبويب نشطاً */}
        {activeTab === 'video' && videos.length > 0 ? (
          <div className="relative bg-black aspect-[16/9] w-full overflow-hidden flex items-center justify-center">
            <video
              src={videos[0]}
              controls
              className="w-full h-full max-h-[500px]"
              autoPlay
              playsInline
            />
          </div>
        ) : (
          /* معرض الصور الكامل */
          images.length > 0 && (
            <div className="relative bg-black group select-none">
              <div className="aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden flex items-center justify-center">
                <img
                  src={images[activeMediaIndex]}
                  alt={`صورة ${activeMediaIndex + 1} من ${images.length}`}
                  className="w-full h-full object-contain"
                />
              </div>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevMedia}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer backdrop-blur-md transition-all shadow-lg"
                    aria-label="الصورة السابقة"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMedia}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer backdrop-blur-md transition-all shadow-lg"
                    aria-label="الصورة التالية"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-md">
                    {activeMediaIndex + 1} من {images.length}
                  </span>

                  {/* شريط الصور المصغرة القابل للتمرير */}
                  <div className="p-3 bg-black/40 backdrop-blur-xs flex gap-2 overflow-x-auto justify-center">
                    {images.map((img, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setActiveMediaIndex(i)}
                        className={`relative w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                          i === activeMediaIndex
                            ? 'border-primary ring-2 ring-primary/40 scale-105'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`مصغرة ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        )}

        {/* المحتوى والمواصفات */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* قسم السعر وحالة التفاوض */}
          {settings.showPrice && (
            <div className="flex items-center justify-between flex-wrap gap-3 bg-success-container rounded-2xl px-5 py-4 border border-success/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-success text-on-success flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-on-success-container block">
                    السعر المطلوب
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-on-success-container">
                      {unit.price.toLocaleString('ar-EG')}
                    </span>
                    <span className="text-xs font-bold text-on-success-container">جنيه مصري</span>
                  </div>
                </div>
              </div>

              {unit.negotiable && (
                <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-success text-on-success shadow-xs">
                  قابل للتفاوض للجادين
                </span>
              )}
            </div>
          )}

          {/* شبكة المواصفات المعمارية */}
          {specs.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">
                المواصفات والبيانات الفنية
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {specs.map((s, i) => (
                  <div
                    key={i}
                    className="panel-section p-3.5 text-center flex flex-col items-center justify-center hover:border-primary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center mb-1.5">
                      <s.icon className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] text-on-surface-variant font-bold">
                      {s.label}
                    </p>
                    <p className="text-sm font-black text-on-surface mt-1">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* المميزات والخدمات */}
          {settings.showFeatures && unit.features && unit.features.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-on-surface">مميزات الوحدة والموقع</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {unit.features.map((f, i) => (
                  <span key={i} className="chip py-1 px-3 text-xs font-semibold">
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* الوصف التفصيلي */}
          {settings.showDescription && unit.description && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-on-surface">الوصف المعماري للوحدة</h4>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line bg-surface-container-low p-4 rounded-2xl border border-outline-variant/50">
                {unit.description}
              </p>
            </div>
          )}

          {/* التسليم وأنظمة السداد */}
          {(settings.showDelivery || settings.showPayment) && (
            <div className="grid sm:grid-cols-2 gap-3">
              {settings.showDelivery && unit.deliveryNote && (
                <div className="panel-section p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-on-surface-variant">
                      موعد التسليم وحالة التشطيب
                    </span>
                  </div>
                  <p className="text-sm font-bold text-on-surface">
                    {unit.deliveryNote}
                  </p>
                </div>
              )}
              {settings.showPayment && unit.paymentTerms && (
                <div className="panel-section p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-on-surface-variant">
                      نظام السداد والتقسيط
                    </span>
                  </div>
                  <p className="text-sm font-bold text-on-surface">
                    {unit.paymentTerms}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* أزرار الإجراءات وحجز الموعد */}
          <div className="pt-2 border-t border-outline-variant space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={() => onReserve(unit)}
                className="btn-primary w-full py-3.5 text-sm sm:text-base font-black shadow-md hover:shadow-xl transition-all"
              >
                <span>احجز موعداً للمعاينة الآن</span>
              </button>

              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-success-container hover:bg-success text-on-success-container hover:text-on-success border border-success/40 font-black text-sm flex items-center justify-center gap-2 shrink-0 transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>محادثة واتساب سريعة</span>
                </a>
              )}

              {companyPhone && (
                <a
                  href={`tel:${companyPhone}`}
                  className="w-full sm:w-auto px-4 py-3.5 rounded-2xl btn-tonal font-black text-sm flex items-center justify-center gap-2 shrink-0"
                >
                  <Phone className="w-4 h-4" />
                  <span>اتصال</span>
                </a>
              )}
            </div>
            <p className="text-[11px] text-center text-on-surface-variant font-medium">
              سيتم إرسال بيانات رغبتك في المعاينة مباشرة لإدارة المبيعات وسيتم التواصل معك لتأكيد الموعد.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
