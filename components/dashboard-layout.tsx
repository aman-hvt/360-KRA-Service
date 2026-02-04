"use client";

import React from "react"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/lib/role-context';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { currentRole } = useRole();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  useEffect(() => {
    if (!currentRole) {
      router.push('/');
    }
  }, [currentRole, router]);

  if (!currentRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-60'}`}
      >
        <Topbar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
