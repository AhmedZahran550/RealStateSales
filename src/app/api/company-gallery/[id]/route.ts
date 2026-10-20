import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';

// حذف عنصر من معرض أعمال سابقة (مدير الشركة)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request, ['company_admin', 'super_admin']);
    const { id } = await params;

    if (authUser.role !== 'super_admin' && !authUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'لا توجد شركة مرتبطة بحسابك' },
        { status: 400 }
      );
    }

    let query = serverSupabase.from('company_gallery_items').delete().eq('id', id);

    if (authUser.role !== 'super_admin') {
      query = query.eq('company_id', authUser.companyId as string);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف العنصر من المعرض بنجاح',
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
