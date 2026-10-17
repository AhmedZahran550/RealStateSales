import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/server/supabase';
import { signJwt, AUTH_COOKIE_NAME, TOKEN_EXPIRY_DAYS } from '@/lib/server/jwt';
import { verifyPassword, hashPassword } from '@/lib/server/auth';
import { UserProfile } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = (body.identifier || '').trim();
    const password = (body.password || '').trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال اسم المستخدم أو رقم الهاتف وكلمة المرور' },
        { status: 400 }
      );
    }

    const sanitized = identifier.replace(/['"(),]/g, '');
    const lowerIdentifier = sanitized.toLowerCase();

    // استعلام مباشر عن المستخدم في قاعدة بيانات سوبابيز
    const { data: dbProfiles, error } = await serverSupabase
      .from('profiles')
      .select('*, companies(name)')
      .or(`username.ilike.${lowerIdentifier},phone.eq.${sanitized}`)
      .limit(1);

    if (error || !dbProfiles || dbProfiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم أو رقم الهاتف غير مسجل في النظام' },
        { status: 401 }
      );
    }

    const profile = dbProfiles[0];

    // التحقق من صحة كلمة المرور المشفّرة
    const isPasswordValid = await verifyPassword(password, profile.password || '');

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // إذا كانت كلمة المرور القديمة نصية عادية غير مشفرة، نقوم بترقيتها وتشفيرها فوراً بـ bcrypt
    if (
      profile.password &&
      !profile.password.startsWith('$2a$') &&
      !profile.password.startsWith('$2b$') &&
      !profile.password.startsWith('$2y$')
    ) {
      const hashed = await hashPassword(password);
      await serverSupabase
        .from('profiles')
        .update({ password: hashed })
        .eq('id', profile.id);
    }

    // إنشاء توكن JWT المشفر
    const token = await signJwt({
      sub: profile.id,
      username: profile.username,
      fullName: profile.full_name,
      role: profile.role,
      companyId: profile.company_id || undefined,
    });

    const userProfile: UserProfile = {
      id: profile.id,
      companyId: profile.company_id || undefined,
      companyName: profile.companies?.name || undefined,
      fullName: profile.full_name,
      username: profile.username,
      phone: profile.phone || '',
      role: profile.role,
      createdAt: profile.created_at,
    };

    const response = NextResponse.json({
      success: true,
      data: userProfile,
      message: `مرحباً بك ${profile.full_name}`,
    });

    // تعيين الكوكي المشفر بحماية كاملة HttpOnly
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * TOKEN_EXPIRY_DAYS,
    });

    return response;
  } catch (err: any) {
    console.error('Login API error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}
