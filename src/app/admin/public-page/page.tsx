'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { CompanyPublicSettings, GalleryItem } from '@/lib/types';
import { publicPageService } from '@/services/publicPageService';
import { uploadMediaToCloudinary } from '@/lib/cloudinary';
import {
  Globe,
  Copy,
  Check,
  Loader2,
  Trash2,
  Plus,
  Images,
  Save,
  Link2,
  ImageOff,
} from 'lucide-react';

const FIELD_TOGGLES: Array<{
  key: keyof CompanyPublicSettings;
  label: string;
  hint: string;
}> = [
  { key: 'showPrice', label: 'السعر', hint: 'إظهار سعر الوحدة وقابلية التفاوض' },
  { key: 'showArea', label: 'المساحة', hint: 'المساحة بالمتر المربع' },
  { key: 'showFloor', label: 'الدور', hint: 'رقم دور الوحدة' },
  { key: 'showGarden', label: 'مساحة الحديقة', hint: 'مساحة الحديقة الخاصة إن وجدت' },
  { key: 'showFeatures', label: 'المميزات', hint: 'قائمة المميزات الخاصة بالوحدة' },
  { key: 'showDescription', label: 'الوصف', hint: 'الوصف التفصيلي للوحدة' },
  { key: 'showDelivery', label: 'التسليم', hint: 'ملاحظات موعد التسليم' },
  { key: 'showPayment', label: 'نظام السداد', hint: 'طريقة السداد والتقسيط' },
];

