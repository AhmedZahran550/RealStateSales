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

export interface ZoneDrawerProps {
  zone: Zone | null;
  onClose: () => void;
  units: Unit[];
  buildings: Building[];
  services: Service[];
  zones?: Zone[];
  onSelectUnit: (unit: Unit) => void;
  onAddUnitInZone: (zoneId: number) => void;
}

export default function ZoneDrawer({
  zone,
  onClose,
  units,
  buildings,
  services,
  zones = [],
  onSelectUnit,
  onAddUnitInZone,
}: ZoneDrawerProps) {
  const [plotSearch, setPlotSearch] = useState('');

  if (!zone) return null;

  // Filter units and buildings for this zone
  const zoneUnits = (units || []).filter((u) => u.zoneId === zone.id);
  const zoneBuildings = (buildings || []).filter((b) => b.zoneId === zone.id);

  const filteredBuildings = zoneBuildings.filter((b) =>
    plotSearch ? b.plotNo.toString().includes(plotSearch) : true
  );

  const parentZone = zone.parentId ? zones.find((z) => z.id === zone.parentId) : null;
  const parentDisplayName = parentZone ? parentZone.name : 'الحي المتميز (مدينة بدر)';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 left-0 z-50 w-full sm:w-[480px] lg:w-[520px] bg-white shadow-2xl border-r border-outline-variant flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Drawer Header */}
        <div className="p-3.5 sm:p-5 border-b border-warning/25 bg-gradient-to-l from-warning-container/60 to-transparent ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-black text-xl shadow-sm">
              {zone.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-on-surface">
                  {zone.name}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-warning-container text-warning font-semibold border border-warning ">
                  {zone.direction}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {parentDisplayName} – إجمالي عروضك: {zoneUnits.length} وحدة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface-variant hover:bg-surface-container transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Masterplan Location Snippet */}
        <div className="relative h-24 w-full rounded-2xl overflow-hidden border border-warning/30 bg-black mt-3 shadow-inner">
          <img
            src="/preview.webp"
            alt={`موقع ${zone.name} على مخطط الجهاز`}
            className="w-full h-full object-cover opacity-90 transition-all duration-300"
            style={{
              objectPosition: `${zone.mapX}% ${zone.mapY}%`,
              transform: 'scale(2.2)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
            <span className="text-[11px] font-bold text-warning-container flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              موقع {zone.name} على مخطط الجهاز الرسمي
            </span>
          </div>
        </div>

        {zone.notes && (
          <div className="mt-3 p-2.5 rounded-xl bg-surface-container text-xs text-on-surface-variant border border-outline-variant/50 ">
            {zone.notes}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Action: Add Unit to Zone */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-warning-container/80 border border-warning ">
          <div>
            <p className="text-xs font-bold text-on-warning-container ">
              هل لديك وحدة جديدة في {zone.name}؟
            </p>
            <p className="text-[11px] text-warning ">
              سجّل بيانات القطعة ومواصفات الشقة فوراً
            </p>
          </div>
          <button
            onClick={() => onAddUnitInZone(zone.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-warning hover:bg-warning text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة وحدة
          </button>
        </div>

        {/* Plots / Buildings in this Zone */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-warning" />
              القطع والمباني المسجلة ({zoneBuildings.length})
            </h4>
            <div className="relative w-36">
              <input
                type="text"
                placeholder="بحث برقم القطعة..."
                value={plotSearch}
                onChange={(e) => setPlotSearch(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-outline-variant bg-white text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary shadow-xs"
              />
            </div>
          </div>

          {filteredBuildings.length === 0 ? (
            <div className="text-center py-6 text-xs text-on-surface-variant bg-surface-container-low rounded-xl border border-dashed border-outline-variant ">
              لا توجد قطع مسجلة تطابق بحثك حالياً
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredBuildings.map((b) => {
                const bUnits = zoneUnits.filter((u) => u.plotNo === b.plotNo);
                return (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl border border-outline-variant bg-surface-container-low hover:border-warning transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#1c1917] ">
                        قطعة {b.plotNo}
                      </span>
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-warning-container text-warning ">
                        {bUnits.length} وحدة
                      </span>
                    </div>
                    {b.landArea && (
                      <p className="text-[11px] text-on-surface-variant">
                        مساحة الأرض: {b.landArea} م²
                      </p>
                    )}
                    {b.features && b.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {b.features.slice(0, 3).map((f, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-container text-warning "
                          >
                            {f}
                          </span>
                        ))}
                        {b.features.length > 3 && (
                          <span className="text-[10px] text-on-surface-variant">+{b.features.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Units List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-warning" />
            عروضك المتاحة بالمنطقة ({zoneUnits.length})
          </h4>

          {zoneUnits.length === 0 ? (
            <div className="text-center py-10 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant p-6">
              <Building2 className="w-10 h-10 text-on-surface-variant mx-auto mb-2" />
              <p className="text-xs font-bold text-on-surface-variant ">
                لا توجد وحدات معروضة لك في {zone.name} بعد
              </p>
              <button
                onClick={() => onAddUnitInZone(zone.id)}
                className="mt-3 text-xs font-bold text-warning hover:text-warning underline"
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
                    className="p-3.5 rounded-2xl border border-outline-variant bg-white hover:shadow-md hover:border-warning transition cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#1c1917] ">
                            قطعة {u.plotNo} – {UNIT_KIND_LABELS[u.unitKind]}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {u.area} م² {u.gardenArea ? `+ حديقة ${u.gardenArea} م²` : ''} • {u.side || 'واجهة'}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-outline-variant ">
                      <div>
                        <span className="text-sm font-extrabold text-warning ">
                          {u.price.toLocaleString('ar-EG')} ج.م
                        </span>
                        {u.negotiable && (
                          <span className="text-[10px] text-warning font-semibold mr-1.5">
                            (قابل للتفاوض)
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-on-surface-variant group-hover:text-warning flex items-center gap-1 font-semibold">
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
    </>
  );
}
