import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAuth(request, ['super_admin', 'company_admin', 'admin']);
    const body = await request.json();

    const { mapX, mapY } = body;

    const { error } = await serverSupabase
      .from('buildings')
      .update({ map_x: mapX, map_y: mapY })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم تحديث إحداثيات المبنى على الخريطة بنجاح' });
  } catch (err: any) {
    return handleApiError(err);
  }
}
