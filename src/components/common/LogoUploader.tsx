'use client';

import React, { useRef, useState } from 'react';
import { uploadMediaToCloudinary } from '@/lib/cloudinary';
import { Store, Trash2, Loader2, AlertCircle } from 'lucide-react';

import { apiClient } from '@/services/apiClient';

export interface LogoUploaderProps {
  logoUrl?: string;
  /** المعرف الفريد للشركة لضمان تسمية ثابتة واستبدال الشعار القديم بالجديد في التخزين */
  companyId?: string;
  /** يُستدعى برابط الشعار الجديد أو undefined عند الإزالة */
  onChange: (logoUrl: string | undefined) => void;
  /** أول حرف من اسم الشركة للعرض كاحتياط عند غياب الشعار */
  fallbackInitial?: string;
  disabled?: boolean;
}

const MAX_LOGO_SIZE_MB = 5;

/**
 * رافع شعار الشركة: يرفع الملف إلى Cloudinary (مجلد el-waha/logos)
 * مع استبدال الملف القديم ومسحه من مساحة التخزين تلقائياً.
 */
export default function LogoUploader({
  logoUrl,
  companyId,
  onChange,
  fallbackInitial,
  disabled,
}: LogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSelectFile = () => {
    if (disabled || isUploading) return;
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // إعادة تعيين قيمة الحقل للسماح باختيار نفس الملف مرة أخرى
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة (PNG / JPG / WEBP / SVG)');
      return;
    }
    if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
      setError(`حجم الملف كبير جداً، الحد الأقصى ${MAX_LOGO_SIZE_MB} ميجابايت`);
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(0);
    try {
      const customPublicId = companyId ? `company_logo_${companyId}` : undefined;
      const result = await uploadMediaToCloudinary(
        file,
        'el-waha/logos',
        (percent) => setProgress(percent),
        { publicId: customPublicId, overwrite: true }
      );
      if (result.url) {
        onChange(result.url);
      } else {
        setError('لم يتم استلام رابط الشعار بعد الرفع');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'فشل رفع الشعار، يرجى المحاولة مرة أخرى';
      setError(errorMsg);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = async () => {
    if (disabled || isUploading) return;
    setError(null);
    const oldUrl = logoUrl;
    onChange(undefined);
    if (oldUrl) {
      try {
        await apiClient.delete('/upload', { url: oldUrl });
      } catch (err) {
        console.warn('تنبيه: فشل الحذف المباشر للشعار من التخزين السحابي:', err);
      }
    }
  };

  return (
    <div className="flex items-start gap-3">
      {/* المعاينة */}
      <div className="shrink-0">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="شعار الشركة"
            className="w-14 h-14 rounded-xl object-cover border border-outline-variant bg-surface-container-low shadow-sm"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary font-black text-lg flex items-center justify-center border border-outline-variant/50">
            {fallbackInitial ? fallbackInitial.charAt(0) : <Store className="w-6 h-6" />}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
          disabled={disabled}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSelectFile}
            disabled={disabled || isUploading}
            className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الرفع… {progress > 0 ? `${progress}%` : ''}
              </>
            ) : (
              <>
                <Store className="w-4 h-4 text-primary" />
                {logoUrl ? 'تغيير الشعار' : 'رفع شعار الشركة'}
              </>
            )}
          </button>
          {logoUrl && !isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="px-3 py-2 rounded-xl bg-error-container hover:bg-error-container/70 text-on-error-container text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              إزالة
            </button>
          )}
        </div>
        <p className="mt-1 text-[10px] text-on-surface-variant">
          PNG / JPG / WEBP / SVG — حتى {MAX_LOGO_SIZE_MB} ميجابايت. يظهر في قائمة جانبية لكل شركتك ووسطائها.
        </p>
        {error && (
          <p className="mt-1 text-[10px] font-bold text-on-error-container flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
