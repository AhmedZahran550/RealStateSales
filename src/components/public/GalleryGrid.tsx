'use client';

import React from 'react';
import { GalleryItem } from '@/lib/types';
import { X, ChevronRight, ChevronLeft, ImageOff, Tag } from 'lucide-react';

export interface GalleryGridProps {
  items: GalleryItem[];
}

export default function GalleryGrid({ items }: GalleryGridProps) {
  const [lightbox, setLightbox] = React.useState<GalleryItem | null>(null);
  const [currentImage, setCurrentImage] = React.useState(0);

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
          <ImageOff className="w-7 h-7" />
        </div>
        <p className="empty-state-title">لا توجد أعمال سابقة بعد</p>
        <p className="empty-state-hint">سيتم عرض أعمال الشركة المنجزة هنا</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => openLightbox(item)}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-surface-container border border-outline-variant cursor-pointer hover:shadow-xl hover:border-primary/60 transition-all"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openLightbox(item)}
          >
            {item.images[0] ? (
              <img
                src={item.images[0]}
                alt={item.title || 'عمل سابق'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                <ImageOff className="w-8 h-8" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-0 right-0 left-0 p-3">
              {item.title && (
                <p className="text-xs font-black text-white truncate">{item.title}</p>
              )}
              {typeof item.price === 'number' && (
                <p className="text-[11px] font-bold text-primary-fixed flex items-center gap-1 mt-0.5">
                  <Tag className="w-3 h-3" />
                  {item.price.toLocaleString('ar-EG')} ج.م
                </p>
              )}
            </div>
            {item.images.length > 1 && (
              <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/70 text-white">
                {item.images.length} صور
              </span>
            )}
          </div>
        ))}
      </div>

      {/* عرض العنصر كاملاً */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-outline-variant">
              <h3 className="font-bold text-lg text-on-surface truncate">
                {lightbox.title || 'عمل سابق'}
              </h3>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant cursor-pointer shrink-0"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {lightbox.images.length > 0 && (
              <div className="relative bg-black">
                <div className="aspect-[16/10] w-full overflow-hidden">
                  <img
                    src={lightbox.images[currentImage]}
                    alt={`${lightbox.title || 'عمل سابق'} - صورة ${currentImage + 1}`}
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                      aria-label="السابق"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                      aria-label="التالي"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full">
                      {currentImage + 1} / {lightbox.images.length}
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="p-5">
              {lightbox.description && (
                <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {lightbox.description}
                </p>
              )}
              {typeof lightbox.price === 'number' && (
                <p className="mt-3 text-sm font-black text-success flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {lightbox.price.toLocaleString('ar-EG')} ج.م
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
