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
  Edit3,
  X,
  Save,
  Building,
  Search,
} from 'lucide-react';

export default function AdminUsersPage() {
  const {
    currentUser,
    users,
    units,
    addUser,
    deleteUser,
    updateUserProfile,
    updateUserPassword,
    setCurrentUser,
  } = useApp();

  // Search State (lowercased)
  const [searchQuery, setSearchQuery] = useState('');

  // Create User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>('user');
  const [createError, setCreateError] = useState('');

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<AppRole>('user');
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPhone = phone.trim();

    if (!fullName.trim() || !cleanUsername) {
      setCreateError('يرجى كتابة الاسم بالكامل واسم المستخدم.');
      return;
    }

    // التحقق من عدم تكرار اسم المستخدم
    const existing = users.find(
      (u) => u.username.toLowerCase() === cleanUsername
    );
    if (existing) {
      setCreateError('اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر.');
      return;
    }

    // التحقق من عدم تكرار رقم الهاتف
    if (cleanPhone) {
      const existingPhone = users.find(
        (u) => u.phone && u.phone.trim() === cleanPhone
      );
      if (existingPhone) {
        setCreateError(`رقم الهاتف (${cleanPhone}) مسجل مسبقاً للمستخدم "${existingPhone.fullName}"، يجب أن يكون رقم الهاتف فريداً لكل حساب.`);
        return;
      }
    }

    const res = await addUser({
      fullName: fullName.trim(),
      username: cleanUsername,
      phone: cleanPhone,
      password: password.trim() || '123456',
      role,
    });

    if (res.success) {
      setFullName('');
      setUsername('');
      setPhone('');
      setPassword('');
      setIsAddModalOpen(false);
      showToast('تم إنشاء الحساب الجديد بنجاح.');
    } else {
      setCreateError(res.message || 'فشل إنشاء الحساب الجديد.');
    }
  };

  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditUsername(u.username);
    setEditPhone(u.phone || '');
    setEditPassword('');
    setEditRole(u.role);
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');

    const cleanUsername = editUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPhone = editPhone.trim();

    if (!editFullName.trim() || !cleanUsername) {
      setEditError('يرجى إدخال الاسم بالكامل واسم المستخدم.');
      return;
    }

    // التحقق من عدم تكرار اسم المستخدم مع حساب آخر
    const existing = users.find(
      (u) => u.id !== editingUser.id && u.username.toLowerCase() === cleanUsername
    );
    if (existing) {
      setEditError('اسم المستخدم هذا مسجل مسبقاً لحساب آخر، يرجى اختيار اسم مستخدم آخر.');
      return;
    }

    // التحقق من عدم تكرار رقم الهاتف مع حساب آخر
    if (cleanPhone) {
      const existingPhone = users.find(
        (u) => u.id !== editingUser.id && u.phone && u.phone.trim() === cleanPhone
      );
      if (existingPhone) {
        setEditError(`رقم الهاتف (${cleanPhone}) مسجل مسبقاً لحساب "${existingPhone.fullName}"، يجب أن يكون رقم الهاتف فريداً لكل مستخدم.`);
        return;
      }
    }

    setIsSaving(true);
    const updates: Partial<UserProfile> = {
      fullName: editFullName.trim(),
      username: cleanUsername,
      phone: cleanPhone,
      role: editRole,
    };

    if (editPassword.trim()) {
      updates.password = editPassword.trim();
    }

    const res = await updateUserProfile(editingUser.id, updates);
    setIsSaving(false);

    if (res.success) {
      setIsEditModalOpen(false);
      setEditingUser(null);
      showToast(`تم تحديث بيانات المستخدم @${cleanUsername} بنجاح.`);
    } else {
      setEditError(res.message || 'حدث خطأ أثناء حفظ التعديلات في قاعدة البيانات، يرجى المحاولة ثانية.');
    }
  };

  // تصفية المستخدمين بحسب البحث مع تحويل البحث دائماً لحروف صغيرة
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      (u.phone && u.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900 text-white rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in border border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

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
              تعديل بيانات الوسطاء، أرقام الهواتف، كلمات المرور، وإدارة الصلاحيات
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 transition self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* تنبيه سياسة الحسابات المغلقة */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
        <Shield className="w-5 h-5 flex-shrink-0 text-amber-600" />
        <div>
          <span className="font-bold">صلاحيات المدير العام (Admin): </span>
          <span>
            يمكنك من هنا تعديل اسم أي وسيط، رقم هاتفه المعتمد للتواصل مع العملاء، وكلمة المرور الخاصة بدخوله، بالإضافة لإضافة وحذف الحسابات.
          </span>
        </div>
      </div>

      {/* جدول الحسابات */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              قائمة المستخدمين المعتمدين ({users.length})
            </h3>
            {searchQuery && (
              <span className="text-[11px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                نتائج البحث: {filteredUsers.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex items-center w-full sm:w-64">
              <Search className="w-4 h-4 absolute right-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                placeholder="بحث باسم المستخدم أو الاسم..."
                className="w-full pr-9 pl-8 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white placeholder:text-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <span className="text-xs text-slate-400 hidden md:inline">
              الحساب الحالي: <strong className="text-amber-600">{currentUser?.fullName || 'غير مسجل'}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
              <tr>
                <th className="py-3.5 px-4">الاسم بالكامل</th>
                <th className="py-3.5 px-4">اسم المستخدم</th>
                <th className="py-3.5 px-4">رقم الهاتف (واتساب)</th>
                <th className="py-3.5 px-4">الوحدات المسجلة</th>
                <th className="py-3.5 px-4">نوع الصلاحية</th>
                <th className="py-3.5 px-4">تاريخ الإنشاء</th>
                <th className="py-3.5 px-4 text-center">إجراءات الحساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                    لا توجد حسابات تطابق بحثك: &quot;{searchQuery}&quot;
                  </td>
                </tr>
              ) : filteredUsers.map((u) => {
                  const isCurrent = currentUser ? u.id === currentUser.id : false;
                  const userUnitsCount = units.filter((unit) => unit.ownerId === u.id).length;

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
                      {u.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span dir="ltr">{u.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">لم يُسجل</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{userUnitsCount} وحدة</span>
                      </span>
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
                      <div className="flex items-center justify-center gap-1.5">
                        {/* زر تعديل بيانات المستخدم */}
                        <button
                          onClick={() => openEditModal(u)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-200 transition cursor-pointer"
                          title="تعديل بيانات المستخدم ورقم الهاتف وكلمة المرور"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() => setCurrentUser(u)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
                            title="التبديل إلى هذا الحساب فوراً"
                          >
                            دخول كـ
                          </button>
                        )}

                        {users.length > 1 && !isCurrent && (
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف حساب ${u.fullName} نهائياً؟`)) {
                                deleteUser(u.id);
                                showToast(`تم حذف حساب ${u.fullName}.`);
                              }
                            }}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
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

      {/* نافذة تعديل بيانات المستخدم */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <span>تعديل بيانات المستخدم: @{editingUser.username}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  الاسم بالكامل *
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="مثال: أحمد زهران"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  اسم المستخدم للدخول (UserName) *
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">@</span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="username"
                    className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-bold font-mono focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  يتم حفظ اسم المستخدم دائماً بحروف صغيرة (lowercase) تلقائياً لتسجيل الدخول والبحث
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  رقم الهاتف المحمول (للتواصل والواتساب)
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="01122334455"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold font-mono focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  يجب أن يكون رقم الهاتف فريداً لكل مستخدم (غير مكرر) حيث يُستخدم لتسجيل الدخول وعند نسخ أو مشاركة تفاصيل أي وحدة عقارية مع العملاء.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="اترك الحقل فارغاً إذا لم ترغب في التغيير"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  إذا تركت هذا الحقل فارغاً، ستظل كلمة المرور الحالية كما هي دون تعديل.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  نوع الصلاحية
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as AppRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs cursor-pointer"
                >
                  <option value="user" className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">
                    وسيط عقاري (متاح له إضافة ومتابعة وحداته وعملائه)
                  </option>
                  <option value="admin" className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">
                    مدير عام للنظام (إدارة المستخدمين والاطلاع على كافة الوحدات)
                  </option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 cursor-pointer transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إضافة مستخدم جديد */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-600" />
              <span>إنشاء حساب وسيط عقاري / مدير جديد</span>
            </h3>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  الاسم بالكامل *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: م/ عمرو رضوان"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  اسم المستخدم للدخول (UserName) *
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="amr_radwan"
                    className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-bold font-mono focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">يتم حفظ اسم المستخدم دائماً بحروف صغيرة (lowercase) تلقائياً لتسجيل الدخول والبحث</p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  رقم الهاتف المحمول
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold font-mono focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">يجب أن يكون رقم الهاتف فريداً لكل مستخدم (غير مكرر) حيث يُستخدم لتسجيل الدخول.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (افتراضياً: 123456)"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  نوع الصلاحية
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AppRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs cursor-pointer"
                >
                  <option value="user" className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">وسيط عقاري (متاح له إضافة ومتابعة وحداته وعملائه)</option>
                  <option value="admin" className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">مدير عام للنظام (صلاحية كاملة لجميع الأقسام والمستخدمين)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 cursor-pointer transition"
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
