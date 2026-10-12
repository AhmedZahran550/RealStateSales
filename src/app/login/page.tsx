'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Building2,
  Lock,
  User,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithUsername, users } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!username.trim()) {
      setError('يرجى إدخال اسم المستخدم');
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور');
      setLoading(false);
      return;
    }

    const res = loginWithUsername(username.trim(), password.trim());
    if (res.success) {
      setSuccess(res.message);
      setTimeout(() => {
        router.replace('/');
      }, 600);
    } else {
      setError(res.message);
      setLoading(false);
    }
  };

  const fillCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#131a26] rounded-3xl p-8 border border-amber-200/80 dark:border-amber-900/50 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* توهج ضوئي عنبري خلفي ناعم مريح للعين */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* الشعار والترحيب */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-600/30 mx-auto mb-3">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-900/60 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>منظومة إدارة عقارات الحي المتميز – مدينة بدر</span>
          </div>
          <h1 className="text-2xl font-black text-[#1c1917] dark:text-[#f5f5f4]">
            تسجيل الدخول إلى الواحة
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            قم بتسجيل الدخول لاستعراض عروضك وخريطتك وعملائك
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>{success}</span>
          </div>
        )}

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs relative z-10">
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              اسم المستخدم (UserName)
            </label>
            <div className="relative">
              <span className="absolute right-3.5 top-3 text-stone-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم (مثال: admin أو AhmedZahran)"
                className="w-full pl-4 pr-10 py-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-[#fbf9f6] dark:bg-[#0b0f17] font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              كلمة المرور (Password)
            </label>
            <div className="relative">
              <span className="absolute right-3.5 top-3 text-stone-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-10 py-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-[#fbf9f6] dark:bg-[#0b0f17] font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500 hover:from-amber-800 hover:to-amber-600 text-white font-black text-sm shadow-xl shadow-amber-600/30 transition transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{loading ? 'جارٍ التحقق...' : 'دخول للنظام'}</span>
          </button>
        </form>

        {/* الحسابات المعتمدة من ملف البذور (Seed Data) */}
        <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80 space-y-2.5 relative z-10">
          <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 text-center">
            الحسابات المعتمدة في النظام (اضغط لتعبئة البيانات):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('AhmedZahran', 'Test@1234')}
              className="p-2.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 hover:border-amber-500 text-right bg-[#fbf9f6] dark:bg-[#0b0f17] transition text-xs group"
            >
              <span className="block font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600">
                أحمد زهران
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono block">
                @AhmedZahran (وسيط)
              </span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('admin', 'Admin@1234')}
              className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-amber-500 text-right bg-[#fbf9f6] dark:bg-[#0b0f17] transition text-xs group"
            >
              <span className="block font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600">
                مدير النظام
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono block">
                @admin (مدير عام)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
