'use client';

import React from 'react';
import { PublicUnit, UNIT_KIND_LABELS, CompanyPublicSettings } from '@/lib/types';
import { firstImageUrl } from '@/lib/public-utils';
import { MapPin, Camera, Bed } from 'lucide-react';

export interface PublicUnitCardProps {
  unit: PublicUnit;
  settings: CompanyPublicSettings;
  onView: (unit: PublicUnit) => void;
}

export default function PublicUnitCard({ unit, settings, onView }: PublicUnitCardProps) {
  const primaryImage = firstImageUrl(unit.media);
  const imagesCount = unit.media.length;

  return (
    <div
      onClick={() => onView(unit)}
      className="card card-bordered rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary transition-all duration-300 flex flex-col cursor-pointer group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onView(unit)}
    >
      {/* الصورت والحالات */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={UNIT_KIND_LABELS[unit.unitKind]}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full hero-gradient flex items-center justify-center">
            <Bed className="w-10 h-10 text-white/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* المنطقة والقطعة */}
        {unit.zoneName && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-xl shadow-lg">
            <MapPin className="w-3.5 h-3.5 text-primary-fixed" />
            <span>{unit.zoneName}</span>
          </div>
        )}

        {/* عدد الصور */}
        {imagesCount > 1 && (
          <span className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/70 text-white backdrop-blur-sm shadow-sm">
            <Camera className="w-3 h-3 text-primary-fixed" />
            <span>{imagesCount}</span>
          </span>
        )}

        {/* السعر أسفل الصورة — حبة بيضاء تضمن وضوح الرقم فوق أي صورة أو خلفية */}
        {settings.showPrice && (
          <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between flex-wrap gap-1">
            <div className="price-pill">
              <span className="text-lg font-black text-primary">
                {unit.price.toLocaleString('ar-EG')}
              </span>
              <span className="text-[11px] font-bold text-on-surface-variant">ج.م</span>
            </div>
            {unit.negotiable && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-success text-on-success shadow-sm">
                قابل للتفاوض
              </span>
            )}
          </div>
        )}
      </div>

      {/* المحتوى */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h4 className="font-bold text-base text-on-surface line-clamp-1">
            {UNIT_KIND_LABELS[unit.unitKind]}
          </h4>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-on-surface-variant font-semibold">
            {settings.showArea && <span>{unit.area} م²</span>}
            {settings.showGarden && unit.gardenArea && (
              <span>+ حديقة {unit.gardenArea} م²</span>
            )}
            {settings.showFloor && unit.floor !== undefined && unit.floor !== null && (
              <span>{unit.floor === 0 ? 'أرضي' : `دور ${unit.floor}`}</span>
            )}
            {unit.side && <span>{unit.side}</span>}
          </div>

          {settings.showDescription && unit.description && (
            <p className="text-xs text-on-surface-variant mt-2 line-clamp-2 leading-relaxed">
              {unit.description}
            </p>
          )}

          {settings.showFeatures && unit.features && unit.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {unit.features.slice(0, 4).map((f, i) => (
                <span key={i} className="chip">
                  ✓ {f}
                </span>
              ))}
              {unit.features.length > 4 && (
                <span className="chip text-primary">
                  +{unit.features.length - 4} مميزات أخرى
                </span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView(unit);
          }}
          className="btn-primary w-full py-2.5"
        >
          عرض التفاصيل وحجز الوحدة
        </button>
      </div>
    </div>
  );
}
