'use client';

import React from 'react';
import { AuthProvider, useAuth } from '../components/AuthContext';
import { Sidebar } from '../components/Sidebar';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-muted font-sans">
        <svg className="animate-spin h-8 w-8 text-accent mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-semibold tracking-wide">Loading workspace...</span>
      </div>
    );
  }

  if (!user) {
    return null; // AuthProvider handles redirect to /login
  }

  return (
    <div className="flex min-h-screen">
      {/* Navigation - Sidebar left on desktop, bottom navigation on mobile */}
      <Sidebar />

      {/* Main Page scrollable region */}
      <main className="flex-1 bg-background overflow-y-auto pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </AuthProvider>
  );
}
