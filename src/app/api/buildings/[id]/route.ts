import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';

// تعديل/حذف مبنى — الشركة تدير مبانيها فقط، وسوبر أدمن يدير أي شركة
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request, ['super_admin', 'company_admin', 'admin']);
    const body = await request.json();

    const buildingId = Number(id);
    if (!Number.isFinite(buildingId)) {
      return NextResponse.json({ success: false, error: 'معرف المبنى غير صالح' }, { status: 400 });
    }

    const { data: building } = await serverSupabase
      .from('buildings')
      .select('id, company_id, zone_id')
      .eq('id', buildingId)
      .maybeSingle();

    if (!building) {
      return NextResponse.json({ success: false, error: 'المبنى غير موجود' }, { status: 404 });
    }
    if (authUser.role !== 'super_admin' && building.company_id !== authUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية على هذا المبنى' },
        { status: 403 }
      );
    }

    const updates: Record<string, unknown> = {};

    // نقل المبنى إلى منطقة أخرى — يجب أن تكون منطقة تابعة لنفس الشركة
    if (body.zoneId != null) {
      const { data: zone } = await serverSupabase
        .from('zones')
        .select('id, company_id')
        .eq('id', body.zoneId)
        .maybeSingle();

      if (!zone) {
        return NextResponse.json({ success: false, error: 'المنطقة غير موجودة' }, { status: 400 });
      }
      if (zone.company_id !== building.company_id) {
        return NextResponse.json(
          { success: false, error: 'المنطقة تابعة لشركة أخرى ولا يمكن نقل المبنى إليها' },
          { status: 403 }
        );
      }
      updates.zone_id = Number(zone.id);
    }

    if (body.plotNo != null) {
      const plotNo = Number(body.plotNo);
      if (!Number.isFinite(plotNo) || plotNo <= 0) {
        return NextResponse.json(
          { success: false, error: 'رقم القطعة غير صالح' },
          { status: 400 }
        );
      }
      updates.plot_no = plotNo;
    }
    if (body.landArea !== undefined) {
      updates.land_area = body.landArea ? Number(body.landArea) : null;
    }
    if (body.features !== undefined) {
      updates.features = Array.isArray(body.features)
        ? body.features.map((f: unknown) => String(f).trim()).filter(Boolean)
        : [];
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes ? String(body.notes).trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'لا يوجد تعديل' }, { status: 400 });
    }

    const { error } = await serverSupabase
      .from('buildings')
      .update(updates)
      .eq('id', buildingId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم تحديث المبنى بنجاح' });
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

    const buildingId = Number(id);
    if (!Number.isFinite(buildingId)) {
      return NextResponse.json({ success: false, error: 'معرف المبنى غير صالح' }, { status: 400 });
    }

    const { data: building } = await serverSupabase
      .from('buildings')
      .select('id, company_id, plot_no')
      .eq('id', buildingId)
      .maybeSingle();

    if (!building) {
      return NextResponse.json({ success: false, error: 'المبنى غير موجود' }, { status: 404 });
    }
    if (authUser.role !== 'super_admin' && building.company_id !== authUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية على هذا المبنى' },
        { status: 403 }
      );
    }

    // لا يمكن حذف مبنى به وحدات — الوحدات تُحذف أولاً
    const { count } = await serverSupabase
      .from('units')
      .select('id', { count: 'exact', head: true })
      .eq('building_id', buildingId);

    if (count && count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `لا يمكن حذف المبنى ${building.plot_no ? `رقم ${building.plot_no}` : ''} لوجود ${count} وحدة فيه — احذف الوحدات أولاً`,
        },
        { status: 409 }
      );
    }

    const { error } = await serverSupabase
      .from('buildings')
      .delete()
      .eq('id', buildingId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف المبنى بنجاح' });
  } catch (err: any) {
    return handleApiError(err);
  }
}
