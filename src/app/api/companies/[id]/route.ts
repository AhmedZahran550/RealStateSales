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
    if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.isActive !== undefined && isSuper) dbUpdates.is_active = updates.isActive;

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
