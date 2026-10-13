'use client';

import React, { useState, useEffect } from 'react';
import { Unit, UnitKind, UnitStatus, Zone, Building, Service, UNIT_KIND_LABELS } from '@/lib/types';
import { X, Building2, Image as ImageIcon, Plus, Check, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import LiveMapPicker from '@/components/LiveMapPicker';
import { useApp } from '@/context/AppContext';

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (unitData: any) => void;
  initialUnit?: Unit | null;
  defaultZoneId?: number;
  defaultPlotNo?: number;
  zones?: Zone[];
  buildings?: Building[];
  services?: Service[];
  onAddBuilding?: (b: Omit<Building, 'id'>) => Building;
}

export default function UnitFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialUnit,
  defaultZoneId,
  defaultPlotNo,
  zones: propsZones,
  buildings: propsBuildings,
  services: propsServices,
  onAddBuilding: propsOnAddBuilding,
}: UnitFormModalProps) {
  const contextApp = useApp();

  const zones = (propsZones && propsZones.length > 0)
    ? propsZones
    : (contextApp?.zones || []);

  const buildings = (propsBuildings && propsBuildings.length > 0)
    ? propsBuildings
    : (contextApp?.buildings || []);

  const services = (propsServices && propsServices.length > 0)
    ? propsServices
    : (contextApp?.services || []);

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

  const [imageUrl, setImageUrl] = useState<string>(
    initialUnit?.media?.[0]?.externalUrl || ''
  );
  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialUnit?.services || []
  );

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
      setImageUrl(initialUnit.media?.[0]?.externalUrl || '');
      setSelectedServices(initialUnit.services || []);
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
      setImageUrl('');
      setSelectedServices([]);
    }
  }, [initialUnit, defaultZoneId, defaultPlotNo]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // التأكد من وجود المبنى أو إنشاؤه عند الحاجة
    let building = (buildings || []).find((b) => b.zoneId === zoneId && b.plotNo === plotNo);
    if (!building) {
      building = onAddBuilding({
        zoneId,
        plotNo,
        landArea: 600,
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
      services: selectedServices,
      media: imageUrl
        ? [
            {
              id: `m-${Date.now()}`,
              unitId: initialUnit?.id || `unit-${Date.now()}`,
              ownerId: 'curr',
              kind: 'image' as const,
              externalUrl: imageUrl,
              caption: 'صورة الواجهة والتصميم',
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
    };

    onSubmit(payload);
    onClose();
  };

  const toggleService = (name: string) => {
    setSelectedServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#131a26] rounded-3xl shadow-2xl border border-amber-200/80 dark:border-amber-900/50 overflow-hidden my-auto sm:my-8 max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-amber-100 dark:border-stone-800 bg-[#fbf9f6] dark:bg-[#18202e] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-600/30 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1c1917] dark:text-[#f5f5f4]">
                {initialUnit ? 'تعديل بيانات الوحدة' : 'إضافة وحدة معروضة جديدة'}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                الحي المتميز – مدينة بدر
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto text-xs flex-1">
          {/* Zone & Plot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                المنطقة (منطقة 1 - 16) *
              </label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs cursor-pointer"
                required
              >
                {(zones || []).map((z) => (
                  <option key={z.id} value={z.id} className="bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50">
                    {z.name} ({z.direction})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                رقم القطعة (المبنى) *
              </label>
              <input
                type="number"
                min="1"
                max="999"
                value={plotNo}
                onChange={(e) => setPlotNo(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
                placeholder="مثال: 42 أو 88 أو 139..."
                required
              />
            </div>
          </div>

          {/* الخريطة الحية وتحديد الموقع الجغرافي الحقيقي (GPS) */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span className="font-extrabold text-stone-900 dark:text-stone-100">
                  تحديد الموقع على الخريطة الحية (Free Live Map / GPS)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLiveMap(!showLiveMap)}
                className="text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>{showLiveMap ? 'إخفاء الخريطة' : 'إظهار الخريطة'}</span>
                {showLiveMap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showLiveMap && (
              <div className="pt-1">
                <LiveMapPicker
                  lat={lat}
                  lng={lng}
                  onChange={(newLat, newLng) => {
                    setLat(newLat);
                    setLng(newLng);
                  }}
                  height="260px"
                />
              </div>
            )}
          </div>

          {/* Unit Kind & Floor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                نوع الوحدة *
              </label>
              <select
                value={unitKind}
                onChange={(e) => setUnitKind(e.target.value as UnitKind)}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs cursor-pointer"
              >
                {Object.entries(UNIT_KIND_LABELS).map(([k, label]) => (
                  <option key={k} value={k} className="bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50">
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                الدور
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs cursor-pointer"
              >
                <option value={0} className="bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50">أرضي</option>
                <option value={1} className="bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50">أول متكرر</option>
                <option value={2} className="bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50">ثاني متكرر</option>
                <option value={3} className="bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50">ثالث</option>
                <option value={4} className="bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50">روف</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                الواجهة / الاتجاه
              </label>
              <input
                type="text"
                value={side}
                onChange={(e) => setSide(e.target.value)}
                placeholder="مثال: بحري، يمين، واجهة..."
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Area & Garden Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                المساحة الإجمالية (م²)*
              </label>
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                مساحة الحديقة إن وجدت (م²)
              </label>
              <input
                type="number"
                value={gardenArea}
                onChange={(e) => setGardenArea(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
                placeholder="0 إذا لم يوجد"
              />
            </div>
          </div>

          {/* Price & Negotiable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                السعر المطلوب (جنيه مصري) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="negotiable"
                checked={negotiable}
                onChange={(e) => setNegotiable(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
              />
              <label htmlFor="negotiable" className="font-bold text-stone-800 dark:text-stone-200 cursor-pointer">
                السعر قابل للتفاوض البسيط
              </label>
            </div>
          </div>

          {/* Delivery & Payment Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                حالة وموعد الاستلام
              </label>
              <input
                type="text"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="استلام فوري، تحت الإنشاء، 6 شهور..."
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

          {/* Image URL */}
          <div>
            <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
              رابط صورة المعاينة أو الواجهة
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-white dark:bg-[#151d2a] text-stone-900 dark:text-stone-50 font-bold placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs text-left font-mono"
            />
          </div>

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

          {/* Surrounding Services Selector */}
          <div>
            <label className="block font-bold text-stone-800 dark:text-stone-200 mb-2">
              الخدمات المجاورة للقطعة:
            </label>
            <div className="flex flex-wrap gap-2">
              {(services || []).map((s) => {
                const isSelected = selectedServices.includes(s.name);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleService(s.name)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                        : 'bg-white dark:bg-[#151d2a] border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {s.name}
                  </button>
                );
              })}
            </div>
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500 hover:from-amber-800 hover:to-amber-600 text-white font-black shadow-md shadow-amber-600/30 transition transform active:scale-95 cursor-pointer"
            >
              {initialUnit ? 'حفظ التعديلات' : 'إضافة الوحدة الآن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
