'use client';

import React, { useState } from 'react';
import { GalleryItem } from '@/lib/types';
import { X, ChevronRight, ChevronLeft, ImageOff, Tag, Camera, Maximize2 } from 'lucide-react';

export interface GalleryGridProps {
  items: GalleryItem[];
}

export default function GalleryGrid({ items }: GalleryGridProps) {
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);
  const [currentImage, setCurrentImage] = useState(0);

  const openLightbox = (item: GalleryItem) => {
    setLightbox(item);
    setCurrentImage(0);
  };

  const nextImage = () => {
    if (!lightbox) return;
    setCurrentImage((i) => (i + 1) % Math.max(lightbox.images.length, 1));
  };

  const prevImage = () => {
    if (!lightbox) return;
    setCurrentImage((i) => (i - 1 + Math.max(lightbox.images.length, 1)) % Math.max(lightbox.images.length, 1));
  };

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <ImageOff className="w-8 h-8" />
        </div>
        <p className="empty-state-title">لا توجد مشاريع أو أعمال سابقة معروضة حالياً</p>
        <p className="empty-state-hint">سيتم تحديث قائمة الأعمال المنجزة والسابقة قريباً</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => openLightbox(item)}
            className="group relative aspect-square rounded-3xl overflow-hidden bg-surface-container border border-outline-variant cursor-pointer hover:shadow-xl hover:border-primary transition-all duration-300"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openLightbox(item)}
          >
            {item.images[0] ? (
              <img
                src={item.images[0]}
                alt={item.title || 'مشروع سابق'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant bg-surface-container-low">
                <ImageOff className="w-8 h-8 opacity-60" />
              </div>
            )}

            {/* طبقة تظليل لضمان وضوح النصوص */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

            {/* شارة التكبير عند التحويم */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl bg-black/60 backdrop-blur-md text-white">
              <Maximize2 className="w-4 h-4" />
            </div>

            {/* عدد الصور */}
            {item.images.length > 1 && (
              <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-xl bg-black/80 backdrop-blur-md text-white border border-white/10 flex items-center gap-1 shadow-xs">
                <Camera className="w-3 h-3 text-primary-fixed" />
                <span>{item.images.length} صور</span>
              </span>
            )}

            {/* تفاصيل المشروع بالأسفل */}
            <div className="absolute bottom-0 right-0 left-0 p-4 space-y-1">
              {item.title && (
                <p className="text-sm font-black text-white truncate drop-shadow-sm">
                  {item.title}
                </p>
              )}
              {typeof item.price === 'number' && (
                <div className="price-pill text-xs py-0.5 px-2.5">
                  <span className="font-black text-primary">{item.price.toLocaleString('ar-EG')}</span>
                  <span className="text-[10px] text-on-surface-variant font-bold">ج.م</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* نافذة العرض الكامل للمشروع (Lightbox) */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md transition-opacity"
          onClick={() => setLightbox(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card card-bordered shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-surface-container-lowest"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur-md">
              <h3 className="font-black text-lg text-on-surface truncate">
                {lightbox.title || 'مشروع سابق'}
              </h3>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {lightbox.images.length > 0 && (
              <div className="relative bg-black group select-none">
                <div className="aspect-[16/10] w-full overflow-hidden flex items-center justify-center">
                  <img
                    src={lightbox.images[currentImage]}
                    alt={`${lightbox.title || 'مشروع سابق'} - صورة ${currentImage + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                {lightbox.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer backdrop-blur-md transition-all shadow-md"
                      aria-label="الصورة السابقة"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer backdrop-blur-md transition-all shadow-md"
                      aria-label="الصورة التالية"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-md">
                      {currentImage + 1} من {lightbox.images.length}
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="p-5 sm:p-6 space-y-4">
              {lightbox.description && (
                <div>
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    تفاصيل المشروع
                  </h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line bg-surface-container-low p-4 rounded-2xl border border-outline-variant/50">
                    {lightbox.description}
                  </p>
                </div>
              )}

              {typeof lightbox.price === 'number' && (
                <div className="flex items-center gap-2 bg-success-container p-3.5 rounded-2xl border border-success/40">
                  <Tag className="w-4 h-4 text-success" />
                  <span className="text-xs font-bold text-on-success-container">القيمة التعاقدية:</span>
                  <span className="text-base font-black text-on-success-container">
                    {lightbox.price.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
