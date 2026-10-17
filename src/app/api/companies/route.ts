import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';
import { Company } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const { data: dbCompanies, error } = await serverSupabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const companies: Company[] = (dbCompanies || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      commercialName: c.commercial_name || undefined,
      logoUrl: c.logo_url || undefined,
      phone: c.phone || undefined,
      email: c.email || undefined,
      address: c.address || undefined,
      isActive: c.is_active ?? true,
      createdAt: c.created_at,
    }));

    return NextResponse.json({ success: true, data: companies });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    // يسمح فقط لـ Super Admin بإضافة شركات جديدة
    await requireAuth(request, ['super_admin']);

    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'اسم الشركة مطلوب' }, { status: 400 });
    }

    const insertData: any = {
      name: body.name.trim(),
      commercial_name: body.commercialName || null,
      logo_url: body.logoUrl || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      is_active: body.isActive ?? true,
    };

    if (body.id) {
      insertData.id = body.id;
    }

    const { data, error } = await serverSupabase
      .from('companies')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const createdCompany: Company = {
      id: data.id,
      name: data.name,
      commercialName: data.commercial_name || undefined,
      logoUrl: data.logo_url || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
    };

    return NextResponse.json({
      success: true,
      data: createdCompany,
      message: 'تم إضافة الشركة بنجاح',
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
