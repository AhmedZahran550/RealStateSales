'use client';

import React, { useState } from 'react';
import { Building, Unit, UnitStatus, UNIT_KIND_LABELS } from '@/lib/types';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Plus,
  Home,
  CheckCircle2,
  Clock,
  CheckCheck,
  Eye,
  Pencil,
  Copy,
  Share2,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { createUnitWhatsAppUrl } from '@/lib/shareUtils';

interface BuildingCardProps {
  building: Building;
  units: Unit[];
  zoneName?: string;
  canManage: boolean;
  onAddUnit: (buildingId: number) => void;
  onSelectUnit: (unit: Unit) => void;
  onEditUnit: (unit: Unit) => void;
  onStatusChange?: (unitId: string, newStatus: UnitStatus) => void;
  onCopyUnit: (unit: Unit) => void;
  defaultExpanded?: boolean;
}

export default function BuildingCard({
  building,
  units,
  zoneName,
  canManage,
  onAddUnit,
  onSelectUnit,
  onEditUnit,
  onStatusChange,
  onCopyUnit,
  defaultExpanded = false,
}: BuildingCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // حساب إحصائيات وحدات هذا المبنى
  const availableUnits = units.filter((u) => u.status === 'available');
  const reservedUnits = units.filter((u) => u.status === 'reserved');
  const soldUnits = units.filter((u) => u.status === 'sold');
  const totalAvailableValue = availableUnits.reduce((acc, u) => acc + (u.price || 0), 0);

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
      {/* 1. Header Row */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-surface-container-low/40 to-surface-container-lowest border-b border-surface-container-high/40">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs border border-primary/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface text-base sm:text-lg">
                القطعة {building.plotNo}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {zoneName || `المنطقة ${building.zoneId}`}
              </span>
              {building.landArea && (
                <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-medium text-xs">
                  أرض: {building.landArea} م²
                </span>
              )}
              {building.companyName && (
                <span className="px-2 py-0.5 rounded-md bg-secondary-container/30 text-on-secondary-container font-semibold text-[11px]">
                  {building.companyName}
                </span>
              )}
            </div>
            {building.notes && (
              <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">
                {building.notes}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {canManage && (
            <button
              onClick={() => onAddUnit(building.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-bold transition shadow-xs cursor-pointer"
              title="إضافة وحدة جديدة في هذا المبنى"
              type="button"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ إضافة وحدة</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition cursor-pointer"
            type="button"
          >
            <span>{isExpanded ? 'إخفاء الوحدات' : `عرض الوحدات (${units.length})`}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Middle Stats & Features Row */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-container-high/30">
        {/* Status Counters */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container font-semibold text-on-surface">
            <Layers className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>إجمالي {units.length} وحدة</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{availableUnits.length} متاحة</span>
          </div>

          {reservedUnits.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/60">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{reservedUnits.length} محجوزة</span>
            </div>
          )}

          {soldUnits.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold border border-stone-200 dark:border-stone-700">
              <CheckCheck className="w-3.5 h-3.5 text-stone-500" />
              <span>{soldUnits.length} مباعة</span>
            </div>
          )}

          {totalAvailableValue > 0 && (
            <span className="text-[11px] text-on-surface-variant font-medium mr-auto">
              قيمة المتاح: <span className="font-bold text-primary">{(totalAvailableValue / 1000000).toFixed(2)}M ج.م</span>
            </span>
          )}
        </div>

        {/* Features Chips */}
        {building.features && building.features.length > 0 && (
          <div className="flex items-center flex-wrap gap-1.5">
            {building.features.slice(0, 4).map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high/80 text-on-surface-variant text-[11px] font-medium"
              >
                <Sparkles className="w-2.5 h-2.5 text-primary" />
                {f}
              </span>
            ))}
            {building.features.length > 4 && (
              <span className="text-[10px] text-on-surface-variant font-bold">
                +{building.features.length - 4} مزايا
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. Collapsible Units Section */}
      {isExpanded && (
        <div className="p-4 sm:p-5 bg-surface-container-low/30 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md font-bold text-on-surface text-xs flex items-center gap-1.5">
              <Home className="w-4 h-4 text-primary" />
              الوحدات التابعة للقطعة {building.plotNo} ({units.length})
            </span>
            {canManage && (
              <button
                onClick={() => onAddUnit(building.id)}
                className="text-xs text-primary hover:text-primary-container font-bold flex items-center gap-1 cursor-pointer"
                type="button"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة وحدة جديدة هنا
              </button>
            )}
          </div>

          {units.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-surface-container-high bg-surface-container-lowest">
              <Building2 className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-2" />
              <p className="text-xs text-on-surface-variant font-semibold">
                لا توجد وحدات مسجلة بعد في هذه العمارة
              </p>
              {canManage && (
                <button
                  onClick={() => onAddUnit(building.id)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition cursor-pointer"
                  type="button"
                >
                  <Plus className="w-3.5 h-3.5" />
                  أضف أول وحدة الآن
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {units.map((unit) => {
                const statusStyles = {
                  available: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
                  reserved: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
                  sold: 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
                }[unit.status];

                const statusLabel = {
                  available: 'متاحة',
                  reserved: 'محجوزة',
                  sold: 'تم البيع',
                }[unit.status];

                const whatsAppUrl = createUnitWhatsAppUrl(unit);

                return (
                  <div
                    key={unit.id}
                    className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-xs hover:border-primary/40 transition flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      {/* Unit Title & Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-on-surface text-sm">
                          {UNIT_KIND_LABELS[unit.unitKind]}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyles}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Floor & Side */}
                      <div className="text-xs text-on-surface-variant flex items-center gap-2 mb-2">
                        <span>الدور: {unit.floor ?? 'أرضي'}</span>
                        {unit.side && <span>• {unit.side}</span>}
                      </div>

                      {/* Area & Price */}
                      <div className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-surface-container-low/50">
                        <div className="flex items-center gap-1 font-semibold text-on-surface">
                          <span>{unit.area} م²</span>
                          {unit.gardenArea ? (
                            <span className="text-[10px] text-emerald-600 font-bold">
                              (+{unit.gardenArea} م² حديقة)
                            </span>
                          ) : null}
                        </div>
                        <div className="font-bold text-primary">
                          {unit.price.toLocaleString('ar-EG')} ج.م
                        </div>
                      </div>

                      {/* Description snippet */}
                      {unit.description && (
                        <p className="text-[11px] text-on-surface-variant mt-2 line-clamp-1">
                          {unit.description}
                        </p>
                      )}
                    </div>

                    {/* Unit Action Bar */}
                    <div className="pt-2 border-t border-surface-container-high/40 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onSelectUnit(unit)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition cursor-pointer"
                          title="عرض تفاصيل الوحدة"
                          type="button"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canManage && (
                          <button
                            onClick={() => onEditUnit(unit)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-amber-600 hover:bg-surface-container transition cursor-pointer"
                            title="تعديل بيانات الوحدة"
                            type="button"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => onCopyUnit(unit)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition cursor-pointer"
                          title="نسخ تفاصيل الوحدة للمشاركة"
                          type="button"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      <a
                        href={whatsAppUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition"
                        title="مشاركة تفاصيل الوحدة عبر واتساب"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>واتساب</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
