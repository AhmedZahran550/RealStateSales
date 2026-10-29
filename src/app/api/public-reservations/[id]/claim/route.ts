import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';

// استلام متابعة حجز عام: إما استلام شخصي مباشر أو إسناد لموظف بالشركة بواسطة المدير
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const targetUserId = body?.targetUserId;

    // 1. جلب الحجز والتحقق من بياناته
    const { data: reservation, error: fetchErr } = await serverSupabase
      .from('public_reservations')
      .select('id, company_id, status, customer_name, phone, note, unit_id, claimed_by, claimed_customer_id')
      .eq('id', id)
      .single();

    if (fetchErr || !reservation) {
      return NextResponse.json(
        { success: false, error: 'الحجز غير موجود' },
        { status: 404 }
      );
    }

    const isSuper = authUser.role === 'super_admin';
    const isCompanyAdmin = authUser.role === 'company_admin' || authUser.role === 'admin';

    // مدير المنصة يتابع أي شركة، أما البقية فشركتهم فقط
    if (!isSuper && authUser.companyId !== reservation.company_id) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء' },
        { status: 403 }
      );
    }

    // 2. التحقق من هوية المستلم المحدد
    let finalAssigneeId = authUser.sub;
    let finalAssigneeName = authUser.fullName;

    // إذا طلب إسناد الحجز لشخص آخر، يجب أن يكون المنفذ مديراً للشركة
    if (targetUserId && targetUserId !== authUser.sub) {
      if (!isSuper && !isCompanyAdmin) {
        return NextResponse.json(
          { success: false, error: 'غير مصرح: إسناد الحجوزات لموظفين آخرين متاح لمدير الشركة فقط' },
          { status: 403 }
        );
      }

      const { data: targetProfile, error: profileErr } = await serverSupabase
        .from('profiles')
        .select('id, company_id, full_name')
        .eq('id', targetUserId)
        .single();

      if (profileErr || !targetProfile) {
        return NextResponse.json(
          { success: false, error: 'الموظف المحدد غير موجود' },
          { status: 404 }
        );
      }

      if (!isSuper && targetProfile.company_id !== reservation.company_id) {
        return NextResponse.json(
          { success: false, error: 'الموظف المحدد لا ينتمي لنفس الشركة' },
          { status: 400 }
        );
      }

      finalAssigneeId = targetProfile.id;
      finalAssigneeName = targetProfile.full_name;
    }

    const now = new Date().toISOString();

    // 3. حالة الحجز الجديد (New Reservation Claim/Assign)
    if (reservation.status === 'new') {
      const { data: claimed, error: claimErr } = await serverSupabase
        .from('public_reservations')
        .update({ status: 'claimed', claimed_by: finalAssigneeId, claimed_at: now })
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

      // إنشاء العميل في CRM الموظف المتابع
      const { data: newCustomer, error: customerErr } = await serverSupabase
        .from('customers')
        .insert({
          owner_id: finalAssigneeId,
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
        // تراجع عن القفل
        await serverSupabase
          .from('public_reservations')
          .update({ status: 'new', claimed_by: null, claimed_at: null })
          .eq('id', id);
        return NextResponse.json(
          { success: false, error: customerErr?.message || 'فشل إنشاء العميل في CRM' },
          { status: 500 }
        );
      }

      // ربط الحجز بالعميل المُنشأ
      await serverSupabase
        .from('public_reservations')
        .update({ claimed_customer_id: newCustomer.id })
        .eq('id', id);

      // تسجيل نشاط أولي للعميل + ربطه بالوحدة محل الاهتمام
      const activityNote =
        targetUserId && targetUserId !== authUser.sub
          ? `تم إسناد متابعة الحجز للموظف ${finalAssigneeName} بواسطة مدير الشركة ${authUser.fullName}`
          : `تم استلام متابعة الحجز بواسطة ${authUser.fullName}`;

      await serverSupabase.from('customer_activities').insert({
        customer_id: newCustomer.id,
        type: 'note',
        note: activityNote,
      });

      await serverSupabase
        .from('customer_units')
        .insert({ customer_id: newCustomer.id, unit_id: reservation.unit_id });

      return NextResponse.json({
        success: true,
        message:
          targetUserId && targetUserId !== authUser.sub
            ? `تم إسناد الحجز للموظف ${finalAssigneeName} بنجاح`
            : 'تم استلام متابعة الحجز بنجاح',
        data: { customerId: newCustomer.id },
      });
    }

    // 4. حالة إعادة إسناد حجز مستلم بالفعل (Re-assignment)
    if (reservation.status === 'claimed') {
      if (!isSuper && !isCompanyAdmin) {
        return NextResponse.json(
          { success: false, error: 'غير مصرح: إعادة إسناد الحجوزات متاحة لمدير الشركة فقط' },
          { status: 403 }
        );
      }

      if (reservation.claimed_by === finalAssigneeId) {
        return NextResponse.json(
          { success: false, error: 'هذا الحجز مسند بالفعل لهذا الموظف' },
          { status: 400 }
        );
      }

      // تحديث الحجز
      await serverSupabase
        .from('public_reservations')
        .update({ claimed_by: finalAssigneeId, claimed_at: now })
        .eq('id', id);

      // نقل ملكية العميل في CRM إن وُجد
      if (reservation.claimed_customer_id) {
        await serverSupabase
          .from('customers')
          .update({ owner_id: finalAssigneeId, updated_at: now })
          .eq('id', reservation.claimed_customer_id);

        await serverSupabase.from('customer_activities').insert({
          customer_id: reservation.claimed_customer_id,
          type: 'note',
          note: `تمت إعادة إسناد متابعة العميل إلى ${finalAssigneeName} بواسطة مدير الشركة ${authUser.fullName}`,
        });
      }

      return NextResponse.json({
        success: true,
        message: `تمت إعادة إسناد الحجز إلى ${finalAssigneeName} بنجاح`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'حالة الحجز غير صالحة للإسناد' },
      { status: 400 }
    );
  } catch (err: any) {
    return handleApiError(err);
  }
}
