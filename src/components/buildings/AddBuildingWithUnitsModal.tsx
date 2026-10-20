'use client';

import React, { useState, useEffect } from 'react';
import { Building, Zone, UnitKind, UnitStatus, UNIT_KIND_LABELS } from '@/lib/types';
import {
  Building2,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  MapPin,
  Sparkles,
  ArrowRight,
  Home,
} from 'lucide-react';

export interface DraftUnit {
  id: string; // temporary client ID
  unitKind: UnitKind;
  floor: number;
  side: string;
  area: number;
  gardenArea: number;
  price: number;
  negotiable: boolean;
  deliveryNote: string;
  paymentTerms: string;
  description: string;
  status: UnitStatus;
  features: string[];
}

interface AddBuildingWithUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: Zone[];
  buildings: Building[];
  defaultBuildingId?: number;
  onAddBuildingWithUnits: (
    buildingData: Omit<Building, 'id'>,
    unitsList: Array<any>
  ) => Promise<{ success: boolean; message?: string }>;
  onAddUnitToExisting: (
    unitData: any
  ) => Promise<{ success: boolean; message?: string }>;
}

export default function AddBuildingWithUnitsModal({
  isOpen,
  onClose,
  zones,
  buildings,
  defaultBuildingId,
  onAddBuildingWithUnits,
  onAddUnitToExisting,
}: AddBuildingWithUnitsModalProps) {
  // Mode: 'new_building' (عمارة جديدة + وحدات) | 'existing_building' (إضافة وحدة لعمارة قائمة)
  const [mode, setMode] = useState<'new_building' | 'existing_building'>('new_building');

  // Building State (for 'new_building')
  const [zoneId, setZoneId] = useState<number>(1);
  const [plotNo, setPlotNo] = useState<number | ''>('');
  const [landArea, setLandArea] = useState<number | ''>(550);
  const [buildingNotes, setBuildingNotes] = useState('');
  const [buildingFeatures, setBuildingFeatures] = useState<string[]>([
    'أسانسير',
    'مدخل رخام',
    'واجهة فاخرة',
  ]);
  const [customFeature, setCustomFeature] = useState('');

  // Units Repeater State (for 'new_building')
  const [draftUnits, setDraftUnits] = useState<DraftUnit[]>([
    {
      id: 'draft-1',
      unitKind: 'floor_1',
      floor: 1,
      side: 'شمال',
      area: 140,
      gardenArea: 0,
      price: 1600000,
      negotiable: false,
      deliveryNote: 'استلام فوري',
      paymentTerms: 'كاش أو بتسهيلات',
      description: '',
      status: 'available',
      features: [],
    },
  ]);

  // Existing Building Selection State (for 'existing_building')
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | ''>('');
  const [existingUnitData, setExistingUnitData] = useState<Omit<DraftUnit, 'id'>>({
    unitKind: 'floor_1',
    floor: 1,
    side: 'شمال',
    area: 140,
    gardenArea: 0,
    price: 1600000,
    negotiable: false,
    deliveryNote: 'استلام فوري',
    paymentTerms: 'كاش أو بتسهيلات',
    description: '',
    status: 'available',
    features: [],
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Pre-select if defaultBuildingId passed
  useEffect(() => {
    if (defaultBuildingId) {
      setSelectedBuildingId(defaultBuildingId);
      setMode('existing_building');
    } else {
      setSelectedBuildingId(buildings.length > 0 ? buildings[0].id : '');
    }
  }, [defaultBuildingId, buildings]);

  if (!isOpen) return null;

  // Features tag handlers
  const handleAddBuildingFeature = () => {
    const trimmed = customFeature.trim();
    if (trimmed && !buildingFeatures.includes(trimmed)) {
      setBuildingFeatures([...buildingFeatures, trimmed]);
      setCustomFeature('');
    }
  };

  const handleRemoveBuildingFeature = (feat: string) => {
    setBuildingFeatures(buildingFeatures.filter((f) => f !== feat));
  };

  // Draft Unit handlers
  const handleAddDraftUnit = () => {
    const nextFloor = draftUnits.length;
    const newUnit: DraftUnit = {
      id: `draft-${Date.now()}`,
      unitKind: nextFloor === 0 ? 'ground_garden' : nextFloor === 4 ? 'roof' : 'floor_1',
      floor: nextFloor,
      side: 'شمال',
      area: 140,
      gardenArea: 0,
      price: 1600000,
      negotiable: false,
      deliveryNote: 'استلام فوري',
      paymentTerms: 'كاش أو بتسهيلات',
      description: '',
      status: 'available',
      features: [],
    };
    setDraftUnits([...draftUnits, newUnit]);
  };

  const handleRemoveDraftUnit = (id: string) => {
    if (draftUnits.length <= 1) return;
    setDraftUnits(draftUnits.filter((u) => u.id !== id));
  };

  const handleUpdateDraftUnit = (id: string, updates: Partial<DraftUnit>) => {
    setDraftUnits(
      draftUnits.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (mode === 'new_building') {
        if (!plotNo || Number(plotNo) <= 0) {
          setErrorMessage('يرجى إدخال رقم قطعة صالح');
          setLoading(false);
          return;
        }

        const bData: Omit<Building, 'id'> = {
          zoneId,
          plotNo: Number(plotNo),
          landArea: landArea ? Number(landArea) : undefined,
          features: buildingFeatures,
          notes: buildingNotes || undefined,
        };

        const unitsPayload = draftUnits.map((u) => ({
          unitKind: u.unitKind,
          floor: Number(u.floor),
          side: u.side,
          area: Number(u.area),
          gardenArea: Number(u.gardenArea) || null,
          price: Number(u.price),
          negotiable: u.negotiable,
          deliveryNote: u.deliveryNote,
          paymentTerms: u.paymentTerms,
          description: u.description || null,
          status: u.status,
          features: buildingFeatures,
          media: [],
        }));

        const res = await onAddBuildingWithUnits(bData, unitsPayload);
        if (res.success) {
          onClose();
        } else {
          setErrorMessage(res.message || 'فشل حفظ المبنى والوحدات');
        }
      } else {
        // Mode: 'existing_building'
        if (!selectedBuildingId) {
          setErrorMessage('يرجى اختيار العمارة المراد إضافة الوحدة إليها');
          setLoading(false);
          return;
        }

        const b = buildings.find((x) => x.id === Number(selectedBuildingId));
        if (!b) {
          setErrorMessage('المبنى المحدد غير موجود');
          setLoading(false);
          return;
        }

        const unitPayload = {
          buildingId: b.id,
          zoneId: b.zoneId,
          plotNo: b.plotNo,
          unitKind: existingUnitData.unitKind,
          floor: Number(existingUnitData.floor),
          side: existingUnitData.side,
          area: Number(existingUnitData.area),
          gardenArea: Number(existingUnitData.gardenArea) || null,
          price: Number(existingUnitData.price),
          negotiable: existingUnitData.negotiable,
          deliveryNote: existingUnitData.deliveryNote,
          paymentTerms: existingUnitData.paymentTerms,
          description: existingUnitData.description || null,
          status: existingUnitData.status,
          features: b.features || [],
          media: [],
        };

        const res = await onAddUnitToExisting(unitPayload);
        if (res.success) {
          onClose();
        } else {
          setErrorMessage(res.message || 'فشل إضافة الوحدة');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const selectedBuildingObj = buildings.find((b) => b.id === Number(selectedBuildingId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container-high overflow-hidden my-auto sm:my-8 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-container-high bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md shadow-primary/25">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-on-surface">
                إدارة وإضافة المخزون العقاري
              </h3>
              <p className="text-xs text-on-surface-variant">
                أضف عمارة جديدة مع وحداتها، أو أضف وحدة جديدة لعمارة مسجلة مسبقاً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition cursor-pointer"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="p-3 bg-surface-container-low/20 border-b border-surface-container-high shrink-0">
          <div className="grid grid-cols-2 gap-2 bg-surface-container p-1 rounded-xl max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => setMode('new_building')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'new_building'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>إضافة عمارة جديدة (+ وحداتها)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('existing_building')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'existing_building'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>إضافة وحدة لعمارة قائمة</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* الوضع 1: عمارة جديدة + وحدات تابعة لها                     */}
          {/* ======================================================== */}
          {mode === 'new_building' && (
            <div className="space-y-6">
              {/* قسم بيانات العمارة */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low/50 border border-surface-container-high/60 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-surface-container-high/60 font-bold text-on-surface text-sm">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>1. بيانات العمارة والقطعة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface mb-1">
                      المنطقة (من 1 إلى 16) *
                    </label>
                    <select
                      value={zoneId}
                      onChange={(e) => setZoneId(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} - {z.direction}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">
                      رقم القطعة *
                    </label>
                    <input
                      type="number"
                      placeholder="مثال: 204"
                      required
                      value={plotNo}
                      onChange={(e) => setPlotNo(e.target.value ? Number(e.target.value) : '')}
                      className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">
                      مساحة الأرض (م²)
                    </label>
                    <input
                      type="number"
                      placeholder="مثال: 550"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value ? Number(e.target.value) : '')}
                      className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* مزايا العمارة */}
                <div>
                  <label className="block font-bold text-on-surface mb-1.5">
                    مزايا ومواصفات العمارة
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {buildingFeatures.map((feat) => (
                      <span
                        key={feat}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold text-xs"
                      >
                        <span>{feat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBuildingFeature(feat)}
                          className="hover:text-error cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="أضف ميزة (مثال: أسانسير إيطالي، جراج خاص...)"
                      value={customFeature}
                      onChange={(e) => setCustomFeature(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBuildingFeature();
                        }
                      }}
                      className="flex-1 p-2 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      onClick={handleAddBuildingFeature}
                      className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high font-bold text-xs cursor-pointer"
                    >
                      + إضافة
                    </button>
                  </div>
                </div>

                {/* ملاحظات الموقع */}
                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    ملاحظات الموقع ومميزات القطعة
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: قريبة من هايبر وان وطريق السويس، ناصية بحري مباشر على الجاردن"
                    value={buildingNotes}
                    onChange={(e) => setBuildingNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* قسم الوحدات التابعة (Multi-Unit Repeater) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-on-surface text-sm">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>2. الوحدات التابعة للعمارة ({draftUnits.length})</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddDraftUnit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-bold text-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ إضافة وحدة أخرى لنفس العمارة</span>
                  </button>
                </div>

                {/* قائمة الوحدات المكررة */}
                <div className="space-y-3">
                  {draftUnits.map((unit, index) => (
                    <div
                      key={unit.id}
                      className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between border-b border-surface-container-high/40 pb-2">
                        <span className="font-bold text-primary text-xs">
                          الوحدة رقم {index + 1}
                        </span>

                        {draftUnits.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftUnit(unit.id)}
                            className="p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition cursor-pointer"
                            title="حذف هذه الوحدة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                            نوع الوحدة
                          </label>
                          <select
                            value={unit.unitKind}
                            onChange={(e) =>
                              handleUpdateDraftUnit(unit.id, {
                                unitKind: e.target.value as UnitKind,
                              })
                            }
                            className="w-full p-2 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface font-semibold text-xs"
                          >
                            {Object.entries(UNIT_KIND_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                            الدور
                          </label>
                          <select
                            value={unit.floor}
                            onChange={(e) =>
                              handleUpdateDraftUnit(unit.id, { floor: Number(e.target.value) })
                            }
                            className="w-full p-2 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs"
                          >
                            <option value={0}>أرضي (0)</option>
                            <option value={1}>أول (1)</option>
                            <option value={2}>ثاني (2)</option>
                            <option value={3}>ثالث (3)</option>
                            <option value={4}>روف (4)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                            الاتجاه / الجانب
                          </label>
                          <input
                            type="text"
                            placeholder="مثال: شمال، يمين، واجهة"
                            value={unit.side}
                            onChange={(e) =>
                              handleUpdateDraftUnit(unit.id, { side: e.target.value })
                            }
                            className="w-full p-2 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                            الحالة
                          </label>
                          <select
                            value={unit.status}
                            onChange={(e) =>
                              handleUpdateDraftUnit(unit.id, {
                                status: e.target.value as UnitStatus,
                              })
                            }
                            className="w-full p-2 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs font-bold"
                          >
                            <option value="available">متاحة</option>
                            <option value="reserved">محجوزة</option>
                            <option value="sold">تم البيع</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                            المساحة (م²) *
                          </label>
                          <input
                            type="number"
                            required
                            value={unit.area}
                            onChange={(e) =>
                              handleUpdateDraftUnit(unit.id, { area: Number(e.target.value) })
                            }
                            className="w-full p-2 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                            مساحة الحديقة (إن وجد)
                          </label>
                          <input
                            type="number"
                            value={unit.gardenArea || ''}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateDraftUnit(unit.id, {
                                gardenArea: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full p-2 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                            السعر الإجمالي (ج.م) *
                          </label>
                          <input
                            type="number"
                            required
                            value={unit.price}
                            onChange={(e) =>
                              handleUpdateDraftUnit(unit.id, { price: Number(e.target.value) })
                            }
                            className="w-full p-2 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface font-extrabold text-xs text-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                            نظام السداد
                          </label>
                          <input
                            type="text"
                            placeholder="كاش، تسهيلات، مقدم 50%"
                            value={unit.paymentTerms}
                            onChange={(e) =>
                              handleUpdateDraftUnit(unit.id, { paymentTerms: e.target.value })
                            }
                            className="w-full p-2 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                          وصف مختصر للوحدة
                        </label>
                        <input
                          type="text"
                          placeholder="مثال: دور أول شمال مباشر على الجاردن غير مجروحة"
                          value={unit.description}
                          onChange={(e) =>
                            handleUpdateDraftUnit(unit.id, { description: e.target.value })
                          }
                          className="w-full p-2 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* الوضع 2: إضافة وحدة لعمارة قائمة مسجلة مسبقاً              */}
          {/* ======================================================== */}
          {mode === 'existing_building' && (
            <div className="space-y-5">
              <div>
                <label className="block font-bold text-on-surface mb-1.5 text-sm">
                  اختر العمارة / القطعة المراد إضافة الوحدة إليها *
                </label>
                {buildings.length === 0 ? (
                  <div className="p-4 rounded-xl bg-warning-container text-warning border border-warning text-xs">
                    لا توجد عمارات مسجلة حالياً لشركتك. يرجى التبديل لتبويب &quot;إضافة عمارة جديدة&quot;.
                  </div>
                ) : (
                  <select
                    value={selectedBuildingId}
                    onChange={(e) => setSelectedBuildingId(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        المنطقة {b.zoneId} — القطعة {b.plotNo}{' '}
                        {b.landArea ? `(أرض: ${b.landArea}م²)` : ''}{' '}
                        {b.companyName ? `• ${b.companyName}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedBuildingObj && (
                <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-surface-container-high flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold">
                      منطقة {selectedBuildingObj.zoneId} - قطعة {selectedBuildingObj.plotNo}
                    </span>
                    {selectedBuildingObj.landArea && (
                      <span className="text-on-surface-variant font-medium">
                        مساحة الأرض: {selectedBuildingObj.landArea} م²
                      </span>
                    )}
                  </div>
                  {selectedBuildingObj.features && selectedBuildingObj.features.length > 0 && (
                    <span className="text-on-surface-variant text-[11px]">
                      {selectedBuildingObj.features.join(' • ')}
                    </span>
                  )}
                </div>
              )}

              {/* مواصفات الوحدة */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high space-y-4">
                <span className="font-bold text-on-surface text-sm block border-b border-surface-container-high/40 pb-2">
                  مواصفات وتفاصيل الوحدة الجديدة
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface-variant mb-1">
                      نوع الوحدة *
                    </label>
                    <select
                      value={existingUnitData.unitKind}
                      onChange={(e) =>
                        setExistingUnitData({
                          ...existingUnitData,
                          unitKind: e.target.value as UnitKind,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface font-semibold text-xs"
                    >
                      {Object.entries(UNIT_KIND_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant mb-1">
                      الدور
                    </label>
                    <select
                      value={existingUnitData.floor}
                      onChange={(e) =>
                        setExistingUnitData({
                          ...existingUnitData,
                          floor: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs"
                    >
                      <option value={0}>أرضي (0)</option>
                      <option value={1}>أول (1)</option>
                      <option value={2}>ثاني (2)</option>
                      <option value={3}>ثالث (3)</option>
                      <option value={4}>روف (4)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant mb-1">
                      الاتجاه / الجانب
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: شمال، يمين، واجهة"
                      value={existingUnitData.side}
                      onChange={(e) =>
                        setExistingUnitData({ ...existingUnitData, side: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface-variant mb-1">
                      المساحة (م²) *
                    </label>
                    <input
                      type="number"
                      required
                      value={existingUnitData.area}
                      onChange={(e) =>
                        setExistingUnitData({
                          ...existingUnitData,
                          area: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant mb-1">
                      مساحة الحديقة (م²)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={existingUnitData.gardenArea || ''}
                      onChange={(e) =>
                        setExistingUnitData({
                          ...existingUnitData,
                          gardenArea: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant mb-1">
                      السعر الإجمالي (ج.م) *
                    </label>
                    <input
                      type="number"
                      required
                      value={existingUnitData.price}
                      onChange={(e) =>
                        setExistingUnitData({
                          ...existingUnitData,
                          price: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface font-extrabold text-xs text-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-on-surface-variant mb-1">
                      موعد الاستلام
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: استلام فوري، خلال 6 شهور"
                      value={existingUnitData.deliveryNote}
                      onChange={(e) =>
                        setExistingUnitData({
                          ...existingUnitData,
                          deliveryNote: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface-variant mb-1">
                      نظام وطريقة الدفع
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: كاش أو مقدم 50% وتسهيلات سنة"
                      value={existingUnitData.paymentTerms}
                      onChange={(e) =>
                        setExistingUnitData({
                          ...existingUnitData,
                          paymentTerms: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-on-surface-variant mb-1">
                    الوصف التفصيلي للوحدة
                  </label>
                  <textarea
                    rows={2}
                    placeholder="وصف إضافي للموقع والإطلالة ومستوى التشطيب..."
                    value={existingUnitData.description}
                    onChange={(e) =>
                      setExistingUnitData({
                        ...existingUnitData,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-surface-container-high bg-surface-container-lowest text-on-surface text-xs resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Submit Bar */}
          <div className="pt-4 border-t border-surface-container-high flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-surface-container-high hover:bg-surface-container text-on-surface font-semibold text-xs cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={loading || (mode === 'existing_building' && !selectedBuildingId)}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-strong text-on-primary font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>جاري الحفظ...</span>
              ) : mode === 'new_building' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ العمارة مع ({draftUnits.length}) وحدة</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>إضافة الوحدة للعمارة المحددة</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
