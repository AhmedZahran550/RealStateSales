import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError, hashPassword } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';
import { UserProfile } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request, ['super_admin', 'company_admin', 'admin']);

    let query = serverSupabase.from('profiles').select('*, companies(name)');

    // Company Admin يرى فقط مستخدمي شركته
    if (authUser.role !== 'super_admin' && authUser.companyId) {
      query = query.eq('company_id', authUser.companyId);
    }

    const { data: dbProfiles, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const users: UserProfile[] = (dbProfiles || []).map((p: any) => ({
      id: p.id,
      companyId: p.company_id || undefined,
      companyName: p.companies?.name || undefined,
      fullName: p.full_name,
      username: p.username,
      phone: p.phone || '',
      role: p.role,
      createdAt: p.created_at,
    }));

    return NextResponse.json({ success: true, data: users });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request, ['super_admin', 'company_admin', 'admin']);
    const body = await request.json();

    const fullName = (body.fullName || '').trim();
    const username = (body.username || '').trim().toLowerCase();
    const phone = (body.phone || '').trim();
    const plainPassword = (body.password || '').trim();

    if (!fullName || !username || !plainPassword) {
      return NextResponse.json(
        { success: false, error: 'الاسم واسم المستخدم وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    // تحديد الشركة والدور
    let assignedCompanyId = body.companyId;
    let assignedRole = body.role || 'user';

    // مدير الشركة يضيف فقط وسطاء تابعين لشركته
    if (authUser.role !== 'super_admin') {
      assignedCompanyId = authUser.companyId;
      assignedRole = 'user';
    }

    // تشفير كلمة المرور بـ bcrypt قبل الحفظ في قاعدة البيانات
    const hashedPassword = await hashPassword(plainPassword);

    const insertData: any = {
      full_name: fullName,
      username,
      password: hashedPassword,
      phone: phone || null,
      role: assignedRole,
      company_id: assignedCompanyId || null,
    };

    if (body.id) {
      insertData.id = body.id;
    }

    const { data, error } = await serverSupabase
      .from('profiles')
      .insert(insertData)
      .select('*, companies(name)')
      .single();

    if (error) {
      if (error.code === '23505') {
        if (error.message?.includes('phone') || error.details?.includes('phone')) {
          return NextResponse.json(
            { success: false, error: 'رقم الهاتف مسجل مسبقاً، يجب أن يكون فريداً لكل حساب' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, error: 'اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر' },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const createdUser: UserProfile = {
      id: data.id,
      companyId: data.company_id || undefined,
      companyName: data.companies?.name || undefined,
      fullName: data.full_name,
      username: data.username,
      phone: data.phone || '',
      role: data.role,
      createdAt: data.created_at,
    };

    return NextResponse.json({
      success: true,
      data: createdUser,
      message: 'تم إنشاء الحساب بنجاح',
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
