"use client";

import React from "react"

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  className?: string;
}

const colorStyles = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    trend: 'text-blue-600'
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-600',
    trend: 'text-emerald-600'
  },
  purple: {
    bg: 'bg-violet-50',
    icon: 'bg-violet-100 text-violet-600',
    trend: 'text-violet-600'
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-100 text-orange-600',
    trend: 'text-orange-600'
  },
  pink: {
    bg: 'bg-pink-50',
    icon: 'bg-pink-100 text-pink-600',
    trend: 'text-pink-600'
  }
};

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'blue',
  className 
}: StatsCardProps) {
  const styles = colorStyles[color];

  return (
    <div className={cn(
      "p-5 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm text-slate-400">vs last month</span>
            </div>
          )}
        </div>
        
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", styles.icon)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
