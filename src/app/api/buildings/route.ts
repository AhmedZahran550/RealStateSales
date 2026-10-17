import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';
import { Building } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    let query = serverSupabase.from('buildings').select('*, companies(name)');

    if (authUser.role !== 'super_admin' && authUser.companyId) {
      query = query.eq('company_id', authUser.companyId);
    }

    const { data: dbBuildings, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const buildings: Building[] = (dbBuildings || []).map((b: any) => ({
      id: Number(b.id),
      companyId: b.company_id || undefined,
      companyName: b.companies?.name || undefined,
      zoneId: Number(b.zone_id),
      plotNo: Number(b.plot_no),
      landArea: b.land_area ? Number(b.land_area) : undefined,
      features: b.features || [],
      mapX: b.map_x ? Number(b.map_x) : undefined,
      mapY: b.map_y ? Number(b.map_y) : undefined,
      notes: b.notes || undefined,
    }));

    return NextResponse.json({ success: true, data: buildings });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request, ['super_admin', 'company_admin', 'admin']);
    const body = await request.json();

    const targetCompanyId = body.companyId || authUser.companyId;

    const upsertData: any = {
      id: body.id || Date.now(),
      company_id: targetCompanyId || null,
      zone_id: body.zoneId,
      plot_no: body.plotNo,
      land_area: body.landArea || null,
      features: body.features || [],
      map_x: body.mapX || null,
      map_y: body.mapY || null,
      notes: body.notes || null,
    };

    const { data, error } = await serverSupabase
      .from('buildings')
      .upsert(upsertData)
      .select('*, companies(name)')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const createdBuilding: Building = {
      id: Number(data.id),
      companyId: data.company_id || undefined,
      companyName: data.companies?.name || undefined,
      zoneId: Number(data.zone_id),
      plotNo: Number(data.plot_no),
      landArea: data.land_area ? Number(data.land_area) : undefined,
      features: data.features || [],
      mapX: data.map_x ? Number(data.map_x) : undefined,
      mapY: data.map_y ? Number(data.map_y) : undefined,
      notes: data.notes || undefined,
    };

    return NextResponse.json({
      success: true,
      data: createdBuilding,
      message: 'تم حفظ المبنى بنجاح',
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
