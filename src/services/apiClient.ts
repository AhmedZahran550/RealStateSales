export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// الرابط الأساسي للـ API - يمكن تغييره بسهولة عبر متغير البيئة عند فصل الباك إند
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * عميل موحد للطلبات البرمجية عبر HTTP يسهل نقل واستبدال الباك إند مستقبلاً
 */
export const apiClient = {
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ServiceResult<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // يرسل كوكي auth_token المشفر تلقائياً
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          error: json?.error || `فشل الطلب (${response.status})`,
          message: json?.error,
        };
      }

      return {
        success: json?.success ?? true,
        data: json?.data ?? json,
        message: json?.message,
      };
    } catch (err: any) {
      console.error(`API Client Error [${endpoint}]:`, err);
      return {
        success: false,
        error: err?.message || 'فشل الاتصال بالخادم، يرجى التحقق من الشبكة',
      };
    }
  },

  get<T = any>(endpoint: string, headers?: HeadersInit) {
    return this.request<T>(endpoint, { method: 'GET', headers });
  },

  post<T = any>(endpoint: string, body?: any, headers?: HeadersInit) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  },

  put<T = any>(endpoint: string, body?: any, headers?: HeadersInit) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  },

  patch<T = any>(endpoint: string, body?: any, headers?: HeadersInit) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  },

  delete<T = any>(endpoint: string, body?: any, headers?: HeadersInit) {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  },
};

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
  return error.message || error.error || 'فشلت العملية، يرجى المحاولة لاحقاً';
}
