import { NextRequest, NextResponse } from 'next/server';
import { getPublicPageData } from '@/lib/server/public-data';

// واجهة عامة بدون مصادقة: تُغذّي الصفحة العامة للشركة /p/[companyId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getPublicPageData(id);

    if (!result.data) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('Public company API Error:', err);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع في الخادم' },
      { status: 500 }
    );
  }
}
