"use client";

import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PILLARS, PillarId, Goal, Feedback, KraItem, UserKra, ZohoGoal } from '@/lib/types';
import { goals, users, getUserById } from '@/lib/store';
import { useRole } from '@/lib/role-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { GoalCard } from '@/components/goal-card';
import { AddGoalModal, ViewGoalModal, EditGoalModal } from '@/components/goal-modal';
import { FeedbackModal } from '@/components/feedback-modal';
import { PillarOverview } from '@/components/pillar-card';
import {
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  RefreshCw,

  Loader2,
  Target,
  TrendingUp,
  MessageSquare,
  Clock
} from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { getGoalsByUser } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ApiEmployee {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  role: string;
  designation?: string;
  department?: string;
  employeeStatus: string;
  photo?: string;
}

interface EmployeesResponse {
  status: string;
  data: ApiEmployee[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
// KRA Types


interface KrasResponse {
  status: string;
  data: {
    employee: {
      id: string;
      name: string;
      email: string;
      designation: string;
      department: string;
    };
    kras: UserKra[];
    summary: {
      totalKRAs: number;
      totalGoals: number;
      activeGoals: number;
      goalsWithLocalChanges: number;
      averageProgress: number;
    };
  };
}
// User KRA Types (Hierarchical)


interface UserKrasResponse {
  status: string;
  data: {
    employee: {
      id: string;
      name: string;
      email: string;
      designation: string;
      department: string;
    };
    kras: UserKra[];
    summary: {
      totalKRAs: number;
      totalGoals: number;
      activeGoals: number;
      goalsWithLocalChanges: number;
      averageProgress: number;
    };
  };
}

export default function GoalsPage() {
  const { currentRole, currentUser } = useRole();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPillar, setSelectedPillar] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedApiEmployee, setSelectedApiEmployee] = useState<ApiEmployee | null>(null);
  const [hrViewRole, setHrViewRole] = useState<'all' | 'employee' | 'manager' | 'hr'>('all');

  // Helper calculations for Employee View
  const myGoalsLocal = currentUser ? getGoalsByUser(currentUser.id) : [];
  const avgProgress = myGoalsLocal.length > 0
    ? Math.round(myGoalsLocal.reduce((sum, g) => sum + g.progress, 0) / myGoalsLocal.length)
    : 0;

  const today = new Date();
  const goalsDueSoon = myGoalsLocal.filter(g => {
    const dueDate = new Date(g.dueDate);
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining <= 14 && daysRemaining > 0;
  }).length;

  const [expandedPillars, setExpandedPillars] = useState<number[]>([1]);
  const togglePillar = (pillarId: number) => {
    setExpandedPillars(prev =>
      prev.includes(pillarId)
        ? prev.filter(id => id !== pillarId)
        : [...prev, pillarId]
    );
  };
  // Calculate pillar-specific stats for the employee
  const getPillarStats = (pillarId: number) => {
    const pillarGoals = myGoalsLocal.filter(g => g.pillarId === pillarId);
    return {
      count: pillarGoals.length,
      avgProgress: pillarGoals.length > 0
        ? Math.round(pillarGoals.reduce((sum, g) => sum + g.progress, 0) / pillarGoals.length)
        : 0
    };
  };

