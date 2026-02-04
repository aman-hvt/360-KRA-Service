"use client";

import React from "react"

import { usePathname, useRouter } from 'next/navigation';
import { useRole } from '@/lib/role-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Target,
  MessageSquare,
  RefreshCw,
  BarChart3,
  LogOut,
  ChevronLeft,
  Menu,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState } from 'react';

const roleColors = {
  hr: 'bg-blue-500',
  manager: 'bg-emerald-500',
  employee: 'bg-violet-500'
};

const roleBadgeColors = {
  hr: 'bg-blue-100 text-blue-700',
  manager: 'bg-emerald-100 text-emerald-700',
  employee: 'bg-violet-100 text-violet-700'
};

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: ('hr' | 'manager' | 'employee')[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ['hr', 'manager', 'employee']
  },
  {
    label: 'Goals Management',
    href: '/goals',
    icon: <Target className="h-5 w-5" />,
    roles: ['hr', 'manager', 'employee']
  },
  {
    label: 'Feedback Center',
    href: '/feedback',
    icon: <MessageSquare className="h-5 w-5" />,
    roles: ['hr', 'manager', 'employee']
  },
  {
    label: 'Sync Status',
    href: '/sync',
    icon: <RefreshCw className="h-5 w-5" />,
    roles: ['hr']
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ['hr', 'manager']
  },
  {
    label: 'Request Centre',
    href: '/pending-requests',
    icon: <Clock className="h-5 w-5" />,
    roles: ['hr', 'manager', 'employee']
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentRole, currentUser, logout } = useRole();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!currentRole || !currentUser) return null;

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="h-5 w-5 text-slate-700" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-50 transition-all duration-300 flex flex-col",
          isCollapsed ? "w-20" : "w-60",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className={cn("p-4 border-b border-slate-200", isCollapsed && "px-3")}>
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-slate-900">GoalTrack</span>
              </div>
            )}
            <button
              onClick={() => {
                setIsCollapsed(!isCollapsed);
                setIsMobileOpen(false);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors hidden lg:block"
            >
              <ChevronLeft className={cn("h-4 w-4 text-slate-500 transition-transform", isCollapsed && "rotate-180")} />
            </button>
          </div>
        </div>

        {/* Role Badge */}
        <div className={cn("px-4 py-3", isCollapsed && "px-3")}>
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium w-fit",
            roleBadgeColors[currentRole]
          )}>
            {isCollapsed ? currentRole.charAt(0).toUpperCase() : currentRole.toUpperCase()}
          </div>
        </div>

        {/* User Profile */}
        <div className={cn("px-4 py-3 border-b border-slate-200", isCollapsed && "px-3")}>
          <div className="flex items-center gap-3">
            <Avatar className={cn("h-10 w-10", roleColors[currentRole])}>
              <AvatarFallback className="bg-transparent text-white text-sm font-medium">
                {currentUser.avatar}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser.designation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setIsMobileOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  isCollapsed && "justify-center"
                )}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className={cn("p-4 border-t border-slate-200", isCollapsed && "p-3")}>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Change Role</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
