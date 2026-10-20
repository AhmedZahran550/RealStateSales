import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';
import { UNIT_KIND_LABELS } from '@/lib/types';

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

    // نقل الوحدة تلقائياً إلى معرض أعمال سابقة عند بيعها
    if (newStatus === 'sold' && oldStatus !== 'sold') {
      try {
        const { data: unit } = await serverSupabase
          .from('units')
          .select('id, company_id, unit_kind, plot_no, area, price, unit_media(storage_path, external_url)')
          .eq('id', id)
          .single();

        if (unit) {
          // منع التكرار: لا نضيف الوحدة للمعرض أكثر من مرة
          const { data: existing } = await serverSupabase
            .from('company_gallery_items')
            .select('id')
            .eq('company_id', unit.company_id)
            .eq('unit_id', unit.id)
            .maybeSingle();

          if (!existing) {
            const images = (unit.unit_media || [])
              .map((m: any) => m.storage_path || m.external_url)
              .filter(Boolean);

            await serverSupabase.from('company_gallery_items').insert({
              company_id: unit.company_id,
              unit_id: unit.id,
              title: `${UNIT_KIND_LABELS[unit.unit_kind as keyof typeof UNIT_KIND_LABELS] || 'وحدة'} - قطعة ${unit.plot_no}`,
              description: null,
              price: unit.price ? Number(unit.price) : null,
              images,
              source: 'auto_sold',
              created_by: authUser.sub,
            });
          }
        }
      } catch (galleryErr: any) {
        console.error('Failed to add sold unit to gallery:', galleryErr);
      }
    }

    return NextResponse.json({ success: true, message: 'تم تحديث حالة الوحدة بنجاح' });
  } catch (err: any) {
    return handleApiError(err);
  }
}
