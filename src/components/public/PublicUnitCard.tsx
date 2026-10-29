'use client';

import React from 'react';
import { PublicUnit, UNIT_KIND_LABELS, CompanyPublicSettings } from '@/lib/types';
import { firstImageUrl } from '@/lib/public-utils';
import {
  MapPin,
  Camera,
  Bed,
  Video,
  Maximize2,
  Trees,
  Layers,
  Compass,
  MessageCircle,
  ArrowUpLeft,
} from 'lucide-react';

export interface PublicUnitCardProps {
  unit: PublicUnit;
  settings: CompanyPublicSettings;
  onView: (unit: PublicUnit) => void;
  companyPhone?: string;
  companyName?: string;
}

export default function PublicUnitCard({
  unit,
  settings,
  onView,
  companyPhone,
  companyName,
}: PublicUnitCardProps) {
  const primaryImage = firstImageUrl(unit.media);
  const imagesCount = unit.media.filter((m) => m.kind === 'image').length;
  const hasVideo = unit.media.some((m) => m.kind === 'video');

  // تجهيز رابط واتساب المخصص لهذه الوحدة
  const waUrl = React.useMemo(() => {
    if (!companyPhone) return '';
    let clean = companyPhone.replace(/[^0-9]/g, '');
    if (clean.startsWith('01')) {
      clean = '2' + clean;
    }
    const unitTitle = UNIT_KIND_LABELS[unit.unitKind] || 'وحدة عقارية';
    const zoneStr = unit.zoneName ? ` في ${unit.zoneName}` : '';
    const plotStr = unit.plotNo ? ` (قطعة ${unit.plotNo})` : '';
    const message = `مرحباً${companyName ? ` ${companyName}` : ''}، أود الاستفسار عن ${unitTitle}${zoneStr}${plotStr} المعروضة في صفحتكم.`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  }, [companyPhone, companyName, unit]);

  return (
    <div
      onClick={() => onView(unit)}
      className="card card-bordered rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-primary transition-all duration-300 flex flex-col cursor-pointer group bg-surface-container-lowest"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onView(unit)}
    >
      {/* قسم الوسائط والحالات */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={UNIT_KIND_LABELS[unit.unitKind]}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full hero-gradient flex flex-col items-center justify-center gap-1.5 text-white/90">
            <Bed className="w-10 h-10 opacity-80" />
            <span className="text-[11px] font-bold opacity-80">معاينة معمارية</span>
          </div>
        )}

        {/* تدرج التباين الداكن المضمون */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

        {/* شارة المنطقة والقطعة أعلى اليمين */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 flex-wrap">
          {unit.zoneName && (
            <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-xl shadow-md border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-primary-fixed" />
              <span>{unit.zoneName}</span>
            </div>
          )}
          {unit.plotNo && (
            <span className="bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2 py-1 rounded-xl shadow-md border border-white/10">
              قطعة {unit.plotNo}
            </span>
          )}
        </div>

        {/* شارات الوسائط أعلى اليسار (الصور والفيديو) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {hasVideo && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-xl bg-black/80 text-primary-fixed backdrop-blur-md border border-white/10 shadow-sm">
              <Video className="w-3 h-3" />
              <span>فيديو</span>
            </span>
          )}
          {imagesCount > 1 && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-xl bg-black/80 text-white backdrop-blur-md border border-white/10 shadow-sm">
              <Camera className="w-3 h-3 text-primary-fixed" />
              <span>{imagesCount}</span>
            </span>
          )}
        </div>

        {/* السعر وحالة التفاوض أسفل الصورة */}
        {settings.showPrice && (
          <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between flex-wrap gap-1.5">
            <div className="price-pill">
              <span className="text-lg font-black text-primary">
                {unit.price.toLocaleString('ar-EG')}
              </span>
              <span className="text-[11px] font-bold text-on-surface-variant">ج.م</span>
            </div>
            {unit.negotiable && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-success text-on-success shadow-sm">
                قابل للتفاوض
              </span>
            )}
          </div>
        )}
      </div>

      {/* المحتوى والتفاصيل المعمارية */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-black text-base text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
              {UNIT_KIND_LABELS[unit.unitKind]}
            </h4>
            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-container text-on-primary-container">
              متاح للتعاقد
            </span>
          </div>

          {/* شريط المواصفات السريعة بالبطاقة */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-outline-variant/60">
            {settings.showArea && (
              <div className="flex items-center gap-1.5 text-xs text-on-surface font-semibold bg-surface-container-low px-2.5 py-1.5 rounded-xl">
                <Maximize2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{unit.area} م²</span>
              </div>
            )}
            {settings.showFloor && unit.floor !== undefined && unit.floor !== null && (
              <div className="flex items-center gap-1.5 text-xs text-on-surface font-semibold bg-surface-container-low px-2.5 py-1.5 rounded-xl">
                <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{unit.floor === 0 ? 'أرضي' : `دور ${unit.floor}`}</span>
              </div>
            )}
            {unit.side && (
              <div className="flex items-center gap-1.5 text-xs text-on-surface font-semibold bg-surface-container-low px-2.5 py-1.5 rounded-xl">
                <Compass className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{unit.side}</span>
              </div>
            )}
            {settings.showGarden && Boolean(unit.gardenArea) && (
              <div className="flex items-center gap-1.5 text-xs text-on-surface font-semibold bg-surface-container-low px-2.5 py-1.5 rounded-xl col-span-2 sm:col-span-1">
                <Trees className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>حديقة {unit.gardenArea} م²</span>
              </div>
            )}
          </div>

          {/* الوصف المختصر */}
          {settings.showDescription && unit.description && (
            <p className="text-xs text-on-surface-variant mt-3 line-clamp-2 leading-relaxed">
              {unit.description}
            </p>
          )}

          {/* المميزات */}
          {settings.showFeatures && unit.features && unit.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {unit.features.slice(0, 3).map((f, i) => (
                <span key={i} className="chip text-[11px] py-0.5 px-2">
                  ✓ {f}
                </span>
              ))}
              {unit.features.length > 3 && (
                <span className="chip text-[11px] py-0.5 px-2 text-primary font-bold">
                  +{unit.features.length - 3} مميزات إضافية
                </span>
              )}
            </div>
          )}
        </div>

        {/* أزرار الإجراء السريع */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onView(unit);
            }}
            className="btn-primary flex-1 py-2.5 text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all"
          >
            <span>عرض التفاصيل والحجز</span>
            <ArrowUpLeft className="w-4 h-4 shrink-0" />
          </button>

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2.5 rounded-2xl bg-success-container hover:bg-success text-on-success-container hover:text-on-success transition-all duration-200 border border-success/30 flex items-center justify-center shrink-0 shadow-xs"
              title="استفسار مباشر عبر واتساب"
              aria-label="استفسار مباشر عبر واتساب"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
