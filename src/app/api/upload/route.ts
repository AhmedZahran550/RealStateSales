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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'el-waha/units';
    const kind = (formData.get('kind') as string) || 'image';

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
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
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
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء معالجة رفع الملف';
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}

