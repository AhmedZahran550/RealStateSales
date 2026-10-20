import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';
import { GalleryItem } from '@/lib/types';

// جلب معرض أعمال سابقة للشركة الحالية
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    if (authUser.role !== 'super_admin' && !authUser.companyId) {
      return NextResponse.json({ success: true, data: [] });
    }

    let query = serverSupabase
      .from('company_gallery_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (authUser.role !== 'super_admin') {
      query = query.eq('company_id', authUser.companyId as string);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const items: GalleryItem[] = (data || []).map((g: any) => ({
      id: g.id,
      companyId: g.company_id,
      unitId: g.unit_id || undefined,
      title: g.title || undefined,
      description: g.description || undefined,
      price: g.price ? Number(g.price) : undefined,
      images: g.images || [],
      source: g.source,
      createdAt: g.created_at,
    }));

    return NextResponse.json({ success: true, data: items });
  } catch (err: any) {
    return handleApiError(err);
  }
}

// إضافة عنصر جديد يدوياً لمعرض أعمال سابقة (مدير الشركة)
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request, ['company_admin', 'super_admin']);
    const body = await request.json();

    if (authUser.role !== 'super_admin' && !authUser.companyId) {
      return NextResponse.json(
        { success: false, error: 'لا توجد شركة مرتبطة بحسابك' },
        { status: 400 }
      );
    }

    const images: string[] = Array.isArray(body.images)
      ? body.images.filter((i: any) => typeof i === 'string' && i.trim()).slice(0, 12)
      : [];

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'يجب إضافة صورة واحدة على الأقل' },
        { status: 400 }
      );
    }

    const { data, error } = await serverSupabase
      .from('company_gallery_items')
      .insert({
        company_id: authUser.companyId,
        title: body.title ? String(body.title).trim() : null,
        description: body.description ? String(body.description).trim() : null,
        price: body.price ? Number(body.price) : null,
        images,
        source: 'manual',
        created_by: authUser.sub,
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error?.message || 'فشل إضافة العنصر' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        companyId: data.company_id,
        unitId: data.unit_id || undefined,
        title: data.title || undefined,
        description: data.description || undefined,
        price: data.price ? Number(data.price) : undefined,
        images: data.images || [],
        source: data.source,
        createdAt: data.created_at,
      } as GalleryItem,
      message: 'تم إضافة العنصر إلى معرض أعمال سابقة بنجاح',
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
