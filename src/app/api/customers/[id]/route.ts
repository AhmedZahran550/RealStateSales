import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);

    const { data: c, error } = await serverSupabase
      .from('customers')
      .select(`
        *,
        customer_activities (*),
        customer_units (unit_id),
        profiles:owner_id (full_name)
      `)
      .eq('id', id)
      .eq('owner_id', authUser.sub)
      .is('deleted_at', null)
      .single();

    if (error || !c) {
      return NextResponse.json({ success: false, error: 'العميل غير موجود أو غير مصرح بالوصول إليه' }, { status: 404 });
    }

    const customer = {
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
    };

    return NextResponse.json({ success: true, data: customer });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);
    const body = await request.json();

    const dbUpdate: any = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) dbUpdate.name = body.name.trim();
    if (body.phone !== undefined) dbUpdate.phone = body.phone.trim();
    if (body.whatsapp !== undefined) dbUpdate.whatsapp = body.whatsapp?.trim() || null;
    if (body.budget !== undefined) dbUpdate.budget = body.budget || null;
    if (body.source !== undefined) dbUpdate.source = body.source || null;
    if (body.stage !== undefined) dbUpdate.stage = body.stage;
    if (body.nextFollowupAt !== undefined) dbUpdate.next_followup_at = body.nextFollowupAt || null;
    if (body.notes !== undefined) dbUpdate.notes = body.notes || null;

    const { error } = await serverSupabase
      .from('customers')
      .update(dbUpdate)
      .eq('id', id)
      .eq('owner_id', authUser.sub);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // تحديث الوحدات المهتم بها إن وردت
    if (body.interestedUnitIds !== undefined) {
      await serverSupabase.from('customer_units').delete().eq('customer_id', id);
      if (body.interestedUnitIds.length > 0) {
        const unitRows = body.interestedUnitIds.map((uId: string) => ({
          customer_id: id,
          unit_id: uId,
        }));
        await serverSupabase.from('customer_units').insert(unitRows);
      }
    }

    return NextResponse.json({ success: true, message: 'تم تحديث بيانات العميل بنجاح' });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await requireAuth(request);

    const { error } = await serverSupabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('owner_id', authUser.sub);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف العميل بنجاح' });
  } catch (err: any) {
    return handleApiError(err);
  }
}
