import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';

// حذف حجز عام: متاح لمدير الشركة أو مدير المنصة فقط
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id } = await params;

    const isSuper = authUser.role === 'super_admin';
    const isCompanyAdmin = authUser.role === 'company_admin' || authUser.role === 'admin';

    // 1. التحقق من صلاحيات الدور
    if (!isSuper && !isCompanyAdmin) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح: حذف الحجوزات متاح لمدير الشركة فقط' },
        { status: 403 }
      );
    }

    // 2. التحقق من وجود الحجز وأنه يتبع لنفس شركة المدير
    const { data: reservation, error: fetchErr } = await serverSupabase
      .from('public_reservations')
      .select('id, company_id')
      .eq('id', id)
      .single();

    if (fetchErr || !reservation) {
      return NextResponse.json(
        { success: false, error: 'الحجز غير موجود' },
        { status: 404 }
      );
    }

    if (!isSuper && authUser.companyId !== reservation.company_id) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك الصلاحية لحذف حجز تابع لشركة أخرى' },
        { status: 403 }
      );
    }

    // 3. حذف الحجز من جدول public_reservations
    const { error: delErr } = await serverSupabase
      .from('public_reservations')
      .delete()
      .eq('id', id);

    if (delErr) {
      return NextResponse.json(
        { success: false, error: delErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف طلب الحجز بنجاح',
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}

