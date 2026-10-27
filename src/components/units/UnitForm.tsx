'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Unit, UnitKind, UnitStatus, UNIT_KIND_LABELS, UnitMedia } from '@/lib/types';
import { zoneDisplayName } from '@/lib/zone-utils';
import {
  Building2,
  Plus,
  Check,
  Sparkles,
  MapPin,
  ArrowRight,
  Loader2,
  AlertCircle,
  Camera,
  Layers,
  DollarSign,
  FileText,
  Save,
  X,
} from 'lucide-react';
import LiveMapPicker from '@/components/LiveMapPicker';
import MediaUploader from '@/components/MediaUploader';
import { useApp } from '@/context/AppContext';

export interface UnitFormProps {
  initialUnit?: Unit | null;
  defaultZoneId?: number;
  defaultPlotNo?: number;
  defaultBuildingId?: number;
  isEdit?: boolean;
}

const COMMON_FEATURE_SUGGESTIONS = [
  'أسانسير إيطالي',
  'مدخل رخام فاخر',
  'عداد كهرباء ومياه راكب',
  'تشطيب الترا سوبر لوكس',
  'جراج خاص',
  'حديقة خاصة',
  'غاز طبيعي',
  'حصة في الأرض',
  'فيو مباشر على حديقة',
  'استلام فوري',
];

