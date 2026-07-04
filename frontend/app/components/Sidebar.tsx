'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeProvider';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  LogOut,
  Sun,
  Moon,
  Monitor,
  User
} from 'lucide-react';
import { clsx } from 'clsx';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  const role = user.role;

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'hr', 'employee'],
    },
    {
      label: 'Employees',
      href: '/employees',
      icon: Users,
      roles: ['admin', 'hr'],
    },
    {
      label: 'Attendance',
      href: '/attendance',
      icon: CalendarCheck,
      roles: ['admin', 'hr', 'employee'],
    },
    {
      label: 'Time Off',
      href: '/leaves',
      icon: CalendarDays,
      roles: ['admin', 'hr', 'employee'],
    },
    {
      label: 'Payroll',
      href: '/payroll',
      icon: CreditCard,
      roles: ['admin', 'hr'],
    },
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(role));

  const themeCycle: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
  const toggleTheme = () => {
    const currentIndex = themeCycle.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeCycle.length;
    setTheme(themeCycle[nextIndex]);
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="h-5 w-5 text-accent" />;
    if (theme === 'dark') return <Moon className="h-5 w-5 text-accent" />;
    return <Monitor className="h-5 w-5 text-accent" />;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border h-screen sticky top-0 font-sans z-40">
        {/* Brand Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-background font-bold text-lg font-display">
              H
            </div>
            <span className="font-display font-semibold text-lg text-text tracking-tight">
              HRMS Core
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {allowedNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-text-muted hover:bg-background hover:text-text"
                )}
              >
                <Icon className={clsx("h-5 w-5", isActive ? "text-accent" : "text-text-muted")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer controls & Profile */}
        <div className="p-4 border-t border-border space-y-4">
          <div className="flex items-center justify-between px-2">
            <Link
              href={`/employees/${user.id}`}
              className="flex items-center gap-3 hover:opacity-85 transition-opacity"
            >
              <div className="h-9 w-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-semibold text-sm">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-text truncate">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-xs text-text-muted capitalize">
                  {user.role}
                </span>
              </div>
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-background border border-transparent hover:border-border transition-all duration-150"
              title={`Theme: ${theme}`}
            >
              {getThemeIcon()}
            </button>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-status-absent hover:bg-status-absent/10 transition-colors duration-150"
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-2 py-2 flex items-center justify-around z-50 font-sans shadow-lg">
        {allowedNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold transition-all duration-150",
                isActive ? "text-accent" : "text-text-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <Link
          href={`/employees/${user.id}`}
          className={clsx(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-bold transition-all duration-150",
            pathname.startsWith(`/employees/${user.id}`) ? "text-accent" : "text-text-muted"
          )}
        >
          <User className="h-5 w-5" />
          Profile
        </Link>
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1 py-1 px-3 text-text-muted"
        >
          {getThemeIcon()}
          <span className="text-[10px] font-bold capitalize">{theme}</span>
        </button>
      </nav>
    </>
  );
}
