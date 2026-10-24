import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);

    const buildingId = Number(id);
    if (!Number.isFinite(buildingId)) {
      return NextResponse.json({ success: false, error: 'معرف المبنى غير صالح' }, { status: 400 });
    }

    let query = serverSupabase
      .from('buildings')
      .select(`
        *,
        zones (name, parent_id)
      `)
      .eq('id', buildingId);

    if (authUser.role !== 'super_admin' && authUser.companyId) {
      query = query.or(`company_id.eq.${authUser.companyId},company_id.is.null`);
    }

    const { data: b, error } = await query.maybeSingle();

    if (error || !b) {
      return NextResponse.json({ success: false, error: 'المبنى غير موجود أو غير مصرح بالوصول إليه' }, { status: 404 });
    }

    const building = {
      id: b.id,
      companyId: b.company_id || undefined,
      zoneId: b.zone_id,
      plotNo: b.plot_no,
      landArea: b.land_area ? Number(b.land_area) : undefined,
      features: b.features || [],
      notes: b.notes || undefined,
      mapX: b.map_x !== null ? Number(b.map_x) : undefined,
      mapY: b.map_y !== null ? Number(b.map_y) : undefined,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    };

    return NextResponse.json({ success: true, data: building });
  } catch (err: any) {
    return handleApiError(err);
  }
}

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

    // التحقق من الصلاحية: سوبر أدمن يدير أي مبنى، ومدير الشركة يدير مباني شركته أو المباني غير المنسوبة
    if (authUser.role !== 'super_admin' && building.company_id && building.company_id !== authUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية على هذا المبنى' },
        { status: 403 }
      );
    }

    const updates: Record<string, unknown> = {};

    // إذا كان المبنى بدون شركة، ينسب تلقائياً لشركة المدير القائم بالتعديل
    const activeCompanyId = authUser.role === 'super_admin' ? (body.companyId || building.company_id) : authUser.companyId;
    if (!building.company_id && activeCompanyId) {
      updates.company_id = activeCompanyId;
    }

    // نقل المبنى إلى منطقة أخرى — يجب أن تكون منطقة تابعة لنفس الشركة أو منطقة عامة
    if (body.zoneId != null) {
      const { data: zone } = await serverSupabase
        .from('zones')
        .select('id, company_id')
        .eq('id', body.zoneId)
        .maybeSingle();

      if (!zone) {
        return NextResponse.json({ success: false, error: 'المنطقة غير موجودة' }, { status: 400 });
      }
      const ownerCompanyId = activeCompanyId || building.company_id;
      if (zone.company_id && ownerCompanyId && zone.company_id !== ownerCompanyId) {
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
    if (body.mapX !== undefined) {
      updates.map_x = body.mapX !== null && body.mapX !== '' ? Number(body.mapX) : null;
    }
    if (body.mapY !== undefined) {
      updates.map_y = body.mapY !== null && body.mapY !== '' ? Number(body.mapY) : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'لا يوجد تعديل مطلوب' }, { status: 400 });
    }

    const { data: updatedData, error } = await serverSupabase
      .from('buildings')
      .update(updates)
      .eq('id', buildingId)
      .select('*, companies(name)')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const updatedBuilding = {
      id: Number(updatedData.id),
      companyId: updatedData.company_id || undefined,
      companyName: updatedData.companies?.name || undefined,
      zoneId: Number(updatedData.zone_id),
      plotNo: Number(updatedData.plot_no),
      landArea: updatedData.land_area ? Number(updatedData.land_area) : undefined,
      features: updatedData.features || [],
      notes: updatedData.notes || undefined,
      mapX: updatedData.map_x !== null ? Number(updatedData.map_x) : undefined,
      mapY: updatedData.map_y !== null ? Number(updatedData.map_y) : undefined,
    };

    return NextResponse.json({
      success: true,
      message: 'تم تحديث بيانات المبنى بنجاح',
      data: updatedBuilding,
    });
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
