/**
 * أدوات ومساعدات Cloudinary لتخزين وتنزيل صور وفيديوهات الوحدات
 */

export interface CloudinaryUploadResult {
  url: string;
  kind: 'image' | 'video';
  publicId?: string;
  sizeBytes?: number;
  format?: string;
  originalFilename?: string;
}

export interface CloudinaryDirectResponse {
  secure_url?: string;
  url?: string;
  public_id?: string;
  bytes?: number;
  format?: string;
}

/**
 * التحقق من إعداد سحابة Cloudinary
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
}

/**
 * تحويل رابط Cloudinary إلى رابط تحميل مباشر يجبر المتصفح على حفظ الملف
 * عبر خاصية fl_attachment المعتمدة في Cloudinary
 */
export function getCloudinaryDownloadUrl(url: string, filename?: string): string {
  if (!url) return '';

  // التحقق إن كان الرابط من سيرفرات Cloudinary
  if (url.includes('res.cloudinary.com')) {
    const safeFilename = filename ? encodeURIComponent(filename.replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '_')) : '';
    const flag = safeFilename ? `fl_attachment:${safeFilename}` : 'fl_attachment';

    // البحث عن /upload/ لإدراج الفلاغ بعدها مباشرة
    if (url.includes('/upload/')) {
      // تفادي تكرار fl_attachment إذا كان موجوداً بالفعل
      if (url.includes('fl_attachment')) {
        return url;
      }
      return url.replace('/upload/', `/upload/${flag}/`);
    }
  }

  return url;
}

export interface UploadOptions {
  publicId?: string;
  overwrite?: boolean;
}

/**
 * استخراج المعرف العام (public_id) من رابط Cloudinary لاستخدامه في الحذف أو التعديل
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    let pathAfterUpload = url.substring(uploadIndex + '/upload/'.length);
    // تجاوز أي transformations أو بادئة النسخة مثل v1234567890/ أو fl_attachment
    pathAfterUpload = pathAfterUpload.replace(/^(?:[a-zA-Z0-9_:,.-]+\/)*v\d+\//, '');
    // إزالة الامتداد مثل .jpg, .png, .webp
    const lastDotIndex = pathAfterUpload.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      pathAfterUpload = pathAfterUpload.substring(0, lastDotIndex);
    }
    return pathAfterUpload || null;
  } catch {
    return null;
  }
}

/**
 * تنزيل وحفظ الصورة أو الفيديو في جهاز المستخدم مباشرة
 */
export async function downloadMediaFile(url: string, suggestedFilename?: string): Promise<boolean> {
  if (!url) return false;

  const extension = url.split('?')[0].split('.').pop() || 'jpg';
  const defaultFilename = suggestedFilename
    ? suggestedFilename.endsWith(`.${extension}`)
      ? suggestedFilename
      : `${suggestedFilename}.${extension}`
    : `media_${Date.now()}.${extension}`;

  // 1. إذا كان رابط Cloudinary، استخدام fl_attachment أولاً
  const downloadUrl = getCloudinaryDownloadUrl(url, defaultFilename);

  try {
    // محاولة تنزيل الملف عبر Fetch و Blob لضمان الحفظ المباشر
    const response = await fetch(downloadUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = defaultFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      return true;
    }
  } catch (err) {
    console.warn('تعذر التنزيل عبر Blob، جاري التنزيل المباشر عبر الرابط:', err);
  }

  // Fallback: إنشاء عنصر رابط مؤقت وتفعيله
  try {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = defaultFilename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (fallbackErr) {
    console.error('فشل تنزيل الملف:', fallbackErr);
    window.open(downloadUrl, '_blank');
    return false;
  }
}

/**
 * رفع ملف (صورة أو فيديو) عبر Cloudinary
 * يستخدم API السيرفر الداخلي أو الرفع المباشر إذا كان Preset متوفراً
 */
export async function uploadMediaToCloudinary(
  file: File,
  folder: string = 'el-waha/units',
  onProgress?: (progress: number) => void,
  options?: UploadOptions
): Promise<CloudinaryUploadResult> {
  const isVideo = file.type.startsWith('video/');
  const kind: 'image' | 'video' = isVideo ? 'video' : 'image';

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // إذا تم تحديد publicId أو overwrite مخصص، نفضل مسار السيرفر الداخلي لضمان التحكم الكامل في الاستبدال والتسمية
  const preferServerUpload = Boolean(options?.publicId || options?.overwrite);

  // الخيار الأول: الرفع المباشر Unsigned إذا تم تحديد Preset و Cloud Name ولم يُطلب publicId مخصص
  if (cloudName && uploadPreset && !preferServerUpload) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);

      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? 'video' : 'image'}/upload`;

      const response = await new Promise<CloudinaryDirectResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint);

        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error('فشل قراءة رد السيرفر'));
            }
          } else {
            reject(new Error(`فشل الرفع المباشر إلى Cloudinary: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('حدث خطأ في شبكة الاتصال بـ Cloudinary'));
        xhr.send(formData);
      });

      return {
        url: response.secure_url || response.url || '',
        kind,
        publicId: response.public_id,
        sizeBytes: response.bytes || file.size,
        format: response.format,
        originalFilename: file.name,
      };
    } catch (presetError) {
      console.warn('فشل الرفع المباشر بـ Preset، جاري المحاولة عبر API الخادم الداخلي:', presetError);
    }
  }

  // الخيار الثاني: الرفع عبر مسار Next.js الداخلي /api/upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  formData.append('kind', kind);
  if (options?.publicId) {
    formData.append('publicId', options.publicId);
  }
  if (options?.overwrite !== undefined) {
    formData.append('overwrite', options.overwrite ? 'true' : 'false');
  }

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            resolve({
              url: data.url,
              kind: data.kind || kind,
              publicId: data.publicId,
              sizeBytes: data.sizeBytes || file.size,
              format: data.format,
              originalFilename: file.name,
            });
          } else {
            reject(new Error(data.error || 'لم يتم استلام رابط الملف'));
          }
        } catch {
          reject(new Error('فشل تحليل استجابة السيرفر'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.error || `خطأ سيرفر: ${xhr.status}`));
        } catch {
          reject(new Error(`خطأ سيرفر: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('تعذر الاتصال بمسار رفع الملفات'));
    xhr.send(formData);
  });
}
