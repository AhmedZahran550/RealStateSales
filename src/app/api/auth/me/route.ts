import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';
import { UserProfile } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'غير مسجل الدخول' },
        { status: 401 }
      );
    }

    // جلب أحدث بيانات الملف الشخصي من قاعدة البيانات
    const { data: dbProfile, error } = await serverSupabase
      .from('profiles')
      .select('*, companies(name)')
      .eq('id', authUser.sub)
      .single();

    if (error || !dbProfile) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على المستخدم' },
        { status: 404 }
      );
    }

    const userProfile: UserProfile = {
      id: dbProfile.id,
      companyId: dbProfile.company_id || undefined,
      companyName: dbProfile.companies?.name || undefined,
      fullName: dbProfile.full_name,
      username: dbProfile.username,
      phone: dbProfile.phone || '',
      role: dbProfile.role,
      createdAt: dbProfile.created_at,
    };

    return NextResponse.json({
      success: true,
      data: userProfile,
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