  // Received Feedback State
  const [receivedFeedback, setReceivedFeedback] = useState<Feedback[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  useEffect(() => {
    if (currentUser?.id && currentRole === 'employee') {
      const fetchFeedback = async () => {
        setIsLoadingFeedback(true);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/feedback/received`, {
            headers: { 'x-employee-id': currentUser.id }
          });
          const data = await response.json();
          if (data.status === 'success' && Array.isArray(data.data)) {
            setReceivedFeedback(data.data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoadingFeedback(false);
        }
      };
      fetchFeedback();
    }
  }, [currentUser, currentRole]);

  // Employee View State
  const [viewTab, setViewTab] = useState('my-goals');
  const [teamMembers, setTeamMembers] = useState<ApiEmployee[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<ApiEmployee | null>(null);
  const [teamMemberKras, setTeamMemberKras] = useState<UserKra[]>([]);
  const [isLoadingTeamMemberKras, setIsLoadingTeamMemberKras] = useState(false);

  // Unified ID logic
  const effectiveEmployeeId = (currentRole === 'employee')
    ? currentUser?.id
    : selectedEmployeeId;

  // API State
  const [apiEmployees, setApiEmployees] = useState<ApiEmployee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // KRA API State
  const [myKras, setMyKras] = useState<UserKra[]>([]);
  const [isLoadingKras, setIsLoadingKras] = useState(false);

  // User KRA API State (For viewing other employees)
  const [userKras, setUserKras] = useState<UserKra[]>([]);
  const [isLoadingUserKras, setIsLoadingUserKras] = useState(false);

  // Direct Reportees State (for permission checks)
  const [directReporteeIds, setDirectReporteeIds] = useState<Set<string>>(new Set<string>());

  // Modal states
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isViewGoalOpen, setIsViewGoalOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Refresh trigger
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // Fetch Employees from API
  useEffect(() => {
    if (currentRole === 'employee') return;

    // Wait for currentUser to be loaded
    if (!currentUser?.id) return;

    const fetchEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        const roleMap = {
          'employee': 'Team Member',  // Fixed: Capital M to match backend enum
          'manager': 'Manager',
          'hr': 'Admin'
        };

        let apiRole = 'Team Member';  // Fixed: Capital M to match backend enum
        if (currentRole === 'hr' && hrViewRole !== 'all') {
          apiRole = roleMap[hrViewRole];
        } else if (currentRole === 'manager') {
          apiRole = 'Team member';
        }

        const queryParams = new URLSearchParams();
        // Re-enabled filtering for HR, but only if not 'all'
        if (currentRole === 'hr' && hrViewRole !== 'all') {
          queryParams.append('role', apiRole);
        }
        // For managers, we don't append 'role' so they see everyone (or backend handles scope)
        // queryParams.append('role', apiRole); 

        queryParams.append('status', 'Active');
        queryParams.append('page', '1');
        queryParams.append('limit', '100');
        if (searchQuery) queryParams.append('search', searchQuery);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employees?${queryParams.toString()}`, {
          headers: {
            'x-employee-id': currentUser.id
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data: EmployeesResponse = await response.json();
        console.log("API DEBUG DATA:", data);
        setApiEmployees(data.data || []);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast({
          title: "Error fetching employees",
          description: "Check console for details.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchEmployees();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentRole, hrViewRole, searchQuery, currentUser]);

  // Fetch My KRAs - DEPRECATED/REMOVED to use unified fetchUserKras below
  // This was causing state sync issues. We rely on the unified `fetchUserKras` 
  // which triggers when effectiveEmployeeId (which is currentUser.id for employees) is set.
  /*
  useEffect(() => {
    // Should run if I am viewing MY goals
    // ...
    const shouldFetchMyKras = currentRole === 'employee' || (selectedEmployeeId === currentUser?.id);

    if (shouldFetchMyKras && currentUser?.id) {
       // ... (Logic moved to unified fetch below)
    }
  }, [currentRole, selectedEmployeeId, currentUser, lastUpdated]);
  */

  // Fetch Direct Reportees to establish permissions
  useEffect(() => {
    if (!currentUser?.id || currentRole === 'employee') return;

    const fetchReportees = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employees/${currentUser.id}/reportees`, {
          headers: { 'x-employee-id': currentUser.id }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && Array.isArray(data.data)) {
            const ids = new Set<string>(data.data.map((r: any) => String(r._id || r.id)));
            setDirectReporteeIds(ids);
          }
        }
      }
      catch (err) {
        console.error(err);
      }
    };

    fetchReportees();

  }, [currentUser, currentRole]);

  // Fetch Team Members (View Only) - Copied from EmployeeDashboard
  useEffect(() => {
    if (currentRole === 'employee' && viewTab === 'team-goals' && teamMembers.length === 0) {
      const fetchTeam = async () => {
        setIsLoadingTeam(true);
        try {
          const queryParams = new URLSearchParams();
          queryParams.append('status', 'Active');
          queryParams.append('page', '1');
          queryParams.append('limit', '100'); // Fetch all

          if (!currentUser?.id) return;
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employees?${queryParams.toString()}`, {
            headers: {
              'x-employee-id': currentUser.id
            }
          });
          if (!response.ok) throw new Error('Failed to fetch employees');
          const data = await response.json();
          if (data.status === 'success' && Array.isArray(data.data)) {
            setTeamMembers(data.data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoadingTeam(false);
        }
      };

      fetchTeam();
    }
  }, [viewTab, teamMembers.length, currentRole, currentUser]);

  // Fetch Selected Team Member KRAs
  useEffect(() => {
    if (selectedTeamMemberId) {
      const fetchMemberKras = async () => {
        setIsLoadingTeamMemberKras(true);
        try {
          if (!currentUser?.id) return;
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kras/user/${selectedTeamMemberId}`, {
            headers: {
              'x-employee-id': currentUser.id
            }
          });

          if (!response.ok) throw new Error('Failed to fetch member KRAs');
          const data = await response.json();
          if (data.status === 'success' && data.data && Array.isArray(data.data.kras)) {
            setTeamMemberKras(data.data.kras);
          } else {
            setTeamMemberKras([]);
          }
        } catch (err) {
          console.error(err);
          setTeamMemberKras([]);
        } finally {
          setIsLoadingTeamMemberKras(false);
        }
      };

      fetchMemberKras();
    }
  }, [selectedTeamMemberId, currentUser]);

  // Fetch User KRAs (When Manager clicks a team member)
  useEffect(() => {
    const shouldFetchUserKras = (currentRole === 'manager' || currentRole === 'hr' || currentRole === 'employee') &&
      effectiveEmployeeId &&
      currentUser?.id;

    if (shouldFetchUserKras && effectiveEmployeeId && currentUser?.id) {
      const fetchUserKras = async () => {
        setIsLoadingUserKras(true);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kras/user/${effectiveEmployeeId}`, {
            headers: {
              'x-employee-id': currentUser.id
              // We omit 'x-manager-view' here to rely on backend or just simple fetch
              // If backend requires it strictly for accessing other's KRAs, we might need to add it,
              // but existing code didn't have it, so assuming it's fine or handled by x-employee-id
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch User KRAs: ${response.statusText}`);
          }

          const data: UserKrasResponse = await response.json();
          console.log("USER KRAS DATA:", data);

          if (data.status === 'success' && data.data && Array.isArray(data.data.kras)) {
            setUserKras(data.data.kras);
          } else {
            setUserKras([]);
          }

        } catch (error) {
          console.error("Error fetching User KRAs:", error);
          toast({
            title: "Error fetching Employee Goals",
            description: "Could not load goals for this employee.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingUserKras(false);
        }
      };

      fetchUserKras();
    }
  }, [currentRole, selectedEmployeeId, currentUser, effectiveEmployeeId, lastUpdated]);

  // Filter goals based on role and search
  const getFilteredGoals = () => {
    let filtered = goals;

    // Role-based filtering
    if (currentRole === 'employee' && currentUser) {
      filtered = filtered.filter(g => g.ownerId === currentUser.id);
    }

    // Search
    if (searchQuery) {
      filtered = filtered.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.kra.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Pillar filter
    if (selectedPillar !== 'all') {
      filtered = filtered.filter(g => g.pillarId === parseInt(selectedPillar));
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(g => g.status === selectedStatus);
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(g => g.priority === selectedPriority);
    }

    return filtered;
  };

  const filteredGoals = getFilteredGoals();

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

  const handleSaveGoal = async (goalData: Partial<Goal>) => {
    try {
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      if (!goalData.kraId) {
        toast({
          title: "Missing KRA",
          description: "Please select a KRA.",
          variant: "destructive"
        });
        return;
      }

      const payload = {
        goalName: goalData.name,
        description: goalData.description || "",
        dueDate: goalData.dueDate,
        kraId: goalData.kraId,
        priority: goalData.priority ? goalData.priority.charAt(0).toUpperCase() + goalData.priority.slice(1) : "Medium",
        progress: goalData.progress || 0,
        weightage: goalData.weightage || "0",
        targetEmployeeId: effectiveEmployeeId || currentUser.id
      };

      console.log("Creating Goal Payload:", payload);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentUser.id
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create goal: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Create Goal Response:", data);

      toast({
        title: "Goal Created",
        description: `Goal "${goalData.name}" has been created successfully.`
      });

      // Refresh Data
      setLastUpdated(Date.now());

    } catch (error) {
      console.error("Error creating goal:", error);
      toast({
        title: "Error creating goal",
        description: error instanceof Error ? error.message : "Could not create goal.",
        variant: "destructive"
      });
    }
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
        title: "Goal Updated",
        description: `Goal "${goal.name}" has been updated successfully.`
      });

      // Refresh data
      setLastUpdated(Date.now());

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

  const handleSubmitFeedback = async (feedbackData: Partial<Feedback>) => {
    try {
      // Use the logged-in user's ID for authentication
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      console.log("Submitting Feedback:", feedbackData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentUser.id
        },
        body: JSON.stringify({
          goalId: feedbackData.goalId,
          comment: feedbackData.comment,
          rating: feedbackData.rating,
          isAnonymous: feedbackData.isAnonymous
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit feedback: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Feedback Response:", data);

      toast({
        title: "Feedback Submitted",
        description: "Your feedback has been recorded successfully."
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error submitting feedback",
        description: "Could not submit your feedback. Please try again.",
        variant: "destructive"
      });
    }
  };

  const roleColors = {
    hr: 'bg-blue-600 hover:bg-blue-700',
    manager: 'bg-emerald-600 hover:bg-emerald-700',
    employee: 'bg-violet-600 hover:bg-violet-700'
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700'
  };

  const statusColors = {
    'not-started': 'bg-slate-100 text-slate-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    'at-risk': 'bg-amber-100 text-amber-700',
    'completed': 'bg-emerald-100 text-emerald-700',
    'overdue': 'bg-red-100 text-red-700'
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Goals Management</h1>
            <p className="text-slate-500">
              {currentRole === 'employee'
                ? 'Manage and track your personal goals'
                : 'View and manage all goals across the organization'
              }
            </p>
          </div>
          {(currentRole === 'hr' || currentRole === 'manager') && (
            <div className="flex gap-2">

              <Button
                onClick={() => setIsAddGoalOpen(true)}
                className={cn("text-white", roleColors[currentRole])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </div>
          )}
        </div>


        {/* Filters and Widgets - Employee Only */}
        {currentRole === 'employee' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="My Active Goals"
                value={myGoalsLocal.length}
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


            {/* Filters Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search goals by name, description, or KRA..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                  <Select value={selectedPillar} onValueChange={setSelectedPillar}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Pillars" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Pillars</SelectItem>
                      {PILLARS.map(pillar => (
                        <SelectItem key={pillar.id} value={String(pillar.id)}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: pillar.color }}
                            />
                            {pillar.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="at-risk">At Risk</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Toggle */}
                  <div className="flex items-center border border-slate-200 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        viewMode === 'grid' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        viewMode === 'table' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {(selectedPillar !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all' || searchQuery) && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <span className="text-sm text-slate-500">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {searchQuery}
                      <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-slate-900">×</button>
                    </Badge>
                  )}
                  {selectedPillar !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Pillar: {PILLARS.find(p => p.id === parseInt(selectedPillar))?.name}
                      <button onClick={() => setSelectedPillar('all')} className="ml-1 hover:text-slate-900">×</button>
                    </Badge>
                  )}
                  {selectedStatus !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {selectedStatus}
                      <button onClick={() => setSelectedStatus('all')} className="ml-1 hover:text-slate-900">×</button>
                    </Badge>
                  )}
                  {selectedPriority !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Priority: {selectedPriority}
                      <button onClick={() => setSelectedPriority('all')} className="ml-1 hover:text-slate-900">×</button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedPillar('all');
                      setSelectedStatus('all');
                      setSelectedPriority('all');
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </>
        )}


        {/* Manager/HR OR Employee View (Unified Logic for Accordion) */}
        {(currentRole === 'manager' || currentRole === 'hr') ? (
          <div className="space-y-6">
            {/* Manager Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  !selectedEmployeeId ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
                onClick={() => setSelectedEmployeeId(null)}
              >
                Team Goals
              </button>
              <button
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  selectedEmployeeId === currentUser?.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
                onClick={() => currentUser && setSelectedEmployeeId(currentUser.id)}
              >
                My Goals
              </button>
            </div>

            {/* Render View based on effectiveEmployeeId */}
            {!effectiveEmployeeId ? (
              // Level 1: Employee/User List
              <div className="space-y-6">

                {/* HR Only: Role Filter Tabs */}
                {currentRole === 'hr' && (
                  <div className="flex gap-2">
                    {(['all', 'manager', 'hr'] as const).map((role) => (
                      <Button
                        key={role}
                        variant={hrViewRole === role ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHrViewRole(role)}
                        className="capitalize"
                      >
                        {role === 'hr' ? 'HR' : role === 'all' ? 'All Employees' : role + 's'}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={`Search ${currentRole === 'hr' ? hrViewRole + 's' : 'employees'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isLoadingEmployees ? (
                    <div className="col-span-full flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : apiEmployees.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                      No employees found.
                    </div>
                  ) : (
                    apiEmployees.map((emp, index) => {
                      // Robust name handling: Priority to 'name' field from API
                      const displayName = emp.name || [emp.firstName, emp.lastName].filter(Boolean).join(' ') || 'Unknown Name';

                      // Initials with fallback
                      let initials = '?';
                      if (displayName !== 'Unknown Name') {
                        initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                      }

                      const designation = emp.designation || emp.role;
                      // Use 'id' from API if available, fallback to '_id'
                      const uniqueKey = emp.id || emp._id || index;

                      return (
                        <div
                          key={uniqueKey}
                          onClick={() => {
                            setSelectedEmployeeId(emp.id || emp._id || '');
                            setSelectedApiEmployee(emp);
                          }}
                          className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 bg-blue-100 text-blue-700">
                              {emp.photo ? (
                                <AvatarImage src={emp.photo} alt={displayName} />
                              ) : null}
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-slate-900">{displayName}</h3>
                              <p className="text-sm text-slate-500">{designation}</p>
                              <Badge variant="secondary" className="mt-2">
                                {emp.department || 'Engineering'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              // Level 2: Selected Employee's Pillars & Goals (Or My Goals)
              <div className="space-y-6">
                {/* Only show "Back" button if we are NOT in "My Goals" mode (i.e. if we drilled down from Team) */}
                {effectiveEmployeeId !== currentUser?.id && (
                  <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => setSelectedEmployeeId(null)}>
                      ← Back to Team
                    </Button>
                    <div className="h-6 w-px bg-slate-300" />
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {selectedApiEmployee?.photo ? (
                          <AvatarImage src={selectedApiEmployee.photo} alt={selectedApiEmployee.name} />
                        ) : null}
                        <AvatarFallback>
                          {selectedApiEmployee?.name
                            ? selectedApiEmployee.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                            : '??'}
                        </AvatarFallback>
                      </Avatar>
                      {selectedApiEmployee?.name || 'Employee'}&apos;s Goals
                    </h2>
                  </div>
                )}

                {effectiveEmployeeId === currentUser?.id && (
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-slate-900">My Goals</h2>
                    <p className="text-slate-500">Manage and track your personal goals</p>
                  </div>
                )}


                <Accordion type="single" collapsible className="space-y-4">
                  {/* Dynamic KRA Rendering for User View */}
                  {userKras.length > 0 ? (
                    userKras.map(kra => {
                      const kraId = kra.id;
                      const kraName = kra.kraName || 'Unknown KRA';
                      const goalsList = kra.goals || [];

                      return (
                        <AccordionItem
                          key={kraId}
                          value={kraId}
                          className="border border-slate-200 rounded-xl overflow-hidden bg-white"
                          style={{ borderColor: `#3B82F640` }} // Default blue-ish border for KRAs
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
                                <p className="text-sm text-slate-500">{kra.goals?.length || 0} Goals</p>
                              </div>

                              {(effectiveEmployeeId === currentUser?.id || (effectiveEmployeeId && directReporteeIds.has(effectiveEmployeeId))) && (
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    asChild
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
                                    onClick={() => {
                                      setIsAddGoalOpen(true);
                                    }}
                                  >
                                    <span role="button">
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Goal
                                    </span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6 pt-2">
                            {isLoadingUserKras ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                              </div>
                            ) : (!kra.goals || kra.goals.length === 0) ? (
                              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                <p>No goals defined for this KRA.</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {kra.goals.map((zohoGoal) => {
                                  // Map ZohoGoal to local Goal interface
                                  const mappedGoal: Goal = {
                                    id: zohoGoal.id,
                                    name: zohoGoal.goalNameOnZoho,
                                    description: zohoGoal.description,
                                    pillarId: 1, // Dummy, effectively unused in this view
                                    kra: kra.kraName,
                                    metrics: '', // Not in ZohoGoal
                                    priority: (zohoGoal.priority?.toLowerCase() as any) || 'medium',
                                    progress: zohoGoal.localProgress ?? zohoGoal.zohoProgress ?? 0,
                                    startDate: zohoGoal.startDate,
                                    dueDate: zohoGoal.dueDate,
                                    ownerId: selectedEmployeeId || '',
                                    assignedBy: 'Manager',
                                    status: (zohoGoal.status?.toLowerCase() === 'active' ? 'in-progress' : 'completed') as any, // Simple mapping
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
                                      onEdit={
                                        // Show Edit only if: 1) It's my own goal, OR 2) Goal owner is my direct reportee
                                        (effectiveEmployeeId === currentUser?.id || directReporteeIds.has(effectiveEmployeeId || ''))
                                          ? () => handleEditGoal(mappedGoal)
                                          : undefined
                                      }
                                      onFeedback={effectiveEmployeeId === currentUser?.id ? undefined : () => handleFeedback(mappedGoal)}
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
                    // Fallback or Loading State if no KRAs found
                    isLoadingUserKras ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        No KRAs found for this employee.
                      </div>
                    )
                  )}
                </Accordion>
              </div>
            )}
          </div>
        ) : (
          // Employee View with Tabs (Refactored)
          <Tabs value={viewTab} onValueChange={setViewTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="my-goals">My Goals</TabsTrigger>
              <TabsTrigger value="team-goals">Team Goals (View Only)</TabsTrigger>
            </TabsList>


            <TabsContent value="my-goals">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <Accordion type="single" collapsible className="space-y-4">
                  {userKras.length > 0 ? (
                    userKras.map(kra => {
                      const kraId = kra.id;
                      const kraName = kra.kraName || 'Unknown KRA';
                      const goalsList = kra.goals || [];

                      return (
                        <AccordionItem
                          key={kraId}
                          value={kraId}
                          className="border border-slate-200 rounded-xl overflow-hidden bg-white"
                          style={{ borderColor: `#3B82F640` }} // Default blue-ish border for KRAs
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
                                <p className="text-sm text-slate-500">{kra.goals?.length || 0} Goals</p>
                              </div>

                              <div onClick={(e) => e.stopPropagation()}>
                                <Button
                                  asChild
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
                                  onClick={() => {
                                    setIsAddGoalOpen(true);
                                  }}
                                >
                                  <span role="button">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Goal
                                  </span>
                                </Button>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6 pt-2">
                            {isLoadingUserKras ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                              </div>
                            ) : (!kra.goals || kra.goals.length === 0) ? (
                              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                <p>No goals defined for this KRA.</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {kra.goals.map((zohoGoal) => {
                                  // Map ZohoGoal to local Goal interface
                                  const pillarIndex = userKras.findIndex(k => k.id === kra.id);
                                  const stylePillar = PILLARS[Math.max(0, pillarIndex) % PILLARS.length];

                                  const mappedGoal: Goal = {
                                    id: zohoGoal.id,
                                    name: zohoGoal.goalNameOnZoho,
                                    description: zohoGoal.description,
                                    pillarId: stylePillar.id,
                                    kra: kra.kraName,
                                    kraId: kra.id, // Include KRA ID
                                    metrics: '', // Not in ZohoGoal
                                    priority: (zohoGoal.priority?.toLowerCase() as any) || 'medium',
                                    progress: zohoGoal.localProgress ?? zohoGoal.zohoProgress ?? 0,
                                    startDate: zohoGoal.startDate,
                                    dueDate: zohoGoal.dueDate,
                                    ownerId: currentUser?.id || '',
                                    assignedBy: 'Manager',
                                    status: (zohoGoal.status?.toLowerCase() === 'active' ? 'in-progress' : 'completed') as any, // Simple mapping
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
                                      onEdit={
                                        // Show Edit only if: 1) It's my own goal, OR 2) Goal owner is my direct reportee
                                        (effectiveEmployeeId === currentUser?.id || directReporteeIds.has(effectiveEmployeeId || ''))
                                          ? () => handleEditGoal(mappedGoal)
                                          : undefined
                                      }
                                      onFeedback={undefined} // No feedback for My Goals (usually)
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
                    // Fallback or Loading State if no KRAs found
                    isLoadingUserKras ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        No KRAs found.
                      </div>
                    )
                  )}
                </Accordion>
              </div>
            </TabsContent>

            <TabsContent value="team-goals">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                {!selectedTeamMemberId ? (
                  // Level 1: Team List
                  <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <h2 className="text-lg font-semibold text-slate-900">
                        Team Goals
                      </h2>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Search colleagues..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-64"
                          />
                        </div>
                      </div>
                    </div>

                    {isLoadingTeam ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teamMembers
                          .filter(user => {
                            const name = user.name || user.firstName + ' ' + user.lastName;
                            return name.toLowerCase().includes(searchQuery.toLowerCase());
                          })
                          .map(user => {
                            const displayName = user.name || `${user.firstName} ${user.lastName}`;
                            const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                            return (
                              <div
                                key={user.id || user._id}
                                onClick={() => {
                                  setSelectedTeamMemberId(user.id || user._id || '');
                                  setSelectedTeamMember(user);
                                }}
                                className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md cursor-pointer transition-all flex items-center gap-4"
                              >
                                <Avatar className="h-12 w-12 bg-blue-100 text-blue-700">
                                  {user.photo ? (
                                    <AvatarImage src={user.photo} alt={displayName} />
                                  ) : null}
                                  <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold text-slate-900">{displayName}</h3>
                                  <p className="text-sm text-slate-500">{user.designation || user.role}</p>
                                  <Badge variant="secondary" className="mt-2">
                                    {user.department || 'Engineering'}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                    {teamMembers.length === 0 && !isLoadingTeam && (
                      <div className="text-center py-12 text-slate-500">
                        No team members found.
                      </div>
                    )}
                  </>
                ) : (
                  // Level 2: Selected Team Member Goals (Accordion View)
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                      <Button variant="ghost" onClick={() => {
                        setSelectedTeamMemberId(null);
                        setSelectedTeamMember(null);
                        setTeamMemberKras([]);
                      }}>
                        ← Back to Team
                      </Button>
                      <div className="h-6 w-px bg-slate-300" />
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {selectedTeamMember?.name
                              ? selectedTeamMember.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                              : '??'}
                          </AvatarFallback>
                        </Avatar>
                        {selectedTeamMember?.name || 'Employee'}&apos;s Goals
                      </h2>
                    </div>

                    <Accordion type="single" collapsible className="space-y-4">
                      {isLoadingTeamMemberKras ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                      ) : teamMemberKras.length > 0 ? (
                        teamMemberKras.map(kra => {
                          const goals = kra.goals || [];
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
                                    <p className="text-sm text-slate-500">{goals.length} Goals</p>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 pb-6 pt-2">
                                {goals.length === 0 ? (
                                  <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <p>No goals found.</p>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {goals.map((zohoGoal) => {
                                      // Determine Pillar based on KRA index
                                      const pillarIndex = teamMemberKras.findIndex(k => k.id === kra.id);
                                      const stylePillar = PILLARS[Math.max(0, pillarIndex) % PILLARS.length];

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
                                        ownerId: selectedTeamMemberId || '',
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
                                          onView={undefined} // Hide View Details
                                          onEdit={undefined} // View Only
                                          onFeedback={() => {
                                            setSelectedGoal(mappedGoal);
                                            setIsFeedbackOpen(true);
                                          }}
                                          showOwner={false}
                                          showPillar={false}
                                          showProgress={false} // Hide progress from employees viewing team goals
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
                          No KRAs found for this employee.
                        </div>
                      )}
                    </Accordion>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Modals */}
        <AddGoalModal
          isOpen={isAddGoalOpen}
          onClose={() => setIsAddGoalOpen(false)}
          onSave={handleSaveGoal}
          defaultPillarId={selectedPillar !== 'all' ? parseInt(selectedPillar) as PillarId : undefined}
          hideAssignee={!!effectiveEmployeeId}
          availableKras={userKras}
        />
        <ViewGoalModal
          isOpen={isViewGoalOpen}
          onClose={() => setIsViewGoalOpen(false)}
          goal={selectedGoal}
          onEdit={() => {
            setIsViewGoalOpen(false);
            if (selectedGoal) handleEditGoal(selectedGoal);
          }}
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
    </DashboardLayout >
  );
}
