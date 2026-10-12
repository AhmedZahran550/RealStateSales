'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Unit, UnitKind, UnitStatus, UNIT_KIND_LABELS, UNIT_STATUS_CONFIG } from '@/lib/types';
import UnitCard from '@/components/UnitCard';
import UnitDetailModal from '@/components/UnitDetailModal';
import UnitFormModal from '@/components/UnitFormModal';
import { exportUnitsToExcel } from '@/lib/excel';
import {
  Building2,
  Plus,
  FileSpreadsheet,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Check,
  ChevronDown,
  Navigation,
} from 'lucide-react';

export default function UnitsPage() {
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

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState<number | 'all'>('all');
  const [filterKind, setFilterKind] = useState<UnitKind | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<UnitStatus | 'all'>('all');
  const [filterHasMedia, setFilterHasMedia] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(10000000);

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Filtered Units - تصفية وحدات المستخدم الحالي فقط
  const filteredUnits = useMemo(() => {
    return myUnits.filter((u) => {
      // Search
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchPlot = u.plotNo.toString().includes(query);
        const matchDesc = u.description?.toLowerCase().includes(query);
        const matchSide = u.side?.toLowerCase().includes(query);
        const matchKind = UNIT_KIND_LABELS[u.unitKind].toLowerCase().includes(query);
        if (!matchPlot && !matchDesc && !matchSide && !matchKind) return false;
      }

      // Zone
      if (filterZone !== 'all' && u.zoneId !== filterZone) return false;

      // Kind
      if (filterKind !== 'all' && u.unitKind !== filterKind) return false;

      // Status
      if (filterStatus !== 'all' && u.status !== filterStatus) return false;

      // Has Media
      if (filterHasMedia && (!u.media || u.media.length === 0)) return false;

      // Price
      if (u.price > maxPrice) return false;

      return true;
    });
  }, [myUnits, searchTerm, filterZone, filterKind, filterStatus, filterHasMedia, maxPrice]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-600/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1c1917] dark:text-[#f5f5f4]">
              عروض الوحدات العقارية الخاصة بي
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              إجمالي {myUnits.length} وحدة مسجلة بحسابك • متاح للبيع: {myUnits.filter((u) => u.status === 'available').length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportUnitsToExcel(filteredUnits)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold border border-stone-200 dark:border-stone-700 transition"
            title="تصدير النتائج الحالية إلى إكسيل"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير إكسيل ({filteredUnits.length})</span>
          </button>

          <button
            onClick={() => {
              setEditingUnit(null);
              setIsUnitFormOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500 hover:from-amber-800 hover:to-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-600/30 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة وحدة جديدة</span>
          </button>
        </div>
      </div>

      {/* Filter and View Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#131a26] border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث برقم القطعة، الوصف، الواجهة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-4 pr-10 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl self-end lg:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#131a26] text-amber-900 dark:text-amber-300 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>جدول البيانات</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#131a26] text-amber-900 dark:text-amber-300 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span>كروت مصورة</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
          {/* Zone Selector */}
          <div>
            <label className="block text-[11px] font-bold text-stone-400 mb-1">المنطقة</label>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">كل المناطق (1 - 16)</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Kind Selector */}
          <div>
            <label className="block text-[11px] font-bold text-stone-400 mb-1">نوع الوحدة</label>
            <select
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value as any)}
              className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">كل الأنواع</option>
              {Object.entries(UNIT_KIND_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-[11px] font-bold text-stone-400 mb-1">الحالة</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">كل الحالات</option>
              {Object.entries(UNIT_STATUS_CONFIG).map(([k, info]) => (
                <option key={k} value={k}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          {/* Max Price Slider */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-stone-400 mb-1">
              <span>أقصى سعر:</span>
              <span className="text-amber-700 dark:text-amber-400 font-black">
                {(maxPrice / 1000000).toFixed(1)} م
              </span>
            </div>
            <input
              type="range"
              min="1000000"
              max="10000000"
              step="250000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-amber-600"
            />
          </div>

          {/* Has Media Checkbox */}
          <div className="flex items-end pb-1.5">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700 dark:text-stone-300">
              <input
                type="checkbox"
                checked={filterHasMedia}
                onChange={(e) => setFilterHasMedia(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              يحتوي على صور فقط
            </label>
          </div>
        </div>
      </div>

      {/* View Content: Table or Grid */}
      {filteredUnits.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-[#131a26] rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
          <Building2 className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <h3 className="font-bold text-base text-[#1c1917] dark:text-[#f5f5f4]">
            لا توجد وحدات تطابق معايير البحث
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            جرب تغيير الفلاتر أو اضغط على الزر أدناه لإضافة وحدة جديدة.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterZone('all');
              setFilterKind('all');
              setFilterStatus('all');
              setFilterHasMedia(false);
              setMaxPrice(10000000);
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold text-amber-700 dark:text-amber-400"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map((u) => (
            <UnitCard
              key={u.id}
              unit={u}
              onView={(unit) => setSelectedUnit(unit)}
              onEdit={(unit) => {
                setEditingUnit(unit);
                setIsUnitFormOpen(true);
              }}
              onDelete={(id) => deleteUnit(id)}
            />
          ))}
        </div>
      ) : (
        /* Data Table View */
        <div className="bg-white dark:bg-[#131a26] rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#fbf9f6] dark:bg-[#18202e] border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">المنطقة / القطعة</th>
                  <th className="py-3.5 px-4">نوع الوحدة</th>
                  <th className="py-3.5 px-4">المساحة</th>
                  <th className="py-3.5 px-4">الواجهة</th>
                  <th className="py-3.5 px-4">السعر المطلوب</th>
                  <th className="py-3.5 px-4">موقع GPS</th>
                  <th className="py-3.5 px-4">التسليم والسداد</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredUnits.map((u) => {
                  const statusInfo = UNIT_STATUS_CONFIG[u.status];
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUnit(u)}
                      className="hover:bg-amber-50/50 dark:hover:bg-amber-950/20 cursor-pointer transition"
                    >
                      {/* Zone & Plot */}
                      <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-[11px] font-black flex items-center justify-center">
                            {u.zoneId}
                          </span>
                          <span>قطعة {u.plotNo}</span>
                        </div>
                      </td>

                      {/* Kind & Floor */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-stone-800 dark:text-stone-200 block">
                          {UNIT_KIND_LABELS[u.unitKind]}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          الدور {u.floor === 0 ? 'الأرضي' : u.floor || 'متكرر'}
                        </span>
                      </td>

                      {/* Area */}
                      <td className="py-3.5 px-4 font-semibold text-stone-700 dark:text-stone-300">
                        {u.area} م²
                        {u.gardenArea ? (
                          <span className="block text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                            + حديقة {u.gardenArea} م²
                          </span>
                        ) : null}
                      </td>

                      {/* Side */}
                      <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400">
                        {u.side || 'واجهة'}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-black text-amber-800 dark:text-amber-400">
                        <div>
                          <span>{u.price.toLocaleString('ar-EG')} ج.م</span>
                          {u.negotiable && (
                            <span className="block text-[10px] text-amber-600 font-bold">
                              قابل للتفاوض
                            </span>
                          )}
                        </div>
                      </td>

                      {/* GPS */}
                      <td className="py-3.5 px-4">
                        {u.lat && u.lng ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 font-mono">
                            <Navigation className="w-3 h-3" />
                            <span>محدد</span>
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[10px]">-</span>
                        )}
                      </td>

                      {/* Delivery & Terms */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-stone-600 dark:text-stone-300">
                        <div className="truncate font-medium">{u.deliveryNote}</div>
                        <div className="text-[10px] text-stone-400 truncate">{u.paymentTerms}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedUnit(u)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingUnit(u);
                              setIsUnitFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('هل ترغب في حذف هذه الوحدة؟')) {
                                deleteUnit(u.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
        zones={zones}
        buildings={buildings}
        services={services}
        onAddBuilding={addBuilding}
      />
    </div>
  );
}
