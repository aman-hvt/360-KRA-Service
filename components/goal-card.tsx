"use client";

import { Goal, PILLARS } from '@/lib/types';
import { getUserById, getFeedbackForGoal } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Eye,
  Edit,
  MessageSquare,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GoalCardProps {
  goal: Goal;
  onView?: () => void;
  onEdit?: () => void;
  onFeedback?: () => void;
  showOwner?: boolean;
  showPillar?: boolean;
  showProgress?: boolean;
  compact?: boolean;
}

const priorityColors = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700'
};

const statusConfig = {
  'not-started': { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100' },
  'in-progress': { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-100' },
  'at-risk': { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-100' },
  'completed': { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  'overdue': { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100' }
};

const syncStatusColors = {
  synced: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700'
};

export function GoalCard({
  goal,
  onView,
  onEdit,
  onFeedback,
  showOwner = true,
  showPillar = false,
  showProgress = true,
  compact = false
}: GoalCardProps) {
  const owner = getUserById(goal.ownerId);
  const pillar = PILLARS.find(p => p.id === goal.pillarId);
  const feedbackCount = getFeedbackForGoal(goal.id).length;
  const StatusIcon = statusConfig[goal.status].icon;

  const dueDate = goal.dueDate ? new Date(goal.dueDate) : null;
  const today = new Date();
  const daysRemaining = dueDate && !isNaN(dueDate.getTime())
    ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const isDueSoon = daysRemaining <= 14 && daysRemaining > 0;
  const isOverdue = daysRemaining < 0;

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showPillar && pillar && (
            <div
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: pillar.color }}
            />
          )}
          <span className="font-medium text-slate-900 truncate">{goal.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {showProgress && (
            <>
              <Progress value={goal.progress} className="w-20 h-2" />
              <span className="text-sm font-medium text-slate-600 w-10">{goal.progress}%</span>
            </>
          )}
          <Badge variant="secondary" className={cn("text-xs", priorityColors[goal.priority])}>
            {goal.priority}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {showPillar && pillar && (
              <Badge
                variant="secondary"
                className="text-xs"
                style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}
              >
                {pillar.name}
              </Badge>
            )}
            <Badge variant="secondary" className={cn("text-xs", priorityColors[goal.priority])}>
              {goal.priority}
            </Badge>
            <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs", statusConfig[goal.status].bg)}>
              <StatusIcon className={cn("h-3 w-3", statusConfig[goal.status].color)} />
              <span className={statusConfig[goal.status].color}>{goal.status.replace('-', ' ')}</span>
            </div>
          </div>

          <h4 className="font-semibold text-slate-900 mb-1">{goal.name}</h4>
          <p className="text-sm text-slate-500 line-clamp-2 mb-3">{goal.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {showOwner && owner && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 bg-slate-200">
                  <AvatarFallback className="text-xs">{owner.avatar}</AvatarFallback>
                </Avatar>
                <span className="text-slate-600">{owner.name}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="font-medium">KRA:</span>
              <span>{goal.kra}</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onView && (
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Goal
              </DropdownMenuItem>
            )}
            {onFeedback && (
              <DropdownMenuItem onClick={onFeedback}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Give Feedback
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showProgress && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Progress</span>
            <span className="text-sm font-medium text-slate-900">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Calendar className="h-4 w-4" />
          <span className="font-medium">Start:</span>
          <span>{goal.startDate ? new Date(goal.startDate).toLocaleDateString() : 'N/A'}</span>
        </div>

        <div className={cn(
          "flex items-center gap-1.5",
          isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-slate-500"
        )}>
          <Calendar className="h-4 w-4" />
          <span className="font-medium">Due:</span>
          <span>
            {!dueDate || isNaN(dueDate.getTime())
              ? 'N/A'
              : isOverdue
                ? `${Math.abs(daysRemaining)} days overdue`
                : isDueSoon
                  ? `${daysRemaining} days left`
                  : dueDate.toLocaleDateString()
            }
          </span>
        </div>

        <div className="flex items-center gap-3">
          {feedbackCount > 0 && (
            <div className="flex items-center gap-1 text-slate-500">
              <MessageSquare className="h-4 w-4" />
              <span>{feedbackCount}</span>
            </div>
          )}
          <Badge variant="secondary" className={cn("text-xs", syncStatusColors[goal.syncStatus])}>
            {goal.syncStatus}
          </Badge>
        </div>
      </div>
    </div>
  );
}
