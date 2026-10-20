import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';
import { Zone } from '@/lib/types';

// جلب مناطق الشركة — كل شركة ترى مناطقها فقط (وسوبر أدمن يرى الكل أو شركة محددة بـ ?companyId)
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    let query = serverSupabase.from('zones').select('*').order('id', { ascending: true });

    if (authUser.role !== 'super_admin' && authUser.companyId) {
      query = query.eq('company_id', authUser.companyId);
    } else {
      const requestedCompanyId = request.nextUrl.searchParams.get('companyId');
      if (requestedCompanyId) {
        query = query.eq('company_id', requestedCompanyId);
      }
    }

    const { data: dbZones, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const zones: Zone[] = (dbZones || []).map((z: any) => ({
      id: Number(z.id),
      companyId: z.company_id || undefined,
      parentId: z.parent_id != null ? Number(z.parent_id) : null,
      name: z.name,
      direction: z.direction || '',
      mapX: z.map_x ? Number(z.map_x) : 50,
      mapY: z.map_y ? Number(z.map_y) : 50,
      notes: z.notes || undefined,
    }));

    return NextResponse.json({ success: true, data: zones });
  } catch (err: any) {
    return handleApiError(err);
  }
}

// إضافة منطقة جديدة خاصة بالشركة (مدير الشركة أو سوبر أدمن)
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();

    const targetCompanyId =
      authUser.role === 'super_admin' ? body.companyId || null : authUser.companyId;

    if (!targetCompanyId) {
      return NextResponse.json(
        { success: false, error: 'حدد الشركة المالكة للمنطقة' },
        { status: 400 }
      );
    }

    const name = body.name ? String(body.name).trim() : '';
    if (!name) {
      return NextResponse.json({ success: false, error: 'اسم المنطقة مطلوب' }, { status: 400 });
    }

    // منطقة فرعية؟ يجب أن يكون الأب منطقة رئيسية بنفس الشركة
    let parentId: number | null = null;
    if (body.parentId != null && body.parentId !== '') {
      const { data: parent } = await serverSupabase
        .from('zones')
        .select('id, company_id, parent_id')
        .eq('id', body.parentId)
        .maybeSingle();

      if (!parent) {
        return NextResponse.json({ success: false, error: 'المنطقة الرئيسية غير موجودة' }, { status: 400 });
      }
      if (parent.company_id !== targetCompanyId) {
        return NextResponse.json(
          { success: false, error: 'المنطقة الرئيسية تابعة لشركة أخرى' },
          { status: 403 }
        );
      }
      if (parent.parent_id != null) {
        return NextResponse.json(
          { success: false, error: 'لا يمكن إضافة منطقة فرعية تحت منطقة فرعية (مستويان فقط)' },
          { status: 400 }
        );
      }
      parentId = Number(parent.id);
    }

    const { data: existing } = await serverSupabase
      .from('zones')
      .select('id')
      .eq('company_id', targetCompanyId)
      .eq('name', name)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'منطقة بنفس الاسم موجودة بالفعل' },
        { status: 409 }
      );
    }

    const insertData: Record<string, unknown> = {
      company_id: targetCompanyId,
      parent_id: parentId,
      name,
      direction: body.direction ? String(body.direction).trim() : 'وسط',
      map_x: body.mapX != null ? Number(body.mapX) : 50,
      map_y: body.mapY != null ? Number(body.mapY) : 50,
      notes: body.notes ? String(body.notes).trim() : null,
    };

    const { data, error } = await serverSupabase.from('zones').insert(insertData).select().single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error?.message || 'فشل إضافة المنطقة' },
        { status: 500 }
      );
    }

    const zone: Zone = {
      id: Number(data.id),
      companyId: data.company_id,
      parentId: data.parent_id != null ? Number(data.parent_id) : null,
      name: data.name,
      direction: data.direction || 'وسط',
      mapX: data.map_x ? Number(data.map_x) : 50,
      mapY: data.map_y ? Number(data.map_y) : 50,
      notes: data.notes || undefined,
    };

    return NextResponse.json({
      success: true,
      data: zone,
      message: 'تم إضافة المنطقة بنجاح',
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
