'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminServicesPage() {
  const router = useRouter();

  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
        <Sparkles className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-stone-900 dark:text-white">
        تم تحديث نظام المواصفات والمميزات
      </h2>
      <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
        تم استبدال دليل الخدمات العام بنظام مميزات المباني والوحدات المباشر مع التوريث الذكي. يمكنك الآن تحديد مميزات المبنى أو الوحدة مباشرة في محفظة الوحدات.
      </p>
      <div className="pt-2">
        <Link
          href="/units"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-sm"
        >
          <span>الانتقال لمحفظة الوحدات</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
