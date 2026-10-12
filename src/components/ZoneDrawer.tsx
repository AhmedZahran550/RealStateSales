'use client';

import React, { useState } from 'react';
import { Zone, Unit, Building, Service, UNIT_KIND_LABELS, UNIT_STATUS_CONFIG } from '@/lib/types';
import {
  X,
  Building2,
  Tag,
  MapPin,
  ExternalLink,
  ChevronRight,
  Plus,
  Compass,
  Sparkles,
} from 'lucide-react';

interface ZoneDrawerProps {
  zone: Zone | null;
  onClose: () => void;
  units: Unit[];
  buildings: Building[];
  services: Service[];
  onSelectUnit: (unit: Unit) => void;
  onAddUnitInZone: (zoneId: number) => void;
}

export default function ZoneDrawer({
  zone,
  onClose,
  units,
  buildings,
  services,
  onSelectUnit,
  onAddUnitInZone,
}: ZoneDrawerProps) {
  const [plotSearch, setPlotSearch] = useState('');

  if (!zone) return null;

  // Filter units and buildings for this zone
  const zoneUnits = units.filter((u) => u.zoneId === zone.id);
  const zoneBuildings = buildings.filter((b) => b.zoneId === zone.id);

  const filteredBuildings = zoneBuildings.filter((b) =>
    plotSearch ? b.plotNo.toString().includes(plotSearch) : true
  );

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-full sm:w-[480px] lg:w-[520px] bg-white dark:bg-[#131a26] shadow-2xl border-r border-stone-200 dark:border-stone-800 flex flex-col transform transition-transform duration-300 ease-in-out">
      {/* Drawer Header */}
      <div className="p-5 border-b border-amber-100 dark:border-stone-800 bg-gradient-to-l from-amber-50/60 to-transparent dark:from-amber-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-amber-600/30">
              {zone.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#1c1917] dark:text-[#f5f5f4]">
                  {zone.name}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                  {zone.direction}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                الحي المتميز – إجمالي عروضك: {zoneUnits.length} وحدة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Masterplan Location Snippet */}
        <div className="relative h-24 w-full rounded-2xl overflow-hidden border border-amber-900/30 bg-black mt-3 shadow-inner">
          <img
            src="/preview.webp"
            alt={`موقع ${zone.name} على مخطط الجهاز`}
            className="w-full h-full object-cover opacity-90 transition-all duration-300"
            style={{
              objectPosition: `${zone.mapX}% ${zone.mapY}%`,
              transform: 'scale(2.2)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              موقع {zone.name} على مخطط الجهاز الرسمي
            </span>
          </div>
        </div>

        {zone.notes && (
          <div className="mt-3 p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800/60 text-xs text-stone-600 dark:text-stone-300 border border-stone-200/50 dark:border-stone-700/50">
            {zone.notes}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Services in this Zone */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            المعالم والخدمات المجاورة
          </h4>
          <div className="flex flex-wrap gap-2">
            {services.slice(0, 4).map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {s.name}
              </span>
            ))}
          </div>
        </div>

        {/* Action: Add Unit to Zone */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
          <div>
            <p className="text-xs font-bold text-amber-950 dark:text-amber-200">
              هل لديك وحدة جديدة في {zone.name}؟
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              سجّل بيانات القطعة ومواصفات الشقة فوراً
            </p>
          </div>
          <button
            onClick={() => onAddUnitInZone(zone.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة وحدة
          </button>
        </div>

        {/* Plots / Buildings in this Zone */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              القطع والمباني المسجلة ({zoneBuildings.length})
            </h4>
            <div className="relative w-36">
              <input
                type="text"
                placeholder="بحث برقم القطعة..."
                value={plotSearch}
                onChange={(e) => setPlotSearch(e.target.value)}
                className="w-full text-xs px-2.5 py-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {filteredBuildings.length === 0 ? (
            <div className="text-center py-6 text-xs text-stone-400 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
              لا توجد قطع مسجلة تطابق بحثك حالياً
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {filteredBuildings.map((b) => {
                const bUnits = zoneUnits.filter((u) => u.plotNo === b.plotNo);
                return (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 hover:border-amber-500 dark:hover:border-amber-500 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4]">
                        قطعة {b.plotNo}
                      </span>
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
                        {bUnits.length} وحدة
                      </span>
                    </div>
                    {b.landArea && (
                      <p className="text-[11px] text-stone-500 mt-1">
                        مساحة الأرض: {b.landArea} م²
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Units List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            عروضك المتاحة بالمنطقة ({zoneUnits.length})
          </h4>

          {zoneUnits.length === 0 ? (
            <div className="text-center py-10 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 p-6">
              <Building2 className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-stone-600 dark:text-stone-300">
                لا توجد وحدات معروضة لك في {zone.name} بعد
              </p>
              <button
                onClick={() => onAddUnitInZone(zone.id)}
                className="mt-3 text-xs font-bold text-amber-600 hover:text-amber-700 underline"
              >
                اضغط هنا لإضافة أول وحدة
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {zoneUnits.map((u) => {
                const statusInfo = UNIT_STATUS_CONFIG[u.status];
                return (
                  <div
                    key={u.id}
                    onClick={() => onSelectUnit(u)}
                    className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/80 hover:shadow-md hover:border-amber-500 dark:hover:border-amber-500 transition cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#1c1917] dark:text-[#f5f5f4]">
                            قطعة {u.plotNo} – {UNIT_KIND_LABELS[u.unitKind]}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {u.area} م² {u.gardenArea ? `+ حديقة ${u.gardenArea} م²` : ''} • {u.side || 'واجهة'}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-700/60">
                      <div>
                        <span className="text-sm font-extrabold text-amber-800 dark:text-amber-400">
                          {u.price.toLocaleString('ar-EG')} ج.م
                        </span>
                        {u.negotiable && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mr-1.5">
                            (قابل للتفاوض)
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-400 group-hover:text-amber-600 flex items-center gap-1 font-semibold">
                        التفاصيل
                        <ChevronRight className="w-3.5 h-3.5 transform rotate-180" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
