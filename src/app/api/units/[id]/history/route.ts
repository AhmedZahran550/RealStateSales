import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';
import { UnitHistory } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAuth(request);

    const { data: dbHistory, error } = await serverSupabase
      .from('unit_history')
      .select('*, profiles:changed_by (full_name)')
      .eq('unit_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const history: UnitHistory[] = (dbHistory || []).map((h: any) => ({
      id: h.id,
      unitId: h.unit_id,
      changedBy: h.changed_by,
      changerName: h.profiles?.full_name || 'المستخدم',
      changeType: h.change_type,
      oldStatus: h.old_status,
      newStatus: h.new_status,
      details: h.details,
      changes: h.changes,
      createdAt: h.created_at,
    }));

    return NextResponse.json({ success: true, data: history });
  } catch (err: any) {
    return handleApiError(err);
  }
}
