import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// On the server, we use SUPABASE_SERVICE_ROLE_KEY if valid, otherwise fallback to NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !isPlaceholderServiceKey(process.env.SUPABASE_SERVICE_ROLE_KEY)
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// مفاتيح الخدمة الحقيقية JWT حمولتها {"role":"service_role"}؛ أي قيمة أخرى (تعبوية أو anon) تعامل كغير صالحة
function isPlaceholderServiceKey(key: string): boolean {
  const payload = key.split('.')[1] || '';
  if (!payload) return true;
  try {
    const json = JSON.parse(
      decodeBase64Url(payload)
    );
    return json?.role !== 'service_role';
  } catch {
    // حمولة غير JWT (قيمة تعبوية مثل your-…-secret-key)
    return true;
  }
}

function decodeBase64Url(segment: string): string {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(normalized, 'base64').toString('utf8');
  }
  return atob(normalized);
}

if (isPlaceholderServiceKey(process.env.SUPABASE_SERVICE_ROLE_KEY || '')) {
  console.warn(
    '[supabase] SUPABASE_SERVICE_ROLE_KEY is a placeholder — falling back to the anon key. ' +
      'Server-side writes will be blocked by RLS; set the real service_role key from the Supabase dashboard.'
  );
}

export const serverSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
