"use client";

import React from "react"

import { useRouter } from 'next/navigation';
import { useRole } from '@/lib/role-context';
import { Role } from '@/lib/types';
import { Target, Users, Briefcase, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Hardcoded Zoho User IDs for each role
// TODO: Replace these with actual Zoho IDs from your database
const ROLE_ZOHO_IDS: Record<Role, string> = {
  hr: '316554000000301001',       // Replace with actual Zoho ID for HR user
  manager: '316554000000301090',   // Replace with actual Zoho ID for Manager user
  employee: '316554000000293291'   // Replace with actual Zoho ID for Employee user
};

const roleCards: { role: Role; title: string; description: string; icon: React.ReactNode; gradient: string; hoverGlow: string }[] = [
  {
    role: 'hr',
    title: 'HR',
    description: 'Manage organization-wide goals, sync data, and oversee all performance metrics',
    icon: <Briefcase className="h-10 w-10" />,
    gradient: 'from-blue-500 to-blue-700',
    hoverGlow: 'hover:shadow-blue-500/30'
  },
  {
    role: 'manager',
    title: 'Manager',
    description: 'Track team progress, provide feedback, and manage direct reports',
    icon: <Users className="h-10 w-10" />,
    gradient: 'from-emerald-500 to-emerald-700',
    hoverGlow: 'hover:shadow-emerald-500/30'
  },
  {
    role: 'employee',
    title: 'Employee',
    description: 'View your goals, track progress, and receive feedback from peers and managers',
    icon: <Target className="h-10 w-10" />,
    gradient: 'from-violet-500 to-violet-700',
    hoverGlow: 'hover:shadow-violet-500/30'
  }
];

export function LandingPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useRole();
  const { toast } = useToast();

  const handleRoleSelect = async (role: Role) => {
    try {
      clearError();

      // Get the Zoho ID for this role
      const zohoUserId = ROLE_ZOHO_IDS[role];

      // Call login API
      await login(zohoUserId);

      // Show success message
      toast({
        title: "Login successful",
        description: `Welcome! Accessing ${role === 'hr' ? 'HR' : role === 'manager' ? 'Manager' : 'Employee'} dashboard...`,
      });

      // Navigate to dashboard
      router.push('/dashboard');
    } catch (err) {
      // Show error toast
      toast({
        title: "Login failed",
        description: error || "Unable to login. Please try again.",
        variant: "destructive",
      });

      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-900">GoalTrack 360</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Sparkles className="h-4 w-4" />
            <span>Performance Management System</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-4 text-balance">
            360° Feedback & Goal Tracking
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto text-pretty">
            Empower your organization with comprehensive goal management, real-time feedback, and performance insights across all levels.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          {roleCards.map((card) => (
            <button
              key={card.role}
              onClick={() => handleRoleSelect(card.role)}
              disabled={isLoading}
              className={`group relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br ${card.gradient} text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl ${card.hoverGlow} focus:outline-none focus:ring-4 focus:ring-blue-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
              </div>

              <div className="relative z-10">
                <div className="mb-6 p-3 bg-white/20 rounded-xl w-fit backdrop-blur-sm">
                  {card.icon}
                </div>
                <h2 className="text-2xl font-bold mb-3">{card.title}</h2>
                <p className="text-white/80 mb-6 text-sm leading-relaxed">
                  {card.description}
                </p>
                <div className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
                  <span>
                    {isLoading ? 'Logging in...' : `Access as ${card.title}`}
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>

          ))}
        </div>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl w-full">
          {[
            { label: '5 Pillars', desc: 'Structured goal categories' },
            { label: 'Real-time', desc: 'Live progress tracking' },
            { label: '360° Feedback', desc: 'Multi-directional reviews' },
            { label: 'Analytics', desc: 'Performance insights' }
          ].map((feature, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold text-slate-900">{feature.label}</div>
              <div className="text-sm text-slate-600">{feature.desc}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 text-center text-sm text-slate-500">
        <p>Secure, role-based access to performance management</p>
      </footer>
    </div>
  );
}
