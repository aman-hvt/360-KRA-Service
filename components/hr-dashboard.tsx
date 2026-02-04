"use client";

import { useState, useEffect } from 'react';
import { PILLARS, PillarId, Goal, UserKra, ZohoGoal } from '@/lib/types';
import {
  getOverallStats,
  goals,
  getGoalsByPillar,
  users,
  getUsersByRole,
  getDirectReports,
  getGoalsByUser,
  getUserById
} from '@/lib/store';
import { useRole } from '@/lib/role-context';
import { StatsCard } from './stats-card';
import { PillarCard, PillarOverview } from './pillar-card';
import { GoalCard } from './goal-card';
import { AddGoalModal, ViewGoalModal, EditGoalModal } from './goal-modal';
import { FeedbackModal } from './feedback-modal';
import {
  Users,
  UserCog,
  Briefcase,
  Target,
  Plus,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';

export function HRDashboard() {
  const { currentUser } = useRole();
  const { toast } = useToast();
  const stats = getOverallStats();

  const [apiDirectReports, setApiDirectReports] = useState<any[]>([]);
  const [isLoadingReportees, setIsLoadingReportees] = useState(false);
  const [selectedReporteeId, setSelectedReporteeId] = useState<string>('');

  // KRA View State
  const [userKras, setUserKras] = useState<UserKra[]>([]);
  const [isLoadingKras, setIsLoadingKras] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Fetch Reportees from API
  useEffect(() => {
    if (currentUser?.id) {
      const fetchReportees = async () => {
        setIsLoadingReportees(true);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employees/${currentUser.id}/reportees`, {
            headers: {
              'x-employee-id': currentUser.id
            }
          });
          const data = await response.json();
          if (data.status === 'success' && Array.isArray(data.data)) {
            setApiDirectReports(data.data);
          }
        } catch (error) {
          console.error("Error fetching reportees:", error);
          toast({
            title: "Error fetching reportees",
            description: "Could not load team members.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingReportees(false);
        }
      };

      fetchReportees();
    }
  }, [currentUser]);

  // Fetch Reportee KRAs when selected
  useEffect(() => {
    if (selectedReporteeId && currentUser?.id) {
      const fetchReporteeKras = async () => {
        setIsLoadingKras(true);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kras/user/${selectedReporteeId}`, {
            headers: {
              'x-employee-id': currentUser.id
            }
          });

          if (!response.ok) throw new Error('Failed to fetch KRAs');

          const data = await response.json();
          if (data.status === 'success' && data.data && Array.isArray(data.data.kras)) {
            setUserKras(data.data.kras);
            setExpandedItems([]); // Start with all collapsed
          } else {
            setUserKras([]);
          }
        } catch (error) {
          console.error("Error fetching KRAs:", error);
          toast({
            title: "Error",
            description: "Failed to load reportee KRAs.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingKras(false);
        }
      };

      fetchReporteeKras();
    } else {
      setUserKras([]);
    }
  }, [selectedReporteeId, currentUser]);

  const toggleItem = (value: string) => {
    setExpandedItems((current) =>
      current.includes(value)
        ? current.filter((i) => i !== value)
        : [...current, value]
    );
  };

  // Transform API data to friendly format
  const directReports = apiDirectReports.map(r => ({
    id: r._id || r.id,
    name: r.name,
    email: r.email,
    designation: r.designation,
    department: r.department,
    status: r.status,
    photo: r.photo,
    avatar: r.name ? r.name.substring(0, 2).toUpperCase() : '??',
    role: 'employee'
  }));

  const [expandedPillars, setExpandedPillars] = useState<number[]>([1]);
  const [selectedTab, setSelectedTab] = useState('employee');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isViewGoalOpen, setIsViewGoalOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [addGoalPillar, setAddGoalPillar] = useState<PillarId | undefined>();
  const [addGoalKraId, setAddGoalKraId] = useState<string | undefined>();

  const togglePillar = (pillarId: number) => {
    setExpandedPillars(prev =>
      prev.includes(pillarId)
        ? prev.filter(id => id !== pillarId)
        : [...prev, pillarId]
    );
  };

  const handleAddGoal = (pillarId?: PillarId, kraId?: string) => {
    setAddGoalPillar(pillarId);
    setAddGoalKraId(kraId);
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

  const handleSaveGoal = async (goalData: Partial<Goal>) => {
    try {
      if (!selectedReporteeId) {
        toast({
          title: "Error",
          description: "No employee selected.",
          variant: "destructive"
        });
        return;
      }

      if (!goalData.kraId) {
        toast({
          title: "Missing KRA",
          description: "Please select a KRA for this goal.",
          variant: "destructive"
        });
        return;
      }

      const payload = {
        kraId: goalData.kraId,
        goalName: goalData.name,
        description: goalData.description,
        dueDate: goalData.dueDate,
        priority: goalData.priority,
        progress: goalData.progress || 0,
        targetEmployeeId: selectedReporteeId,
        createdById: currentUser?.id
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentUser?.id || ''
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      toast({
        title: "Goal Created",
        description: `Goal "${goalData.name}" has been created successfully.`
      });
      setIsAddGoalOpen(false);
      // Ideally trigger refresh here
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateGoal = (goal: Goal) => {
    toast({
      title: "Goal Updated",
      description: `Goal "${goal.name}" has been updated successfully.`
    });
  };

  const handleSubmitFeedback = async (feedbackData: any) => {
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

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedTab === 'employee') {
      const owner = users.find(u => u.id === goal.ownerId);
      return matchesSearch && owner?.role === 'employee' &&
        (!selectedUser || goal.ownerId === selectedUser);
    } else if (selectedTab === 'manager') {
      const owner = users.find(u => u.id === goal.ownerId);
      return matchesSearch && owner?.role === 'manager' &&
        (!selectedUser || goal.ownerId === selectedUser);
    } else {
      const owner = users.find(u => u.id === goal.ownerId);
      return matchesSearch && owner?.role === 'hr' &&
        (!selectedUser || goal.ownerId === selectedUser);
    }
  });

  const getUsersForTab = () => {
    if (selectedTab === 'employee') return getUsersByRole('employee');
    if (selectedTab === 'manager') return getUsersByRole('manager');
    return getUsersByRole('hr');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HR Dashboard</h1>
          <p className="text-slate-500">Overview of organization-wide goals and performance</p>
        </div>
        <Button onClick={() => handleAddGoal()} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={<Users className="h-6 w-6" />}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <StatsCard
          title="Total Managers"
          value={stats.totalManagers}
          icon={<UserCog className="h-6 w-6" />}
          trend={{ value: 5, isPositive: true }}
          color="green"
        />
        <StatsCard
          title="HR Staff"
          value={stats.totalHR}
          icon={<Briefcase className="h-6 w-6" />}
          color="purple"
        />
        <StatsCard
          title="Total Goals"
          value={stats.totalGoals}
          icon={<Target className="h-6 w-6" />}
          trend={{ value: 8, isPositive: true }}
          color="orange"
        />
      </div>

      {/* Pillars Overview */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Pillars Overview</h2>
        <PillarOverview
          onPillarClick={(id) => togglePillar(id)}
          selectedPillar={expandedPillars[0]}
        />
      </div>

      {/* Direct Reportees Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Direct Reportees</h2>
        {selectedReporteeId ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedReporteeId('')}
                  className="gap-2 pl-0 hover:pl-2 transition-all p-0 h-auto font-medium"
                >
                  &larr; Back to Team
                </Button>
                <div className="h-6 w-px bg-slate-200" />
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 bg-emerald-100">
                    {(() => {
                      const r = directReports.find(r => r.id === selectedReporteeId);
                      return r?.photo ? <AvatarImage src={r.photo} /> : <AvatarFallback>{r?.avatar || '??'}</AvatarFallback>;
                    })()}
                  </Avatar>
                  <h3 className="font-semibold text-lg">
                    {directReports.find(r => r.id === selectedReporteeId)?.name || 'Employee Details'}
                  </h3>
                </div>
              </div>
            </div>

            <Accordion type="multiple" value={expandedItems} className="space-y-3">
              {isLoadingKras ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : userKras.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                  No KRAs found for this employee.
                </div>
              ) : (
                userKras.map(kra => (
                  <AccordionItem
                    key={kra.id}
                    value={kra.id}
                    className="border rounded-lg overflow-hidden"
                    style={{ borderColor: `#3B82F630` }}
                  >
                    <AccordionTrigger
                      className="px-4 py-3 hover:no-underline hover:bg-slate-50"
                      onClick={() => toggleItem(kra.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: '#3B82F6' }}
                        />
                        <span className="font-medium text-left">{kra.kraName || 'Unknown KRA'}</span>
                        <Badge variant="secondary" className="ml-2">
                          {kra.goals?.length || 0} Goals
                        </Badge>
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        className="ml-auto mr-2 h-8 w-8 p-0 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-slate-100 hover:text-slate-900 text-slate-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddGoal(undefined, kra.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddGoal(undefined, kra.id);
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {(!kra.goals || kra.goals.length === 0) ? (
                        <div className="text-center py-8 text-slate-500">
                          No goals in this KRA
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {kra.goals.map((zohoGoal) => {
                            // Map ZohoGoal to Goal
                            const mappedGoal: Goal = {
                              id: zohoGoal.id,
                              name: zohoGoal.goalNameOnZoho,
                              description: zohoGoal.description,
                              pillarId: 1, // Dummy
                              kra: kra.kraName,
                              metrics: '',
                              priority: (zohoGoal.priority?.toLowerCase() as any) || 'medium',
                              progress: zohoGoal.localProgress ?? zohoGoal.zohoProgress ?? 0,
                              startDate: zohoGoal.startDate,
                              dueDate: zohoGoal.dueDate,
                              ownerId: selectedReporteeId,
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
                                onFeedback={() => handleFeedback(mappedGoal)}
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
                ))
              )}
            </Accordion>
          </div>
        ) : isLoadingReportees ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : directReports.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No direct reportees found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directReports.map(report => (
                  <TableRow
                    key={report.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedReporteeId(report.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-emerald-100">
                          {report.photo ? (
                            <AvatarImage src={report.photo} />
                          ) : (
                            <AvatarFallback className="text-emerald-700 text-xs">
                              {report.avatar}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900">{report.name}</p>
                          <p className="text-xs text-slate-500">{report.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{report.department || '-'}</TableCell>
                    <TableCell>{report.designation || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={report.status === 'Active' ? 'default' : 'secondary'}
                        className={report.status === 'Active' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : ""}
                      >
                        {report.status || 'Active'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>


      {/* Modals */}
      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onSave={handleSaveGoal}
        defaultPillarId={addGoalPillar}
        defaultKraId={addGoalKraId}
        availableKras={selectedReporteeId ? userKras : []}
        hideAssignee={true}
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
      />
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={handleSubmitFeedback}
        preselectedGoal={selectedGoal}
      />
    </div>
  );
}
