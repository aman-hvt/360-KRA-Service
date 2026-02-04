"use client";

import React from "react"

import { useState } from 'react';
import { PILLARS, PillarId, Goal, FeedbackCenterItem, FeedbackCenterResponse } from '@/lib/types';
import {
  goals,
  users,
  getGoalsByUser,
  getFeedbackForUser,
  getUserById
} from '@/lib/store';
import { useRole } from '@/lib/role-context';
import { StatsCard } from './stats-card';
import { PillarOverview } from './pillar-card';
import { GoalCard } from './goal-card';
import { AddGoalModal, ViewGoalModal, EditGoalModal } from './goal-modal';
import { FeedbackModal } from './feedback-modal';
import {
  Target,
  TrendingUp,
  MessageSquare,
  Clock,
  Plus,
  Search,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// REMOVED Tabs imports
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

// ... (existing interfaces)

export function EmployeeDashboard() {
  const { currentUser } = useRole();
  const { toast } = useToast();

  const myGoals = currentUser ? getGoalsByUser(currentUser.id) : [];

  // Real feedback data from API
  const [receivedFeedback, setReceivedFeedback] = useState<FeedbackCenterItem[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const avgProgress = myGoals.length > 0
    ? Math.round(myGoals.reduce((sum, g) => sum + g.progress, 0) / myGoals.length)
    : 0;

  const today = new Date();
  const goalsDueSoon = myGoals.filter(g => {
    const dueDate = new Date(g.dueDate);
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining <= 14 && daysRemaining > 0;
  }).length;

  const [expandedPillars, setExpandedPillars] = useState<number[]>([1]);
  const [searchQuery, setSearchQuery] = useState('');
  // REMOVED viewTab state

  // Modal states
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isViewGoalOpen, setIsViewGoalOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [addGoalPillar, setAddGoalPillar] = useState<PillarId | undefined>();

  const togglePillar = (pillarId: number) => {
    setExpandedPillars(prev =>
      prev.includes(pillarId)
        ? prev.filter(id => id !== pillarId)
        : [...prev, pillarId]
    );
  };

  const handleAddGoal = (pillarId?: PillarId) => {
    setAddGoalPillar(pillarId);
    setIsAddGoalOpen(true);
  };

  const handleViewGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsViewGoalOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsEditGoalOpen(true);
  };

  const handleFeedback = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsFeedbackOpen(true);
  };

  const handleSaveGoal = (goalData: Partial<Goal>) => {
    toast({
      title: "Goal Requested",
      description: `Goal "${goalData.name}" has been submitted for approval.`
    });
  };

  const handleUpdateGoal = async (goal: Goal) => {
    try {
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Updating goal:', {
        goalId: goal.id,
        employeeId: currentUser.id,
        payload: {
          goalName: goal.name,
          description: goal.description,
          priority: goal.priority,
          progress: goal.progress,
          dueDate: goal.dueDate
        }
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/goals/${goal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentUser.id
        },
        body: JSON.stringify({
          goalName: goal.name,
          description: goal.description,
          priority: goal.priority,
          progress: goal.progress,
          dueDate: goal.dueDate
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to update goal: ${response.statusText}`;

        // Try to parse JSON error response
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If not JSON, use the text as is
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Update Goal Response:', data);

      toast({
        title: "Progress Updated",
        description: `Your progress on "${goal.name}" has been saved.`
      });

      // Optionally refresh data if needed
      // setLastUpdated(Date.now());

    } catch (error) {
      if (error instanceof Error && error.message.includes('Due date cannot be')) {
        console.warn('Validation error updating goal:', error.message);
      } else {
        console.error('Error updating goal:', error);
      }

      // Extract user-friendly error message
      let errorMessage = "Could not update goal.";
      let title = "Unable to Update Goal";

      if (error instanceof Error) {
        errorMessage = error.message;
        // Remove technical prefixes for cleaner user message
        errorMessage = errorMessage.replace(/^Failed to update goal: (Internal Server Error - )?/, '');

        // If it's a specific validation message, make the title friendlier
        if (errorMessage.includes('Due date cannot be')) {
          title = "Invalid Date";
        }
      }

      toast({
        title: title,
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleSubmitFeedback = async (feedbackData: Partial<any>) => {
    try {
      // Use the logged-in user's ID for authentication
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Sending feedback to backend:', {
        goalId: feedbackData.goalId,
        providerId: feedbackData.providerId,
        recipientId: feedbackData.recipientId,
        rating: feedbackData.rating,
        comment: feedbackData.comment,
        isAnonymous: feedbackData.isAnonymous
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentUser.id
        },
        body: JSON.stringify({
          goalId: feedbackData.goalId,
          providerId: feedbackData.providerId,
          recipientId: feedbackData.recipientId,
          rating: feedbackData.rating,
          comment: feedbackData.comment,
          isAnonymous: feedbackData.isAnonymous
        })
      });

      const responseData = await response.json();
      console.log('Backend response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to submit feedback');
      }

      toast({
        title: "Feedback Sent",
        description: "Your feedback has been submitted successfully."
      });

      setIsFeedbackOpen(false);
    } catch (error: any) {
      console.error('Feedback submit error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback.",
        variant: "destructive"
      });
    }
  };

  const filteredMyGoals = myGoals.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const colleagues = users.filter(u => u.role === 'employee' && u.id !== currentUser?.id);



  // Calculate pillar-specific stats for the employee
  const getPillarStats = (pillarId: number) => {
    const pillarGoals = myGoals.filter(g => g.pillarId === pillarId);
    return {
      count: pillarGoals.length,
      avgProgress: pillarGoals.length > 0
        ? Math.round(pillarGoals.reduce((sum, g) => sum + g.progress, 0) / pillarGoals.length)
        : 0
    };
  };

  // State for KRA View
  const [userKras, setUserKras] = useState<UserKra[]>([]);
  const [isLoadingUserKras, setIsLoadingUserKras] = useState(false);

  // Fetch Received Feedback
  useEffect(() => {
    if (currentUser?.id) {
      const fetchFeedback = async () => {
        setIsLoadingFeedback(true);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/feedback/received`, {
            headers: {
              'x-employee-id': currentUser.id
            }
          });

          if (!response.ok) throw new Error('Failed to fetch feedback');
          const data: FeedbackCenterResponse = await response.json();
          if (data.status === 'success' && Array.isArray(data.data)) {
            setReceivedFeedback(data.data);
          } else {
            setReceivedFeedback([]);
          }
        } catch (err) {
          console.error('Error fetching feedback:', err);
          setReceivedFeedback([]);
        } finally {
          setIsLoadingFeedback(false);
        }
      };

      fetchFeedback();
    }
  }, [currentUser?.id]);

  // Fetch User KRAs (My Goals)
  useEffect(() => {
    if (currentUser?.id) {
      const fetchMyKras = async () => {
        setIsLoadingUserKras(true);
        try {
          // Use the logged-in user's ID for authentication
          if (!currentUser?.id) return;

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kras/user/${currentUser.id}`, {
            headers: {
              'x-employee-id': currentUser.id
            }
          });

          if (!response.ok) throw new Error('Failed to fetch user KRAs');
          const data = await response.json();
          if (data.status === 'success' && data.data && Array.isArray(data.data.kras)) {
            setUserKras(data.data.kras);
          } else {
            setUserKras([]);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoadingUserKras(false);
        }
      };

      fetchMyKras();
    }
  }, [currentUser]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
          <p className="text-slate-500">Track your goals and view feedback</p>
        </div>
        <Button onClick={() => handleAddGoal()} className="bg-violet-600 hover:bg-violet-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Request New Goal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="My Active Goals"
          value={myGoals.length}
          icon={<Target className="h-6 w-6" />}
          color="purple"
        />
        <StatsCard
          title="Average Progress"
          value={`${avgProgress}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          trend={{ value: 8, isPositive: true }}
          color="green"
        />
        <StatsCard
          title="Feedback Received"
          value={isLoadingFeedback ? '...' : receivedFeedback.length}
          icon={<MessageSquare className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="Goals Due Soon"
          value={goalsDueSoon}
          icon={<Clock className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* My Pillars Overview */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">My Pillars Progress</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {PILLARS.map(pillar => {
            const stats = getPillarStats(pillar.id);
            return (
              <button
                key={pillar.id}
                onClick={() => togglePillar(pillar.id)}
                className="flex flex-col items-center p-4 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-all min-w-[140px]"
                style={{ borderColor: expandedPillars.includes(pillar.id) ? pillar.color : undefined }}
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}
                >
                  <Target className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-700 text-center">{pillar.name}</span>
                <span className="text-lg font-bold mt-1" style={{ color: pillar.color }}>
                  {stats.avgProgress}%
                </span>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {stats.count} Goals
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* Goals Section */}
      {/* Goals Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-900">My Goals by KRA</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search my goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {isLoadingUserKras ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : userKras.length > 0 ? (
            userKras.map(kra => {
              const filteredGoals = kra.goals ? kra.goals.filter(g =>
                !searchQuery || g.goalNameOnZoho.toLowerCase().includes(searchQuery.toLowerCase())
              ) : [];

              if (searchQuery && filteredGoals.length === 0) return null;

              return (
                <AccordionItem
                  key={kra.id}
                  value={kra.id}
                  className="border border-slate-200 rounded-xl overflow-hidden bg-white"
                  style={{ borderColor: `#3B82F640` }}
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50">
                    <div className="flex items-center gap-4 w-full">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `#3B82F615`, color: '#3B82F6' }}
                      >
                        <div className="h-5 w-5 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-slate-900">{kra.kraName || 'Unknown KRA'}</h3>
                        <p className="text-sm text-slate-500">{filteredGoals.length} Goals</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2">
                    {filteredGoals.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <p>No goals found.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredGoals.map((zohoGoal) => {
                          // Determine Pillar based on KRA index
                          const pillarIndex = userKras.findIndex(k => k.id === kra.id);
                          const stylePillar = PILLARS[Math.max(0, pillarIndex) % PILLARS.length];

                          // Map ZohoGoal to local Goal interface
                          const mappedGoal: Goal = {
                            id: zohoGoal.id,
                            name: zohoGoal.goalNameOnZoho,
                            description: zohoGoal.description,
                            pillarId: stylePillar.id,
                            kra: kra.kraName,
                            kraId: kra.id, // Include KRA ID
                            metrics: '',
                            priority: (zohoGoal.priority?.toLowerCase() as any) || 'medium',
                            progress: zohoGoal.localProgress ?? zohoGoal.zohoProgress ?? 0,
                            startDate: zohoGoal.startDate,
                            dueDate: zohoGoal.dueDate,
                            ownerId: currentUser?.id || '',
                            assignedBy: 'Manager',
                            status: (zohoGoal.status?.toLowerCase() === 'active' ? 'in-progress' : 'completed') as any,
                            syncStatus: 'synced',
                            positionInPillar: 0,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                          };

                          return (
                            <GoalCard
                              key={mappedGoal.id}
                              goal={mappedGoal}
                              onView={() => handleViewGoal(mappedGoal)}
                              onEdit={() => handleEditGoal(mappedGoal)}
                              onFeedback={undefined} // Hide feedback for self
                              showOwner={false}
                              showPillar={false}
                              showProgress={true}
                            />
                          );
                        })}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500">
              No KRAs found.
            </div>
          )}
        </Accordion>
      </div>

      {/* Modals */}
      < AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)
        }
        onSave={handleSaveGoal}
        defaultPillarId={addGoalPillar}
      />
      <ViewGoalModal
        isOpen={isViewGoalOpen}
        onClose={() => setIsViewGoalOpen(false)}
        goal={selectedGoal}
        onEdit={selectedGoal?.ownerId === currentUser?.id ? () => {
          setIsViewGoalOpen(false);
          if (selectedGoal) handleEditGoal(selectedGoal);
        } : undefined}
      />
      <EditGoalModal
        isOpen={isEditGoalOpen}
        onClose={() => setIsEditGoalOpen(false)}
        goal={selectedGoal}
        onSave={handleUpdateGoal}
        availableKras={userKras}
      />
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={handleSubmitFeedback}
        preselectedGoal={selectedGoal}
      />
    </div >
  );
}

function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
