import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// تهيئة إعدادات Cloudinary
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

import { requireAuth, handleApiError } from '@/lib/server/auth';
import { extractCloudinaryPublicId } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error:
            'إعدادات Cloudinary غير مكتملة في الخادم. يرجى التأكد من إضافة NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME و CLOUDINARY_API_KEY و CLOUDINARY_API_SECRET في ملف .env',
        },
        { status: 400 }
      );
    }

    await requireAuth(req);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'el-waha/units';
    const kind = (formData.get('kind') as string) || 'image';
    const customPublicId = (formData.get('publicId') as string) || undefined;
    const shouldOverwrite = formData.get('overwrite') === 'true' || Boolean(customPublicId);

    if (!file) {
      return NextResponse.json({ error: 'لم يتم إرسال أي ملف للرفع' }, { status: 400 });
    }

    const isVideo = kind === 'video' || file.type.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // رفع الملف عبر Cloudinary Stream
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: customPublicId,
          resource_type: resourceType,
          use_filename: !customPublicId,
          unique_filename: !customPublicId,
          overwrite: shouldOverwrite,
          invalidate: true,
        },
        (error, result) => {
          if (error || !result) return reject(error || new Error('فشل استلام نتيجة الرفع'));
          resolve(result);
        }
      );

      stream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url || uploadResult.url,
      publicId: uploadResult.public_id,
      kind: isVideo ? 'video' : 'image',
      format: uploadResult.format,
      sizeBytes: uploadResult.bytes || file.size,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration,
    });
  } catch (error: unknown) {
    console.error('خطأ أثناء رفع الملف إلى Cloudinary:', error);
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error: 'إعدادات Cloudinary غير مكتملة في الخادم',
        },
        { status: 400 }
      );
    }

    await requireAuth(req);

    const body = await req.json().catch(() => ({}));
    let publicId = body.publicId;
    if (!publicId && body.url) {
      publicId = extractCloudinaryPublicId(body.url);
    }

    if (!publicId) {
      return NextResponse.json(
        { error: 'لم يتم تحديد معرف الملف (publicId) أو الرابط للحذف' },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الملف من التخزين بنجاح',
      result,
    });
  } catch (error: unknown) {
    console.error('خطأ أثناء حذف الملف من Cloudinary:', error);
    return handleApiError(error);
  }
}

