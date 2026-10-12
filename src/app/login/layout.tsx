import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تسجيل الدخول | منظومة الواحة العقارية',
  description: 'تسجيل الدخول لوسطاء وإدارة الحي المتميز بمدينة بدر',
};

// Opt this segment out of instant-navigation validation (Next.js 16)
export const instant = false;

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
