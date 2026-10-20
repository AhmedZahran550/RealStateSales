import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/server/supabase';

const VALID_PERIODS = ['morning', 'afternoon', 'evening'];

// واجهة عامة بدون مصادقة: حجز وحدة من زائر الصفحة العامة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صالحة' },
        { status: 400 }
      );
    }

    const companyId: string = body.companyId;
    const unitId: string = body.unitId;
    const customerName: string = (body.customerName || '').trim();
    const phone: string = (body.phone || '').trim();
    const preferredDate: string = (body.preferredDate || '').trim();
    const period: string = (body.period || '').trim();
    const note: string = (body.note || '').trim();

    // 1. التحقق من الحقول المطلوبة
    if (!companyId || !unitId) {
      return NextResponse.json(
        { success: false, error: 'بيانات الوحدة غير مكتملة' },
        { status: 400 }
      );
    }
    if (!customerName || customerName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال الاسم بالكامل' },
        { status: 400 }
      );
    }
    // أرقام الهاتف: 7 إلى 15 رقماً (يدعم الأرقام الدولية)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال رقم هاتف صحيح' },
        { status: 400 }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      return NextResponse.json(
        { success: false, error: 'يرجى اختيار تاريخ صحيح' },
        { status: 400 }
      );
    }
    if (!VALID_PERIODS.includes(period)) {
      return NextResponse.json(
        { success: false, error: 'يرجى اختيار فترة زمنية صحيحة' },
        { status: 400 }
      );
    }
    if (note && note.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'الملاحظات طويلة جداً (الحد الأقصى 1000 حرف)' },
        { status: 400 }
      );
    }

    // 2. التحقق من تفعيل الصفحة العامة للشركة
    const { data: settings } = await serverSupabase
      .from('company_public_settings')
      .select('is_enabled')
      .eq('company_id', companyId)
      .single();

    if (!settings || !settings.is_enabled) {
      return NextResponse.json(
        { success: false, error: 'هذه الصفحة غير متاحة حالياً' },
        { status: 404 }
      );
    }

    // 3. التحقق من أن الوحدة تتبع لنفس الشركة
    const { data: unit } = await serverSupabase
      .from('units')
      .select('id')
      .eq('id', unitId)
      .eq('company_id', companyId)
      .single();

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 404 }
      );
    }

    // 4. إدخال الحجز (الفهرس الفريد يمنع تكرار نفس الهاتف لنفس الوحدة)
    const { error: insertErr } = await serverSupabase
      .from('public_reservations')
      .insert({
        company_id: companyId,
        unit_id: unitId,
        customer_name: customerName,
        phone: phone,
        preferred_date: preferredDate,
        period: period,
        note: note || null,
      });

    if (insertErr) {
      if (insertErr.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: 'تم تسجيل طلب حجز بهذا الرقم لنفس الوحدة بالفعل، سيتواصل معك فريقنا قريباً',
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: insertErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلب الحجز بنجاح، سيتواصل معك أحد موظفي الشركة في أقرب وقت',
    });
  } catch (err: any) {
    console.error('Public reservation API Error:', err);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع في الخادم' },
      { status: 500 }
    );
  }
}