export default function UnitForm({
  initialUnit,
  defaultZoneId,
  defaultPlotNo,
  defaultBuildingId,
  isEdit = false,
}: UnitFormProps) {
  const router = useRouter();
  const {
    zones,
    buildings,
    addBuildingAsync,
    addUnit,
    updateUnit,
    currentUser,
    isSuperAdmin,
    isCompanyAdmin,
  } = useApp();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [zoneId, setZoneId] = useState<number>(defaultZoneId || initialUnit?.zoneId || zones[0]?.id || 1);
  const [plotNo, setPlotNo] = useState<number>(defaultPlotNo || initialUnit?.plotNo || 1);
  const [unitKind, setUnitKind] = useState<UnitKind>(initialUnit?.unitKind || 'floor_1');
  const [floor, setFloor] = useState<number>(initialUnit?.floor ?? 1);
  const [side, setSide] = useState<string>(initialUnit?.side || '');
  const [area, setArea] = useState<number>(initialUnit?.area || 140);
  const [gardenArea, setGardenArea] = useState<number>(initialUnit?.gardenArea || 0);
  const [price, setPrice] = useState<number>(initialUnit?.price || 1500000);
  const [negotiable, setNegotiable] = useState<boolean>(initialUnit?.negotiable ?? false);
  const [deliveryNote, setDeliveryNote] = useState<string>(initialUnit?.deliveryNote || '');
  const [paymentTerms, setPaymentTerms] = useState<string>(initialUnit?.paymentTerms || '');
  const [description, setDescription] = useState<string>(initialUnit?.description || '');
  const [status, setStatus] = useState<UnitStatus>(initialUnit?.status || 'available');
  const [lat, setLat] = useState<number | undefined>(initialUnit?.lat || 30.1382);
  const [lng, setLng] = useState<number | undefined>(initialUnit?.lng || 31.7415);
  const [showLiveMap, setShowLiveMap] = useState<boolean>(true);

  const [unitMedia, setUnitMedia] = useState<UnitMedia[]>(initialUnit?.media || []);
  const [unitFeatures, setUnitFeatures] = useState<string[]>(initialUnit?.features || []);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | ''>(
    defaultBuildingId || initialUnit?.buildingId || ''
  );

  useEffect(() => {
    if (initialUnit) {
      setSelectedBuildingId(initialUnit.buildingId);
      setZoneId(initialUnit.zoneId);
      setPlotNo(initialUnit.plotNo);
      setUnitKind(initialUnit.unitKind);
      setFloor(initialUnit.floor ?? 1);
      setSide(initialUnit.side || '');
      setArea(initialUnit.area);
      setGardenArea(initialUnit.gardenArea || 0);
      setPrice(initialUnit.price);
      setNegotiable(initialUnit.negotiable);
      setDeliveryNote(initialUnit.deliveryNote || '');
      setPaymentTerms(initialUnit.paymentTerms || '');
      setDescription(initialUnit.description || '');
      setStatus(initialUnit.status);
      setLat(initialUnit.lat || 30.1382);
      setLng(initialUnit.lng || 31.7415);
      setUnitMedia(initialUnit.media || []);
      setUnitFeatures(initialUnit.features || []);
    }
  }, [initialUnit]);

  // المبنى المرتبط
  const currentBuilding = buildings.find(
    (b) => b.id === selectedBuildingId || (b.zoneId === zoneId && b.plotNo === Number(plotNo))
  );

  const handleAddFeature = () => {
    const trimmed = newFeatureText.trim();
    if (trimmed && !unitFeatures.includes(trimmed)) {
      setUnitFeatures((prev) => [...prev, trimmed]);
      setNewFeatureText('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setUnitFeatures((prev) => prev.filter((f) => f !== feature));
  };

  const handleToggleSuggestion = (feature: string) => {
    if (unitFeatures.includes(feature)) {
      handleRemoveFeature(feature);
    } else {
      setUnitFeatures((prev) => [...prev, feature]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      let bId = selectedBuildingId;
      if (!bId) {
        let building = buildings.find(
          (b) => b.zoneId === Number(zoneId) && b.plotNo === Number(plotNo)
        );
        if (!building) {
          building = await addBuildingAsync({
            zoneId: Number(zoneId),
            plotNo: Number(plotNo),
            features: unitFeatures,
            mapX: lat || 30.1382,
            mapY: lng || 31.7415,
          });
        }
        bId = building.id;
      }

      const unitPayload = {
        buildingId: Number(bId),
        zoneId: Number(zoneId),
        plotNo: Number(plotNo),
        unitKind,
        floor: Number(floor),
        side: side.trim() || undefined,
        area: Number(area),
        gardenArea: gardenArea ? Number(gardenArea) : 0,
        price: Number(price),
        negotiable,
        deliveryNote: deliveryNote.trim() || '',
        paymentTerms: paymentTerms.trim() || '',
        description: description.trim() || '',
        status,
        lat: lat || 30.1382,
        lng: lng || 31.7415,
        features: unitFeatures,
        media: unitMedia,
      };

      if (isEdit && initialUnit) {
        const res = await updateUnit(initialUnit.id, unitPayload);
        if (res.success) {
          router.push(`/units/${initialUnit.id}`);
        } else {
          setSubmitError(res.message || 'فشل تحديث بيانات الوحدة');
          setSubmitting(false);
        }
      } else {
        const res = await addUnit(unitPayload);
        if (res.success) {
          router.push('/units');
        } else {
          setSubmitError(res.message || 'فشل إضافة الوحدة العقارية');
          setSubmitting(false);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء الحفظ';
      setSubmitError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-container-low border border-surface-container-high/40 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href={isEdit && initialUnit ? `/units/${initialUnit.id}` : '/units'}
            className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface flex items-center justify-center transition"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-on-surface">
              {isEdit ? `تعديل الوحدة: قطعة ${plotNo}` : 'إضافة وحدة عقارية جديدة'}
            </h1>
            <p className="text-xs text-on-surface-variant">
              {isEdit
                ? 'تحديث مواصفات الوحدة والأسعار والميديا'
                : 'تسجيل وحدة سكنية جديدة في الحي المتميز وربطها بالمبنى والمنطقة'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={isEdit && initialUnit ? `/units/${initialUnit.id}` : '/units'}
            className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition"
          >
            إلغاء
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ…</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'حفظ التعديلات' : 'إضافة الوحدة الآن'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-error-container text-on-error-container border border-error flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. الموقع والقطعة والمبنى */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high/40">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-on-surface">الموقع والمبنى والقطعة</h2>
              <p className="text-[11px] text-on-surface-variant">تحديد المنطقة ورقم القطعة والمبنى المنسوب إليه</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">المنطقة *</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(Number(e.target.value))}
                className="input-base w-full text-xs"
                required
              >
                {zones.filter((z) => z.parentId == null).map((mz) => {
                  const subs = zones.filter((z) => z.parentId === mz.id);
                  if (subs.length === 0) {
                    return (
                      <option key={mz.id} value={mz.id}>
                        {mz.name}
                      </option>
                    );
                  }
                  return (
                    <optgroup key={mz.id} label={mz.name}>
                      {subs.map((sz) => (
                        <option key={sz.id} value={sz.id}>
                          {sz.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">رقم القطعة *</label>
              <input
                type="number"
                min={1}
                value={plotNo}
                onChange={(e) => setPlotNo(Number(e.target.value))}
                className="input-base w-full text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">المبنى / العمارة</label>
              <select
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value ? Number(e.target.value) : '')}
                className="input-base w-full text-xs"
              >
                <option value="">عمارة افتراضية حسب القطعة ({plotNo})</option>
                {buildings
                  .filter((b) => b.zoneId === Number(zoneId))
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      عمارة قطعة {b.plotNo} {b.companyName ? `(${b.companyName})` : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. مواصفات ونوع الوحدة */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high/40">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-on-surface">مواصفات وتفاصيل الوحدة</h2>
              <p className="text-[11px] text-on-surface-variant">النوع، الدور، المساحات، والاتجاه</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">نوع الوحدة *</label>
              <select
                value={unitKind}
                onChange={(e) => setUnitKind(e.target.value as UnitKind)}
                className="input-base w-full text-xs"
                required
              >
                {Object.entries(UNIT_KIND_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">رقم الدور *</label>
              <input
                type="number"
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="input-base w-full text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">المساحة (م²) *</label>
              <input
                type="number"
                min={10}
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="input-base w-full text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">مساحة الحديقة (إن وجدت)</label>
              <input
                type="number"
                min={0}
                value={gardenArea}
                onChange={(e) => setGardenArea(Number(e.target.value))}
                placeholder="0"
                className="input-base w-full text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-on-surface block mb-1.5">الاتجاه والواجهة</label>
              <input
                type="text"
                value={side}
                onChange={(e) => setSide(e.target.value)}
                placeholder="مثال: بحري صريح، ناصية مميزة، واجهة أمامية على شارع رئيسي"
                className="input-base w-full text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-on-surface block mb-1.5">حالة توفر الوحدة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UnitStatus)}
                className="input-base w-full text-xs"
              >
                <option value="available">متاح للبيع (Available)</option>
                <option value="reserved">حجز مؤقت (Reserved)</option>
                <option value="sold">تم البيع (Sold)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. الأسعار وشروط السداد والتسليم */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high/40">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-on-surface">السعر ونظام السداد والتسليم</h2>
              <p className="text-[11px] text-on-surface-variant">البيانات المالية ومواعيد الاستلام</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">السعر الإجمالي (ج.م) *</label>
              <input
                type="number"
                min={1000}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="input-base w-full text-xs"
                required
              />
              <div className="flex items-center justify-between mt-1 text-[11px] text-on-surface-variant">
                <span>سعر المتر التقريبي:</span>
                <span className="font-bold text-primary">
                  {area > 0 ? Math.round(price / area).toLocaleString() : 0} ج.م / م²
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">موعد التسليم</label>
              <input
                type="text"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="مثال: فوري، استلام 6 أشهر، نصف تشطيب"
                className="input-base w-full text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-on-surface block mb-1.5">نظام السداد والتقسيط</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="مثال: 50% مقدم والباقي بتسهيلات على سنتين بدون فوائد"
                className="input-base w-full text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="negotiable"
                checked={negotiable}
                onChange={(e) => setNegotiable(e.target.checked)}
                className="w-4 h-4 text-primary rounded cursor-pointer"
              />
              <label htmlFor="negotiable" className="text-xs font-bold text-on-surface cursor-pointer">
                السعر قابل للتفاوض البسيط
              </label>
            </div>
          </div>
        </div>

        {/* 4. المميزات والوصف */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high/40">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-on-surface">المميزات والوصف التسويقي</h2>
              <p className="text-[11px] text-on-surface-variant">تظهر للعملاء في رسائل الواتساب والصفحة العامة</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface block mb-1.5">الوصف التسويقي للوحدة</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب وصفاً تفصيلياً جذاباً للوحدة وموقعها الاستراتيجي في الحي المتميز..."
              className="input-base w-full text-xs resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface block mb-1.5">المميزات والخدمات</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="اكتب ميزة واضغط إضافة (مثل: أسانسير، مدخل فاخر)..."
                className="input-base flex-1 text-xs"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition cursor-pointer"
              >
                + إضافة
              </button>
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className="text-[10px] text-on-surface-variant font-bold">اقتراحات سريعة:</span>
              {COMMON_FEATURE_SUGGESTIONS.map((sug) => {
                const active = unitFeatures.includes(sug);
                return (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleToggleSuggestion(sug)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      active
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {sug}
                  </button>
                );
              })}
            </div>

            {/* Selected features */}
            {unitFeatures.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40">
                {unitFeatures.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-highest text-on-surface text-xs font-bold"
                  >
                    <span>{f}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(f)}
                      className="text-on-surface-variant hover:text-error transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. معرض الصور والفيديو (Media Uploader) */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high/40">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-on-surface">معرض الصور والفيديو (Cloudinary)</h2>
              <p className="text-[11px] text-on-surface-variant">رفع الصور والمخططات وفيديوهات المعاينة</p>
            </div>
          </div>

          <MediaUploader
            media={unitMedia}
            onChange={setUnitMedia}
            unitId={initialUnit?.id}
          />
        </div>

        {/* 6. الموقع الجغرافي على الخريطة */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-on-surface">الموقع الجغرافي على الماستربلان</h2>
                <p className="text-[11px] text-on-surface-variant">تحديد إحداثيات القطعة على خريطة الحي المتميز</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLiveMap(!showLiveMap)}
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              {showLiveMap ? 'إخفاء الخريطة' : 'إظهار الخريطة'}
            </button>
          </div>

          {showLiveMap && (
            <LiveMapPicker
              lat={lat}
              lng={lng}
              onChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
            />
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/40 flex items-center justify-between gap-4 sticky bottom-4 shadow-lg z-10">
          <Link
            href={isEdit && initialUnit ? `/units/${initialUnit.id}` : '/units'}
            className="px-5 py-2.5 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition"
          >
            إلغاء والعودة
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary px-8 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ…</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'حفظ التعديلات' : 'إضافة الوحدة العقارية'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
