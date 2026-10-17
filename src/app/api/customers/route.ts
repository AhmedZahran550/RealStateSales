import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';
import { Customer } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    // عزل تام للعملاء: الوسطاء يرون فقط عملاءهم
    const { data: dbCustomers, error: custError } = await serverSupabase
      .from('customers')
      .select(`
        *,
        customer_activities (*),
        customer_units (unit_id),
        profiles:owner_id (full_name)
      `)
      .eq('owner_id', authUser.sub)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (custError) {
      return NextResponse.json({ success: false, error: custError.message }, { status: 500 });
    }

    const customers: Customer[] = (dbCustomers || []).map((c: any) => ({
      id: c.id,
      ownerId: c.owner_id,
      ownerName: c.profiles?.full_name || authUser.fullName,
      name: c.name,
      phone: c.phone,
      whatsapp: c.whatsapp || undefined,
      budget: c.budget ? Number(c.budget) : undefined,
      source: c.source || undefined,
      stage: c.stage,
      nextFollowupAt: c.next_followup_at || undefined,
      notes: c.notes || undefined,
      interestedUnitIds: (c.customer_units || []).map((cu: any) => cu.unit_id),
      activities: (c.customer_activities || [])
        .map((act: any) => ({
          id: act.id,
          customerId: act.customer_id,
          type: act.type,
          note: act.note,
          createdAt: act.created_at,
          authorName: c.profiles?.full_name || authUser.fullName,
        }))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    return NextResponse.json({ success: true, data: customers });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'اسم العميل ورقم هاتفه مطلوبان' },
        { status: 400 }
      );
    }

    const insertData: any = {
      owner_id: authUser.sub,
      name: body.name.trim(),
      phone: body.phone.trim(),
      whatsapp: body.whatsapp ? body.whatsapp.trim() : null,
      budget: body.budget || null,
      source: body.source || null,
      stage: body.stage || 'lead',
      next_followup_at: body.nextFollowupAt || null,
      notes: body.notes || null,
    };

    if (body.id) {
      insertData.id = body.id;
    }

    const { data: newCustomer, error: insertCustErr } = await serverSupabase
      .from('customers')
      .insert(insertData)
      .select()
      .single();

    if (insertCustErr) {
      return NextResponse.json({ success: false, error: insertCustErr.message }, { status: 500 });
    }

    // تسجيل النشاط الأولي
    const initialNote = `تم تسجيل العميل الجديد بواسطة ${authUser.fullName}`;
    await serverSupabase.from('customer_activities').insert({
      customer_id: newCustomer.id,
      type: 'note',
      note: initialNote,
    });

    // ربط الوحدات المهتم بها
    if (body.interestedUnitIds && body.interestedUnitIds.length > 0) {
      const unitRows = body.interestedUnitIds.map((uId: string) => ({
        customer_id: newCustomer.id,
        unit_id: uId,
      }));
      await serverSupabase.from('customer_units').insert(unitRows);
    }

    return NextResponse.json({
      success: true,
      data: newCustomer,
      message: 'تم إضافة العميل بنجاح',
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
