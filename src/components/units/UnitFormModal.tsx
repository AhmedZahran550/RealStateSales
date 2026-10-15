'use client';

import React, { useState, useEffect } from 'react';
import { Unit, UnitKind, UnitStatus, Zone, Building, UNIT_KIND_LABELS, UnitMedia } from '@/lib/types';
import { X, Building2, Plus, Check, Sparkles, Tag, Info } from 'lucide-react';
import LiveMapPicker from '@/components/LiveMapPicker';
import MediaUploader from '@/components/MediaUploader';
import { useApp } from '@/context/AppContext';

export interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (unitData: any) => void;
  initialUnit?: Unit | null;
  defaultZoneId?: number;
  defaultPlotNo?: number;
  zones?: Zone[];
  buildings?: Building[];
  services?: any;
  onAddBuilding?: (b: Omit<Building, 'id'>) => Building;
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

export default function UnitFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialUnit,
  defaultZoneId,
  defaultPlotNo,
  zones: propsZones,
  buildings: propsBuildings,
  onAddBuilding: propsOnAddBuilding,
}: UnitFormModalProps) {
  const contextApp = useApp();

  const zones = (propsZones && propsZones.length > 0)
    ? propsZones
    : (contextApp?.zones || []);

  const buildings = (propsBuildings && propsBuildings.length > 0)
    ? propsBuildings
    : (contextApp?.buildings || []);

  const onAddBuilding = propsOnAddBuilding || contextApp?.addBuilding || ((b: any) => ({ ...b, id: Date.now() }));
  const [zoneId, setZoneId] = useState<number>(defaultZoneId || initialUnit?.zoneId || 1);
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

  const [unitMedia, setUnitMedia] = useState<UnitMedia[]>(
    initialUnit?.media || []
  );
  const [unitFeatures, setUnitFeatures] = useState<string[]>(
    initialUnit?.features || []
  );
  const [newFeatureText, setNewFeatureText] = useState('');

  useEffect(() => {
    if (initialUnit) {
      setZoneId(initialUnit.zoneId);
      setPlotNo(initialUnit.plotNo);
      setUnitKind(initialUnit.unitKind);
      setFloor(initialUnit.floor ?? 1);
      setSide(initialUnit.side || '');
      setArea(initialUnit.area);
      setGardenArea(initialUnit.gardenArea || 0);
      setPrice(initialUnit.price);
      setNegotiable(initialUnit.negotiable);
      setDeliveryNote(initialUnit.deliveryNote);
      setPaymentTerms(initialUnit.paymentTerms);
      setDescription(initialUnit.description || '');
      setStatus(initialUnit.status);
      setLat(initialUnit.lat || 30.1382);
      setLng(initialUnit.lng || 31.7415);
      setUnitMedia(initialUnit.media || []);
      setUnitFeatures(initialUnit.features || []);
    } else {
      setZoneId(defaultZoneId || 1);
      setPlotNo(defaultPlotNo || 1);
      setUnitKind('floor_1');
      setFloor(1);
      setSide('');
      setArea(140);
      setGardenArea(0);
      setPrice(1500000);
      setNegotiable(false);
      setDeliveryNote('');
      setPaymentTerms('');
      setDescription('');
      setStatus('available');
      setLat(30.1382);
      setLng(31.7415);
      setUnitMedia([]);
      setUnitFeatures([]);
    }
  }, [initialUnit, defaultZoneId, defaultPlotNo]);

  if (!isOpen) return null;

  // المبنى والقطعة الحالية
  const currentBuilding = (buildings || []).find((b) => b.zoneId === zoneId && b.plotNo === Number(plotNo));

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // التأكد من وجود المبنى أو إنشاؤه عند الحاجة
    let building = currentBuilding;
    if (!building) {
      building = onAddBuilding({
        zoneId,
        plotNo: Number(plotNo),
        landArea: 600,
        features: [],
      });
    }

    const payload = {
      buildingId: building.id,
      zoneId,
      plotNo: Number(plotNo),
      unitKind,
      floor: Number(floor),
      side,
      area: Number(area),
      gardenArea: Number(gardenArea),
      price: Number(price),
      negotiable,
      deliveryNote,
      paymentTerms,
      description,
      status,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      features: unitFeatures,
      media: unitMedia,
    };

    onSubmit(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#131a26] rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-auto sm:my-8 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-[#fbf9f6] dark:bg-[#18202e] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30 font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                {initialUnit ? 'تعديل بيانات الوحدة العقارية' : 'إضافة وحدة عقارية جديدة لمخزون الشركة'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                الوحدة تتبع الشركة وتظهر لجميع وسطاء الشركة مباشرة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Location & Plot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                المنطقة (من 1 إلى 16)
              </label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} - {z.direction}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                رقم القطعة
              </label>
              <input
                type="number"
                min="1"
                required
                value={plotNo}
                onChange={(e) => setPlotNo(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Unit Kind & Floor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                نوع الوحدة
              </label>
              <select
                value={unitKind}
                onChange={(e) => setUnitKind(e.target.value as UnitKind)}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
              >
                {Object.entries(UNIT_KIND_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                رقم الدور
              </label>
              <input
                type="number"
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                الواجهة / الاتجاه
              </label>
              <input
                type="text"
                value={side}
                onChange={(e) => setSide(e.target.value)}
                placeholder="شمال، يمين، واجهة بحري..."
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Areas & Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                المساحة المبنية (م²)
              </label>
              <input
                type="number"
                min="30"
                required
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                مساحة الحديقة (م² إن وجدت)
              </label>
              <input
                type="number"
                min="0"
                value={gardenArea}
                onChange={(e) => setGardenArea(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                السعر الإجمالي (ج.م)
              </label>
              <input
                type="number"
                min="100000"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Negotiable & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                حالة الوحدة
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UnitStatus)}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
              >
                <option value="available">متاح للبيع</option>
                <option value="reserved">حجز مؤقت</option>
                <option value="sold">تم البيع</option>
              </select>
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                />
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  السعر قابل للتفاوض
                </span>
              </label>
            </div>
          </div>

          {/* Live Map Picker */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-2xl p-4 bg-stone-50/50 dark:bg-stone-900/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  تحديد الموقع الحقيقي على الخريطة (GPS)
                </span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  OpenStreetMap
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLiveMap(!showLiveMap)}
                className="text-amber-600 text-xs font-bold hover:underline"
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

          {/* Terms & Delivery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                شروط وموعد الاستلام
              </label>
              <input
                type="text"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="استلام فوري، خلال 6 شهور..."
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                طريقة وتسهيلات الدفع
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="كاش، مقدم 50% وتسهيلات..."
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Cloudinary Media Uploader */}
          <MediaUploader
            media={unitMedia}
            onChange={setUnitMedia}
            unitId={initialUnit?.id}
          />

          {/* Description */}
          <div>
            <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
              الوصف التفصيلي والمزايا
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="تقسيم الغرف، نوع التشطيب، فيو الشارع، المصعد، العدادات..."
              className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs leading-relaxed"
            />
          </div>

          {/* مميزات الوحدة والتوريث من المبنى */}
          <div className="space-y-3 p-4 rounded-2xl bg-amber-50/40 dark:bg-stone-900/60 border border-amber-200/80 dark:border-amber-900/40">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-amber-500" />
                مميزات الوحدة الخاصة:
              </label>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold">
                {unitFeatures.length} مميزات محددة
              </span>
            </div>

            {/* Input to add custom feature */}
            <div className="flex gap-2">
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
                placeholder="أضف ميزة جديدة (مثال: تشطيب الترا سوبر لوكس)..."
                className="flex-1 p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-100 text-xs font-medium focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة
              </button>
            </div>

            {/* Current Unit Features Chips */}
            {unitFeatures.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {unitFeatures.map((f, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-600 text-white font-bold text-[11px] shadow-xs"
                  >
                    <span>{f}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(f)}
                      className="hover:bg-amber-700 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggestions Chips */}
            <div className="pt-1">
              <span className="text-[11px] font-bold text-stone-500 mb-1.5 block">
                اقتراحات سريعة للمميزات:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_FEATURE_SUGGESTIONS.map((suggestion) => {
                  const isSelected = unitFeatures.includes(suggestion);
                  return (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() => handleToggleSuggestion(suggestion)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                          : 'bg-white dark:bg-[#151d2a] border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-amber-600" />}
                      {suggestion}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Building Inheritance Info Card */}
            {currentBuilding && (
              <div className="p-3 rounded-xl bg-white dark:bg-[#151d2a] border border-stone-200 dark:border-stone-700/80 space-y-1.5 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    مميزات المبنى والقطعة #{plotNo}:
                  </span>
                  {currentBuilding.features && currentBuilding.features.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const merged = Array.from(new Set([...unitFeatures, ...currentBuilding.features!]));
                        setUnitFeatures(merged);
                      }}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                    >
                      نسخ مميزات المبنى للوحدة
                    </button>
                  )}
                </div>

                {currentBuilding.features && currentBuilding.features.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {currentBuilding.features.map((bf, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                      >
                        {bf}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-400">
                    لا توجد مميزات مسجلة للمبنى حالياً.
                  </p>
                )}

                <p className="text-[10px] text-stone-400 flex items-center gap-1 pt-1">
                  <Info className="w-3 h-3 text-sky-500" />
                  إذا تُركت مميزات الوحدة فارغة، ستَرث الوحدة تلقائياً مميزات المبنى في جميع شاشات العرض.
                </p>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold cursor-pointer transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-md shadow-amber-600/20 transition"
            >
              {initialUnit ? 'حفظ التعديلات' : 'إضافة الوحدة للمخزون'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
