import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);

    // التحقق من الصلاحيات: Super Admin أو مدير نفس الشركة فقط
    const isSuper = authUser.role === 'super_admin';
    const isOwnCompanyAdmin =
      (authUser.role === 'company_admin' || authUser.role === 'admin') &&
      authUser.companyId === id;

    if (!isSuper && !isOwnCompanyAdmin) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بتعديل بيانات هذه الشركة' },
        { status: 403 }
      );
    }

    const updates = await request.json();
    const dbUpdates: any = { updated_at: new Date().toISOString() };

    if (updates.name !== undefined) dbUpdates.name = updates.name.trim();
    if (updates.commercialName !== undefined) dbUpdates.commercial_name = updates.commercialName;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.isActive !== undefined && isSuper) dbUpdates.is_active = updates.isActive;

    // تحديث المعرف الفريد للرابط العام (Slug) مع التحقق من الفرادة
    if (updates.slug !== undefined) {
      const rawSlug = String(updates.slug || '').trim().toLowerCase();
      const cleanSlug = rawSlug
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      if (cleanSlug) {
        if (cleanSlug.length < 2) {
          return NextResponse.json(
            { success: false, error: 'الاسم المخصص للرابط يجب أن يكون حرفين على الأقل' },
            { status: 400 }
          );
        }
        const { data: existingSlug } = await serverSupabase
          .from('companies')
          .select('id')
          .eq('slug', cleanSlug)
          .neq('id', id)
          .maybeSingle();

        if (existingSlug) {
          return NextResponse.json(
            { success: false, error: 'هذا الاسم المخصص مستخدم بالفعل لشركة أخرى، يرجى اختيار اسم فريد' },
            { status: 400 }
          );
        }
        dbUpdates.slug = cleanSlug;
      } else {
        dbUpdates.slug = null;
      }
    }

    if (updates.logoUrl !== undefined) {
      dbUpdates.logo_url = updates.logoUrl || null;

      // تنظيف الشعار السابق من Cloudinary إذا تم تغييره أو حذفه
      try {
        const { data: existingComp } = await serverSupabase
          .from('companies')
          .select('logo_url')
          .eq('id', id)
          .single();

        const oldLogoUrl = existingComp?.logo_url;
        if (oldLogoUrl && oldLogoUrl !== updates.logoUrl) {
          const { extractCloudinaryPublicId } = await import('@/lib/cloudinary');
          const oldPublicId = extractCloudinaryPublicId(oldLogoUrl);
          if (oldPublicId) {
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const apiKey = process.env.CLOUDINARY_API_KEY;
            const apiSecret = process.env.CLOUDINARY_API_SECRET;
            if (cloudName && apiKey && apiSecret) {
              const { v2: cloudinary } = await import('cloudinary');
              cloudinary.config({
                cloud_name: cloudName,
                api_key: apiKey,
                api_secret: apiSecret,
                secure: true,
              });
              await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
            }
          }
        }
      } catch (cleanupErr) {
        console.warn('تنبيه: تعذر إزالة الشعار السابق من Cloudinary:', cleanupErr);
      }
    }

    const { error } = await serverSupabase
      .from('companies')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم تحديث بيانات الشركة بنجاح' });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // حذف الشركات مقصور حصراً على Super Admin
    await requireAuth(request, ['super_admin']);

    const { error } = await serverSupabase.from('companies').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف الشركة بنجاح' });
  } catch (err: any) {
    return handleApiError(err);
  }
}
