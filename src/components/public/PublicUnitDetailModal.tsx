'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Ruler,
  Trees,
  Building,
  Compass,
  CheckCircle2,
  CalendarDays,
  CreditCard,
  FileText,
  Tag,
} from 'lucide-react';

export interface PublicUnitDetailModalProps {
  unit?: PublicUnit | null;
  settings: CompanyPublicSettings;
  isOpen: boolean;
  onClose: () => void;
  onReserve: (unit: PublicUnit) => void;
}

export default function PublicUnitDetailModal({
  unit,
  settings,
  isOpen,
  onClose,
  onReserve,
}: PublicUnitDetailModalProps) {
  const images = unit ? allImageUrls(unit.media) : [];
  const [currentImage, setCurrentImage] = useState(0);

  // إغلاق المودال بمفتاح Escape والتنقل بين الصور بالأسهم
  const nextImage = useCallback(
    () => setCurrentImage((i) => (images.length ? (i + 1) % images.length : 0)),
    [images.length]
  );
  const prevImage = useCallback(
    () =>
      setCurrentImage((i) => (images.length ? (i - 1 + images.length) % images.length : 0)),
    [images.length]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') nextImage();
      if (e.key === 'ArrowRight') prevImage();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, nextImage, prevImage]);

  if (!isOpen || !unit) return null;

  const specs = [
    settings.showArea && {
      icon: Ruler,
      label: 'المساحة',
      value: `${unit.area} م²`,
    },
    settings.showGarden &&
      unit.gardenArea && {
        icon: Trees,
        label: 'مساحة الحديقة',
        value: `${unit.gardenArea} م²`,
      },
    settings.showFloor && {
      icon: Building,
      label: 'الدور',
      value: unit.floor === 0 || unit.floor === undefined ? 'أرضي' : `دور ${unit.floor}`,
    },
    unit.side && { icon: Compass, label: 'الاتجاه', value: unit.side },
  ].filter(Boolean) as Array<{ icon: any; label: string; value: string }>;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto"
      >
        {/* شريط العنوان */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-surface-container-lowest/95 backdrop-blur border-b border-outline-variant">
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-on-surface truncate">
              {UNIT_KIND_LABELS[unit.unitKind]}
            </h3>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-semibold mt-0.5">
              {unit.zoneName && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {unit.zoneName}
                </span>
              )}
              <span>قطعة {unit.plotNo}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant cursor-pointer shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* معرض الصور الكامل */}
        {images.length > 0 && (
          <div className="relative bg-black">
            <div className="aspect-[16/9] w-full overflow-hidden">
              <img
                src={images[currentImage]}
                alt={`صورة ${currentImage + 1} من ${images.length}`}
                className="w-full h-full object-contain"
              />
            </div>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                  aria-label="السابق"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                  aria-label="التالي"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full">
                  {currentImage + 1} / {images.length}
                </span>
                <div className="absolute bottom-2 right-2 left-2 flex gap-1.5 justify-center pt-3">
                  {images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`مصغرة ${i + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImage(i);
                      }}
                      className={`w-12 h-9 object-cover rounded-md cursor-pointer transition-all border-2 ${
                        i === currentImage
                          ? 'border-primary opacity-100'
                          : 'border-transparent opacity-50 hover:opacity-80'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* المحتوى */}
        <div className="p-5 space-y-5">
          {/* السعر */}
          {settings.showPrice && (
            <div className="flex items-baseline justify-between flex-wrap gap-2 bg-success-container rounded-2xl px-4 py-3 border border-success">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-success" />
                <span className="text-xs font-bold text-on-success-container">
                  السعر
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-success">
                  {unit.price.toLocaleString('ar-EG')}
                </span>
                <span className="text-xs font-bold text-success">ج.م</span>
                {unit.negotiable && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-success text-on-success">
                    قابل للتفاوض
                  </span>
                )}
              </div>
            </div>
          )}

          {/* المواصفات */}
          {specs.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {specs.map((s, i) => (
                <div
                  key={i}
                  className="panel-section px-3 py-2.5 text-center"
                >
                  <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-[10px] text-on-surface-variant font-bold">
                    {s.label}
                  </p>
                  <p className="text-sm font-black text-on-surface mt-0.5">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* المميزات */}
          {settings.showFeatures && unit.features && unit.features.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-on-surface">المميزات</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {unit.features.map((f, i) => (
                  <span key={i} className="chip">
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* الوصف */}
          {settings.showDescription && unit.description && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-on-surface">الوصف</h4>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                {unit.description}
              </p>
            </div>
          )}

          {/* التسليم والسداد */}
          {(settings.showDelivery || settings.showPayment) && (
            <div className="grid sm:grid-cols-2 gap-2.5">
              {settings.showDelivery && unit.deliveryNote && (
                <div className="panel-section px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-on-surface-variant">
                      التسليم
                    </span>
                  </div>
                  <p className="text-sm font-bold text-on-surface">
                    {unit.deliveryNote}
                  </p>
                </div>
              )}
              {settings.showPayment && unit.paymentTerms && (
                <div className="panel-section px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-on-surface-variant">
                      نظام السداد
                    </span>
                  </div>
                  <p className="text-sm font-bold text-on-surface">
                    {unit.paymentTerms}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* زر الحجز */}
          <button
            type="button"
            onClick={() => onReserve(unit)}
            className="btn-primary w-full py-3.5 shadow-lg shadow-primary/20"
          >
            احجز هذه الوحدة الآن
          </button>
          <p className="text-[11px] text-center text-on-surface-variant">
            سيتم إرسال بيانات تواصلك لفريق الشركة ليتواصل معك في أقرب وقت
          </p>
        </div>
      </div>
    </div>
  );
}
