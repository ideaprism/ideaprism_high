'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, KeyRound, BarChart3, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminOrgType } from '@/lib/auth-roles';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, partnerName, isLoading, isAuthenticated, organization } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const allowed = isAuthenticated && isAdminOrgType(organization?.orgType);
    if (!allowed) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, organization?.orgType, router]);

  if (isLoading) {
    return <div className="min-h-screen bg-[#F8FAFC]" />;
  }

  if (!isAuthenticated || !isAdminOrgType(organization?.orgType)) {
    return null;
  }

  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: '접수 및 코드 관리', href: '/admin/codes', icon: KeyRound },
    { name: '통계/검색 로그', href: '/admin/stats', icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="fixed inset-y-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white">
        <div className="p-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">
              PRISM <span className="italic text-primary">Admin</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 font-bold transition-all ${
                  isActive
                    ? 'border border-primary/10 bg-primary/5 text-primary'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-6">
          <div className="mb-4 rounded-2xl bg-slate-50 p-4">
            <div className="mb-1 text-xs font-black uppercase tracking-widest text-slate-400">Signed in as</div>
            <div className="truncate text-sm font-black text-slate-900">{partnerName || 'Master Admin'}</div>
          </div>
          <button
            onClick={() => void logout()}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-red-50 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </aside>

      <main className="ml-72 flex-1 p-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

