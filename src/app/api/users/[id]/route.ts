import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError, hashPassword } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);

    // التحقق من الصلاحيات: صاحب الحساب نفسه، أو Super Admin، أو مدير شركته
    const isSelf = authUser.sub === id;
    const isSuper = authUser.role === 'super_admin';
    const isCompanyAdmin = authUser.role === 'company_admin' || authUser.role === 'admin';

    if (!isSelf && !isSuper && !isCompanyAdmin) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بتعديل هذا الحساب' },
        { status: 403 }
      );
    }

    const updates = await request.json();
    const dbUpdates: any = {};

    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName.trim();
    if (updates.username !== undefined) dbUpdates.username = updates.username.trim().toLowerCase();
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone.trim() || null;

    // إذا طلب تحديث كلمة المرور، نقوم بتشفيرها بـ bcrypt
    if (updates.password && updates.password.trim()) {
      dbUpdates.password = await hashPassword(updates.password.trim());
    }

    // تعديل الدور والشركة مقصور على Super Admin و Company Admin
    if (isSuper) {
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.companyId !== undefined) dbUpdates.company_id = updates.companyId || null;
    }

    const { error } = await serverSupabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      if (error.code === '23505') {
        if (error.message?.includes('phone') || error.details?.includes('phone')) {
          return NextResponse.json(
            { success: false, error: 'رقم الهاتف مسجل مسبقاً لحساب آخر' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'اسم المستخدم مسجل مسبقاً لحساب آخر' },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم تحديث الحساب بنجاح' });
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
    const authUser = await requireAuth(request, ['super_admin', 'company_admin', 'admin']);

    if (authUser.sub === id) {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف حسابك الشخصي الحالي' },
        { status: 400 }
      );
    }

    const { error } = await serverSupabase.from('profiles').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف الحساب بنجاح' });
  } catch (err: any) {
    return handleApiError(err);
  }
}
