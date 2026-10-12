'use client';

import React from 'react';
import { Unit, UNIT_KIND_LABELS, UNIT_STATUS_CONFIG } from '@/lib/types';
import {
  Building2,
  MapPin,
  Calendar,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  Navigation,
} from 'lucide-react';

interface UnitCardProps {
  unit: Unit;
  onView: (unit: Unit) => void;
  onEdit: (unit: Unit) => void;
  onDelete: (id: string) => void;
}

export default function UnitCard({ unit, onView, onEdit, onDelete }: UnitCardProps) {
  const statusInfo = UNIT_STATUS_CONFIG[unit.status];
  const primaryImage =
    unit.media?.[0]?.externalUrl ||
    unit.media?.[0]?.storagePath ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="bg-white dark:bg-[#131a26] rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-500 dark:hover:border-amber-500 transition-all duration-300 flex flex-col group">
      {/* Image & Badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
        <img
          src={primaryImage}
          alt={`قطعة ${unit.plotNo}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

        {/* Zone & Plot Pin badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-xl border border-stone-700/60 shadow-lg">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>منطقة {unit.zoneId}</span>
          <span className="text-stone-500">•</span>
          <span>قطعة {unit.plotNo}</span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl border shadow-md ${statusInfo.badgeClass}`}
          >
            {statusInfo.label}
          </span>
          {unit.lat && unit.lng && (
            <span
              className="p-1 rounded-xl bg-amber-600/90 text-white shadow-md backdrop-blur-sm"
              title="محدد بإحداثيات GPS على الخريطة الحية"
            >
              <Navigation className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Bottom image overlay: Price */}
        <div className="absolute bottom-3 right-3 left-3 flex items-baseline justify-between text-white">
          <div>
            <span className="text-xl font-black text-amber-400">
              {unit.price.toLocaleString('ar-EG')}
            </span>
            <span className="text-xs font-bold mr-1">ج.م</span>
          </div>
          {unit.negotiable && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/80 text-amber-950 backdrop-blur-sm">
              قابل للتفاوض
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-base text-stone-900 dark:text-stone-100 line-clamp-1">
              {UNIT_KIND_LABELS[unit.unitKind]}
            </h4>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              الدور {unit.floor === 0 ? 'الأرضي' : unit.floor || 'متكرر'}
            </span>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-1">
            {unit.side || 'واجهة بحري'} • {unit.area} م²{' '}
            {unit.gardenArea ? `(+ حديقة ${unit.gardenArea} م²)` : ''}
          </p>

          {unit.description && (
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 line-clamp-2 leading-relaxed">
              {unit.description}
            </p>
          )}
        </div>

        {/* Specs highlights */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
          <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
            <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="truncate">{unit.deliveryNote}</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
            <CreditCard className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="truncate">{unit.paymentTerms}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
          <button
            onClick={() => onView(unit)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-300 text-xs font-bold transition"
          >
            <Eye className="w-3.5 h-3.5" />
            التفاصيل
          </button>

          <button
            onClick={() => onEdit(unit)}
            className="p-2 rounded-xl text-stone-500 hover:text-amber-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="تعديل"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(unit.id)}
            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
            title="حذف"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
