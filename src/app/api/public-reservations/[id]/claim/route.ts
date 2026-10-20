import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';

// استلام متابعة حجز عام: أول من يضغط يستلمه (قفل ذري) + إنشاء عميل CRM خاص به
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id } = await params;

    // 1. جلب الحجز والتحقق من بياناته قبل القفل
    const { data: reservation, error: fetchErr } = await serverSupabase
      .from('public_reservations')
      .select('id, company_id, status, customer_name, phone, note, unit_id')
      .eq('id', id)
      .single();

    if (fetchErr || !reservation) {
      return NextResponse.json(
        { success: false, error: 'الحجز غير موجود' },
        { status: 404 }
      );
    }

    // مدير المنصة يتابع أي شركة، أما البقية فشركتهم فقط
    if (authUser.role !== 'super_admin' && authUser.companyId !== reservation.company_id) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء' },
        { status: 403 }
      );
    }

    // 2. محاولة القفل الذري: تحديث مشروط بالحالة 'new' — من يسبق يفوز
    const now = new Date().toISOString();
    const { data: claimed, error: claimErr } = await serverSupabase
      .from('public_reservations')
      .update({ status: 'claimed', claimed_by: authUser.sub, claimed_at: now })
      .eq('id', id)
      .eq('status', 'new')
      .select()
      .single();

    if (claimErr || !claimed) {
      return NextResponse.json(
        { success: false, error: 'تم استلام هذا الحجز من موظف آخر بالفعل' },
        { status: 409 }
      );
    }

    // 3. إنشاء العميل في CRM الموظف المتابع
    const { data: newCustomer, error: customerErr } = await serverSupabase
      .from('customers')
      .insert({
        owner_id: authUser.sub,
        name: reservation.customer_name,
        phone: reservation.phone,
        source: 'حجز من الصفحة العامة',
        stage: 'lead',
        notes: reservation.note
          ? `حجز عام عبر الصفحة العامة - ${reservation.note}`
          : 'حجز عام عبر الصفحة العامة',
      })
      .select()
      .single();

    if (customerErr || !newCustomer) {
      // تراجع عن القفل لكي يتمكن الموظف من المحاولة مجدداً
      await serverSupabase
        .from('public_reservations')
        .update({ status: 'new', claimed_by: null, claimed_at: null })
        .eq('id', id)
        .eq('claimed_by', authUser.sub);
      return NextResponse.json(
        { success: false, error: customerErr?.message || 'فشل إنشاء العميل' },
        { status: 500 }
      );
    }

    // 4. ربط الحجز بالعميل المُنشأ
    await serverSupabase
      .from('public_reservations')
      .update({ claimed_customer_id: newCustomer.id })
      .eq('id', id);

    // 5. تسجيل نشاط أولي للعميل + ربطه بالوحدة محل الاهتمام
    await serverSupabase.from('customer_activities').insert({
      customer_id: newCustomer.id,
      type: 'note',
      note: `تم استلام متابعة الحجز العام بواسطة ${authUser.fullName}`,
    });

    await serverSupabase
      .from('customer_units')
      .insert({ customer_id: newCustomer.id, unit_id: reservation.unit_id });

    return NextResponse.json({
      success: true,
      message: 'تم استلام متابعة الحجز وإنشاء العميل الخاص بك بنجاح',
      data: { customerId: newCustomer.id },
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
