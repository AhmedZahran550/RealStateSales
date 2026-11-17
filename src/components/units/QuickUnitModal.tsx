'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Unit, UnitKind, UnitStatus, UNIT_KIND_LABELS, UnitMedia, Zone, Building } from '@/lib/types';
import { zoneDisplayName } from '@/lib/zone-utils';
import { useApp } from '@/context/AppContext';
import MediaUploader from '@/components/MediaUploader';
import LiveMapPicker from '@/components/LiveMapPicker';
import {
  X,
  Building2,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Sparkles,
  MapPin,
  Tag,
  DollarSign,
  Maximize2,
  Layers,
} from 'lucide-react';

export interface QuickUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUnit?: Unit | null;
  defaultZoneId?: number;
  defaultPlotNo?: number;
  defaultBuildingId?: number;
  onSaved?: (unit: Unit) => void;
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

export default function QuickUnitModal({
  isOpen,
  onClose,
  initialUnit,
  defaultZoneId,
  defaultPlotNo,
  defaultBuildingId,
  onSaved,
}: QuickUnitModalProps) {
  const {
    zones,
    buildings,
    addBuildingAsync,
    addUnit,
    updateUnit,
    currentUser,
    currentCompany,
    myUnits,
  } = useApp();

  const isEdit = Boolean(initialUnit?.id);
  const defaultCompanyName = currentCompany?.name || currentUser?.companyName || '';

  // حالة النموذج
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // الحقول الأساسية
  const [zoneId, setZoneId] = useState<number>(1);
  const [plotNo, setPlotNo] = useState<number>(1);
  const [unitKind, setUnitKind] = useState<UnitKind>('floor_1');
  const [floor, setFloor] = useState<number>(1);
  const [side, setSide] = useState<string>('واجهة');
  const [area, setArea] = useState<number>(140);
  const [price, setPrice] = useState<number>(1500000);
  const [status, setStatus] = useState<UnitStatus>('available');
  const [unitMedia, setUnitMedia] = useState<UnitMedia[]>([]);

  // الحقول المتقدمة القابلة للطي
  const [gardenArea, setGardenArea] = useState<number>(0);
  const [belongTo, setBelongTo] = useState<string>('');
  const [negotiable, setNegotiable] = useState<boolean>(false);
  const [deliveryNote, setDeliveryNote] = useState<string>('استلام فوري');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [lat, setLat] = useState<number | undefined>(30.1382);
  const [lng, setLng] = useState<number | undefined>(31.7415);
  const [unitFeatures, setUnitFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState<string>('');

  // استخراج المناطق الرئيسية والفرعية
  const mainZones = useMemo(() => zones.filter((z) => z.parentId == null), [zones]);
  const subZonesOf = (parentId: number) => zones.filter((z) => z.parentId === parentId);

  // إعادة ضبط النموذج عند الفتح أو تغيير الوحدة
  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      if (initialUnit) {
        setZoneId(initialUnit.zoneId || 1);
        setPlotNo(initialUnit.plotNo || 1);
        setUnitKind(initialUnit.unitKind || 'floor_1');
        setFloor(initialUnit.floor ?? 1);
        setSide(initialUnit.side || 'واجهة');
        setArea(initialUnit.area || 140);
        setPrice(initialUnit.price || 1500000);
        setStatus(initialUnit.status || 'available');
        setUnitMedia(
          initialUnit.media
            ? [...initialUnit.media].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            : []
        );

        setGardenArea(initialUnit.gardenArea || 0);
        setBelongTo(initialUnit.belongTo || initialUnit.companyName || defaultCompanyName);
        setNegotiable(Boolean(initialUnit.negotiable));
        setDeliveryNote(initialUnit.deliveryNote || 'استلام فوري');
        setPaymentTerms(initialUnit.paymentTerms || '');
        setDescription(initialUnit.description || '');
        setLat(initialUnit.lat || 30.1382);
        setLng(initialUnit.lng || 31.7415);
        setUnitFeatures(initialUnit.features || []);

        // إذا كانت هناك بيانات متقدمة مدخلة، نفتح القسم تلقائياً
        if (
          initialUnit.gardenArea ||
          initialUnit.paymentTerms ||
          initialUnit.description ||
          (initialUnit.features && initialUnit.features.length > 0)
        ) {
          setShowAdvanced(true);
        } else {
          setShowAdvanced(false);
        }
      } else {
        // قيم افتراضية لوحدة جديدة
        setZoneId(defaultZoneId || (zones[0]?.id ?? 1));
        setPlotNo(defaultPlotNo || 1);
        setUnitKind('floor_1');
        setFloor(1);
        setSide('واجهة');
        setArea(140);
        setPrice(1500000);
        setStatus('available');
        setUnitMedia([]);
        setGardenArea(0);
        setBelongTo(defaultCompanyName);
        setNegotiable(false);
        setDeliveryNote('استلام فوري');
        setPaymentTerms('كاش أو تقسيط');
        setDescription('');
        setLat(30.1382);
        setLng(31.7415);
        setUnitFeatures([]);
        setShowAdvanced(false);
      }
    }
  }, [isOpen, initialUnit, defaultZoneId, defaultPlotNo, defaultCompanyName, zones]);

  // إدارة المميزات
  const handleToggleFeature = (feat: string) => {
    if (unitFeatures.includes(feat)) {
      setUnitFeatures((prev) => prev.filter((f) => f !== feat));
    } else {
      setUnitFeatures((prev) => [...prev, feat]);
    }
  };

  const handleAddCustomFeature = () => {
    const trimmed = newFeatureText.trim();
    if (trimmed && !unitFeatures.includes(trimmed)) {
      setUnitFeatures((prev) => [...prev, trimmed]);
      setNewFeatureText('');
    }
  };

  // معالجة الحفظ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!zoneId) {
      setSubmitError('يرجى تحديد المنطقة العقارية');
      return;
    }
    if (!plotNo || Number(plotNo) <= 0) {
      setSubmitError('يرجى إدخال رقم قطعة صالح');
      return;
    }
    if (!area || Number(area) <= 0) {
      setSubmitError('يرجى إدخال مساحة الوحدة بالمتر المربع');
      return;
    }
    if (!price || Number(price) <= 0) {
      setSubmitError('يرجى إدخال سعر الوحدة الإجمالي');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. التأكد من وجود المبنى المرتبط أو إنشاؤه تلقائياً
      let buildingId = defaultBuildingId || initialUnit?.buildingId;
      if (!buildingId) {
        let matchedBuilding = buildings.find(
          (b) => b.zoneId === Number(zoneId) && b.plotNo === Number(plotNo)
        );
        if (!matchedBuilding) {
          matchedBuilding = await addBuildingAsync({
            zoneId: Number(zoneId),
            plotNo: Number(plotNo),
            features: unitFeatures,
            mapX: lat || 30.1382,
            mapY: lng || 31.7415,
          });
        }
        buildingId = matchedBuilding.id;
      }

      const unitPayload: any = {
        buildingId: Number(buildingId),
        zoneId: Number(zoneId),
        plotNo: Number(plotNo),
        unitKind,
        belongTo: belongTo.trim() || defaultCompanyName || undefined,
        floor: Number(floor),
        side: side.trim() || undefined,
        area: Number(area),
        gardenArea: gardenArea ? Number(gardenArea) : 0,
        price: Number(price),
        negotiable,
        deliveryNote: deliveryNote.trim() || 'استلام فوري',
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
          if (onSaved) onSaved({ ...initialUnit, ...unitPayload });
          onClose();
        } else {
          setSubmitError(res.message || 'فشل تحديث بيانات الوحدة');
        }
      } else {
        const res = await addUnit(unitPayload);
        if (res.success) {
          if (onSaved) onSaved(unitPayload);
          onClose();
        } else {
          setSubmitError(res.message || 'فشل إضافة الوحدة العقارية');
        }
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'حدث خطأ أثناء حفظ الوحدة');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl my-6 bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس النافذة */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant bg-surface-container-low shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-on-surface">
                {isEdit ? 'تعديل بيانات الوحدة' : 'إضافة وحدة عقارية سريعة'}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {isEdit
                  ? `تعديل قطعة ${plotNo} - ${zoneDisplayName(zoneId, zones)}`
                  : 'أدخل البيانات الأساسية للوحدة وسيتم نشرها فوراً لمحفظة الشركة'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* جسم النموذج */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-error-container border border-error/30 text-on-error-container flex items-start gap-2 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* 1. الموقع والمنطقة ورقم القطعة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                المنطقة أو الحي العقاري <span className="text-error">*</span>
              </label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(Number(e.target.value))}
                className="input-base w-full text-xs font-semibold py-2.5"
                required
              >
                {mainZones.map((mz) => {
                  const children = subZonesOf(mz.id);
                  if (children.length > 0) {
                    return (
                      <optgroup key={mz.id} label={mz.name}>
                        <option value={mz.id}>{mz.name} (كامل المنطقة)</option>
                        {children.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  }
                  return (
                    <option key={mz.id} value={mz.id}>
                      {mz.name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                رقم القطعة / المبنى <span className="text-error">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={plotNo}
                onChange={(e) => setPlotNo(Number(e.target.value))}
                className="input-base w-full text-xs font-bold py-2.5 font-mono"
                placeholder="مثال: 45"
                required
              />
            </div>
          </div>

          {/* 2. نوع الوحدة والدور والواجهة */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">نوع الوحدة</label>
              <select
                value={unitKind}
                onChange={(e) => setUnitKind(e.target.value as UnitKind)}
                className="input-base w-full text-xs font-bold py-2.5"
              >
                {Object.entries(UNIT_KIND_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">الدور</label>
              <select
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="input-base w-full text-xs font-bold py-2.5"
              >
                <option value={0}>دور أرضي</option>
                <option value={1}>دور أول متكرر</option>
                <option value={2}>دور ثاني متكرر</option>
                <option value={3}>دور ثالث متكرر</option>
                <option value={4}>دور رابع</option>
                <option value={5}>روف / سطح</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">الاتجاه / الواجهة</label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value)}
                className="input-base w-full text-xs font-bold py-2.5"
              >
                <option value="واجهة">واجهة رئيسية</option>
                <option value="بحري">بحري صريح</option>
                <option value="قبلي">قبلي</option>
                <option value="شرقي">شرقي</option>
                <option value="غربي">غربي</option>
                <option value="خلفي">خلفي على حديقة</option>
                <option value="جانبي">جانبي مفتوح</option>
              </select>
            </div>
          </div>

          {/* 3. المساحة والسعر وحالة الوحدة */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                المساحة (م²) <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="20"
                  max="2000"
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  className="input-base w-full text-xs font-black py-2.5 pl-10 font-mono"
                  placeholder="140"
                  required
                />
                <span className="absolute left-3 top-2.5 text-[11px] font-bold text-on-surface-variant">
                  م²
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                السعر الإجمالي (ج.م) <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10000"
                  step="5000"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="input-base w-full text-xs font-black py-2.5 pl-12 text-primary font-mono"
                  placeholder="1500000"
                  required
                />
                <span className="absolute left-3 top-2.5 text-[11px] font-bold text-on-surface-variant">
                  ج.م
                </span>
              </div>
              {area > 0 && price > 0 && (
                <span className="text-[10px] text-on-surface-variant font-medium block mt-1">
                  سعر المتر: {Math.round(price / area).toLocaleString('ar-EG')} ج/م²
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">حالة الوحدة</label>
              <div className="grid grid-cols-3 gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant">
                {(['available', 'reserved', 'sold'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition ${
                      status === st
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
          </div>

          {/* 4. صور وسائط الوحدة */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              صور ومخططات الوحدة
            </label>
            <MediaUploader
              media={unitMedia}
              onChange={setUnitMedia}
              unitId={initialUnit?.id}
            />
          </div>

          {/* 5. قسم قابل للطي: تفاصيل متقدمة */}
          <div className="border border-outline-variant/60 rounded-2xl overflow-hidden bg-surface-container-low/40">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-on-surface hover:bg-surface-container-high/40 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>تفاصيل متقدمة (نظام السداد، الاستلام، المميزات، الخريطة)</span>
              </span>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-on-surface-variant" />
              ) : (
                <ChevronDown className="w-4 h-4 text-on-surface-variant" />
              )}
            </button>

            {showAdvanced && (
              <div className="p-4 border-t border-outline-variant/50 space-y-4 bg-surface-container-lowest">
                {/* المطور والحديقة */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      الجهة التابعة / المطور العقاري
                    </label>
                    <input
                      type="text"
                      value={belongTo}
                      onChange={(e) => setBelongTo(e.target.value)}
                      className="input-base w-full text-xs py-2 font-medium"
                      placeholder="اسم الشركة أو المطور"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      مساحة الحديقة الخاصة (إن وجدت)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={gardenArea}
                        onChange={(e) => setGardenArea(Number(e.target.value))}
                        className="input-base w-full text-xs py-2 pl-10 font-mono"
                        placeholder="0"
                      />
                      <span className="absolute left-3 top-2 text-[11px] font-bold text-on-surface-variant">
                        م²
                      </span>
                    </div>
                  </div>
                </div>

                {/* السداد والاستلام */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      نظام السداد والتقسيط
                    </label>
                    <input
                      type="text"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="input-base w-full text-xs py-2 font-medium"
                      placeholder="مثال: مقدم 15% والباقي على 4 سنوات"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      موعد الاستلام
                    </label>
                    <input
                      type="text"
                      value={deliveryNote}
                      onChange={(e) => setDeliveryNote(e.target.value)}
                      className="input-base w-full text-xs py-2 font-medium"
                      placeholder="استلام فوري / بعد 6 أشهر"
                    />
                  </div>
                </div>

                {/* الوصف */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    الوصف التسويقي للوحدة
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-base w-full text-xs py-2 font-medium"
                    placeholder="تفاصيل إضافية عن الفيو، التشطيب، مميزات الموقع..."
                  />
                </div>

                {/* المميزات السريعة */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    المميزات الملحقة بالوحدة
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {COMMON_FEATURE_SUGGESTIONS.map((f) => {
                      const selected = unitFeatures.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => handleToggleFeature(f)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            selected
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          {selected && <Check className="w-3 h-3" />}
                          <span>{f}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeatureText}
                      onChange={(e) => setNewFeatureText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomFeature();
                        }
                      }}
                      placeholder="إضافة ميزة مخصصة..."
                      className="input-base text-xs py-1.5 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomFeature}
                      className="btn-tonal px-3 py-1.5 text-xs font-bold shrink-0"
                    >
                      إضافة
                    </button>
                  </div>
                </div>

                {/* الخريطة والموقع الجغرافي */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    الموقع الجغرافي على الخريطة (اختياري)
                  </label>
                  <div className="rounded-xl overflow-hidden border border-outline-variant">
                    <LiveMapPicker
                      lat={lat}
                      lng={lng}
                      onChange={(newLat, newLng) => {
                        setLat(newLat);
                        setLng(newLng);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-tonal px-5 py-2.5 text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-2 min-w-[130px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEdit ? 'تحديث الوحدة' : 'حفظ ونشر الوحدة'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
