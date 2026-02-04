"use client";

import React from "react"

import { Pillar, Goal } from '@/lib/types';
import { PILLARS, getPillarStats } from '@/lib/store';
import { Target, Settings, Users, Lightbulb, Heart, ChevronDown, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const pillarIcons: Record<string, React.ReactNode> = {
  target: <Target className="h-5 w-5" />,
  settings: <Settings className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  lightbulb: <Lightbulb className="h-5 w-5" />,
  heart: <Heart className="h-5 w-5" />
};

interface PillarCardProps {
  pillar: Pillar;
  isExpanded?: boolean;
  onToggle?: () => void;
  onAddGoal?: () => void;
  showAddButton?: boolean;
  compact?: boolean;
}

export function PillarCard({ 
  pillar, 
  isExpanded, 
  onToggle, 
  onAddGoal,
  showAddButton = true,
  compact = false
}: PillarCardProps) {
  const stats = getPillarStats(pillar.id);
  
  const progressColor = stats.avgProgress >= 70 
    ? 'text-emerald-600' 
    : stats.avgProgress >= 40 
      ? 'text-amber-600' 
      : 'text-red-600';

  if (compact) {
    return (
      <button
        onClick={onToggle}
        className="flex flex-col items-center p-4 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-all min-w-[140px]"
        style={{ borderColor: `${pillar.color}20` }}
      >
        <div 
          className="h-10 w-10 rounded-xl flex items-center justify-center mb-2"
          style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}
        >
          {pillarIcons[pillar.icon]}
        </div>
        <span className="text-xs font-medium text-slate-700 text-center">{pillar.name}</span>
        <span className="text-lg font-bold mt-1" style={{ color: pillar.color }}>
          {stats.avgProgress}%
        </span>
        <Badge variant="secondary" className="mt-1 text-xs">
          {stats.totalGoals} Goals
        </Badge>
      </button>
    );
  }

  return (
    <div 
      className={cn(
        "rounded-xl bg-white border transition-all",
        isExpanded ? "shadow-lg" : "hover:shadow-md"
      )}
      style={{ borderColor: `${pillar.color}30` }}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div 
            className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}
          >
            {pillarIcons[pillar.icon]}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">{pillar.name}</h3>
            <p className="text-sm text-slate-500">{pillar.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress Ring */}
          <div className="relative h-12 w-12">
            <svg className="h-12 w-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="4"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={pillar.color}
                strokeWidth="4"
                strokeDasharray={`${(stats.avgProgress / 100) * 125.6} 125.6`}
                strokeLinecap="round"
              />
            </svg>
            <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold", progressColor)}>
              {stats.avgProgress}%
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{stats.totalGoals} Goals</Badge>
            {stats.atRisk > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {stats.atRisk} At Risk
              </Badge>
            )}
          </div>

          {/* Expand Icon */}
          <ChevronDown 
            className={cn(
              "h-5 w-5 text-slate-400 transition-transform",
              isExpanded && "rotate-180"
            )} 
          />
        </div>
      </button>

      {/* Add Goal Button */}
      {showAddButton && isExpanded && (
        <div className="px-4 pb-4">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onAddGoal?.();
            }}
            variant="outline" 
            size="sm"
            className="w-full"
            style={{ borderColor: pillar.color, color: pillar.color }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal to {pillar.name}
          </Button>
        </div>
      )}
    </div>
  );
}

interface PillarOverviewProps {
  onPillarClick?: (pillarId: number) => void;
  selectedPillar?: number | null;
}

export function PillarOverview({ onPillarClick, selectedPillar }: PillarOverviewProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {PILLARS.map(pillar => (
        <button
          key={pillar.id}
          onClick={() => onPillarClick?.(pillar.id)}
          className={cn(
            "flex flex-col items-center p-4 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-all min-w-[140px]",
            selectedPillar === pillar.id && "ring-2"
          )}
          style={{ 
            borderColor: selectedPillar === pillar.id ? pillar.color : undefined,
            ringColor: pillar.color 
          }}
        >
          <div 
            className="h-10 w-10 rounded-xl flex items-center justify-center mb-2"
            style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}
          >
            {pillarIcons[pillar.icon]}
          </div>
          <span className="text-xs font-medium text-slate-700 text-center">{pillar.name}</span>
          <span className="text-lg font-bold mt-1" style={{ color: pillar.color }}>
            {getPillarStats(pillar.id).avgProgress}%
          </span>
          <Badge variant="secondary" className="mt-1 text-xs">
            {getPillarStats(pillar.id).totalGoals} Goals
          </Badge>
        </button>
      ))}
    </div>
  );
}
