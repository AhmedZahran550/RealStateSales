'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Unit, Zone, UserProfile } from '@/lib/types';
import { zoneDisplayName } from '@/lib/zone-utils';
import { createUnitWhatsAppUrl } from '@/lib/shareUtils';
import {
  Share2,
  ExternalLink,
  Square,
  Layers,
  ArrowRight,
  Search,
  Filter,
  Eye,
  CheckCircle,
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
              وحدات متاحة حالياً جاهزة للمشاركة الفورية مع المشترين بضغطة زر
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
            className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold inline-flex items-center gap-1 transition"
          >
            <span>كل المحفظة</span>
            <ExternalLink className="w-3 h-3 text-primary" />
          </Link>
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.slice(0, 9).map((unit) => {
          const img =
            unit.media?.[0]?.externalUrl ||
            unit.media?.[0]?.storagePath ||
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

          const waUrl = createUnitWhatsAppUrl(unit, currentUser, undefined, zones);

          return (
            <div
              key={unit.id}
              className="card overflow-hidden hover:shadow-md transition-all border border-surface-container-high/60 flex flex-col justify-between group"
            >
              {/* Image & Badges */}
              <div className="relative h-40 w-full overflow-hidden bg-surface-container-low">
                <img
                  src={img}
                  alt={`قطعة ${unit.plotNo}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-primary text-on-primary font-bold text-[10px] shadow-sm">
                  متاح حصرياً
                </span>
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-inverse-surface/80 backdrop-blur-sm text-inverse-on-surface text-[10px] font-mono">
                  قطعة {unit.plotNo}
                </span>
              </div>

              {/* Details */}
              <div className="p-3.5 space-y-2.5 flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant mb-1">
                    <span className="font-bold text-primary">الحي المتميز</span>
                    <span>{zoneDisplayName(unit.zoneId, zones)}</span>
                  </div>

                  <h3 className="text-xs font-black text-on-surface line-clamp-1 break-words">
                    {unit.description || `وحدة فاخرة قطعة ${unit.plotNo}`}
                  </h3>

                  <div className="flex items-center gap-3 my-2 text-xs text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <Square className="w-3.5 h-3.5 text-primary" />
                      <span>{unit.area} م²</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span>{unit.deliveryNote || 'فوري'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-container-high/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">السعر</span>
                    <span className="text-sm font-black text-on-surface">
                      {unit.price.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectUnit(unit)}
                      className="px-2.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-success-container hover:bg-success-container/70 text-success text-xs font-bold inline-flex items-center gap-1 transition shadow-xs"
                      title="مشاركة العرض بالواتساب"
                    >
                      <Share2 className="w-3.5 h-3.5" />
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
