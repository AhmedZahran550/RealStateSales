import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * دالة مساعدة لإنشاء معرفات UUID فريدة متوافقة مع المتصفحات
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * معالج موحد لأخطاء قاعدة البيانات والـ API
 */
export function parseApiError(error: any): string {
  if (!error) return 'حدث خطأ غير متوقع';
  if (typeof error === 'string') return error;

  // فحص أخطاء القيود في Postgres (Unique Constraint Violation)
  if (error.code === '23505') {
    const details = (error.details || error.message || '').toLowerCase();
    if (details.includes('phone')) {
      return 'رقم الهاتف مسجل مسبقاً، يرجى استخدام رقم هاتف آخر.';
    }
    if (details.includes('username')) {
      return 'اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم آخر.';
    }
    return 'هذا السجل مسجل مسبقاً في النظام.';
  }

  return error.message || error.details || 'فشلت العملية، يرجى التحقق من الاتصال بالشبكة.';
}

export { supabase, isSupabaseConfigured };
