"use client";

import React from "react"

// cleaned up duplicate import
import { Goal, PILLARS, Feedback } from '@/lib/types';
import { getUserById, goals, users } from '@/lib/store';
import { useRole } from '@/lib/role-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

import { useState, useEffect } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: Partial<Feedback>) => void;
  preselectedGoal?: Goal | null;
}

export function FeedbackModal({ isOpen, onClose, onSubmit, preselectedGoal }: FeedbackModalProps) {
  const { currentUser } = useRole();
  const [selectedGoalId, setSelectedGoalId] = useState(preselectedGoal?.id || '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedPillarId, setSelectedPillarId] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Sync state when preselected goal changes or modal opens
  useEffect(() => {
    if (isOpen && preselectedGoal) {
      setSelectedGoalId(preselectedGoal.id);
    }
  }, [isOpen, preselectedGoal]);

  // Determine selected goal:
  // 1. If preselectedGoal is present AND matches selectedGoalId, use it (API data case)
  // 2. Otherwise try finding it in local store (Fallback/Legacy case)
  const selectedGoal = (preselectedGoal && preselectedGoal.id === selectedGoalId)
    ? preselectedGoal
    : goals.find(g => g.id === selectedGoalId);
  const pillar = selectedGoal ? PILLARS.find(p => p.id === selectedGoal.pillarId) : null;
  const goalOwner = selectedGoal ? getUserById(selectedGoal.ownerId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !currentUser) return;

    if (rating === 0) {
      // Small visual feedback if rating is missing
      setHoverRating(0);
      return;
    }

    onSubmit({
      goalId: selectedGoal.id,
      providerId: currentUser.id,
      recipientId: selectedGoal.ownerId,
      rating,
      comment,
      isAnonymous,
      createdAt: new Date().toISOString()
    });

    // Reset form
    setSelectedGoalId('');
    setSelectedEmployeeId('');
    setSelectedPillarId('');
    setRating(0);
    setHoverRating(0);
    setComment('');
    setIsAnonymous(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Give Feedback</DialogTitle>
          <DialogDescription>
            Share your feedback for the selected goal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-6 -mr-6 px-1">
          <form onSubmit={handleSubmit} className="space-y-6 pb-6">
            {/* Goal Selection */}
            {!preselectedGoal && (
              <div className="space-y-4">
                {/* Step 1: Select Employee */}
                <div className="space-y-2">
                  <Label>Select Employee</Label>
                  <Select
                    value={selectedEmployeeId}
                    onValueChange={(val) => {
                      setSelectedEmployeeId(val);
                      setSelectedPillarId('');
                      setSelectedGoalId('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a colleague" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(u => u.role === 'employee' && u.id !== currentUser?.id)
                        .map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 bg-slate-200">
                                <AvatarFallback>{user.avatar}</AvatarFallback>
                              </Avatar>
                              {user.name}
                            </div>
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 2: Select Pillar */}
                {selectedEmployeeId && (
                  <div className="space-y-2">
                    <Label>Select Pillar</Label>
                    <div className="flex flex-wrap gap-2">
                      {PILLARS.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPillarId(String(p.id));
                            setSelectedGoalId('');
                          }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                            selectedPillarId === String(p.id)
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: selectedPillarId === String(p.id) ? 'white' : p.color }}
                          />
                          <span className="text-sm font-medium">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Select Goal */}
                {selectedEmployeeId && selectedPillarId && (
                  <div className="space-y-2">
                    <Label>Select Goal</Label>
                    <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a goal to review" />
                      </SelectTrigger>
                      <SelectContent>
                        {goals
                          .filter(g =>
                            g.ownerId === selectedEmployeeId &&
                            String(g.pillarId) === selectedPillarId
                          )
                          .map(goal => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {goal.name}
                            </SelectItem>
                          ))
                        }
                        {goals.filter(g =>
                          g.ownerId === selectedEmployeeId &&
                          String(g.pillarId) === selectedPillarId
                        ).length === 0 && (
                            <div className="p-2 text-sm text-slate-500 text-center">
                              No goals found for this pillar
                            </div>
                          )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Goal Info */}
            {selectedGoal && (
              <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900">{selectedGoal.name}</h4>
                  {(selectedGoal.kra || pillar) && (
                    <Badge
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                    >
                      {selectedGoal.kra || pillar?.name}
                    </Badge>
                  )}
                </div>
                {goalOwner && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Avatar className="h-6 w-6 bg-slate-200">
                      <AvatarFallback className="text-xs">{goalOwner.avatar}</AvatarFallback>
                    </Avatar>
                    <span>{goalOwner.name}</span>
                  </div>
                )}

              </div>
            )}

            {/* Star Rating */}
            {selectedGoal && (
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "h-8 w-8 transition-colors",
                          (hoverRating || rating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "fill-slate-200 text-slate-300"
                        )}
                      />
                    </button>
                  ))}
                  {rating > 0 ? (
                    <span className="ml-2 text-sm font-medium text-slate-700">
                      {rating} / 5
                    </span>
                  ) : (
                    <span className="ml-2 text-sm text-slate-400">
                      (Required)
                    </span>
                  )}
                </div>
              </div>
            )}


            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="fb-comment">Comment</Label>
              <Textarea
                id="fb-comment"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your feedback, suggestions, or observations..."
                rows={4}
                required
              />
            </div>

            {/* Anonymous Option */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked === true)}
              />
              <Label htmlFor="anonymous" className="text-sm font-normal cursor-pointer">
                Submit anonymously
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedGoal || !comment.trim()}
              >
                Submit Feedback
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
