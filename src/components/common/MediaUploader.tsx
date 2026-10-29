'use client';

import React, { useState, useRef } from 'react';
import { UnitMedia } from '@/lib/types';
import { uploadMediaToCloudinary } from '@/lib/cloudinary';
import {
  UploadCloud,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Film,
  Star,
  GripVertical,
  ChevronUp,
  ChevronDown,
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
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualCaption, setManualCaption] = useState('');
  const [manualKind, setManualKind] = useState<'image' | 'video'>('image');

  // Drag and drop state for reordering items
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);

    const fileList = Array.from(files);
    const newMediaItems: UnitMedia[] = [];
    let failedCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const isVideo = file.type.startsWith('video/');
      const fileNumber = i + 1;
      const totalFiles = fileList.length;

      setUploadStatusText(
        totalFiles > 1
          ? `جاري رفع وحفظ الملف (${fileNumber} من ${totalFiles})...`
          : 'جاري رفع وحفظ الملف...'
      );

      const baseProgress = (i / totalFiles) * 100;

      try {
        const result = await uploadMediaToCloudinary(
          file,
          `el-waha/units/${unitId || 'new'}`,
          (percent) => {
            setUploadProgress(Math.round(baseProgress + percent / totalFiles));
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
          sortOrder: media.length + i,
          createdAt: new Date().toISOString(),
        });
      } catch (err: unknown) {
        console.error(`تعذر رفع الملف ${file.name}:`, err);
        failedCount++;
      }
    }

    if (newMediaItems.length > 0) {
      const combined = [...media, ...newMediaItems].map((item, idx) => ({
        ...item,
        sortOrder: idx,
      }));
      onChange(combined);
    }

    if (failedCount > 0) {
      if (newMediaItems.length === 0) {
        setUploadError('تعذر رفع الملفات، يرجى التحقق من الملفات والاتصال بالإنترنت ثم المحاولة مرة أخرى.');
      } else {
        setUploadError(`تم رفع ${newMediaItems.length} ملفات بنجاح، بينما تعذر رفع ${failedCount} ملفات.`);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatusText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = (index: number) => {
    const updated = media
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, sortOrder: idx }));
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
      sortOrder: media.length,
      createdAt: new Date().toISOString(),
    };

    const updated = [...media, newItem].map((item, idx) => ({
      ...item,
      sortOrder: idx,
    }));
    onChange(updated);
    setManualUrl('');
    setManualCaption('');
    setShowUrlInput(false);
  };

  // Reorder by moving up / down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= media.length) return;

    const updated = [...media];
    const item = updated[index];
    updated.splice(index, 1);
    updated.splice(targetIndex, 0, item);

    const withRecomputedSort = updated.map((m, idx) => ({
      ...m,
      sortOrder: idx,
    }));
    onChange(withRecomputedSort);
  };

  // Set selected item as cover (promote to index 0)
  const handleSetAsCover = (index: number) => {
    if (index === 0) return;

    const updated = [...media];
    const [coverItem] = updated.splice(index, 1);
    updated.unshift(coverItem);

    const withRecomputedSort = updated.map((m, idx) => ({
      ...m,
      sortOrder: idx,
    }));
    onChange(withRecomputedSort);
  };

  // HTML5 Drag and Drop handlers for reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...media];
    const [item] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, item);

    const withRecomputedSort = updated.map((m, idx) => ({
      ...m,
      sortOrder: idx,
    }));
    onChange(withRecomputedSort);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block font-bold text-on-surface text-sm">
            معرض صور وفيديوهات الوحدة
          </label>
          <p className="text-xs text-on-surface-variant mt-0.5">
            ارفع صور أو فيديوهات عالية الجودة. يمكنك إعادة الترتيب واختيار صورة الغلاف الرئيسية
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-primary hover:underline flex items-center gap-1 font-bold cursor-pointer"
        >
          {showUrlInput ? 'إلغاء الرابط اليدوي' : '+ إضافة رابط خارجي'}
        </button>
      </div>

      {/* نموذج إضافة رابط يدوي */}
      {showUrlInput && (
        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setManualKind('image')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                manualKind === 'image'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> صورة
            </button>
            <button
              type="button"
              onClick={() => setManualKind('video')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                manualKind === 'video'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant'
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
              className="w-full p-2 rounded-xl text-xs border border-outline-variant bg-surface text-on-surface font-mono text-left focus:outline-hidden focus:border-primary"
            />
            <input
              type="text"
              placeholder="وصف مختصر (مثلاً: واجهة بحري، الصالة، الغرفة الرئيسية)"
              value={manualCaption}
              onChange={(e) => setManualCaption(e.target.value)}
              className="w-full p-2 rounded-xl text-xs border border-outline-variant bg-surface text-on-surface focus:outline-hidden focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleAddManualUrl}
            disabled={!manualUrl.trim()}
            className="btn-primary px-4 py-1.5 text-xs"
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
            ? 'border-primary bg-primary-container/20'
            : 'border-outline-variant bg-surface-container-low/50 hover:border-primary hover:bg-surface-container-low'
        } ${isUploading ? 'opacity-90 pointer-events-none' : ''}`}
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
          <div className="py-4 flex flex-col items-center gap-2.5">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs font-bold text-on-surface">
              {uploadStatusText || 'جاري معالجة وحفظ الوسائط...'} {uploadProgress > 0 && `${uploadProgress}%`}
            </p>
            {uploadProgress > 0 && (
              <div className="w-56 h-2 bg-surface-container-high rounded-full overflow-hidden mt-1 shadow-inner">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <span className="text-[11px] text-on-surface-variant font-medium">
              يتم حفظ الوسائط بجودة عالية وربطها بالوحدة
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">
                اضغط هنا لاختيار صور وفيديوهات أو اسحبها وأفلتها هنا
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                يدعم الصور (JPG, PNG, WebP) وفيديوهات الجولة والمعاينة (MP4, MOV)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* رسالة الخطأ إن وُجدت */}
      {uploadError && (
        <div className="p-3 rounded-xl bg-error-container border border-error text-on-error-container text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* قائمة الوسائط المرفوعة مسبقاً مع أدوات الترتيب وصورة الغلاف */}
      {media.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface">
                الوسائط المرفقة ({media.length}):
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium hidden sm:inline">
                (يمكنك السحب لإعادة الترتيب، أو استخدام الأسهم، وتعيين صورة الغلاف)
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[32rem] overflow-y-auto p-1">
            {media.map((item, idx) => {
              const url = item.externalUrl || item.storagePath || '';
              const isVideo = item.kind === 'video';
              const isCover = idx === 0 && !isVideo;
              const isItemDragged = draggedIndex === idx;
              const isItemDragOver = dragOverIndex === idx && draggedIndex !== idx;

              return (
                <div
                  key={item.id || idx}
                  draggable={!isUploading}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-2xl bg-surface border transition-all duration-150 ${
                    isCover
                      ? 'border-primary ring-2 ring-primary/25 shadow-xs'
                      : 'border-outline-variant hover:border-outline shadow-xs'
                  } ${isItemDragOver ? 'ring-2 ring-primary border-primary bg-primary-container/10' : ''} ${
                    isItemDragged ? 'opacity-40 scale-[0.98]' : 'opacity-100'
                  }`}
                >
                  {/* Handle, Index & Thumbnail */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition"
                      title="اسحب لإعادة الترتيب"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Sequential Number Badge */}
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        isCover
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {/* Thumbnail Preview */}
                    <div className="relative w-20 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-outline-variant">
                      {isVideo ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-surface-container-lowest text-on-surface">
                          <Film className="w-6 h-6 text-primary" />
                          <span className="text-[9px] font-black mt-0.5">فيديو</span>
                        </div>
                      ) : (
                        <img
                          src={url}
                          alt={item.caption || 'صورة الوحدة'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200';
                          }}
                        />
                      )}

                      {/* Small badge over thumbnail */}
                      {isCover && (
                        <div className="absolute top-1 right-1 p-0.5 rounded-full bg-primary text-on-primary shadow-xs">
                          <Star className="w-3 h-3 fill-current" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Caption & Metadata */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Cover Badge */}
                      {isCover ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-primary text-on-primary shadow-xs">
                          <Star className="w-3 h-3 fill-current" />
                          صورة الغلاف الأساسية
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-bold">
                          {isVideo ? '🎥 فيديو' : '📸 صورة'}
                        </span>
                      )}

                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5 font-bold"
                      >
                        معاينة الرابط <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    <input
                      type="text"
                      value={item.caption || ''}
                      onChange={(e) => handleUpdateCaption(idx, e.target.value)}
                      placeholder={isVideo ? 'وصف الفيديو (مثلاً: جولة بالفيديو)' : 'وصف الصورة (مثلاً: الواجهة، الصالة، الغرفة)'}
                      className="w-full p-2 text-xs rounded-xl border border-outline-variant bg-surface text-on-surface focus:outline-hidden focus:border-primary font-medium transition"
                    />
                  </div>

                  {/* Ordering Controls & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-container-high/40 shrink-0">
                    {/* Make Cover Button (available on non-cover images) */}
                    {!isVideo && !isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetAsCover(idx)}
                        className="btn-tonal text-xs py-1.5 px-3 flex items-center gap-1 font-bold cursor-pointer"
                        title="تعيين هذه الصورة كغلاف رئيسي للوحدة"
                      >
                        <Star className="w-3.5 h-3.5 text-primary" />
                        <span>تعيين كغلاف</span>
                      </button>
                    )}

                    {/* Move Up Button */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1.5 rounded-xl border border-outline-variant hover:border-outline hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface disabled:opacity-25 disabled:pointer-events-none transition cursor-pointer"
                      title="تحريك للأعلى (تقديم الترتيب)"
                      aria-label="تحريك للأعلى"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>

                    {/* Move Down Button */}
                    <button
                      type="button"
                      disabled={idx === media.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1.5 rounded-xl border border-outline-variant hover:border-outline hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface disabled:opacity-25 disabled:pointer-events-none transition cursor-pointer"
                      title="تحريك للأسفل (تأخير الترتيب)"
                      aria-label="تحريك للأسفل"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(idx)}
                      className="p-1.5 rounded-xl text-error hover:bg-error-container transition cursor-pointer"
                      title="حذف هذا الملف"
                      aria-label="حذف الملف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
