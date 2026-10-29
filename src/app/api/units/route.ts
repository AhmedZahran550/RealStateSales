import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';
import { Unit } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    let query = serverSupabase.from('units').select(`
      *,
      companies (name),
      buildings (zone_id, plot_no, features),
      unit_media (*)
    `);

    // غير Super Admin يرى فقط وحدات شركته
    if (authUser.role !== 'super_admin' && authUser.companyId) {
      query = query.eq('company_id', authUser.companyId);
    }

    const { data: dbUnits, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const units: Unit[] = (dbUnits || []).map((u: any) => ({
      id: u.id,
      companyId: u.company_id || undefined,
      companyName: u.companies?.name || undefined,
      buildingId: Number(u.building_id),
      zoneId: u.buildings?.zone_id || 1,
      plotNo: u.buildings?.plot_no || 1,
      unitKind: u.unit_kind,
      floor: u.floor !== null && u.floor !== undefined ? Number(u.floor) : undefined,
      side: u.side || undefined,
      area: Number(u.area),
      gardenArea: u.garden_area ? Number(u.garden_area) : undefined,
      price: Number(u.price),
      negotiable: Boolean(u.negotiable),
      deliveryNote: u.delivery_note || '',
      paymentTerms: u.payment_terms || '',
      description: u.description || '',
      status: u.status || 'available',
      lat: u.lat ? Number(u.lat) : undefined,
      lng: u.lng ? Number(u.lng) : undefined,
      media: (u.unit_media || [])
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((m: any) => ({
          id: m.id,
          unitId: m.unit_id,
          ownerId: m.owner_id,
          kind: m.kind || 'image',
          storagePath: m.storage_path || undefined,
          externalUrl: m.external_url || undefined,
          caption: m.caption || '',
          sortOrder: m.sort_order ?? 0,
          createdAt: m.created_at,
        })),
      features: u.features || [],
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));

    return NextResponse.json({ success: true, data: units });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request, ['super_admin', 'company_admin', 'admin']);
    const body = await request.json();

    const targetCompanyId = body.companyId || authUser.companyId;
    if (!targetCompanyId) {
      return NextResponse.json(
        { success: false, error: 'يجب تحديد الشركة التابعة لها الوحدة' },
        { status: 400 }
      );
    }

    const insertData: any = {
      company_id: targetCompanyId,
      building_id: body.buildingId,
      unit_kind: body.unitKind,
      floor: body.floor !== undefined ? body.floor : null,
      side: body.side || null,
      area: body.area,
      garden_area: body.gardenArea || null,
      price: body.price,
      negotiable: body.negotiable || false,
      delivery_note: body.deliveryNote || null,
      payment_terms: body.paymentTerms || null,
      description: body.description || null,
      status: body.status || 'available',
      lat: body.lat || null,
      lng: body.lng || null,
      features: body.features || [],
    };

    if (body.id) {
      insertData.id = body.id;
    }

    const { data: newUnit, error: unitErr } = await serverSupabase
      .from('units')
      .insert(insertData)
      .select('*, companies(name), buildings(zone_id, plot_no, features)')
      .single();

    if (unitErr) {
      return NextResponse.json({ success: false, error: unitErr.message }, { status: 500 });
    }

    // إدراج وسائط الوحدة إن وجدت
    if (body.media && body.media.length > 0) {
      const mediaRows = body.media.map((m: any, index: number) => ({
        unit_id: newUnit.id,
        owner_id: authUser.sub,
        kind: m.kind || 'image',
        storage_path: m.storagePath || null,
        external_url: m.externalUrl || null,
        caption: m.caption || '',
        sort_order: typeof m.sortOrder === 'number' ? m.sortOrder : index,
      }));
      await serverSupabase.from('unit_media').insert(mediaRows);
    }

    // تسجيل سجل التعديلات unit_history
    await serverSupabase.from('unit_history').insert({
      unit_id: newUnit.id,
      changed_by: authUser.sub,
      change_type: 'created',
      new_status: newUnit.status,
      details: `تمت إضافة الوحدة إلى محفظة الشركة بواسطة ${authUser.fullName}`,
    });

    return NextResponse.json({
      success: true,
      data: newUnit,
      message: 'تم إضافة الوحدة العقارية بنجاح',
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
