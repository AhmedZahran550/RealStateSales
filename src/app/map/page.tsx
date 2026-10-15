'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Zone, Unit } from '@/lib/types';
import MapViewer from '@/components/MapViewer';
import ZoneDrawer from '@/components/ZoneDrawer';
import UnitDetailModal from '@/components/UnitDetailModal';
import UnitFormModal from '@/components/UnitFormModal';
import LiveUnitsMap from '@/components/LiveUnitsMap';

export default function MapPage() {
  const {
    currentUser,
    zones,
    buildings,
    myUnits,
    services,
    addBuilding,
    addUnit,
    updateUnit,
    deleteUnit,
  } = useApp();

  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitFormPresetZone, setUnitFormPresetZone] = useState<number | undefined>(undefined);
  const [mapMode, setMapMode] = useState<'blueprint' | 'live_gps'>('blueprint');

  const handleAddUnitInZone = (zoneId: number) => {
    setUnitFormPresetZone(zoneId);
    setEditingUnit(null);
    setIsUnitFormOpen(true);
  };

  if (!currentUser) return null;

  return (
    <div className="flex flex-col w-full space-y-space-lg animate-in fade-in duration-300">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 sm:p-5 lg:p-space-lg rounded-2xl bg-surface-container-lowest border border-surface-container-high/40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center shadow-md shrink-0">
            <span className="material-symbols-outlined text-[24px] sm:text-[26px]">map</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-on-surface">
              خريطة الحي المتميز التفاعلية (مدينة بدر)
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              استكشف مناطق الحي الـ 16 بمخطط الجهاز الرسمي، أو استعرض الخريطة الحية للوحدات المحددة عبر الـ GPS
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {/* Map Mode Switcher */}
          <div className="bg-surface-container-low p-1 rounded-xl flex items-center text-xs font-bold border border-surface-container-high/40 w-full sm:w-auto">
            <button
              onClick={() => setMapMode('blueprint')}
              className={`flex-1 sm:flex-initial px-3 py-2 rounded-lg transition cursor-pointer min-h-[38px] ${
                mapMode === 'blueprint'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              مخطط الجهاز الهندسي
            </button>
            <button
              onClick={() => setMapMode('live_gps')}
              className={`flex-1 sm:flex-initial px-3 py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
                mapMode === 'live_gps'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">navigation</span>
              <span>الخريطة الحية (GPS)</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingUnit(null);
              setUnitFormPresetZone(undefined);
              setIsUnitFormOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-md transition cursor-pointer w-full sm:w-auto min-h-[40px]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>إضافة وحدة</span>
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
      <div className="p-space-md rounded-2xl bg-surface-container-lowest border border-surface-container-high/40 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">explore</span>
          الانتقال السريع لمناطق الحي الـ 16
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
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
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface border-surface-container-high hover:border-primary/50'
                }`}
              >
                <span>منطقة {z.id}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-on-primary text-primary'
                        : 'bg-primary-fixed text-primary'
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

      {/* Modals & Drawers */}
      <ZoneDrawer
        zone={selectedZone}
        units={myUnits.filter((u) => selectedZone && u.zoneId === selectedZone.id)}
        buildings={buildings}
        services={services}
        onClose={() => setSelectedZone(null)}
        onSelectUnit={(u) => setSelectedUnit(u)}
        onAddUnitInZone={handleAddUnitInZone}
      />

      <UnitDetailModal
        unit={selectedUnit}
        onClose={() => setSelectedUnit(null)}
        onEdit={(unit) => {
          setEditingUnit(unit);
          setSelectedUnit(null);
          setIsUnitFormOpen(true);
        }}
        onDelete={(id) => {
          deleteUnit(id);
          setSelectedUnit(null);
        }}
      />

      <UnitFormModal
        isOpen={isUnitFormOpen}
        initialUnit={editingUnit || undefined}
        defaultZoneId={unitFormPresetZone}
        zones={zones}
        buildings={buildings}
        onAddBuilding={addBuilding}
        onClose={() => {
          setIsUnitFormOpen(false);
          setEditingUnit(null);
          setUnitFormPresetZone(undefined);
        }}
        onSubmit={(unitData) => {
          if (editingUnit) {
            updateUnit(editingUnit.id, unitData);
          } else {
            addUnit(unitData);
          }
          setIsUnitFormOpen(false);
          setEditingUnit(null);
          setUnitFormPresetZone(undefined);
        }}
      />
    </div>
  );
}
