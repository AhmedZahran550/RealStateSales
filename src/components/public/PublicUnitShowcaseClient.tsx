'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  PublicUnitDetail,
} from '@/lib/server/public-data';
import { CompanyPublicSettings, UNIT_KIND_LABELS } from '@/lib/types';
import ReservationModal from './ReservationModal';
import {
  Building2,
  MapPin,
  CalendarDays,
  Maximize2,
  Trees,
  Layers,
  Compass,
  CreditCard,
  Clock,
  Sparkles,
  Phone,
  MessageCircle,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Film,
  Building,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export interface PublicUnitShowcaseClientProps {
  unit: PublicUnitDetail;
  company: {
    id: string;
    name: string;
    commercialName?: string;
    logoUrl?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  settings: CompanyPublicSettings;
}

export default function PublicUnitShowcaseClient({
  unit,
  company,
  settings,
}: PublicUnitShowcaseClientProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);

  const mediaList = unit.media || [];
  const currentMedia = mediaList[activeMediaIndex];

  // التنقل بين الوسائط
  const nextMedia = useCallback(() => {
    if (mediaList.length === 0) return;
    setActiveMediaIndex((i) => (i + 1) % mediaList.length);
  }, [mediaList.length]);

  const prevMedia = useCallback(() => {
    if (mediaList.length === 0) return;
    setActiveMediaIndex((i) => (i - 1 + mediaList.length) % mediaList.length);
  }, [mediaList.length]);

  // مفاتيح الأسهم للتنقل
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') nextMedia();
      if (e.key === 'ArrowRight') prevMedia();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nextMedia, prevMedia]);

  // نسخ رابط المشاركة
  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  // رابط الواتساب المخصص للاستفسار عن هذه الوحدة
  const waUrl = useMemo(() => {
    if (!company.phone) return '';
    let clean = company.phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('01')) clean = '2' + clean;
    const unitTitle = UNIT_KIND_LABELS[unit.unitKind] || 'وحدة عقارية';
    const zoneStr = unit.zoneName ? ` في ${unit.zoneName}` : '';
    const plotStr = unit.plotNo ? ` قطعة ${unit.plotNo}` : '';
    const priceStr = settings.showPrice ? ` بسعر ${unit.price.toLocaleString('ar-EG')} ج.م` : '';
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const msg = `مرحباً ${company.name}، أود الاستفسار وحجز موعد معاينة لـ ${unitTitle}${zoneStr}${plotStr}${priceStr}.\nرابط الوحدة: ${pageUrl}`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  }, [company.phone, company.name, unit, settings.showPrice]);

  const unitKindTitle = UNIT_KIND_LABELS[unit.unitKind] || 'وحدة سكنية';

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-24 sm:pb-16 selection:bg-primary-container selection:text-on-primary-container">
      {/* الترويسة العلوية مع هوية الشركة */}
      <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-40 shadow-xs backdrop-blur-md bg-opacity-95">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* هوية الشركة */}
          <Link
            href={`/p/${company.id}`}
            className="flex items-center gap-2.5 min-w-0 group hover:opacity-90 transition"
            title="زيارة صفحة الشركة وكافة الوحدات"
          >
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-outline-variant shrink-0"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-black text-xs sm:text-sm text-on-surface truncate group-hover:text-primary transition">
                  {company.name}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              </div>
              <span className="text-[10px] text-on-surface-variant font-semibold flex items-center gap-1">
                <span>تصفح كافة الوحدات</span>
                <ArrowRight className="w-2.5 h-2.5 rotate-180" />
              </span>
            </div>
          </Link>

          {/* أزرار سريعة */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="min-h-[40px] px-3 rounded-xl border border-outline-variant hover:bg-surface-container text-on-surface text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="نسخ رابط الوحدة"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'تم النسخ!' : 'مشاركة'}</span>
            </button>

            {company.phone && (
              <a
                href={`tel:${company.phone}`}
                className="min-h-[40px] px-3.5 rounded-xl bg-primary text-on-primary text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                dir="ltr"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{company.phone}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي للوحدة */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-6 flex-1 w-full">
        {/* عنوان الوحدة والمنطقة والتسعير */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-primary/10 text-primary">
                {unitKindTitle}
              </span>
              {unit.zoneName && (
                <span className="flex items-center gap-1 text-xs font-bold text-on-surface-variant">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{unit.zoneName}</span>
                </span>
              )}
              {unit.plotNo && (
                <span className="text-xs font-bold text-on-surface-variant">
                  • قطعة {unit.plotNo}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-on-surface">
              {unitKindTitle} {unit.area} م² {unit.zoneName ? `بـ ${unit.zoneName}` : ''}
            </h1>
          </div>

          {/* بطاقة السعر */}
          {settings.showPrice && unit.price > 0 && (
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-3 sm:px-4 sm:py-2.5 flex items-center justify-between sm:justify-end gap-3 self-start sm:self-auto">
              <div>
                <span className="text-[10px] font-bold text-on-surface-variant block">السعر المطلوب</span>
                <span className="text-lg sm:text-xl font-black text-primary">
                  {unit.price.toLocaleString('ar-EG')} <span className="text-xs font-bold text-on-surface-variant">ج.م</span>
                </span>
              </div>
              {unit.negotiable && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-success-container text-on-success-container self-center">
                  قابل للتفاوض
                </span>
              )}
            </div>
          )}
        </div>

        {/* معرض الوسائط (صور وفيديوهات) */}
        <div className="space-y-3">
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-3xl overflow-hidden bg-black shadow-lg border border-outline-variant">
            {mediaList.length > 0 && currentMedia ? (
              currentMedia.kind === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <video
                    src={currentMedia.externalUrl || currentMedia.storagePath}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <img
                  src={currentMedia.externalUrl || currentMedia.storagePath}
                  alt={currentMedia.caption || unitKindTitle}
                  className="w-full h-full object-contain bg-black/90"
                />
              )
            ) : (
              <div className="w-full h-full hero-gradient flex flex-col items-center justify-center text-white/90 gap-2">
                <Building className="w-12 h-12 opacity-80" />
                <span className="text-xs font-bold opacity-80">لا توجد صور مرفقة لهذه الوحدة</span>
              </div>
            )}

            {/* تدرج التباين */}
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none flex items-end justify-between text-white">
              <span className="text-xs font-bold">
                {currentMedia?.caption || `${unitKindTitle} - قطعة ${unit.plotNo}`}
              </span>
              {mediaList.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md">
                  {activeMediaIndex + 1} / {mediaList.length}
                </span>
              )}
            </div>

            {/* أزرار التقليب للوسائط */}
            {mediaList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevMedia}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition flex items-center justify-center cursor-pointer shadow-lg"
                  aria-label="السابق"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextMedia}
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition flex items-center justify-center cursor-pointer shadow-lg"
                  aria-label="التالي"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* شريط الصور المصغرة (Thumbnails) */}
          {mediaList.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {mediaList.map((m, idx) => {
                const url = m.externalUrl || m.storagePath || '';
                const isVideo = m.kind === 'video';
                const isSelected = idx === activeMediaIndex;

                return (
                  <button
                    key={m.id || idx}
                    type="button"
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 transition-all border-2 cursor-pointer bg-black ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 scale-105 shadow-md'
                        : 'border-outline-variant opacity-60 hover:opacity-100'
                    }`}
                  >
                    {isVideo ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-primary bg-surface-container-lowest">
                        <Film className="w-4 h-4" />
                        <span className="text-[8px] font-black mt-0.5">فيديو</span>
                      </div>
                    ) : (
                      <img src={url} alt="thumbnail" className="w-full h-full object-cover" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* شبكة المواصفات الفنية للوحدة */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-on-surface">المواصفات والتفاصيل الأساسية</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {/* المساحة */}
            {settings.showArea && (
              <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant block">المساحة الإجمالية</span>
                  <span className="text-xs sm:text-sm font-black text-on-surface">{unit.area} م²</span>
                </div>
              </div>
            )}

            {/* الحديقة الخاصة */}
            {settings.showGarden && unit.gardenArea && unit.gardenArea > 0 && (
              <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-success-container text-success flex items-center justify-center shrink-0">
                  <Trees className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant block">حديقة خاصة</span>
                  <span className="text-xs sm:text-sm font-black text-on-surface">{unit.gardenArea} م²</span>
                </div>
              </div>
            )}

            {/* الدور / الطابق */}
            {settings.showFloor && (
              <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant block">الطابق</span>
                  <span className="text-xs sm:text-sm font-black text-on-surface">
                    {unit.floor === 0 || unit.floor === undefined ? 'أرضي' : `الدور ${unit.floor}`}
                  </span>
                </div>
              </div>
            )}

            {/* الاتجاه / الواجهة */}
            {unit.side && (
              <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant block">الواجهة والاتجاه</span>
                  <span className="text-xs sm:text-sm font-black text-on-surface">{unit.side}</span>
                </div>
              </div>
            )}

            {/* موعد الاستلام */}
            {unit.deliveryNote && (
              <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant block">موعد الاستلام</span>
                  <span className="text-xs sm:text-sm font-black text-on-surface">{unit.deliveryNote}</span>
                </div>
              </div>
            )}

            {/* نظام السداد */}
            {unit.paymentTerms && (
              <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant block">طريقة السداد</span>
                  <span className="text-xs sm:text-sm font-black text-on-surface">{unit.paymentTerms}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* مميزات الوحدة والمواصفات الإضافية */}
        {unit.features && unit.features.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-black text-on-surface">المميزات والتجهيزات</h2>
            <div className="flex flex-wrap gap-2">
              {unit.features.map((f, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant text-xs font-bold text-on-surface flex items-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>{f}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* الوصف الإضافي */}
        {unit.description && (
          <div className="space-y-2 p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant">
            <h2 className="text-sm font-black text-on-surface">تفاصيل إضافية عن الوحدة</h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
              {unit.description}
            </p>
          </div>
        )}

        {/* الموقع على الخريطة */}
        {unit.lat && unit.lng && (
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-on-surface">الموقع الجغرافي للوحدة</h3>
                <p className="text-xs text-on-surface-variant font-medium">
                  {unit.zoneName ? `${unit.zoneName} - ` : ''}قطعة {unit.plotNo}
                </p>
              </div>
            </div>
            <a
              href={`https://www.google.com/maps?q=${unit.lat},${unit.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tonal min-h-[40px] px-3.5 text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <span>فتح في الخرائط</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* بطاقة الشركة وخيار استعراض باقي الوحدات */}
        <div className="p-5 sm:p-6 rounded-3xl bg-surface-container-low border border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-right">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-12 h-12 rounded-2xl object-cover border border-outline-variant shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold text-lg shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1 justify-center sm:justify-start">
                <span className="font-black text-sm sm:text-base text-on-surface">{company.name}</span>
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              </div>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                تصفح كافة المشاريع والوحدات المتاحة وسابقة الأعمال
              </p>
            </div>
          </div>

          <Link
            href={`/p/${company.id}`}
            className="btn-primary min-h-[44px] px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 shadow-sm"
          >
            <span>استعراض كافة وحدات الشركة</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </main>

      {/* الشريط السفلي العائم (شاشات الجوال والحاسوب) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant p-3 sm:py-3.5 shadow-2xl">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between gap-3">
          {/* معلومات سريعة */}
          <div className="hidden sm:block">
            <span className="text-xs font-bold text-on-surface-variant block">
              {unitKindTitle} • {unit.area} م²
            </span>
            {settings.showPrice && unit.price > 0 && (
              <span className="text-base font-black text-primary">
                {unit.price.toLocaleString('ar-EG')} ج.م
              </span>
            )}
          </div>

          {/* أزرار الحجز والتواصل */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsReservationOpen(true)}
              className="btn-primary flex-1 sm:flex-none min-h-[44px] py-2.5 px-6 text-xs sm:text-sm font-black shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CalendarDays className="w-4 h-4" />
              <span>طلب حجز موعد معاينة</span>
            </button>

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] py-2.5 px-4 rounded-2xl bg-success-container hover:bg-success text-on-success-container hover:text-on-success border border-success/30 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs"
                title="تواصل مباشر عبر واتساب"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden xs:inline">واتساب</span>
              </a>
            )}

            {company.phone && (
              <a
                href={`tel:${company.phone}`}
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl border border-outline-variant hover:bg-surface-container text-on-surface flex items-center justify-center transition"
                title="اتصال هاتفي"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* مودال حجز موعد المعاينة المباشر للوحدة */}
      {isReservationOpen && (
        <ReservationModal
          key={unit.id}
          unit={unit}
          companyId={company.id}
          isOpen={true}
          onClose={() => setIsReservationOpen(false)}
          companyPhone={company.phone}
          companyName={company.name}
        />
      )}
    </div>
  );
}

