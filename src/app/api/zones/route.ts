import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/server/auth';
import { serverSupabase } from '@/lib/server/supabase';
import { Zone } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    const { data: dbZones, error } = await serverSupabase
      .from('zones')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const zones: Zone[] = (dbZones || []).map((z: any) => ({
      id: Number(z.id),
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
