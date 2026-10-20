'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
    const existing = (users || []).find(
      (u) => (u.username || '').toLowerCase() === cleanUsername
    );
    if (existing) {
      setCreateError('اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر.');
      return;
    }

    // التحقق من عدم تكرار رقم الهاتف
    if (cleanPhone) {
      const existingPhone = (users || []).find(
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
    setEditFullName(u.fullName || '');
    setEditUsername(u.username || '');
    setEditPhone(u.phone || '');
    setEditPassword('');
    setEditRole(u.role || 'user');
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
    const existing = (users || []).find(
      (u) => u.id !== editingUser.id && (u.username || '').toLowerCase() === cleanUsername
    );
    if (existing) {
      setEditError('اسم المستخدم هذا مسجل مسبقاً لحساب آخر، يرجى اختيار اسم مستخدم آخر.');
      return;
    }

    // التحقق من عدم تكرار رقم الهاتف مع حساب آخر
    if (cleanPhone) {
      const existingPhone = (users || []).find(
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

  const isSuper = currentUser?.role === 'super_admin';
  const isCompAdmin = currentUser?.role === 'company_admin' || currentUser?.role === 'admin';

  // حظر الوصول المباشر للوسطاء غير المدراء
  if (!currentUser || (!isSuper && !isCompAdmin)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white rounded-3xl border border-outline-variant text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-warning-container text-warning flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">
          قسم مخصص لإدارة الشركة والنظام فقط
        </h2>
        <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
          إدارة حسابات الوسطاء والمستخدمين وتعيين الصلاحيات مخصصة حصرياً لمدير الشركة أو مدير المنصة. يمكنك متابعة وحداتك وعملائك من خلال الأقسام المخصصة لك.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-warning hover:bg-warning text-white font-bold text-xs shadow-md transition"
          >
            العودة للرئيسية
          </Link>
          <Link
            href="/units"
            className="px-5 py-2.5 rounded-xl bg-surface-container text-on-surface font-bold text-xs hover:bg-surface-container-high transition"
          >
            استعراض الوحدات
          </Link>
        </div>
      </div>
    );
  }

  // تصفية المستخدمين بحسب الشركة والصلاحية
  const scopedUsers = isSuper
    ? users
    : users.filter((u) => u.companyId === currentUser.companyId);

  // تصفية المستخدمين بحسب البحث
  const filteredUsers = (scopedUsers || []).filter((u) => {
    if (!u) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const usernameMatch = (u.username || '').toLowerCase().includes(q);
    const fullNameMatch = (u.fullName || '').toLowerCase().includes(q);
    const phoneMatch = u.phone ? u.phone.toLowerCase().includes(q) : false;
    return usernameMatch || fullNameMatch || phoneMatch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2.5 bg-surface-container-low text-white rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in border border-outline">
          <CheckCircle className="w-4 h-4 text-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* الترويسة الرئيسية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-outline-variant shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-warning text-white flex items-center justify-center shadow-lg shadow-warning/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-on-surface ">
                {isSuper ? 'إدارة كافة المستخدمين والوسطاء' : `إدارة وسطاء ومبيعات ${currentUser.companyName || 'الشركة'}`}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-warning-container text-warning text-xs font-bold">
                {filteredUsers.length} وسيط مسجل
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {isSuper
                ? 'إدارة الحسابات وكلمات المرور والصلاحيات على مستوى كافة الشركات'
                : 'إضافة حسابات جديدة لوسطاء شركتك، تعيين كلمات المرور، وتحديث بيانات التواصل'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setRole('user');
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-warning hover:bg-warning text-white font-extrabold text-xs shadow-md shadow-warning/30 transition self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ إضافة وسيط جديد</span>
        </button>
      </div>

      {/* تنبيه سياسة الحسابات المغلقة */}
      <div className="p-4 rounded-2xl bg-warning-container border border-warning flex items-center gap-3 text-xs text-warning ">
        <Shield className="w-5 h-5 flex-shrink-0 text-warning" />
        <div>
          <span className="font-bold">صلاحيات المدير العام (Admin): </span>
          <span>
            يمكنك من هنا تعديل اسم أي وسيط، رقم هاتفه المعتمد للتواصل مع العملاء، وكلمة المرور الخاصة بدخوله، بالإضافة لإضافة وحذف الحسابات.
          </span>
        </div>
      </div>

      {/* جدول الحسابات */}
      <div className="bg-white rounded-3xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-sm text-on-surface ">
              قائمة وسطاء الشركة المعتمدين ({scopedUsers.length})
            </h3>
            {searchQuery && (
              <span className="text-[11px] bg-warning-container text-warning px-2 py-0.5 rounded-full font-bold">
                نتائج البحث: {filteredUsers.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex items-center w-full sm:w-64">
              <Search className="w-4 h-4 absolute right-3 text-on-surface-variant pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                placeholder="بحث باسم المستخدم أو الاسم..."
                className="w-full pr-9 pl-8 py-2 rounded-xl text-xs border border-outline-variant bg-white text-on-surface placeholder:text-outline font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 text-on-surface-variant hover:text-on-surface-variant text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <span className="text-xs text-on-surface-variant hidden md:inline">
              الحساب الحالي: <strong className="text-warning">{currentUser?.fullName || 'غير مسجل'}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-bold">
              <tr>
                <th className="py-3.5 px-4">الاسم بالكامل</th>
                <th className="py-3.5 px-4">اسم المستخدم</th>
                <th className="py-3.5 px-4">رقم الهاتف (واتساب)</th>
                <th className="py-3.5 px-4">حالة الحساب</th>
                <th className="py-3.5 px-4">نوع الصلاحية</th>
                <th className="py-3.5 px-4">تاريخ الإنشاء</th>
                <th className="py-3.5 px-4 text-center">إجراءات الحساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant ">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-on-surface-variant font-medium">
                    {searchQuery
                      ? `لا توجد حسابات تطابق بحثك: "${searchQuery}"`
                      : 'لا توجد حسابات مسجلة حالياً'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser ? u.id === currentUser.id : false;
                  const displayName = u.fullName || u.username || 'مستخدم بدون اسم';
                  const avatarLetter = (u.fullName || u.username || 'م').slice(0, 1);

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-surface-container-low  transition ${
                        isCurrent ? 'bg-warning-container/30 ' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-on-surface ">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-warning text-white font-black flex items-center justify-center text-xs">
                            {avatarLetter}
                          </div>
                          <div>
                            <span>{displayName}</span>
                            {isCurrent && (
                              <span className="mr-2 text-[10px] bg-warning-container text-warning font-bold px-2 py-0.5 rounded-full">
                                حسابك الحالي
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-warning ">
                        @{u.username || 'user'}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-on-surface-variant ">
                        {u.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-success" />
                            <span dir="ltr">{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant">لم يُسجل</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-full bg-success-container text-success text-[11px] border border-success ">
                          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                          <span>نشط بالمنظومة</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            u.role === 'admin'
                              ? 'bg-warning-container text-warning border-warning  '
                              : 'bg-surface-container text-on-surface border-outline-variant  '
                          }`}
                        >
                          {u.role === 'admin' ? 'مدير شركة' : 'وسيط عقاري معتمد'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-on-surface-variant" suppressHydrationWarning>
                        {u.createdAt && !isNaN(new Date(u.createdAt).getTime())
                          ? new Date(u.createdAt).toLocaleDateString('ar-EG')
                          : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* زر تعديل بيانات المستخدم */}
                          <button
                            onClick={() => openEditModal(u)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-warning-container hover:bg-warning-container text-warning transition cursor-pointer"
                            title="تعديل بيانات المستخدم ورقم الهاتف وكلمة المرور"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>



                          {users.length > 1 && !isCurrent && (
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف حساب ${displayName} نهائياً؟`)) {
                                  deleteUser(u.id);
                                  showToast(`تم حذف حساب ${displayName}.`);
                                }
                              }}
                              className="p-1.5 rounded-xl text-error hover:bg-error-container transition cursor-pointer"
                              title="حذف الحساب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة تعديل بيانات المستخدم */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-outline-variant shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant mb-4">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-warning" />
                <span>تعديل بيانات المستخدم: @{editingUser.username}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface-variant cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-error-container border border-error text-error text-xs font-bold">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface mb-1">
                  الاسم بالكامل *
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="مثال: أحمد زهران"
                  className="w-full p-2.5 rounded-xl border-2 border-outline-variant bg-white text-on-surface placeholder:text-outline font-bold focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">
                  اسم المستخدم للدخول (UserName) *
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-2.5 text-on-surface-variant font-bold">@</span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="username"
                    className="w-full pl-3 pr-8 py-2.5 rounded-xl border-2 border-outline-variant bg-white text-on-surface placeholder:text-outline font-black font-mono focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs"
                    required
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  يتم حفظ اسم المستخدم دائماً بحروف صغيرة (lowercase) تلقائياً لتسجيل الدخول والبحث
                </p>
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">
                  رقم الهاتف المحمول (للتواصل والواتساب)
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="01122334455"
                  className="w-full p-2.5 rounded-xl border-2 border-outline-variant bg-white text-on-surface placeholder:text-outline font-black font-mono focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">
                  يجب أن يكون رقم الهاتف فريداً لكل مستخدم (غير مكرر) حيث يُستخدم لتسجيل الدخول وعند نسخ أو مشاركة تفاصيل أي وحدة عقارية مع العملاء.
                </p>
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="اترك الحقل فارغاً إذا لم ترغب في التغيير"
                  className="w-full p-2.5 rounded-xl border-2 border-outline-variant bg-white text-on-surface placeholder:text-outline font-bold focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">
                  إذا تركت هذا الحقل فارغاً، ستظل كلمة المرور الحالية كما هي دون تعديل.
                </p>
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">
                  نوع الصلاحية
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as AppRole)}
                  className="w-full p-2.5 rounded-xl border-2 border-outline-variant bg-white text-on-surface font-bold focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs cursor-pointer"
                >
                  <option value="user" className="bg-white text-on-surface ">
                    وسيط عقاري (عرض ومشاركة وحدات محفظة الشركة وإدارة عملائه الخاصة)
                  </option>
                  <option value="admin" className="bg-white text-on-surface ">
                    مدير شركة (المسؤول عن إدارة وحدات ومباني ووسطاء الشركة)
                  </option>
                </select>
              </div>

              <div className="pt-4 border-t border-outline-variant flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-on-surface-variant font-bold hover:bg-surface-container cursor-pointer transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-warning hover:bg-warning text-white font-bold shadow-md shadow-warning/30 cursor-pointer transition disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-outline-variant shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-base text-on-surface mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-warning" />
              <span>إنشاء حساب وسيط عقاري / مدير جديد</span>
            </h3>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-error-container border border-error text-error text-xs font-bold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface mb-1">
                  الاسم بالكامل *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: م/ عمرو رضوان"
                  className="w-full p-2.5 rounded-xl border-2 border-outline-variant bg-white text-on-surface placeholder:text-outline font-bold focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">
                  اسم المستخدم للدخول (UserName) *
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-2.5 text-on-surface-variant font-bold">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="amr_radwan"
                    className="w-full pl-3 pr-8 py-2.5 rounded-xl border-2 border-outline-variant bg-white text-on-surface placeholder:text-outline font-black font-mono focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs"
                    required
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">يتم حفظ اسم المستخدم دائماً بحروف صغيرة (lowercase) تلقائياً لتسجيل الدخول والبحث</p>
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">
                  رقم الهاتف المحمول
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full p-2.5 rounded-xl border-2 border-outline-variant bg-white text-on-surface placeholder:text-outline font-black font-mono focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">يجب أن يكون رقم الهاتف فريداً لكل مستخدم (غير مكرر) حيث يُستخدم لتسجيل الدخول.</p>
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (افتراضياً: 123456)"
                  className="w-full p-2.5 rounded-xl border-2 border-outline-variant bg-white text-on-surface placeholder:text-outline font-bold focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">
                  نوع الصلاحية
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AppRole)}
                  className="w-full p-2.5 rounded-xl border-2 border-outline-variant bg-white text-on-surface font-bold focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs cursor-pointer"
                >
                  <option value="user" className="bg-white text-on-surface ">
                    وسيط عقاري (عرض ومشاركة وحدات محفظة الشركة وإدارة عملائه الخاصة)
                  </option>
                  {isSuper && (
                    <option value="admin" className="bg-white text-on-surface ">
                      مدير شركة (المسؤول عن إدارة وحدات ومباني ووسطاء الشركة)
                    </option>
                  )}
                </select>
              </div>

              <div className="pt-4 border-t border-outline-variant flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-on-surface-variant font-bold hover:bg-surface-container cursor-pointer transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-warning hover:bg-warning text-white font-bold shadow-md shadow-warning/30 cursor-pointer transition"
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
