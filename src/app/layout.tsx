import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Cairo, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import AuthGuard from '@/components/AuthGuard';
import AppShell from '@/components/AppShell';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'عقار سيلز | AqarSales Pro - المنظومة العقارية الذكية',
  description: 'منظومة عقارية متكاملة لإدارة عروض الوحدات، الخريطة التفاعلية، ومتابعة العملاء والمبيعات (CRM)',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${plusJakartaSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface text-on-surface antialiased selection:bg-primary selection:text-white">
        <AppProvider>
          <Suspense>
            <AuthGuard>
              <AppShell>{children}</AppShell>
            </AuthGuard>
          </Suspense>
        </AppProvider>
      </body>
    </html>
  );
}
