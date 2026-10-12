'use client';

import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Zone, Building, Unit, Service } from '@/lib/types';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  MapPin,
  Sparkles,
  Building2,
  Navigation,
  Compass,
  Search,
  Filter,
  Eye,
  EyeOff,
  Maximize2,
  Info,
} from 'lucide-react';

interface MapViewerProps {
  zones: Zone[];
  buildings: Building[];
  units: Unit[];
  services: Service[];
  onSelectZone: (zone: Zone) => void;
  selectedZone: Zone | null;
  onSelectUnit: (unit: Unit) => void;
  isAdmin?: boolean;
}

export default function MapViewer({
  zones,
  buildings,
  units,
  services,
  onSelectZone,
  selectedZone,
  onSelectUnit,
  isAdmin = false,
}: MapViewerProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'my-units' | 'services'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [badgeMode, setBadgeMode] = useState<'full' | 'compact' | 'minimal'>('full');
  const [showServices, setShowServices] = useState(true);
  const [showPlots, setShowPlots] = useState(true);
  const [adminCoordHint, setAdminCoordHint] = useState<{ x: number; y: number } | null>(null);

  // Map units to zones
  const unitsCountByZone = zones.reduce((acc, z) => {
    acc[z.id] = units.filter((u) => u.zoneId === z.id).length;
    return acc;
  }, {} as Record<number, number>);

  // Coordinates of known services matching the official preview.webp blueprint
  const serviceMarkers = [
    { id: 1, name: 'هايبر وان', x: 93.0, y: 89.5, icon: '🛒', color: 'bg-amber-600' },
    { id: 2, name: 'مول العين', x: 66.0, y: 57.0, icon: '🏬', color: 'bg-indigo-600' },
    { id: 3, name: 'مول مصر', x: 3.8, y: 29.5, icon: '🛍️', color: 'bg-rose-600' },
    { id: 4, name: 'الداون تاون والمحور الخدمي', x: 50.0, y: 51.0, icon: '🏙️', color: 'bg-blue-600' },
    { id: 7, name: 'الحزام الأخضر', x: 42.0, y: 36.0, icon: '🌳', color: 'bg-emerald-600' },
    { id: 8, name: 'الحديقة المركزية', x: 42.0, y: 11.5, icon: '🌿', color: 'bg-emerald-500' },
    { id: 9, name: 'النادي الاجتماعي', x: 19.5, y: 85.5, icon: '⚽', color: 'bg-amber-600' },
    { id: 10, name: 'الجامعة الإيطالية', x: 21.0, y: 13.5, icon: '🎓', color: 'bg-violet-600' },
    { id: 11, name: 'ميديكال بوينت الطبي', x: 10.5, y: 25.5, icon: '🏥', color: 'bg-red-500' },
    { id: 12, name: 'طريق الروبيكي', x: 97.5, y: 41.0, icon: '🛣️', color: 'bg-sky-600' },
    { id: 13, name: 'طريق السويس الصحراوي', x: 48.5, y: 97.0, icon: '🛣️', color: 'bg-amber-600' },
  ];

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdmin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const y = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));
    setAdminCoordHint({ x, y });
  };

  return (
    <div className="relative w-full h-[520px] sm:h-[640px] lg:h-[760px] rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-[#070a0e] shadow-2xl flex flex-col">
      {/* Top Map Toolbar */}
      <div className="absolute top-3 sm:top-4 inset-x-2 sm:inset-x-4 z-20 flex flex-wrap items-center justify-between gap-2 sm:gap-3 pointer-events-none">
        {/* Search & Filter pills */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 sm:gap-2 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-2xl max-w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث برقم المنطقة أو القطعة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs bg-slate-900 text-white placeholder-slate-400 pl-3 pr-9 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 w-40 sm:w-60"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition ${
                filterMode === 'all'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              الكل (16)
            </button>
            <button
              onClick={() => setFilterMode('my-units')}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition ${
                filterMode === 'my-units'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              وحداتي المتاحة
            </button>
            <button
              onClick={() => setFilterMode('services')}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition ${
                filterMode === 'services'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              الخدمات
            </button>
          </div>

          <div className="h-5 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

          {/* Badge Density Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setBadgeMode('full')}
              className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition ${
                badgeMode === 'full'
                  ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="عرض الشارات الكاملة للمناطق مع الأسماء"
            >
              شارات تفصيلية
            </button>
            <button
              onClick={() => setBadgeMode('compact')}
              className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition ${
                badgeMode === 'compact'
                  ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="أزرار دائرية مطابقة لمخطط الجهاز"
            >
              دوائر المخطط
            </button>
            <button
              onClick={() => setBadgeMode('minimal')}
              className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition ${
                badgeMode === 'minimal'
                  ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="خريطة نقية لرؤية أرقام القطع والشوارع بوضوح"
            >
              مخطط نقي
            </button>
          </div>
        </div>

        {/* Masterplan Legend & Badge */}
        <div className="pointer-events-auto hidden md:flex items-center gap-3 bg-slate-950/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 text-slate-300 text-xs shadow-2xl">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Compass className="w-4 h-4" />
            <span>مخطط جهاز مدينة بدر الرسمي</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500/50" />
              منطقة بها وحدات
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
              منطقة شاغرة
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              معلم رئيسي
            </span>
          </div>
        </div>
      </div>

      {/* Admin Click Coordinates Hint */}
      {isAdmin && adminCoordHint && (
        <div className="absolute top-20 right-4 z-20 bg-amber-950/95 border border-amber-500 text-amber-200 text-xs px-3.5 py-2.5 rounded-2xl backdrop-blur-md shadow-2xl animate-in fade-in">
          <p className="font-bold">إحداثيات المعايرة (جهاز بدر):</p>
          <p className="font-mono mt-0.5 text-[11px]">
            mapX: <strong className="text-white">{adminCoordHint.x}%</strong> • mapY: <strong className="text-white">{adminCoordHint.y}%</strong>
          </p>
        </div>
      )}

      {/* Interactive Pan & Zoom Area */}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.15 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Floating Zoom & Orientation Controls */}
            <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2 bg-slate-950/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-2xl">
              <button
                onClick={() => zoomIn()}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="تكبير الخريطة (+)"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => zoomOut()}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="تصغير الخريطة (-)"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => resetTransform()}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition border-t border-slate-800 pt-2"
                title="إعادة ضبط الرؤية"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Axis Hints Badge in Corner */}
            <div className="absolute bottom-6 right-6 z-20 pointer-events-none hidden sm:flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 text-[11px] text-slate-400 shadow-xl">
              <span className="flex items-center gap-1 font-bold text-amber-400">
                <Navigation className="w-3.5 h-3.5 transform -rotate-45" />
                <span>الاتجاهات:</span>
              </span>
              <span>شمال: الحديقة المركزية</span>
              <span>•</span>
              <span>جنوب: طريق السويس</span>
              <span>•</span>
              <span>شرق: محور الروبيكي</span>
            </div>

            {/* Transform Container with Masterplan */}
            <TransformComponent
              wrapperClass="!w-full !h-full cursor-grab active:cursor-grabbing"
              contentClass="!w-full !h-full flex items-center justify-center"
            >
              <div
                onClick={handleMapClick}
                className="relative w-[1269px] h-[952px] bg-[#0c1017] rounded-2xl overflow-hidden select-none border border-amber-900/40 shadow-2xl"
              >
                {/* Official Authority Blueprint Masterplan Image */}
                <img
                  src="/preview.webp"
                  alt="مخطط جهاز مدينة بدر - الحي المتميز"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                  draggable={false}
                />

                {/* Subtle Amber Glow Border */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-amber-500/20 pointer-events-none" />

                {/* 16 Zones Interactive Nodes */}
                {zones.map((zone) => {
                  const unitCount = unitsCountByZone[zone.id] || 0;
                  const isSelected = selectedZone?.id === zone.id;

                  // Filter logic
                  if (filterMode === 'my-units' && unitCount === 0) return null;
                  if (
                    searchTerm &&
                    !zone.name.includes(searchTerm) &&
                    !zone.id.toString().includes(searchTerm)
                  ) {
                    return null;
                  }

                  // 1) MINIMAL MODE: Subtle glowing ring matching printed circles
                  if (badgeMode === 'minimal') {
                    return (
                      <div
                        key={zone.id}
                        onClick={() => onSelectZone(zone)}
                        style={{
                          left: `${zone.mapX}%`,
                          top: `${zone.mapY}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute group cursor-pointer z-10 transition-transform duration-200 hover:scale-125"
                        title={`${zone.name} - ${zone.direction} (${unitCount} وحدة)`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-all border-2 ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-white shadow-xl shadow-amber-500/60 scale-110'
                              : unitCount > 0
                              ? 'bg-amber-600/40 text-amber-200 border-amber-400 backdrop-blur-[2px] shadow-lg shadow-amber-600/30'
                              : 'bg-slate-900/40 text-white border-white/60 hover:border-amber-400'
                          }`}
                        >
                          <span className="drop-shadow-md">{zone.id}</span>
                          {unitCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-md">
                              {unitCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // 2) COMPACT MODE: Circular gold pin that sits directly on the blueprint circle
                  if (badgeMode === 'compact') {
                    return (
                      <div
                        key={zone.id}
                        onClick={() => onSelectZone(zone)}
                        style={{
                          left: `${zone.mapX}%`,
                          top: `${zone.mapY}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute group cursor-pointer z-10 transition-transform duration-200 hover:scale-115"
                      >
                        {isSelected && (
                          <div className="absolute -inset-2 rounded-full bg-amber-400/40 animate-ping pointer-events-none" />
                        )}
                        <div
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-black border-white shadow-amber-500/50 scale-105'
                              : unitCount > 0
                              ? 'bg-slate-950/90 text-white border-amber-500 shadow-amber-950/40'
                              : 'bg-slate-950/85 text-slate-300 border-slate-700/80 hover:border-amber-400'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-lg bg-amber-600 text-white font-black text-xs flex items-center justify-center">
                            {zone.id}
                          </span>
                          <span className="text-[11px] font-bold">منطقة {zone.id}</span>
                          {unitCount > 0 && (
                            <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-black text-[10px]">
                              {unitCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // 3) FULL MODE: Detailed badge with Name, Direction, and Counter
                  return (
                    <div
                      key={zone.id}
                      onClick={() => onSelectZone(zone)}
                      style={{
                        left: `${zone.mapX}%`,
                        top: `${zone.mapY}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute group cursor-pointer z-10 transition-transform duration-200 hover:scale-110"
                    >
                      {/* Pulse effect if selected or has units */}
                      {isSelected && (
                        <div className="absolute -inset-3 rounded-full bg-amber-400/30 animate-ping pointer-events-none" />
                      )}

                      <div
                        className={`relative flex items-center gap-2.5 px-3 py-2 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-black border-white shadow-amber-500/50 scale-105'
                            : unitCount > 0
                            ? 'bg-slate-900/90 text-white border-amber-500/80 hover:border-amber-400 shadow-amber-950/40'
                            : 'bg-slate-950/85 text-slate-300 border-slate-700/80 hover:border-slate-500'
                        }`}
                      >
                        {/* Zone Number Circle */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                            isSelected
                              ? 'bg-slate-950 text-white'
                              : unitCount > 0
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {zone.id}
                        </div>

                        {/* Zone Name & Direction */}
                        <div className="flex flex-col text-right">
                          <span className="text-xs font-bold leading-tight whitespace-nowrap">
                            {zone.name}
                          </span>
                          <span
                            className={`text-[9px] font-medium ${
                              isSelected ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {zone.direction}
                          </span>
                        </div>

                        {/* Unit Counter Badge */}
                        {unitCount > 0 && (
                          <div
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isSelected
                                ? 'bg-slate-950 text-amber-300'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {unitCount}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Buildings / Plots Interactive Markers */}
                {showPlots &&
                  buildings.map((b) => {
                    if (!b.mapX || !b.mapY) return null;
                    const bUnits = units.filter((u) => u.buildingId === b.id);
                    if (filterMode === 'my-units' && bUnits.length === 0) return null;
                    if (searchTerm && !b.plotNo.toString().includes(searchTerm)) return null;

                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          const targetZone = zones.find((z) => z.id === b.zoneId);
                          if (targetZone) onSelectZone(targetZone);
                        }}
                        style={{
                          left: `${b.mapX}%`,
                          top: `${b.mapY}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute z-10 cursor-pointer group"
                        title={`قطعة رقم ${b.plotNo} - المنطقة ${b.zoneId}`}
                      >
                        <div className="flex items-center gap-1 bg-slate-950/90 text-amber-300 border border-amber-500/60 rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-lg group-hover:scale-125 group-hover:border-amber-300 group-hover:bg-amber-900 transition">
                          <Building2 className="w-3 h-3 text-amber-400" />
                          <span>قطعة {b.plotNo}</span>
                          {bUnits.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          )}
                        </div>
                      </div>
                    );
                  })}

                {/* Service Landmark Markers */}
                {showServices &&
                  (filterMode === 'all' || filterMode === 'services') &&
                  serviceMarkers.map((sm) => (
                    <div
                      key={sm.id}
                      style={{
                        left: `${sm.x}%`,
                        top: `${sm.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute z-10 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-sm border border-slate-700/80 rounded-xl px-2.5 py-1 text-slate-200 text-[11px] font-bold shadow-xl hover:scale-110 hover:border-amber-500 transition pointer-events-auto"
                    >
                      <span className="text-sm">{sm.icon}</span>
                      <span>{sm.name}</span>
                    </div>
                  ))}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
