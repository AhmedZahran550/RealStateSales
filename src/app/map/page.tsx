'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Zone, Unit } from '@/lib/types';
import MapViewer from '@/components/MapViewer';
import ZoneDrawer from '@/components/ZoneDrawer';
import UnitDetailModal from '@/components/UnitDetailModal';
import UnitFormModal from '@/components/UnitFormModal';
import LiveUnitsMap from '@/components/LiveUnitsMap';
import { MapPin, Plus, Compass, Sparkles, Building2, Navigation, Layers } from 'lucide-react';

export default function MapPage() {
  const {
    currentUser,
    zones,
    buildings,
    myUnits,
    services,
    addUnit,
    updateUnit,
    deleteUnit,
    addBuilding,
  } = useApp();

  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitFormPresetZone, setUnitFormPresetZone] = useState<number | undefined>(undefined);
  
  // نمط عرض الخريطة
  const [mapMode, setMapMode] = useState<'blueprint' | 'live_gps'>('blueprint');

  const handleAddUnitInZone = (zoneId: number) => {
    setUnitFormPresetZone(zoneId);
    setEditingUnit(null);
    setIsUnitFormOpen(true);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#131a26] border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-600/30">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1c1917] dark:text-[#f5f5f4]">
              خريطة الحي المتميز التفاعلية (مدينة بدر)
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              استكشف مناطق الحي الـ 16 بالمخطط الهندسي، أو استعرض الخريطة الحية للوحدات المحددة عبر الـ GPS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Map Mode Switcher */}
          <div className="bg-stone-100 dark:bg-stone-800/80 p-1 rounded-2xl flex items-center text-xs font-bold">
            <button
              onClick={() => setMapMode('blueprint')}
              className={`px-3 py-1.5 rounded-xl transition ${
                mapMode === 'blueprint'
                  ? 'bg-white dark:bg-[#131a26] text-amber-900 dark:text-amber-300 shadow-sm border border-stone-200 dark:border-stone-700'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              مخطط الجهاز
            </button>
            <button
              onClick={() => setMapMode('live_gps')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                mapMode === 'live_gps'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>الخريطة الحية (GPS)</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingUnit(null);
              setUnitFormPresetZone(undefined);
              setIsUnitFormOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500 hover:from-amber-800 hover:to-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-600/30 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة وحدة جديدة</span>
          </button>
        </div>
      </div>

      {/* Main Map Box */}
      {mapMode === 'blueprint' ? (
        <MapViewer
          zones={zones}
          buildings={buildings}
          units={myUnits}
          services={services}
          onSelectZone={(z) => setSelectedZone(z)}
          selectedZone={selectedZone}
          onSelectUnit={(u) => setSelectedUnit(u)}
          isAdmin={currentUser.role === 'admin'}
        />
      ) : (
        <LiveUnitsMap
          units={myUnits}
          onSelectUnit={(u) => setSelectedUnit(u)}
          selectedUnit={selectedUnit}
          height="620px"
        />
      )}

      {/* Quick Zones Horizontal Strip */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#131a26] border border-stone-200 dark:border-stone-800 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-600" />
          الانتقال السريع لمناطق الحي (1 - 16)
        </h3>
        <div className="flex gap-2.5 overflow-x-auto pb-2">
          {zones.map((z) => {
            const count = myUnits.filter((u) => u.zoneId === z.id).length;
            const isSelected = selectedZone?.id === z.id;
            return (
              <button
                key={z.id}
                onClick={() => {
                  setSelectedZone(z);
                  if (mapMode === 'live_gps') setMapMode('blueprint');
                }}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                    : count > 0
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-stone-400'
                }`}
              >
                <span>{z.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected
                        ? 'bg-white text-amber-800'
                        : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zone Drawer */}
      <ZoneDrawer
        zone={selectedZone}
        onClose={() => setSelectedZone(null)}
        units={myUnits}
        buildings={buildings}
        services={services}
        onSelectUnit={(u) => setSelectedUnit(u)}
        onAddUnitInZone={handleAddUnitInZone}
      />

      {/* Unit Detail Modal */}
      <UnitDetailModal
        unit={selectedUnit}
        onClose={() => setSelectedUnit(null)}
        onEdit={(unit) => {
          setSelectedUnit(null);
          setEditingUnit(unit);
          setIsUnitFormOpen(true);
        }}
        onDelete={(id) => deleteUnit(id)}
      />

      {/* Unit Form Modal */}
      <UnitFormModal
        isOpen={isUnitFormOpen}
        onClose={() => {
          setIsUnitFormOpen(false);
          setEditingUnit(null);
        }}
        onSubmit={(unitData) => {
          if (editingUnit) {
            updateUnit(editingUnit.id, unitData);
          } else {
            addUnit(unitData);
          }
        }}
        initialUnit={editingUnit}
        defaultZoneId={unitFormPresetZone}
        zones={zones}
        buildings={buildings}
        services={services}
        onAddBuilding={addBuilding}
      />
    </div>
  );
}
