'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { UserProfile, AppRole } from '@/lib/types';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  Phone,
  CheckCircle,
  UserCheck,
  ShieldCheck,
  AtSign,
  User,
} from 'lucide-react';

export default function AdminUsersPage() {
  const { currentUser, users, addUser, deleteUser, setCurrentUser } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>('user');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !username.trim()) {
      setErrorMessage('يرجى كتابة الاسم بالكامل واسم المستخدم.');
      return;
    }

    // التحقق من عدم تكرار اسم المستخدم
    const existing = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (existing) {
      setErrorMessage('اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر.');
      return;
    }

    addUser({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      phone: phone.trim(),
      password: password.trim() || '123456',
      role,
    });

    setFullName('');
    setUsername('');
    setPhone('');
    setPassword('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* الترويسة الرئيسية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              إدارة المستخدمين وحسابات الوسطاء
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              إنشاء حسابات باسم المستخدم وكلمة المرور وتعيين الصلاحيات
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* تنبيه سياسة الحسابات المغلقة */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
        <Shield className="w-5 h-5 flex-shrink-0 text-amber-600" />
        <div>
          <span className="font-bold">سياسة التسجيل الداخلي المعتمد: </span>
          <span>
            التسجيل العام مغلق تماماً. يتم دخول جميع الوسطاء العقاريين باستخدام (اسم المستخدم) و(كلمة المرور) المنشأة حصرياً من قبل مدير النظام.
          </span>
        </div>
      </div>

      {/* جدول الحسابات */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            قائمة المستخدمين المعتمدين ({users.length})
          </h3>
          <span className="text-xs text-slate-400">
            الحساب النشط حالياً: <strong className="text-amber-600">{currentUser?.fullName || 'غير مسجل'}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
              <tr>
                <th className="py-3.5 px-4">الاسم بالكامل</th>
                <th className="py-3.5 px-4">اسم المستخدم للدخول</th>
                <th className="py-3.5 px-4">رقم الهاتف المحمول</th>
                <th className="py-3.5 px-4">نوع الصلاحية</th>
                <th className="py-3.5 px-4">تاريخ الإنشاء</th>
                <th className="py-3.5 px-4 text-center">إجراءات الحساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => {
                const isCurrent = currentUser ? u.id === currentUser.id : false;
                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                      isCurrent ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-600 text-white font-black flex items-center justify-center text-xs">
                          {u.fullName.slice(0, 1)}
                        </div>
                        <div>
                          <span>{u.fullName}</span>
                          {isCurrent && (
                            <span className="mr-2 text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                              حسابك الحالي
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700 dark:text-amber-400">
                      @{u.username}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {u.phone || 'غير مسجل'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          u.role === 'admin'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {u.role === 'admin' ? 'مدير عام للنظام' : 'وسيط عقاري معتمد'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('ar-EG')}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!isCurrent && (
                          <button
                            onClick={() => setCurrentUser(u)}
                            className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                            title="التبديل إلى هذا الحساب فوراً"
                          >
                            دخول كـ
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const newPass = prompt(
                              `أدخل كلمة المرور الجديدة للمستخدم @${u.username}:`,
                              '123456'
                            );
                            if (newPass) {
                              u.password = newPass;
                              alert('تم تحديث كلمة المرور بنجاح.');
                            }
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="تغيير كلمة المرور"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {users.length > 1 && !isCurrent && (
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف حساب ${u.fullName}؟`)) {
                                deleteUser(u.id);
                              }
                            }}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                            title="حذف الحساب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة إضافة مستخدم جديد */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-600" />
              <span>إنشاء حساب وسيط عقاري / مدير جديد</span>
            </h3>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الاسم بالكامل *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: م/ عمرو رضوان"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المستخدم للدخول (UserName) *
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="amr_radwan"
                    className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold font-mono focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">يستخدم هذا الاسم لتسجيل الدخول بدلاً من البريد الإلكتروني</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الهاتف المحمول
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (افتراضياً: 123456)"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نوع الصلاحية
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AppRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="user">وسيط عقاري (متاح له إضافة ومتابعة وحداته وعملائه)</option>
                  <option value="admin">مدير عام للنظام (صلاحية كاملة لجميع الأقسام والمستخدمين)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20"
                >
                  إنشاء الحساب الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
