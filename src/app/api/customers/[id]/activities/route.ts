import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);
    const body = await request.json();

    if (!body.type || !body.note) {
      return NextResponse.json(
        { success: false, error: 'نوع النشاط والملاحظة مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من ملكية الموظف للعميل
    const { data: cust } = await serverSupabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .eq('owner_id', authUser.sub)
      .is('deleted_at', null)
      .maybeSingle();

    if (!cust) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بإضافة نشاط لهذا العميل' },
        { status: 403 }
      );
    }

    const { data, error } = await serverSupabase
      .from('customer_activities')
      .insert({
        customer_id: id,
        type: body.type,
        note: body.note,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        customerId: data.customer_id,
        type: data.type,
        note: data.note,
        createdAt: data.created_at,
        authorName: authUser.fullName,
      },
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
