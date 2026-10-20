import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';

// تعديل/حذف منطقة — الشركة تدير مناطقها فقط، وسوبر أدمن يدير أي شركة
async function loadOwnedZone(id: number, authUser: { role: string; companyId?: string | null }) {
  const { data: zone } = await serverSupabase.from('zones').select('*').eq('id', id).single();
  if (!zone) return { zone: null, error: 'المنطقة غير موجودة' } as const;
  if (authUser.role !== 'super_admin' && zone.company_id !== authUser.companyId) {
    return { zone: null, error: 'ليس لديك صلاحية على هذه المنطقة' } as const;
  }
  return { zone, error: null } as const;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);
    const body = await request.json();

    const zoneId = Number(id);
    if (!Number.isFinite(zoneId)) {
      return NextResponse.json({ success: false, error: 'معرف المنطقة غير صالح' }, { status: 400 });
    }

    const { zone, error: loadErr } = await loadOwnedZone(zoneId, authUser);
    if (loadErr || !zone) {
      return NextResponse.json({ success: false, error: loadErr }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (body.name != null) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json({ success: false, error: 'اسم المنطقة مطلوب' }, { status: 400 });
      }
      const { data: dup } = await serverSupabase
        .from('zones')
        .select('id')
        .eq('company_id', zone.company_id)
        .eq('name', name)
        .neq('id', zoneId)
        .maybeSingle();
      if (dup) {
        return NextResponse.json(
          { success: false, error: 'منطقة بنفس الاسم موجودة بالفعل' },
          { status: 409 }
        );
      }
      updates.name = name;
    }
    if (body.direction != null) updates.direction = String(body.direction).trim();
    if (body.notes !== undefined) updates.notes = body.notes ? String(body.notes).trim() : null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'لا يوجد تعديل' }, { status: 400 });
    }

    const { error } = await serverSupabase.from('zones').update(updates).eq('id', zoneId);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم تحديث المنطقة بنجاح' });
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
    const authUser = await requireAuth(request);

    const zoneId = Number(id);
    if (!Number.isFinite(zoneId)) {
      return NextResponse.json({ success: false, error: 'معرف المنطقة غير صالح' }, { status: 400 });
    }

    const { zone, error: loadErr } = await loadOwnedZone(zoneId, authUser);
    if (loadErr || !zone) {
      return NextResponse.json({ success: false, error: loadErr }, { status: 404 });
    }

    // لا يمكن حذف منطقة بها مبانٍ/وحدات — الوحدات ترث المنطقة عبر المبنى، لذا يكمن فحص المباني
    const { count } = await serverSupabase
      .from('buildings')
      .select('id', { count: 'exact', head: true })
      .eq('zone_id', zoneId);

    if (count && count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `لا يمكن حذف المنطقة لوجود ${count} مبنى فيها — احذف المباني والوحدات أولاً`,
        },
        { status: 409 }
      );
    }

    const { error } = await serverSupabase.from('zones').delete().eq('id', zoneId);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف المنطقة بنجاح' });
  } catch (err: any) {
    return handleApiError(err);
  }
}
