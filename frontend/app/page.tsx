'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ThemeToggle } from './components/Primitives';
import { ShieldCheck, Users, User, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  const roles = [
    {
      id: 'admin',
      title: 'Admin',
      badge: 'SECURE ACCESS',
      desc: 'System administration & full platform control',
      icon: <ShieldCheck className="h-6 w-6 text-indigo-400" />,
      badgeClass: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      linkClass: 'text-indigo-400 hover:text-indigo-300',
    },
    {
      id: 'hr',
      title: 'HR',
      badge: 'OTP VERIFIED',
      desc: 'Human resources management & team oversight',
      icon: <Users className="h-6 w-6 text-amber-500" />,
      badgeClass: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
      linkClass: 'text-amber-500 hover:text-amber-400',
    },
    {
      id: 'employee',
      title: 'Employee',
      badge: 'OTP VERIFIED',
      desc: 'Access your workspace, leaves & payslips',
      icon: <User className="h-6 w-6 text-emerald-500" />,
      badgeClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
      linkClass: 'text-emerald-500 hover:text-emerald-400',
    },
  ];

  const handleCardClick = (roleId: string) => {
    router.push(`/login?role=${roleId}`);
  };

  return (
    <div className="relative min-h-screen bg-background text-text flex flex-col justify-between overflow-hidden">
      {/* Background grid overlay */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Floating Theme Switcher */}
      <ThemeToggle />

      {/* Header Container */}
      <header className="pt-20 px-4 text-center z-10 select-none">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-surface border border-border rounded-full text-xs font-semibold tracking-wide text-text shadow-sm"
        >
          <span className="h-2 w-2 rounded-full bg-status-present animate-pulse" />
          Secure Role-Based Access
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight text-text mt-6"
        >
          Welcome to <span className="text-accent bg-clip-text bg-gradient-to-r from-accent to-amber-500">HRMS Core</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm md:text-base text-text-muted mt-4 max-w-xl mx-auto font-sans"
        >
          Select your role to continue to the appropriate authentication portal.
        </motion.p>
      </header>

      {/* Roles Cards Grid */}
      <main className="max-w-5xl mx-auto px-6 py-12 z-10 w-full">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {roles.map((role) => (
            <motion.div
              key={role.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
              }}
              whileHover={{
                y: -10,
                scale: 1.025,
                rotateX: 4,
                rotateY: -4,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCardClick(role.id)}
              className="bg-surface border border-border rounded-2xl p-8 shadow-lg cursor-pointer hover:shadow-xl hover:border-accent/30 transition-all duration-300 flex flex-col justify-between min-h-[250px] relative overflow-hidden group perspective-1000"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Subtle ambient lighting hover glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="space-y-6" style={{ transform: 'translateZ(20px)' }}>
                {/* Icon box */}
                <div className="h-12 w-12 bg-background border border-border rounded-xl flex items-center justify-center shadow-inner">
                  {role.icon}
                </div>

                <div className="space-y-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-bold tracking-wider font-sans uppercase ${role.badgeClass}`}>
                    {role.badge}
                  </span>
                  <h3 className="text-xl font-semibold text-text font-sans mt-2">{role.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed font-sans mt-1">
                    {role.desc}
                  </p>
                </div>
              </div>

              <div className="pt-6" style={{ transform: 'translateZ(10px)' }}>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors ${role.linkClass}`}>
                  Continue <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 text-center z-10 border-t border-border/20 bg-background/50 backdrop-blur-sm select-none">
        <p className="text-[10px] md:text-xs text-text-muted font-sans font-medium tracking-wide">
          Protected by industry-standard encryption • All sessions are audited
        </p>
      </footer>
    </div>
  );
}
