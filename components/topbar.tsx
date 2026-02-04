"use client";

import { usePathname } from 'next/navigation';
import { useRole } from '@/lib/role-context';
import { Bell, Search, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { notifications } from '@/lib/store';

const roleColors = {
  hr: 'bg-blue-500',
  manager: 'bg-emerald-500',
  employee: 'bg-violet-500'
};

const pathLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/goals': 'Goals Management',
  '/feedback': 'Feedback Center',
  '/sync': 'Sync Status',
  '/reports': 'Reports',
  '/settings': 'Settings'
};

export function Topbar() {
  const pathname = usePathname();
  const { currentRole, currentUser } = useRole();

  if (!currentRole || !currentUser) return null;

  const pathParts = pathname.split('/').filter(Boolean);
  const unreadCount = notifications.filter(n => !n.isRead && n.userId === currentUser.id).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <Home className="h-4 w-4 text-slate-400" />
        {pathParts.map((part, index) => {
          const fullPath = '/' + pathParts.slice(0, index + 1).join('/');
          const label = pathLabels[fullPath] || part.charAt(0).toUpperCase() + part.slice(1);
          const isLast = index === pathParts.length - 1;

          return (
            <div key={fullPath} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <span className={isLast ? "text-slate-900 font-medium" : "text-slate-500"}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search goals, users..."
            className="pl-10 w-64 bg-slate-50 border-slate-200"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate-600" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-2 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications
                .filter(n => n.userId === currentUser.id)
                .slice(0, 5)
                .map(notification => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-pointer">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-slate-900 text-sm">{notification.title}</span>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <span className="text-xs text-slate-500 mt-1">{notification.message}</span>
                  </DropdownMenuItem>
                ))}
              {notifications.filter(n => n.userId === currentUser.id).length === 0 && (
                <div className="p-4 text-center text-sm text-slate-500">
                  No notifications
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className={cn("h-8 w-8", roleColors[currentRole])}>
                <AvatarFallback className="bg-transparent text-white text-xs font-medium">
                  {currentUser.avatar}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium text-slate-700">
                {currentUser.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="p-3 border-b border-slate-200 space-y-1">
              <p className="font-semibold text-slate-900">{currentUser.name}</p>
              <p className="text-xs text-slate-500">{currentUser.designation}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser.email || 'user@example.com'}</p>
              <p className="text-xs text-slate-400 font-mono mt-1">ID: {currentUser.id}</p>
            </div>
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                onClick={() => {
                  /* handle logout if needed */
                  window.location.href = '/';
                }}
              >
                Sign Out
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
