import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);
    const body = await request.json();

    const newStatus = body.status;
    const oldStatus = body.oldStatus;

    if (!newStatus) {
      return NextResponse.json({ success: false, error: 'الحالة الجديدة مطلوبة' }, { status: 400 });
    }

    const { error } = await serverSupabase
      .from('units')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // تسجيل في سجل التعديلات unit_history
    const statusLabels: Record<string, string> = {
      available: 'متاح',
      reserved: 'محجوز',
      sold: 'تم البيع',
    };
    const oldLabel = oldStatus ? statusLabels[oldStatus] || oldStatus : 'غير محدد';
    const newLabel = statusLabels[newStatus] || newStatus;

    await serverSupabase.from('unit_history').insert({
      unit_id: id,
      changed_by: authUser.sub,
      change_type: 'status_change',
      old_status: oldStatus || null,
      new_status: newStatus,
      details: `تم تغيير حالة الوحدة من [${oldLabel}] إلى [${newLabel}] بواسطة ${authUser.fullName}`,
    });

    return NextResponse.json({ success: true, message: 'تم تحديث حالة الوحدة بنجاح' });
  } catch (err: any) {
    return handleApiError(err);
  }
}
