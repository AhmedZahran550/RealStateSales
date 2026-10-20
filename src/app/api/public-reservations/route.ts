import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';
import { PublicReservation, ReservationPeriod, CustomerStage } from '@/lib/types';

// جلب الحجوزات العامة لفريق الشركة (المدير + الوسطاء)
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    let query = serverSupabase
      .from('public_reservations')
      .select(
        `
        *,
        units (id, plot_no, area, unit_kind),
        claimer:claimed_by (full_name),
        claimed_customer:claimed_customer_id (id, stage)
      `
      )
      .order('created_at', { ascending: false });

    // مدير المنصة يرى الكل، أما باقي الأدوار فيرون شركتهم فقط
    if (authUser.role !== 'super_admin') {
      if (!authUser.companyId) {
        return NextResponse.json({ success: true, data: [] });
      }
      query = query.eq('company_id', authUser.companyId);
    }

    const { data: rows, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const reservations: PublicReservation[] = (rows || []).map((r: any) => ({
      id: r.id,
      companyId: r.company_id,
      unitId: r.unit_id,
      unitLabel: r.units
        ? `وحدة ${r.units.unit_kind} - قطعة ${r.units.plot_no}`
        : undefined,
      unitArea: r.units?.area ? Number(r.units.area) : undefined,
      customerName: r.customer_name,
      phone: r.phone,
      preferredDate: r.preferred_date,
      period: r.period as ReservationPeriod,
      note: r.note || undefined,
      status: r.status,
      claimedBy: r.claimed_by || undefined,
      claimedByName: r.claimer?.full_name || undefined,
      claimedCustomerId: r.claimed_customer?.id || undefined,
      claimedCustomerStage: r.claimed_customer?.stage as CustomerStage | undefined,
      claimedAt: r.claimed_at || undefined,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ success: true, data: reservations });
  } catch (err: any) {
    return handleApiError(err);
  }
}
