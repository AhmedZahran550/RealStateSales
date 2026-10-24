'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building, Zone, UnitKind, UnitStatus, UnitMedia } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import {
  Building2,
  Trash2,
  Check,
  Save,
  Loader2,
  AlertCircle,
  ArrowRight,
  Layers,
  Sparkles,
  MapPin,
  X,
  Compass,
  Info,
} from 'lucide-react';

export interface BuildingFormProps {
  initialBuilding?: Building | null;
  isEdit?: boolean;
}

const COMMON_BUILDING_FEATURES = [
  'أسانسير إيطالي',
  'مدخل رخام فاخر',
  'واجهة مودرن حديثة',
  'جراج خاص تحت الأرض',
  'كاميرات مراقبة وأمن',
  'دش مركزي وإنتركم مرئي',
  'خزان مياه وموتور إيطالي',
  'عدادات كهرباء ومياه راكبة',
];

interface DraftUnitItem {
  id: string;
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
  media: UnitMedia[];
}

export default function BuildingForm({ initialBuilding, isEdit = false }: BuildingFormProps) {
  const router = useRouter();
  const {
    zones,
    units,
    currentUser,
    isSuperAdmin,
    isCompanyAdmin,
    companies,
    addBuildingAsync,
    addBuildingWithUnits,
    updateBuilding,
  } = useApp();

  const companyId = currentUser?.companyId || '';
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    initialBuilding?.companyId || (isSuperAdmin ? companies[0]?.id || '' : companyId)
  );
  const activeCompanyId = isSuperAdmin ? selectedCompanyId : companyId;

  // Filter zones for this company (include zones that are global or match companyId)
  const companyZones = useMemo(
    () => zones.filter((z) => !activeCompanyId || !z.companyId || z.companyId === activeCompanyId),
    [zones, activeCompanyId]
  );
  const mainZones = companyZones.filter((z) => z.parentId == null);
  const subZonesOf = (mainId: number): Zone[] => companyZones.filter((z) => z.parentId === mainId);

  // Form State
  const [zoneId, setZoneId] = useState<number | ''>('');
  const [plotNo, setPlotNo] = useState<number | ''>('');
  const [landArea, setLandArea] = useState<number | ''>(500);
  const [features, setFeatures] = useState<string[]>(['أسانسير إيطالي', 'مدخل رخام فاخر', 'واجهة مودرن حديثة']);
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [notes, setNotes] = useState('');

  // Map Coordinates (0-100% on interactive map)
  const [mapX, setMapX] = useState<number | ''>('');
  const [mapY, setMapY] = useState<number | ''>('');
  const [showMapCoords, setShowMapCoords] = useState(false);

  // Unit generation for new building
  const [withUnits, setWithUnits] = useState(false);
  const [floorsCount, setFloorsCount] = useState(4);
  const [unitsPerFloor, setUnitsPerFloor] = useState(2);
  const [defaultArea, setDefaultArea] = useState(150);
  const [defaultPrice, setDefaultPrice] = useState(1800000);
  const [draftUnits, setDraftUnits] = useState<DraftUnitItem[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stable initialization to avoid overwriting user edits on re-renders
  const initializedBuildingId = useRef<number | null>(null);

  useEffect(() => {
    if (initialBuilding && initializedBuildingId.current !== initialBuilding.id) {
      initializedBuildingId.current = initialBuilding.id;
      setZoneId(initialBuilding.zoneId);
      setPlotNo(initialBuilding.plotNo);
      setLandArea(initialBuilding.landArea || '');
      setFeatures(initialBuilding.features || []);
      setNotes(initialBuilding.notes || '');
      setMapX(initialBuilding.mapX !== undefined && initialBuilding.mapX !== null ? initialBuilding.mapX : '');
      setMapY(initialBuilding.mapY !== undefined && initialBuilding.mapY !== null ? initialBuilding.mapY : '');
      if (initialBuilding.mapX !== undefined || initialBuilding.mapY !== undefined) {
        setShowMapCoords(true);
      }
    } else if (!initialBuilding && companyZones.length > 0 && !zoneId) {
      setZoneId(companyZones[0].id);
    }
  }, [initialBuilding, companyZones, zoneId]);

  // Count units linked to this building
  const linkedUnitsCount = useMemo(
    () => (isEdit && initialBuilding ? units.filter((u) => u.buildingId === initialBuilding.id).length : 0),
    [isEdit, initialBuilding, units]
  );

  // Generate Units Handler
  const handleGenerateUnits = () => {
    const list: DraftUnitItem[] = [];
    let counter = 1;

    for (let f = 0; f <= floorsCount; f++) {
      for (let u = 1; u <= unitsPerFloor; u++) {
        const sideName = u === 1 ? 'واجهة أمامية بحري' : u === 2 ? 'واجهة قبلية' : `شقة ${u}`;
        const kind: UnitKind = f === 0 ? 'ground_garden' : f === floorsCount ? 'roof' : (f === 1 ? 'floor_1' : f === 2 ? 'floor_2' : 'floor_3');
        list.push({
          id: `draft-${counter++}`,
          unitKind: kind,
          floor: f,
          side: sideName,
          area: defaultArea,
          gardenArea: f === 0 ? 80 : 0,
          price: defaultPrice,
          negotiable: true,
          deliveryNote: 'استلام فوري',
          paymentTerms: 'كاش أو تقسيط بتسهيلات',
          description: `شقة دور ${f === 0 ? 'أرضي' : f} بموقع متميز بالعمارة`,
          status: 'available',
          features: [],
          media: [],
        });
      }
    }
    setDraftUnits(list);
  };

  const addCustomFeature = () => {
    const trimmed = customFeatureInput.trim();
    if (!trimmed || features.includes(trimmed)) return;
    setFeatures([...features, trimmed]);
    setCustomFeatureInput('');
  };

  const removeFeature = (f: string) => {
    setFeatures(features.filter((item) => item !== f));
  };

  const toggleSuggestedFeature = (feat: string) => {
    if (features.includes(feat)) {
      removeFeature(feat);
    } else {
      setFeatures([...features, feat]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!plotNo || Number(plotNo) <= 0) {
      setErrorMsg('يرجى إدخال رقم قطعة صالح');
      return;
    }
    if (!zoneId) {
      setErrorMsg('يرجى اختيار المنطقة التابع لها المبنى');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (isEdit && initialBuilding) {
        const res = await updateBuilding(initialBuilding.id, {
          zoneId: Number(zoneId),
          plotNo: Number(plotNo),
          landArea: landArea ? Number(landArea) : undefined,
          features,
          notes: notes.trim() || undefined,
          mapX: mapX !== '' ? Number(mapX) : undefined,
          mapY: mapY !== '' ? Number(mapY) : undefined,
        });

        if (res.success) {
          router.push(`/admin/buildings/${initialBuilding.id}`);
        } else {
          setErrorMsg(res.message || 'فشل تحديث بيانات المبنى');
          setSubmitting(false);
        }
      } else {
        // Create new building
        const buildingData = {
          zoneId: Number(zoneId),
          plotNo: Number(plotNo),
          landArea: landArea ? Number(landArea) : undefined,
          features,
          notes: notes.trim() || undefined,
          mapX: mapX !== '' ? Number(mapX) : undefined,
          mapY: mapY !== '' ? Number(mapY) : undefined,
          companyId: isSuperAdmin ? selectedCompanyId : undefined,
        };

        if (withUnits && draftUnits.length > 0) {
          const res = await addBuildingWithUnits(buildingData, draftUnits);
          if (res.success) {
            router.push('/admin/buildings');
          } else {
            setErrorMsg(res.message || 'فشل إضافة المبنى مع الوحدات');
            setSubmitting(false);
          }
        } else {
          await addBuildingAsync(buildingData);
          router.push('/admin/buildings');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ المبنى');
      setSubmitting(false);
    }
  };

  // Role Guard: Only Company Admin or Super Admin can create/edit buildings
  if (currentUser && !isCompanyAdmin && !isSuperAdmin) {
    return (
      <div className="mx-auto max-w-xl text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-error-container text-error flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">غير مصرح لك بتعديل بيانات المبنى</h2>
        <p className="text-sm text-on-surface-variant">هذه الميزة مخصصة لمدير الشركة ومسؤولي النظام فقط.</p>
        <Link href="/units" className="btn-primary inline-flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة للوحدات
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={isEdit && initialBuilding ? `/admin/buildings/${initialBuilding.id}` : '/admin/buildings'}
            className="p-2.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container text-on-surface-variant transition"
            title="رجوع"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-on-surface flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              {isEdit ? `تعديل بيانات المبنى قطعة ${initialBuilding?.plotNo}` : 'إضافة عمارة وقطع جديدة'}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {isEdit
                ? 'تحديث موقع ومواصفات ومميزات العمارة وإحداثياتها'
                : 'تسجيل عمارة جديدة ضمن محفظة الشركة مع إمكانية التوليد التلقائي للوحدات'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 shadow-md text-xs sm:text-sm font-bold"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isEdit ? 'حفظ التعديلات' : 'تسجيل المبنى'}</span>
        </button>
      </div>

      {/* Sync Warning for linked units */}
      {isEdit && linkedUnitsCount > 0 && (
        <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-on-surface space-y-1">
            <p className="font-bold">
              تنبيه مزامنة الوحدات: هذا المبنى مرتبط به حالياً ({linkedUnitsCount}) وحدة سكنية.
            </p>
            <p className="text-on-surface-variant">
              أي تعديل في رقم القطعة أو المنطقة أو المميزات سيتم تحديثه وتوريثه فورياً لكافة الوحدات التابعة لهذا المبنى.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-error-container text-error flex items-center gap-3 border border-error/20 text-xs sm:text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Selector for Super Admin */}
        {isSuperAdmin && !isEdit && (
          <div className="card p-5 space-y-2">
            <label className="block text-xs font-bold text-on-surface">
              الشركة التابع لها المبنى <span className="text-error">*</span>
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="input-base w-full"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Location & Plot Card */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-2">
            <MapPin className="w-4 h-4 text-primary" />
            الموقع وبيانات القطعة
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                المنطقة والحي <span className="text-error">*</span>
              </label>
              <select
                required
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : '')}
                className="input-base w-full"
              >
                <option value="">اختر المنطقة</option>
                {mainZones.map((mz) => (
                  <React.Fragment key={mz.id}>
                    <option value={mz.id}>{mz.name}</option>
                    {subZonesOf(mz.id).map((sz) => (
                      <option key={sz.id} value={sz.id}>
                        — {sz.name}
                      </option>
                    ))}
                  </React.Fragment>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                رقم القطعة <span className="text-error">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={plotNo}
                onChange={(e) => setPlotNo(e.target.value ? Number(e.target.value) : '')}
                placeholder="مثال: 45"
                className="input-base w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                مساحة الأرض الإجمالية (م²)
              </label>
              <input
                type="number"
                min={0}
                value={landArea}
                onChange={(e) => setLandArea(e.target.value ? Number(e.target.value) : '')}
                placeholder="مثال: 550"
                className="input-base w-full"
              />
            </div>
          </div>
        </div>

        {/* Interactive Map Coordinates (Optional) */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-on-surface">إحداثيات المبنى على الخريطة التفاعلية</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowMapCoords(!showMapCoords)}
              className="text-xs font-bold text-primary hover:underline"
            >
              {showMapCoords ? 'إخفاء الإحداثيات' : 'تحديد / تعديل الإحداثيات (X/Y)'}
            </button>
          </div>

          {showMapCoords && (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-on-surface-variant">
                الإحداثيات تعبر عن نسبة مئوية (من 0% إلى 100%) لموضع القطعة على الخريطة الكبرى للمدينة.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    محور X (نسبة مئوية 0 - 100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={mapX}
                    onChange={(e) => setMapX(e.target.value ? Number(e.target.value) : '')}
                    placeholder="مثال: 48.5"
                    className="input-base w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    محور Y (نسبة مئوية 0 - 100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={mapY}
                    onChange={(e) => setMapY(e.target.value ? Number(e.target.value) : '')}
                    placeholder="مثال: 62.3"
                    className="input-base w-full text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features & Amenities Card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              مواصفات ومميزات العمارة (تورث تلقائياً لجميع وحدات المبنى)
            </h2>
            <span className="text-xs text-primary font-bold">({features.length}) مميزة</span>
          </div>

          {/* Quick suggestions */}
          <div>
            <span className="text-xs font-bold text-on-surface-variant block mb-2">مميزات شائعة مقترحة:</span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_BUILDING_FEATURES.map((feat) => {
                const selected = features.includes(feat);
                return (
                  <button
                    key={feat}
                    type="button"
                    onClick={() => toggleSuggestedFeature(feat)}
                    className={`chip px-3 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      selected
                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    <span>{feat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add custom feature */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={customFeatureInput}
              onChange={(e) => setCustomFeatureInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomFeature();
                }
              }}
              placeholder="أضف ميزة مخصصة أخرى واضغط إضافة..."
              className="input-base flex-1 text-xs"
            />
            <button
              type="button"
              onClick={addCustomFeature}
              className="btn-tonal px-4 py-2 text-xs font-bold shrink-0"
            >
              + إضافة
            </button>
          </div>

          {/* Current selected features */}
          {features.length > 0 && (
            <div className="p-3 rounded-xl bg-surface-container space-y-2">
              <span className="text-xs font-bold text-on-surface block">المميزات المحددة حالياً:</span>
              <div className="flex flex-wrap gap-2">
                {features.map((f) => (
                  <span
                    key={f}
                    className="chip px-3 py-1 text-xs font-semibold bg-surface border border-outline-variant text-on-surface flex items-center gap-1.5"
                  >
                    <span>{f}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(f)}
                      className="text-on-surface-variant hover:text-error"
                      title="إزالة"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-2">
            ملاحظات وتفاصيل إضافية عن المبنى
          </h2>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب ملاحظات حول رخصة البناء، نسبة الإشغال، المقاول المنفذ، إلخ..."
            className="input-base w-full text-xs sm:text-sm"
          />
        </div>

        {/* Automated Units Generator (Only for new building) */}
        {!isEdit && (
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <div>
                <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  توليد وحدات العمارة تلقائياً
                </h2>
                <p className="text-xs text-on-surface-variant">
                  يمكنك إنشاء شقق العمارة بضغطة زر واحدة وتخصيص أسعارها ومساحاتها
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={withUnits}
                  onChange={(e) => {
                    setWithUnits(e.target.checked);
                    if (e.target.checked && draftUnits.length === 0) {
                      handleGenerateUnits();
                    }
                  }}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-xs font-bold text-on-surface">تفعيل توليد الوحدات</span>
              </label>
            </div>

            {withUnits && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">عدد الأدوار</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={floorsCount}
                      onChange={(e) => setFloorsCount(Number(e.target.value))}
                      className="input-base w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">وحدات بكل دور</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={unitsPerFloor}
                      onChange={(e) => setUnitsPerFloor(Number(e.target.value))}
                      className="input-base w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">متوسط المساحة (م²)</label>
                    <input
                      type="number"
                      value={defaultArea}
                      onChange={(e) => setDefaultArea(Number(e.target.value))}
                      className="input-base w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">السعر التقريبي (ج)</label>
                    <input
                      type="number"
                      value={defaultPrice}
                      onChange={(e) => setDefaultPrice(Number(e.target.value))}
                      className="input-base w-full text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleGenerateUnits}
                    className="btn-tonal text-xs font-bold px-4 py-2"
                  >
                    إعادة توليد قائمة الوحدات
                  </button>
                </div>

                {draftUnits.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                    <span className="text-xs font-bold text-on-surface block">
                      الوحدات الجاري إضافتها ({draftUnits.length} وحدة):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {draftUnits.map((u, idx) => (
                        <div
                          key={u.id}
                          className="p-2.5 rounded-xl bg-surface-container text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-on-surface">
                              الدور {u.floor === 0 ? 'الأرضي' : u.floor} - {u.side}
                            </span>
                            <span className="text-on-surface-variant block text-[11px]">
                              {u.area} م² • {u.price.toLocaleString('ar-EG')} ج
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDraftUnits(draftUnits.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={isEdit && initialBuilding ? `/admin/buildings/${initialBuilding.id}` : '/admin/buildings'}
            className="btn-tonal px-6 py-2.5 text-xs sm:text-sm font-bold"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex items-center gap-2 px-8 py-2.5 shadow-md text-xs sm:text-sm font-bold"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isEdit ? 'حفظ التعديلات' : 'تسجيل المبنى'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
