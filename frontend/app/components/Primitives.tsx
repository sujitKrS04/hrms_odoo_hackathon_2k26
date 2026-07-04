'use client';

import React from 'react';
import { clsx } from 'clsx';

// PageHeader Component
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-display font-semibold text-text tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-text-muted mt-1 font-sans">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

// Card Component
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Card({ title, subtitle, action, children, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-surface border border-border rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-md",
        className
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between gap-4 mb-6 border-b border-border pb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-text font-sans">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-text-muted mt-0.5 font-sans">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

// FormField Component
interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  textarea?: boolean;
}

export const FormField = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
  ({ label, error, className, textarea = false, id, required, ...props }, ref) => {
    const inputClasses = clsx(
      "w-full px-4 py-2.5 bg-background border rounded-lg text-text text-sm transition-all duration-150 font-sans",
      "placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent",
      error ? "border-status-absent focus:ring-status-absent/20 animate-shake" : "border-border",
      className
    );

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor={id} className="text-xs font-semibold text-text uppercase tracking-wider font-sans flex items-center">
          {label}
          {required && <span className="text-status-absent ml-1">*</span>}
        </label>
        {textarea ? (
          <textarea
            id={id}
            ref={ref as any}
            className={clsx(inputClasses, "resize-none h-24")}
            {...(props as any)}
          />
        ) : (
          <input
            id={id}
            ref={ref as any}
            className={inputClasses}
            {...props}
          />
        )}
        {error ? (
          <span className="text-xs font-semibold text-status-absent mt-0.5 font-sans">
            {error}
          </span>
        ) : (
          <span className="h-4" />
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";

// DataTable Component
export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading,
  emptyMessage = "No data found.",
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full border border-border rounded-xl bg-surface overflow-hidden">
        <div className="border-b border-border p-4 bg-background animate-pulse">
          <div className="h-6 bg-border/60 rounded w-1/4"></div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="h-5 bg-border/40 rounded w-1/4"></div>
              <div className="h-5 bg-border/40 rounded w-1/2"></div>
              <div className="h-5 bg-border/40 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border border-border rounded-xl bg-surface overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-border bg-background/50">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={clsx(
                    "px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-text-muted font-sans"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors duration-150 hover:bg-background/20"
                >
                  {columns.map((col, idx) => {
                    const content =
                      typeof col.accessor === "function"
                        ? col.accessor(row)
                        : (row[col.accessor] as React.ReactNode);
                    return (
                      <td key={idx} className={clsx("px-6 py-4 text-text", col.className)}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
