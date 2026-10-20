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
      className="bg-white dark:bg-[#131a26] rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500 dark:hover:border-emerald-600 transition-all duration-300 flex flex-col cursor-pointer group"
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
          <div className="w-full h-full bg-gradient-to-tr from-emerald-900 via-emerald-700 to-emerald-500 flex items-center justify-center">
            <Bed className="w-10 h-10 text-white/70" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

        {/* المنطقة والقطعة */}
        {unit.zoneName && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-xl border border-stone-700/60 shadow-lg">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{unit.zoneName}</span>
          </div>
        )}

        {/* عدد الصور */}
        {imagesCount > 1 && (
          <span className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/70 text-white backdrop-blur-sm border border-white/10 shadow-sm">
            <Camera className="w-3 h-3 text-emerald-400" />
            <span>{imagesCount}</span>
          </span>
        )}

        {/* السعر أسفل الصورة */}
        {settings.showPrice && (
          <div className="absolute bottom-3 right-3 left-3 flex items-baseline justify-between flex-wrap gap-1 text-white">
            <div>
              <span className="text-xl font-black text-emerald-400">
                {unit.price.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-bold mr-1">ج.م</span>
            </div>
            {unit.negotiable && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/90 text-emerald-950 backdrop-blur-sm">
                قابل للتفاوض
              </span>
            )}
          </div>
        )}
      </div>

      {/* المحتوى */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h4 className="font-bold text-base text-stone-900 dark:text-stone-100 line-clamp-1">
            {UNIT_KIND_LABELS[unit.unitKind]}
          </h4>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-stone-500 dark:text-stone-400 font-semibold">
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
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 line-clamp-2 leading-relaxed">
              {unit.description}
            </p>
          )}

          {settings.showFeatures && unit.features && unit.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {unit.features.slice(0, 4).map((f, i) => (
                <span
                  key={i}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                >
                  ✓ {f}
                </span>
              ))}
              {unit.features.length > 4 && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
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
          className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
        >
          عرض التفاصيل وحجز الوحدة
        </button>
      </div>
    </div>
  );
}
