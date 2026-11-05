'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Unit, Zone, UserProfile } from '@/lib/types';
import { zoneDisplayName } from '@/lib/zone-utils';
import { createUnitWhatsAppUrl } from '@/lib/shareUtils';
import { firstImageUrl } from '@/lib/public-utils';
import {
  Share2,
  ExternalLink,
  Square,
  Layers,
  ArrowLeft,
  Search,
  Eye,
  Building2,
  Briefcase,
  MessageCircle,
} from 'lucide-react';

interface BrokerQuickShareTabProps {
  units: Unit[];
  zones: Zone[];
  currentUser: UserProfile;
  onSelectUnit: (unit: Unit) => void;
}

export default function BrokerQuickShareTab({
  units,
  zones,
  currentUser,
  onSelectUnit,
}: BrokerQuickShareTabProps) {
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');

  const availableUnits = units.filter((u) => u.status === 'available');

  const filtered = availableUnits
    .filter((u) => {
      if (selectedZone !== 'all' && String(u.zoneId) !== selectedZone) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchPlot = String(u.plotNo).includes(q);
        const matchDesc = u.description?.toLowerCase().includes(q);
        return matchPlot || matchDesc;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.zoneId !== b.zoneId) return a.zoneId - b.zoneId;
      return a.plotNo - b.plotNo;
    });

  return (
    <div className="space-y-4">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-on-surface">عروض مميزة للمشاركة السريعة (واتساب)</h2>
            <p className="text-[11px] text-on-surface-variant">
              وحدات متاحة حالياً جاهزة للمشاركة الفورية مع المشترين برابط المعاينة المباشر
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث برقم القطعة…"
              className="input-base text-xs py-1.5 pr-8 pl-3 w-36 sm:w-44"
            />
            <Search className="w-3.5 h-3.5 text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="input-base text-xs py-1.5 px-3"
          >
            <option value="all">كل المناطق ({availableUnits.length})</option>
            {zones.map((z) => (
              <option key={z.id} value={String(z.id)}>
                {z.name}
              </option>
            ))}
          </select>

          <Link
            href="/units"
            className="btn-tonal px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 min-h-[36px]"
          >
            <span>كل المحفظة</span>
            <ExternalLink className="w-3 h-3 text-on-surface-variant" />
          </Link>
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filtered.slice(0, 9).map((unit) => {
          const img = firstImageUrl(unit.media);
          const waUrl = createUnitWhatsAppUrl(unit, currentUser, undefined, zones);

          return (
            <div
              key={unit.id}
              className="rounded-2xl overflow-hidden border border-outline-variant/60 bg-surface-container-lowest hover:border-primary/40 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              {/* Image & Badges with Scrim */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
                {img ? (
                  <img
                    src={img}
                    alt={`قطعة ${unit.plotNo}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full hero-gradient flex flex-col items-center justify-center gap-1.5 text-white/90">
                    <Building2 className="w-8 h-8 opacity-80" />
                    <span className="text-[11px] font-bold opacity-80">معاينة معمارية</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                <span className="badge badge-success absolute top-2.5 right-2.5 text-[10px]">
                  متاح للبيع
                </span>
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-mono">
                  قطعة {unit.plotNo}
                </span>
              </div>

              {/* Details */}
              <div className="p-4 space-y-2.5 flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant mb-1">
                    <span className="font-bold text-primary">{zoneDisplayName(unit.zoneId, zones)}</span>
                    <span className="font-mono font-bold text-on-surface-variant">#BD-{unit.zoneId}-{unit.plotNo}</span>
                  </div>

                  {(unit.belongTo || unit.companyName) && (
                    <div className="mb-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-1 max-w-full truncate ${
                        unit.belongTo && unit.belongTo !== unit.companyName
                          ? 'bg-secondary-container/80 text-on-secondary-container border border-secondary/20'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        <Briefcase className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{unit.belongTo || unit.companyName}</span>
                      </span>
                    </div>
                  )}

                  <h3 className="text-xs font-black text-on-surface line-clamp-1 break-words">
                    {unit.description || `وحدة سكنية فاخرة قطعة ${unit.plotNo}`}
                  </h3>

                  <div className="flex items-center gap-3 my-2 text-xs text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <Square className="w-3.5 h-3.5 text-primary" />
                      <span className="font-mono tabular-nums">{unit.area} م²</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span>{unit.deliveryNote || 'استلام فوري'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-outline-variant/40 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">السعر الإجمالي</span>
                    <span className="text-sm font-black text-on-surface font-mono">
                      {unit.price.toLocaleString('ar-EG')} <span className="text-[10px] font-bold text-on-surface-variant">ج.م</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectUnit(unit)}
                      className="btn-tonal p-2 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                      title="معاينة تفاصيل الوحدة"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 min-h-[36px]"
                      title="مشاركة العرض بالواتساب"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>مشاركة</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
