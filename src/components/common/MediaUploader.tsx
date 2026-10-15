'use client';

import React, { useState, useRef } from 'react';
import { UnitMedia } from '@/lib/types';
import { uploadMediaToCloudinary } from '@/lib/cloudinary';
import {
  UploadCloud,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  ExternalLink,
  Film,
} from 'lucide-react';

export interface MediaUploaderProps {
  media: UnitMedia[];
  onChange: (media: UnitMedia[]) => void;
  unitId?: string;
}

export default function MediaUploader({ media, onChange, unitId }: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualCaption, setManualCaption] = useState('');
  const [manualKind, setManualKind] = useState<'image' | 'video'>('image');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);

    const fileList = Array.from(files);
    const newMediaItems: UnitMedia[] = [];

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const isVideo = file.type.startsWith('video/');

        // تحديث التقدم بناء على الملف الحالي والنسبة المئوية
        const baseProgress = (i / fileList.length) * 100;
        const result = await uploadMediaToCloudinary(
          file,
          `el-waha/units/${unitId || 'new'}`,
          (percent) => {
            setUploadProgress(Math.round(baseProgress + (percent / fileList.length)));
          }
        );

        newMediaItems.push({
          id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          unitId: unitId || '',
          ownerId: 'curr',
          kind: result.kind,
          externalUrl: result.url,
          caption: isVideo ? 'فيديو معاينة الوحدة' : 'صورة الوحدة',
          sizeBytes: result.sizeBytes,
          createdAt: new Date().toISOString(),
        });
      }

      onChange([...media, ...newMediaItems]);
    } catch (err: unknown) {
      console.error('فشل رفع الملفات:', err);
      const errorMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الملفات إلى Cloudinary';
      setUploadError(errorMsg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveMedia = (index: number) => {
    const updated = [...media];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleUpdateCaption = (index: number, newCaption: string) => {
    const updated = [...media];
    updated[index] = { ...updated[index], caption: newCaption };
    onChange(updated);
  };

  const handleAddManualUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;

    const newItem: UnitMedia = {
      id: `m-${Date.now()}`,
      unitId: unitId || '',
      ownerId: 'curr',
      kind: manualKind,
      externalUrl: manualUrl.trim(),
      caption: manualCaption.trim() || (manualKind === 'video' ? 'فيديو الوحدة' : 'صورة الوحدة'),
      createdAt: new Date().toISOString(),
    };

    onChange([...media, newItem]);
    setManualUrl('');
    setManualCaption('');
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block font-bold text-stone-800 dark:text-stone-200 text-sm">
            معرض صور وفيديوهات الوحدة (Cloudinary)
          </label>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            ارفع صور أو فيديوهات عالية الجودة لتظهر للعملاء ومشاركتها عبر واتساب
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
        >
          {showUrlInput ? 'إلغاء الرابط اليدوي' : '+ إضافة رابط خارجي'}
        </button>
      </div>

      {/* نموذج إضافة رابط يدوي */}
      {showUrlInput && (
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setManualKind('image')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                manualKind === 'image'
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> صورة
            </button>
            <button
              type="button"
              onClick={() => setManualKind('video')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                manualKind === 'video'
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              <VideoIcon className="w-3.5 h-3.5" /> فيديو
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="url"
              placeholder="رابط الصورة أو الفيديو المباشر (https://...)"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className="w-full p-2 rounded-xl text-xs border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-left"
            />
            <input
              type="text"
              placeholder="وصف مختصر (مثلاً: واجهة بحري، الصالة، الغرفة الرئيسية)"
              value={manualCaption}
              onChange={(e) => setManualCaption(e.target.value)}
              className="w-full p-2 rounded-xl text-xs border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
            />
          </div>
          <button
            type="button"
            onClick={handleAddManualUrl}
            disabled={!manualUrl.trim()}
            className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-50 transition cursor-pointer"
          >
            إضافة الرابط للمعرض
          </button>
        </div>
      )}

      {/* منطقة السحب والإفلات والرفع */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
            : 'border-stone-300 dark:border-stone-700/80 bg-stone-50/50 dark:bg-stone-800/20 hover:border-amber-400 hover:bg-amber-50/30 dark:hover:bg-amber-950/10'
        } ${isUploading ? 'opacity-80 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {isUploading ? (
          <div className="py-3 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
              جاري الرفع والمعالجة على سحابة Cloudinary... {uploadProgress > 0 && `${uploadProgress}%`}
            </p>
            {uploadProgress > 0 && (
              <div className="w-48 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-amber-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                اضغط هنا لاختيار صور وفيديوهات أو اسحبها وأفلتها هنا
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                يدعم الصور (JPG, PNG, WebP) وفيديوهات الجولة والمعاينة (MP4, MOV)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* رسالة الخطأ إن وُجدت */}
      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* قائمة الوسائط المرفوعة مسبقاً */}
      {media.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-stone-600 dark:text-stone-400">
            الملفات المرفقة ({media.length}):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
            {media.map((item, idx) => {
              const url = item.externalUrl || item.storagePath || '';
              const isVideo = item.kind === 'video';

              return (
                <div
                  key={item.id || idx}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs group"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-14 rounded-xl overflow-hidden bg-black shrink-0 border border-stone-200 dark:border-stone-800">
                    {isVideo ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950 text-amber-400">
                        <Film className="w-6 h-6" />
                        <span className="text-[9px] font-black mt-0.5">فيديو</span>
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt="media"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200';
                        }}
                      />
                    )}
                  </div>

                  {/* Caption & Controls */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={item.caption || ''}
                      onChange={(e) => handleUpdateCaption(idx, e.target.value)}
                      placeholder={isVideo ? 'وصف الفيديو' : 'وصف الصورة'}
                      className="w-full p-1.5 text-xs rounded-lg border border-transparent hover:border-stone-300 dark:hover:border-stone-700 focus:border-amber-500 bg-transparent text-stone-900 dark:text-stone-100 font-medium"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-bold">
                        {isVideo ? '🎥 فيديو' : '📸 صورة'}
                      </span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-amber-600 hover:underline flex items-center gap-0.5"
                      >
                        معاينة <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(idx)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                    title="حذف هذا الملف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
