'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Unit, UNIT_KIND_LABELS } from '@/lib/types';
import { MapPin, Building2, ExternalLink, Eye, Navigation, Layers } from 'lucide-react';

export interface LiveUnitsMapProps {
  units: Unit[];
  onSelectUnit?: (unit: Unit) => void;
  selectedUnit?: Unit | null;
  height?: string;
}

const DEFAULT_CENTER = {
  lat: 30.1382,
  lng: 31.7415,
};

export default function LiveUnitsMap({
  units,
  onSelectUnit,
  selectedUnit,
  height = '540px',
}: LiveUnitsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // الوحدات التي تملك إحداثيات
  const unitsWithCoords = units.filter((u) => u.lat && u.lng);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current, {
        center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
        zoom: 14,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      markersRef.current = [];

      // إضافة دبابيس الوحدات
      unitsWithCoords.forEach((unit) => {
        const isSelected = selectedUnit?.id === unit.id;
        const priceMillions = (unit.price / 1000000).toFixed(2);

        const customIcon = L.divIcon({
          className: 'custom-amber-pin',
          html: `
            <div style="
              background: ${isSelected ? '#b45309' : '#d97706'};
              color: white;
              padding: 4px 8px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              gap: 4px;
              font-family: inherit;
              font-weight: 800;
              font-size: 11px;
              border: 2px solid #ffffff;
              box-shadow: 0 4px 14px rgba(180, 83, 9, 0.4);
              white-space: nowrap;
              cursor: pointer;
              transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
              transition: transform 0.2s;
            ">
              <span>قطعة ${unit.plotNo}</span>
              <span style="opacity: 0.9; font-size: 9px;">• ${priceMillions} م</span>
            </div>
          `,
          iconSize: [80, 30],
          iconAnchor: [40, 15],
        });

        const marker = L.marker([unit.lat!, unit.lng!], { icon: customIcon }).addTo(map);

        marker.on('click', () => {
          if (onSelectUnit) {
            onSelectUnit(unit);
          }
        });

        markersRef.current.push(marker);
      });

      // إذا كانت هناك وحدات، نضبط إطار الرؤية ليشملها
      if (unitsWithCoords.length > 0) {
        const bounds = L.latLngBounds(unitsWithCoords.map((u) => [u.lat!, u.lng!]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }

      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 200);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [units, selectedUnit]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-warning/80 shadow-xl bg-surface-container " style={{ height }}>
      {/* الحاوية الفعلية للخريطة */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* لوحة معلومات عائمة علوية */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-warning/80 shadow-lg text-xs flex items-center gap-2.5 sm:gap-3 max-w-[calc(100%-24px)]">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-warning text-white flex items-center justify-center font-black shrink-0">
          <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0">
          <span className="font-extrabold text-[#1c1917] block truncate">
            الخريطة الجغرافية الحية (Live GPS)
          </span>
          <span className="text-[11px] text-warning font-bold block truncate">
            {unitsWithCoords.length} وحدة محددة الإحداثيات من أصل {units.length}
          </span>
        </div>
      </div>
    </div>
  );
}
