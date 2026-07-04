'use client';

import React, { useEffect, useState } from 'react';
import { StatusDot } from '../components/StatusDot';
import { AuthProvider } from '../components/AuthContext';

const STATIC_DOTS = [
  { id: 1, top: '12%', left: '15%', status: 'present' as const, delay: '0.2s', opacity: 0.3 },
  { id: 2, top: '18%', left: '75%', status: 'leave' as const, delay: '1.1s', opacity: 0.25 },
  { id: 3, top: '32%', left: '25%', status: 'absent' as const, delay: '2.4s', opacity: 0.35 },
  { id: 4, top: '45%', left: '80%', status: 'present' as const, delay: '0.7s', opacity: 0.2 },
  { id: 5, top: '68%', left: '20%', status: 'neutral' as const, delay: '1.9s', opacity: 0.3 },
  { id: 6, top: '82%', left: '70%', status: 'leave' as const, delay: '2.5s', opacity: 0.22 },
  { id: 7, top: '28%', left: '50%', status: 'present' as const, delay: '0.5s', opacity: 0.4 },
  { id: 8, top: '58%', left: '45%', status: 'absent' as const, delay: '1.7s', opacity: 0.28 },
  { id: 9, top: '85%', left: '35%', status: 'neutral' as const, delay: '0.9s', opacity: 0.32 },
  { id: 10, top: '40%', left: '10%', status: 'present' as const, delay: '2.1s', opacity: 0.25 },
  { id: 11, top: '75%', left: '55%', status: 'leave' as const, delay: '1.4s', opacity: 0.3 },
  { id: 12, top: '22%', left: '90%', status: 'present' as const, delay: '0.3s', opacity: 0.2 },
  { id: 13, top: '50%', left: '30%', status: 'neutral' as const, delay: '2.7s', opacity: 0.35 },
  { id: 14, top: '62%', left: '88%', status: 'absent' as const, delay: '1.2s', opacity: 0.24 },
  { id: 15, top: '90%', left: '15%', status: 'present' as const, delay: '0.6s', opacity: 0.4 },
  { id: 16, top: '10%', left: '45%', status: 'leave' as const, delay: '2.0s', opacity: 0.27 },
  { id: 17, top: '38%', left: '65%', status: 'present' as const, delay: '1.5s', opacity: 0.33 },
  { id: 18, top: '78%', left: '92%', status: 'absent' as const, delay: '0.8s', opacity: 0.29 },
  { id: 19, top: '52%', left: '60%', status: 'neutral' as const, delay: '2.3s', opacity: 0.22 },
  { id: 20, top: '95%', left: '65%', status: 'present' as const, delay: '1.0s', opacity: 0.31 }
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col md:flex-row overflow-x-hidden font-sans">
        {/* Left / Top branded panel */}
        <div className="w-full md:w-[45%] h-[15vh] md:h-screen bg-background border-b md:border-b-0 md:border-r border-border relative overflow-hidden flex flex-col justify-center p-6 md:p-12 transition-all">
          {/* Ambient grid of status dots (rendered only on client to ensure delay style consistency) */}
          {mounted && (
            <div className="absolute inset-0 z-0">
              {STATIC_DOTS.map((dot) => (
                <div
                  key={dot.id}
                  className="absolute transition-opacity duration-500"
                  style={{
                    top: dot.top,
                    left: dot.left,
                    opacity: dot.opacity,
                    animationDelay: dot.delay,
                  }}
                >
                  <StatusDot status={dot.status} size="sm" />
                </div>
              ))}
            </div>
          )}

          {/* Branded text overlay */}
          <div className="relative z-10 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center md:h-full gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center text-background font-bold text-xl font-display shadow-sm">
                  H
                </div>
                <h1 className="text-xl md:text-3xl font-display font-semibold text-text tracking-tight">
                  HRMS Core
                </h1>
              </div>
              <p className="hidden md:block text-sm text-text-muted">
                Every workday, perfectly aligned.
              </p>
            </div>
            <p className="md:hidden text-xs text-text-muted font-medium">
              Every workday, perfectly aligned.
            </p>
          </div>
        </div>

        {/* Right / Bottom form container */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-surface">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
