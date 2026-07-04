'use client';

import React from 'react';
import { clsx } from 'clsx';

export type StatusDotType = 'present' | 'leave' | 'absent' | 'neutral';

interface StatusDotProps {
  status: StatusDotType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusDot({ status, size = 'md', className }: StatusDotProps) {
  const statusColors: Record<StatusDotType, { dot: string; ping: string }> = {
    present: {
      dot: 'bg-status-present',
      ping: 'bg-status-present/40',
    },
    leave: {
      dot: 'bg-status-leave',
      ping: 'bg-status-leave/40',
    },
    absent: {
      dot: 'bg-status-absent',
      ping: 'bg-status-absent/40',
    },
    neutral: {
      dot: 'bg-status-neutral',
      ping: 'bg-status-neutral/40',
    },
  };

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-5 w-5',
  };

  const colors = statusColors[status] || statusColors.neutral;
  const currentSize = sizeClasses[size];

  return (
    <span className={clsx("relative flex items-center justify-center", currentSize, className)}>
      {/* Outer pulsing ring, respects prefers-reduced-motion */}
      <span className={clsx(
        "absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping",
        colors.ping
      )} />
      {/* Inner solid dot */}
      <span className={clsx(
        "relative inline-flex rounded-full",
        currentSize,
        colors.dot
      )} />
    </span>
  );
}
