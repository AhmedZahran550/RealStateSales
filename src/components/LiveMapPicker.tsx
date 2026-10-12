'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, ExternalLink, RefreshCw, AlertCircle, Check } from 'lucide-react';

interface LiveMapPickerProps {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

// مركز الحي المتميز - مدينة بدر كإحداثيات افتراضية
const DEFAULT_CENTER = {
  lat: 30.1382,
  lng: 31.7415,
};

export default function LiveMapPicker({
  lat,
  lng,
  onChange,
  height = '320px',
}: LiveMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [currentLat, setCurrentLat] = useState<number>(lat || DEFAULT_CENTER.lat);
  const [currentLng, setCurrentLng] = useState<number>(lng || DEFAULT_CENTER.lng);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (lat && lng && (lat !== currentLat || lng !== currentLng)) {
      setCurrentLat(lat);
      setCurrentLng(lng);
      if (markerRef.current && mapInstanceRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.panTo([lat, lng]);
      }
    }
  }, [lat, lng]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    // تهيئة Leaflet ديناميكياً لتجنب مشاكل التصيير بالخادم SSR
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // تجنب إعادة التهيئة إذا كانت الخريطة موجودة بالفعل
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // أيقونة عنبرية مخصصة للدبوس
      const amberIcon = L.divIcon({
        className: 'custom-amber-pin',
        html: `
          <div style="
            background: linear-gradient(135deg, #d97706, #b45309);
            color: white;
            width: 38px;
            height: 38px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #ffffff;
            box-shadow: 0 10px 20px rgba(180, 83, 9, 0.45);
          ">
            <svg style="transform: rotate(45deg); width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });

      const initialLat = lat || DEFAULT_CENTER.lat;
      const initialLng = lng || DEFAULT_CENTER.lng;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        attributionControl: false,
      });

      // إضافة طبقة البلاطات المجانية OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // وضع الدبوس
      const marker = L.marker([initialLat, initialLng], {
        icon: amberIcon,
        draggable: true,
      }).addTo(map);

      // الاستماع لتحريك الدبوس بالسحب
      marker.on('dragend', (e: any) => {
        const position = e.target.getLatLng();
        const newLat = Number(position.lat.toFixed(6));
        const newLng = Number(position.lng.toFixed(6));
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        onChange(newLat, newLng);
      });

      // الاستماع للنقر في أي مكان على الخريطة لتغيير مكان الدبوس
      map.on('click', (e: any) => {
        const newLat = Number(e.latlng.lat.toFixed(6));
        const newLng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng([newLat, newLng]);
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        onChange(newLat, newLng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setMapLoaded(true);

      // تأكيد ملء الحجم بعد التهيئة
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 200);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // جلب الموقع الحالي عبر Geolocation API
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('خاصية تحديد الموقع غير مدعومة في متصفحك');
      return;
    }

    setIsLocating(true);
    setLocationSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(6));
        const newLng = Number(pos.coords.longitude.toFixed(6));

        setCurrentLat(newLat);
        setCurrentLng(newLng);
        onChange(newLat, newLng);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 17);
          markerRef.current.setLatLng([newLat, newLng]);
        }

        setIsLocating(false);
        setLocationSuccess(true);
        setTimeout(() => setLocationSuccess(false), 3000);
      },
      (err) => {
        setIsLocating(false);
        alert('تعذر جلب موقعك الحالي. يرجى تفعيل إذن الوصول للموقع أو النقر يدوياً على الخريطة.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // إعادة التمركز على الحي المتميز بمدينة بدر
  const handleResetToHayElMotamayez = () => {
    setCurrentLat(DEFAULT_CENTER.lat);
    setCurrentLng(DEFAULT_CENTER.lng);
    onChange(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 15);
      markerRef.current.setLatLng([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* شريط الإجراءات والإحداثيات */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#fdfbf7] dark:bg-[#18202e] p-2.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-sm">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-[#1c1917] dark:text-[#f5f5f4] block">
              الموقع على الخريطة الحية (GPS)
            </span>
            <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
              {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* زر تحديد موقعي الآن */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
              locationSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/30'
            }`}
            title="تحديد الموقع الحالي للهاتف / الجهاز أمام العقار"
          >
            {isLocating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : locationSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>{isLocating ? 'جارٍ التحديد...' : locationSuccess ? 'تم رصد موقعك' : 'موقعي الآن'}</span>
          </button>

          {/* زر إعادة التمركز لمدينة بدر */}
          <button
            type="button"
            onClick={handleResetToHayElMotamayez}
            className="p-1.5 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-950/60 transition"
            title="العودة لمركز الحي المتميز"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* معاينة في جوجل مابس */}
          <a
            href={`https://www.google.com/maps?q=${currentLat},${currentLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-[11px] transition"
            title="فتح الموقع في Google Maps"
          >
            <ExternalLink className="w-3 h-3 text-amber-600" />
            <span className="hidden sm:inline">Google Maps</span>
          </a>
        </div>
      </div>

      {/* حاوية الخريطة */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-amber-200 dark:border-amber-900/60 shadow-inner bg-slate-100 dark:bg-slate-900"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* دليل إرشادي سريع */}
        <div className="absolute bottom-2 right-2 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-[10px] text-amber-900 dark:text-amber-300 font-bold shadow-sm flex items-center gap-1.5 pointer-events-none">
          <MapPin className="w-3 h-3 text-amber-600" />
          <span>انقر في أي مكان أو اسحب الدبوس لتغيير موقع الوحدة</span>
        </div>
      </div>
    </div>
  );
}
