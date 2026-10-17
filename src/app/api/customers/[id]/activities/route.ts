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

    const type = body.type || 'note';
    const note = (body.note || '').trim();

    if (!note) {
      return NextResponse.json({ success: false, error: 'نص النشاط مطلوب' }, { status: 400 });
    }

    const { data: act, error } = await serverSupabase
      .from('customer_activities')
      .insert({
        customer_id: id,
        type,
        note,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    await serverSupabase
      .from('customers')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', authUser.sub);

    return NextResponse.json({
      success: true,
      data: {
        id: act.id,
        customerId: act.customer_id,
        type: act.type,
        note: act.note,
        createdAt: act.created_at,
        authorName: authUser.fullName,
      },
      message: 'تم إضافة النشاط بنجاح',
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
