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

    let query = serverSupabase
      .from('units')
      .select(`
        *,
        companies (name),
        buildings (zone_id, plot_no, features),
        unit_media (*)
      `)
      .eq('id', id);

    if (authUser.role !== 'super_admin' && authUser.companyId) {
      query = query.eq('company_id', authUser.companyId);
    }

    const { data: dbUnit, error } = await query.single();

    if (error || !dbUnit) {
      return NextResponse.json({ success: false, error: 'الوحدة غير موجودة أو غير مصرح بالوصول إليها' }, { status: 404 });
    }

    const unit = {
      id: dbUnit.id,
      companyId: dbUnit.company_id || undefined,
      companyName: dbUnit.companies?.name || undefined,
      buildingId: Number(dbUnit.building_id),
      zoneId: dbUnit.buildings?.zone_id || 1,
      plotNo: dbUnit.buildings?.plot_no || 1,
      unitKind: dbUnit.unit_kind,
      floor: dbUnit.floor !== null && dbUnit.floor !== undefined ? Number(dbUnit.floor) : undefined,
      side: dbUnit.side || undefined,
      area: Number(dbUnit.area),
      gardenArea: dbUnit.garden_area ? Number(dbUnit.garden_area) : undefined,
      price: Number(dbUnit.price),
      negotiable: Boolean(dbUnit.negotiable),
      deliveryNote: dbUnit.delivery_note || '',
      paymentTerms: dbUnit.payment_terms || '',
      description: dbUnit.description || '',
      status: dbUnit.status || 'available',
      lat: dbUnit.lat ? Number(dbUnit.lat) : undefined,
      lng: dbUnit.lng ? Number(dbUnit.lng) : undefined,
      media: (dbUnit.unit_media || []).map((m: any) => ({
        id: m.id,
        unitId: m.unit_id,
        ownerId: m.owner_id,
        kind: m.kind || 'image',
        externalUrl: m.external_url,
        caption: m.caption || '',
        createdAt: m.created_at,
      })),
      features: dbUnit.features || [],
      createdAt: dbUnit.created_at,
      updatedAt: dbUnit.updated_at,
    };

    return NextResponse.json({ success: true, data: unit });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);
    const body = await request.json();

    const isSuper = authUser.role === 'super_admin';
    const isCompanyAdmin = authUser.role === 'company_admin' || authUser.role === 'admin';

    // إذا كان وسيطاً، يسمح له بتحديث الحالة فقط
    if (!isSuper && !isCompanyAdmin) {
      if (body.status !== undefined) {
        const { error } = await serverSupabase
          .from('units')
          .update({ status: body.status, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, message: 'تم تحديث حالة الوحدة' });
      }
      return NextResponse.json(
        { success: false, error: 'غير مصرح للوسيط بتعديل تفاصيل الوحدة الكاملة' },
        { status: 403 }
      );
    }

    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (body.unitKind !== undefined) dbUpdates.unit_kind = body.unitKind;
    if (body.floor !== undefined) dbUpdates.floor = body.floor;
    if (body.side !== undefined) dbUpdates.side = body.side;
    if (body.area !== undefined) dbUpdates.area = body.area;
    if (body.gardenArea !== undefined) dbUpdates.garden_area = body.gardenArea;
    if (body.price !== undefined) dbUpdates.price = body.price;
    if (body.negotiable !== undefined) dbUpdates.negotiable = body.negotiable;
    if (body.deliveryNote !== undefined) dbUpdates.delivery_note = body.deliveryNote;
    if (body.paymentTerms !== undefined) dbUpdates.payment_terms = body.paymentTerms;
    if (body.description !== undefined) dbUpdates.description = body.description;
    if (body.status !== undefined) dbUpdates.status = body.status;
    if (body.features !== undefined) dbUpdates.features = body.features;
    if (body.lat !== undefined) dbUpdates.lat = body.lat;
    if (body.lng !== undefined) dbUpdates.lng = body.lng;

    const { error: updateErr } = await serverSupabase
      .from('units')
      .update(dbUpdates)
      .eq('id', id);

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // تحديث الوسائط إن وردت
    if (body.media !== undefined) {
      await serverSupabase.from('unit_media').delete().eq('unit_id', id);
      if (body.media.length > 0) {
        const mediaRows = body.media.map((m: any) => ({
          unit_id: id,
          owner_id: authUser.sub,
          kind: m.kind || 'image',
          external_url: m.externalUrl,
          caption: m.caption || '',
        }));
        await serverSupabase.from('unit_media').insert(mediaRows);
      }
    }

    // تسجيل سجل التعديل
    await serverSupabase.from('unit_history').insert({
      unit_id: id,
      changed_by: authUser.sub,
      change_type: 'details_update',
      details: `تم تحديث تفاصيل الوحدة بواسطة ${authUser.fullName}`,
    });

    return NextResponse.json({ success: true, message: 'تم تحديث الوحدة بنجاح' });
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
    await requireAuth(request, ['super_admin', 'company_admin', 'admin']);

    const { error } = await serverSupabase.from('units').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف الوحدة بنجاح' });
  } catch (err: any) {
    return handleApiError(err);
  }
}
