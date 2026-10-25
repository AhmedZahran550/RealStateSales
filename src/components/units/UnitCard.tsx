'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Unit, UNIT_KIND_LABELS, UNIT_STATUS_CONFIG } from '@/lib/types';
import { zoneDisplayName } from '@/lib/zone-utils';
import { createUnitWhatsAppUrl } from '@/lib/shareUtils';
import {
  MapPin,
  Building2,
  Calendar,
  CreditCard,
  Copy,
  Check,
  MessageCircle,
  ArrowLeft,
  Layers,
  Sparkles,
} from 'lucide-react';

interface UnitCardProps {
  unit: Unit;
  zones?: any[];
  currentUser?: any;
  onStatusChange?: (unitId: string, newStatus: Unit['status']) => void;
  onCopy?: (unit: Unit) => void;
}

export default function UnitCard({
  unit,
  zones = [],
  currentUser,
  onStatusChange,
  onCopy,
}: UnitCardProps) {
  const [copied, setCopied] = useState(false);
  const statusConfig = UNIT_STATUS_CONFIG[unit.status];

  const primaryImage =
    unit.media?.[0]?.externalUrl ||
    unit.media?.[0]?.storagePath ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onCopy) {
      onCopy(unit);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pricePerMeter = unit.area > 0 ? Math.round(unit.price / unit.area) : null;

  return (
    <div className="card p-3 sm:p-4 hover:shadow-md transition-all duration-200 border border-outline-variant flex flex-col justify-between gap-3 bg-surface">
      {/* Top Section: Small Thumbnail + High-Density Header Specs */}
      <div className="flex items-start gap-3">
        {/* Small Thumbnail Image (User Request: small image, see details more) */}
        <Link
          href={`/units/${unit.id}`}
          className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-outline-variant group bg-surface-container"
        >
          <img
            src={primaryImage}
            alt={`قطعة ${unit.plotNo}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
          <span
            className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${statusConfig.badgeClass}`}
          >
            {statusConfig.label}
          </span>
        </Link>

        {/* Core Specs: Plot, Zone, Kind, Price */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <Link href={`/units/${unit.id}`} className="hover:underline">
              <h3 className="text-sm sm:text-base font-black text-on-surface truncate">
                {zoneDisplayName(unit.zoneId, zones)} • ق {unit.plotNo}
              </h3>
            </Link>
            <span className="text-[11px] font-mono text-on-surface-variant font-bold shrink-0">
              #BD-{unit.zoneId}-{unit.plotNo}
            </span>
          </div>

          {/* Unit Kind & Floor & Company */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="px-1.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] font-bold">
              {UNIT_KIND_LABELS[unit.unitKind] || 'شقة سكنية'}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium">
              {unit.floor === 0 ? 'أرضي' : unit.floor ? `دور ${unit.floor}` : 'متكرر'}
              {unit.side ? ` (${unit.side})` : ''}
            </span>
            {unit.companyName && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant font-semibold truncate max-w-[110px]">
                {unit.companyName}
              </span>
            )}
          </div>

          {/* Primary Price & Price/m² Display */}
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-black text-primary font-mono">
              {unit.price.toLocaleString('ar-EG')} <span className="text-[11px] font-bold text-on-surface-variant">ج.م</span>
            </span>
            {pricePerMeter && (
              <span className="text-[11px] text-on-surface-variant font-medium">
                ({pricePerMeter.toLocaleString('ar-EG')} ج/م²)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Specifications Row: Area, Down Payment, Delivery */}
      <div className="grid grid-cols-3 gap-1.5 bg-surface-container rounded-xl p-2 text-center text-[11px]">
        <div>
          <span className="text-on-surface-variant block text-[10px]">المساحة</span>
          <strong className="text-on-surface font-bold font-mono">{unit.area} م²</strong>
        </div>
        <div>
          <span className="text-on-surface-variant block text-[10px]">المقدم</span>
          <strong className="text-on-surface font-bold font-mono">
            {(unit.price * 0.1).toLocaleString('ar-EG')}
          </strong>
        </div>
        <div>
          <span className="text-on-surface-variant block text-[10px]">الاستلام</span>
          <strong className="text-on-surface font-bold truncate block">{unit.deliveryNote || 'فوري'}</strong>
        </div>
      </div>

      {/* Payment note if present */}
      {unit.paymentTerms && (
        <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5 px-1 truncate">
          <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate">{unit.paymentTerms}</span>
        </div>
      )}

      {/* Quick Status Buttons */}
      {onStatusChange && (
        <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-surface-container text-[11px] border border-outline-variant">
          <span className="text-[10px] font-bold text-on-surface-variant px-1">الحالة:</span>
          <div className="flex items-center gap-1">
            {(['available', 'reserved', 'sold'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(unit.id, st);
                }}
                className={`px-2 py-0.5 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                  unit.status === st
                    ? st === 'available'
                      ? 'bg-success text-on-success shadow-xs'
                      : st === 'reserved'
                      ? 'bg-warning text-on-warning shadow-xs'
                      : 'bg-error text-on-error shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {st === 'available' ? 'متاح' : st === 'reserved' ? 'حجز' : 'مباع'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Links */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-outline-variant">
        <button
          type="button"
          onClick={handleCopy}
          className="btn-tonal flex-1 py-2 text-xs flex items-center justify-center gap-1 font-bold min-h-[42px]"
          title="نسخ تفاصيل الوحدة"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
        </button>

        <a
          href={createUnitWhatsAppUrl(unit, currentUser, undefined, zones)}
          target="_blank"
          rel="noreferrer"
          className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1 font-bold min-h-[42px]"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>واتساب</span>
        </a>

        <Link
          href={`/units/${unit.id}`}
          className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition border border-outline-variant min-h-[42px] min-w-[42px] flex items-center justify-center"
          title="عرض صفحة التفاصيل الكاملة"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
