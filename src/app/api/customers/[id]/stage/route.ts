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

    const stage = body.stage;
    const note = body.note || `تم تحديث المرحلة إلى [${stage}]`;

    if (!stage) {
      return NextResponse.json({ success: false, error: 'المرحلة الجديدة مطلوبة' }, { status: 400 });
    }

    const { error: updateErr } = await serverSupabase
      .from('customers')
      .update({ stage, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', authUser.sub);

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // تسجيل نشاط تغيير المرحلة
    await serverSupabase.from('customer_activities').insert({
      customer_id: id,
      type: 'stage_change',
      note,
    });

    return NextResponse.json({ success: true, message: 'تم تحديث مرحلة العميل بنجاح' });
  } catch (err: any) {
    return handleApiError(err);
  }
}