export default function PublicPageAdminPage() {
  const { currentUser, buildings, zones } = useApp();
  const [settings, setSettings] = useState<CompanyPublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // المعرض
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [itemBuildingId, setItemBuildingId] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemImages, setItemImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // رابط النسخ
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    (async () => {
      const res = await publicPageService.fetchSettings();
      if (cancelled) return;
      if (res.success && res.data) setSettings(res.data);
      setLoading(false);

      const galRes = await publicPageService.fetchGallery();
      if (cancelled) return;
      if (galRes.success && galRes.data) setGallery(galRes.data);
      setGalleryLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser, refreshKey]);

  const load = useCallback(() => {
    setLoading(true);
    setGalleryLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  const shareUrl =
    settings && typeof window !== 'undefined'
      ? `${window.location.origin}/p/${settings.companyId}`
      : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage({ type: 'error', text: 'تعذر نسخ الرابط، انسخه يدوياً من شريط العنوان' });
    }
  };

  const updateSettings = async (updates: Partial<CompanyPublicSettings>) => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    // تحديث متفائل للحالة
    setSettings({ ...settings, ...updates });
    const res = await publicPageService.updateSettings(updates);
    setSaving(false);
    if (res.success && res.data) {
      setSettings(res.data);
      setMessage({
        type: 'success',
        text: updates.isEnabled !== undefined
          ? updates.isEnabled
            ? 'تم تفعيل الصفحة العامة — يمكن للعملاء زيارتها الآن'
            : 'تم إيقاف الصفحة العامة — لن تظهر للزوار'
          : 'تم حفظ الإعدادات بنجاح',
      });
    } else {
      setMessage({ type: 'error', text: res.error || 'فشل حفظ الإعدادات' });
      load();
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const result = await uploadMediaToCloudinary(file, 'el-waha/gallery');
        if (result.url) setItemImages((prev) => [...prev, result.url].slice(0, 12));
      } catch {
        setMessage({ type: 'error', text: 'تعذر رفع بعض الصور، حاول مرة أخرى' });
      }
    }
    setUploading(false);
  };

  const handleAddItem = async () => {
    if (itemImages.length === 0) {
      setMessage({ type: 'error', text: 'أضف صورة واحدة على الأقل قبل الحفظ' });
      return;
    }
    setAddingItem(true);
    setMessage(null);
    const res = await publicPageService.addGalleryItem({
      buildingId: itemBuildingId || undefined,
      title: itemTitle.trim() || undefined,
      description: itemDescription.trim() || undefined,
      price: itemPrice ? Number(itemPrice) : undefined,
      images: itemImages,
    });
    setAddingItem(false);
    if (res.success) {
      setMessage({ type: 'success', text: 'تم إضافة العنصر إلى معرض أعمال سابقة بنجاح' });
      setItemBuildingId('');
      setItemTitle('');
      setItemDescription('');
      setItemPrice('');
      setItemImages([]);
      load();
    } else {
      setMessage({ type: 'error', text: res.error || 'فشل إضافة العنصر' });
    }
  };

  const handleDeleteItem = async (id: string) => {
    setDeletingId(id);
    const res = await publicPageService.deleteGalleryItem(id);
    setDeletingId(null);
    if (res.success) {
      setGallery((prev) => prev.filter((g) => g.id !== id));
    } else {
      setMessage({ type: 'error', text: res.error || 'فشل حذف العنصر' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* الترويسة */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
          <Globe className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-black text-on-surface">
            الصفحة العامة للشركة
          </h1>
          <p className="text-xs text-on-surface-variant font-semibold">
            شارك الرابط مع عملائك ليستعرضوا الوحدات ويحجزوا موعد معاينة
          </p>
        </div>
      </div>

      {message && (
        <p
          className={`text-xs font-bold rounded-xl px-4 py-3 ${
            message.type === 'success'
              ? 'text-on-success-container bg-success-container'
              : 'text-on-error-container bg-error-container'
          }`}
        >
          {message.text}
        </p>
      )}

      {/* التفعيل + مشاركة الرابط */}
      <div className="card card-bordered rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-on-surface">
              حالة الصفحة العامة
            </h3>
            <p className="text-[11px] text-on-surface-variant font-semibold mt-0.5">
              {settings?.isEnabled ? 'الصفحة ظاهرة للعملاء الآن' : 'الصفحة مخفية عن العملاء'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ isEnabled: !settings?.isEnabled })}
            disabled={saving || !settings}
            className={`relative w-14 h-8 rounded-full transition-colors cursor-pointer shrink-0 ${
              settings?.isEnabled ? 'bg-primary' : 'bg-surface-container-highest'
            }`}
            aria-label="تفعيل الصفحة العامة"
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${
                settings?.isEnabled ? 'right-1' : 'right-7'
              }`}
            />
          </button>
        </div>

        <div className="h-px bg-outline-variant" />

        <div>
          <h3 className="text-sm font-black text-on-surface mb-2 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            رابط المشاركة
          </h3>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              dir="ltr"
              className="input-base flex-1 text-xs text-left min-w-0"
            />
            <button
              type="button"
              onClick={copyLink}
              className="btn-primary px-4 py-2.5 text-xs shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'تم النسخ' : 'نسخ'}
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-tonal inline-flex items-center gap-1.5 px-4 py-2.5 text-xs shrink-0"
            >
              <Globe className="w-4 h-4" />
              فتح الصفحة
            </a>
          </div>
        </div>
      </div>

      {/* اختيار الحقول الظاهرة */}
      <div className="card card-bordered rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Save className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-black text-on-surface">
            تفاصيل الوحدات الظاهرة للعملاء
          </h3>
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {FIELD_TOGGLES.map((f) => {
            const on = !!settings?.[f.key];
            return (
              <button
                key={f.key}
                type="button"
                disabled={saving || !settings}
                onClick={() => updateSettings({ [f.key]: !on } as Partial<CompanyPublicSettings>)}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-right transition-all cursor-pointer ${
                  on
                    ? 'bg-surface-container border-primary'
                    : 'bg-surface-container-lowest border-outline-variant'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-black text-on-surface">{f.label}</p>
                  <p className="text-[10px] text-on-surface-variant truncate">{f.hint}</p>
                </div>
                <span
                  className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                    on ? 'bg-primary' : 'bg-surface-container-highest'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      on ? 'right-0.5' : 'right-4.5'
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-on-surface-variant">
          سيظهر كل مربع تم تفعيله على كروت الوحدات في الصفحة العامة مع تفاصيل الوحدة في العرض الكامل
        </p>
      </div>

      {/* معرض أعمال سابقة */}
      <div className="card card-bordered rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Images className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-black text-on-surface">
            معرض أعمال سابقة
          </h3>
          <p className="text-[11px] text-on-surface-variant">
            ({gallery.length} عنصر — الوحدات المباعة تُنقل تلقائياً إلى هنا)
          </p>
        </div>

        {/* قائمة العناصر الحالية */}
        {galleryLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : gallery.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-4">
            لا توجد عناصر بعد — أضف عملاً سابقاً يدوياً أو عدّل حالة وحدة إلى (تم البيع)
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gallery.map((g) => (
              <div
                key={g.id}
                className="relative group aspect-video rounded-xl overflow-hidden border border-outline-variant bg-surface-container"
              >
                {g.images[0] ? (
                  <img src={g.images[0]} alt={g.title || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                    <ImageOff className="w-5 h-5" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-1.5 right-2 left-2 flex items-center justify-between gap-1">
                  <p className="text-[10px] font-bold text-white truncate">
                    {g.title || (g.source === 'auto_sold' ? 'وحدة مباعة' : 'عمل سابق')}
                  </p>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      g.source === 'auto_sold'
                        ? 'bg-success text-on-success'
                        : 'bg-white/90 text-on-surface'
                    }`}
                  >
                    {g.source === 'auto_sold' ? 'تلقائي' : 'يدوي'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(g.id)}
                  disabled={deletingId === g.id}
                  className="absolute top-1.5 left-1.5 p-1.5 rounded-lg bg-error text-on-error opacity-0 group-hover:opacity-100 hover:brightness-90 transition-all cursor-pointer"
                  aria-label="حذف"
                >
                  {deletingId === g.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="h-px bg-outline-variant" />

        {/* إضافة عنصر جديد */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-on-surface flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-primary" />
            إضافة عمل سابق جديد
          </h4>

          {/* ربط المبنى (القطعة) — الأعمال السابقة = مبانٍ */}
          <select
            value={itemBuildingId}
            onChange={(e) => setItemBuildingId(e.target.value)}
            className="input-base text-xs"
          >
            <option value="">بدون ربط مبنى (اختياري)</option>
            {(buildings || [])
              .filter((b) => !b.companyId || !currentUser?.companyId || b.companyId === currentUser.companyId)
              .map((b) => {
                const zoneName = zones?.find((z) => z.id === b.zoneId)?.name;
                return (
                  <option key={b.id} value={b.id}>
                    قطعة {b.plotNo}
                    {zoneName ? ' - ' + zoneName : ''}
                    {b.landArea ? ' (' + b.landArea + 'م²)' : ''}
                  </option>
                );
              })}
          </select>
          <p className="text-[11px] text-on-surface-variant">
            سابقة الأعمال تُعرض كمباني (قطع) — اختر القطعة ليُربط العنصر بمبنى الشركة
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              placeholder="العنوان (اختياري)"
              maxLength={120}
              className="input-base text-xs"
            />
            <input
              type="number"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder="السعر (اختياري) ج.م"
              className="input-base text-xs"
            />
          </div>

          <textarea
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            placeholder="وصف قصير (اختياري)"
            rows={2}
            maxLength={1000}
            className="input-base text-xs resize-none"
          />

          {/* رفع الصور */}
          <div className="flex flex-wrap items-center gap-2">
            <label
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-dashed border-outline text-on-surface-variant text-xs font-bold hover:border-primary hover:text-primary transition-all cursor-pointer ${
                uploading ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              إضافة صور
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
            </label>
            {itemImages.length > 0 && (
              <span className="text-[11px] font-bold text-success">
                {itemImages.length} صورة جاهزة
              </span>
            )}
          </div>

          {/* معاينة الصور */}
          {itemImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {itemImages.map((img, i) => (
                <div key={i} className="relative w-16 h-12 rounded-lg overflow-hidden border border-outline-variant">
                  <img src={img} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setItemImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 left-0.5 p-0.5 rounded bg-black/70 text-white cursor-pointer"
                    aria-label="إزالة الصورة"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleAddItem}
            disabled={addingItem || uploading || itemImages.length === 0}
            className="btn-primary w-full sm:w-auto px-6 py-2.5 text-xs"
          >
            {addingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            حفظ في المعرض
          </button>
        </div>
      </div>
    </div>
  );
}
