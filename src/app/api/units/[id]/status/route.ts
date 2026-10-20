import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);
    const body = await request.json();

    const newStatus = body.status;
    const oldStatus = body.oldStatus;

    if (!newStatus) {
      return NextResponse.json({ success: false, error: 'الحالة الجديدة مطلوبة' }, { status: 400 });
    }

    const { error } = await serverSupabase
      .from('units')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // تسجيل في سجل التعديلات unit_history
    const statusLabels: Record<string, string> = {
      available: 'متاح',
      reserved: 'محجوز',
      sold: 'تم البيع',
    };
    const oldLabel = oldStatus ? statusLabels[oldStatus] || oldStatus : 'غير محدد';
    const newLabel = statusLabels[newStatus] || newStatus;

    await serverSupabase.from('unit_history').insert({
      unit_id: id,
      changed_by: authUser.sub,
      change_type: 'status_change',
      old_status: oldStatus || null,
      new_status: newStatus,
      details: `تم تغيير حالة الوحدة من [${oldLabel}] إلى [${newLabel}] بواسطة ${authUser.fullName}`,
    });

  // سابقة الأعمال = مبانٍ: عند بيع وحدة، تُضاف القطعة (المبنى) فقط بعد اكتمال بيع جميع وحداتها
  if (newStatus === 'sold' && oldStatus !== 'sold') {
    try {
      const { data: unit } = await serverSupabase
        .from('units')
        .select('id, company_id, building_id, unit_media(storage_path, external_url)')
        .eq('id', id)
        .single();

      if (unit?.building_id) {
        const { data: siblingUnits } = await serverSupabase
          .from('units')
          .select('status')
          .eq('building_id', unit.building_id);

        const allUnitsSold =
          (siblingUnits || []).length > 0 &&
          (siblingUnits || []).every((u: any) => u.status === 'sold');

        if (allUnitsSold) {
          // لا تكرار: عنصر واحد لكل مبنى في الأعمال السابقة
          const { data: existing } = await serverSupabase
            .from('company_gallery_items')
            .select('id')
            .eq('company_id', unit.company_id)
            .eq('building_id', unit.building_id)
            .maybeSingle();

          if (!existing) {
            const { data: building } = await serverSupabase
              .from('buildings')
              .select('plot_no, company_id, zones(name)')
              .eq('id', unit.building_id)
              .single();

            const embeddedZone = Array.isArray(building?.zones) ? building?.zones?.[0] : building?.zones;
          const zoneName = (embeddedZone as any)?.name || '';
            const images = (unit.unit_media || [])
              .map((m: any) => m.storage_path || m.external_url)
              .filter(Boolean);

            await serverSupabase.from('company_gallery_items').insert({
              company_id: building?.company_id || unit.company_id,
              building_id: unit.building_id,
              title: `قطعة ${building?.plot_no ?? '؟'}${zoneName ? ` - ${zoneName}` : ''}`,
              description: null,
              price: null,
              images,
              source: 'auto_sold',
              created_by: authUser.sub,
            });
          }
        }
      }
    } catch (galleryErr: any) {
      console.error('Failed to add sold building to past-work gallery:', galleryErr);
    }
  }
  } catch (err: any) {
    return handleApiError(err);
  }
}
