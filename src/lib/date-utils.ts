/**
 * دوال تنسيق التواريخ ومواعيد المتابعة باللغة العربية مع إظهار اسم اليوم بوضوح
 */

export function formatArabicFollowupDate(dateIso?: string | null): {
  dayName: string;
  formattedDate: string;
  formattedTime: string;
  fullBadgeText: string;
  isToday: boolean;
  isOverdue: boolean;
  isTomorrow: boolean;
} {
  if (!dateIso) {
    return {
      dayName: '',
      formattedDate: '',
      formattedTime: '',
      fullBadgeText: 'بدون موعد متابعة',
      isToday: false,
      isOverdue: false,
      isTomorrow: false,
    };
  }

  const d = new Date(dateIso);
  const now = new Date();

  // حساب حالة اليوم والغد والمتأخر
  const dStart = new Date(d).setHours(0, 0, 0, 0);
  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
  const afterTomorrowStart = todayStart + 48 * 60 * 60 * 1000;

  const isToday = dStart === todayStart;
  const isTomorrow = dStart >= tomorrowStart && dStart < afterTomorrowStart;
  const isOverdue = dStart < todayStart;

  // اسم اليوم بالعربية (السبت، الأحد، الاثنين...)
  const dayName = d.toLocaleDateString('ar-EG', { weekday: 'long' });

  // التاريخ (اليوم / الشهر)
  const dayNum = d.getDate();
  const monthName = d.toLocaleDateString('ar-EG', { month: 'short' });
  const formattedDate = `${dayNum} ${monthName}`;

  // الوقت بالساعة والدقيقة (02:30 م)
  const formattedTime = d.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // النص الكامل مع اسم اليوم والوقت
  let fullBadgeText = '';
  if (isOverdue) {
    fullBadgeText = `⚠️ متأخرة (${dayName} ${formattedDate}) • ${formattedTime}`;
  } else if (isToday) {
    fullBadgeText = `🔔 اليوم (${dayName}) • ${formattedTime}`;
  } else if (isTomorrow) {
    fullBadgeText = `🌅 غداً (${dayName}) • ${formattedTime}`;
  } else {
    fullBadgeText = `📅 ${dayName}، ${formattedDate} • ${formattedTime}`;
  }

  return {
    dayName,
    formattedDate,
    formattedTime,
    fullBadgeText,
    isToday,
    isOverdue,
    isTomorrow,
  };
}
