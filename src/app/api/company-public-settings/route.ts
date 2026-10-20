import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';
import { CompanyPublicSettings } from '@/lib/types';

function mapSettings(companyId: string, s: any): CompanyPublicSettings {
  return {
    companyId,
    isEnabled: s.is_enabled,
    showPrice: s.show_price,
    showArea: s.show_area,
    showFloor: s.show_floor,
    showGarden: s.show_garden,
    showFeatures: s.show_features,
    showDescription: s.show_description,
    showDelivery: s.show_delivery,
    showPayment: s.show_payment,
  };
}

// جلب إعدادات الصفحة العامة لشركة الموظف الحالي
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    if (authUser.role !== 'super_admin' && !authUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'لا توجد شركة مرتبطة بحسابك' },
        { status: 400 }
      );
    }

    const companyId = authUser.companyId as string;

    let { data, error } = await serverSupabase
      .from('company_public_settings')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();

    // إنشاء صف الإعدادات تلقائياً إذا لم يكن موجوداً (للشركات القديمة)
    if (!data && !error) {
      const { data: created, error: createErr } = await serverSupabase
        .from('company_public_settings')
        .insert({ company_id: companyId })
        .select()
        .single();
      data = created;
      error = createErr;
    }

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error?.message || 'فشل جلب الإعدادات' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: mapSettings(companyId, data) });
  } catch (err: any) {
    return handleApiError(err);
  }
}

// تحديث إعدادات الصفحة العامة (مدير الشركة أو مدير المنصة)
export async function PUT(request: NextRequest) {
  try {
    const authUser = await requireAuth(request, ['company_admin', 'super_admin']);
    const body = await request.json();

    if (authUser.role !== 'super_admin' && !authUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'لا توجد شركة مرتبطة بحسابك' },
        { status: 400 }
      );
    }

    const companyId = authUser.companyId as string;

    const updateData: any = { updated_at: new Date().toISOString() };
    if (typeof body.isEnabled === 'boolean') updateData.is_enabled = body.isEnabled;
    if (typeof body.showPrice === 'boolean') updateData.show_price = body.showPrice;
    if (typeof body.showArea === 'boolean') updateData.show_area = body.showArea;
    if (typeof body.showFloor === 'boolean') updateData.show_floor = body.showFloor;
    if (typeof body.showGarden === 'boolean') updateData.show_garden = body.showGarden;
    if (typeof body.showFeatures === 'boolean') updateData.show_features = body.showFeatures;
    if (typeof body.showDescription === 'boolean') updateData.show_description = body.showDescription;
    if (typeof body.showDelivery === 'boolean') updateData.show_delivery = body.showDelivery;
    if (typeof body.showPayment === 'boolean') updateData.show_payment = body.showPayment;

    // ضمان وجود صف الإعدادات قبل التحديث
    // إنشاء/تحديث صف الإعدادات في خطوة واحدة (حتى لو لم توجد إعدادات بعد لشركة جديدة)
    const { data, error } = await serverSupabase
      .from('company_public_settings')
      .upsert({ ...updateData, company_id: companyId }, { onConflict: 'company_id' })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error?.message || 'فشل تحديث الإعدادات' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mapSettings(companyId, data),
      message: 'تم تحديث إعدادات الصفحة العامة بنجاح',
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
