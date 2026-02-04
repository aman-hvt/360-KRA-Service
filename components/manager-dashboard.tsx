"use client";

import { useState, useEffect } from 'react';
import { PILLARS, PillarId, Goal, User, UserKra, ZohoGoal, Feedback } from '@/lib/types';
import {
  goals,
  users,
  getDirectReports,
  getGoalsByUser,
  getPillarStats,
  getUserById,
  getFeedbackByGiver
} from '@/lib/store';
import { useRole } from '@/lib/role-context';
import { StatsCard } from './stats-card';
import { PillarOverview } from './pillar-card';
import { GoalCard } from './goal-card';
import { AddGoalModal, ViewGoalModal, EditGoalModal } from './goal-modal';
import { FeedbackModal } from './feedback-modal';
import {
  Users,
  UsersRound,
  ClipboardCheck,
  TrendingUp,
  Plus,
  Search,
  Eye,
  MessageSquare,
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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

export function ManagerDashboard() {
  const { currentUser } = useRole();
  const { toast } = useToast();

  // Local state for API data
  const [apiDirectReports, setApiDirectReports] = useState<any[]>([]);
  const [isLoadingReportees, setIsLoadingReportees] = useState(false);

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
          console.log("Direct Reportees API Response:", data);
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

  // Use API data
  const directReports = apiDirectReports.map(r => ({
    id: r._id || r.id,
    name: r.name,
    email: r.email,
    designation: r.designation,
    department: r.department,
    status: r.status,
    photo: r.photo,
    avatar: r.name ? r.name.substring(0, 2).toUpperCase() : '??',
    role: 'employee' as const
  }));

  const indirectReports = directReports.flatMap(dr => getDirectReports(dr.id));
  const allReportees = [...directReports, ...indirectReports];

  const teamGoals = allReportees.flatMap(r => getGoalsByUser(r.id));
  const avgProgress = teamGoals.length > 0
    ? Math.round(teamGoals.reduce((sum, g) => sum + g.progress, 0) / teamGoals.length)
    : 0;
  const pendingReviews = teamGoals.filter(g => g.status === 'in-progress' || g.status === 'at-risk').length;

  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [userKras, setUserKras] = useState<UserKra[]>([]);
  const [isLoadingKras, setIsLoadingKras] = useState(false);
  const [selectedReportee, setSelectedReportee] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [reporteeTab, setReporteeTab] = useState('direct');

  // Modal states
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isViewGoalOpen, setIsViewGoalOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [addGoalPillar, setAddGoalPillar] = useState<PillarId | undefined>();
  const [addGoalKraId, setAddGoalKraId] = useState<string | undefined>();

  // Refresh trigger for data refetching
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // Fetch Reportee KRAs when selected
  useEffect(() => {
    if (selectedReportee && currentUser?.id) {
      const fetchReporteeKras = async () => {
        setIsLoadingKras(true);
        try {
          // Use 'effectiveEmployeeId' logic similar to GoalsPage or just selectedReportee
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kras/user/${selectedReportee}`, {
            headers: {
              'x-employee-id': currentUser.id
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch KRAs');
          }

          const data = await response.json();
          if (data.status === 'success' && data.data && Array.isArray(data.data.kras)) {
            setUserKras(data.data.kras);
            // Default to collapsed (empty array) so user can expand as needed
            // setExpandedItems([]);
          } else {
            setUserKras([]);
          }
        } catch (error) {
          console.error("Error fetching KRAs:", error);
          toast({
            title: "Error fetching Goals",
            description: "Could not load reportee goals.",
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
  }, [selectedReportee, currentUser, lastUpdated]);

  const toggleItem = (value: string) => {
    setExpandedItems(prev =>
      prev.includes(value)
        ? prev.filter(id => id !== value)
        : [...prev, value]
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
      if (!selectedReportee) {
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
        progress: goalData.progress || 0, // API might ignore this if created new, but good to send
        targetEmployeeId: selectedReportee,
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
      setLastUpdated(Date.now()); // usage of lastUpdated to refresh
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
    setLastUpdated(Date.now());
  };

  const handleSubmitFeedback = async (feedbackData: Partial<Feedback>) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentUser?.id || ''
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast({
        title: "Feedback Submitted",
        description: "Your feedback has been recorded successfully."
      });
      setIsFeedbackOpen(false);
      // Optional: Refresh data if needed, though feedback is separate from goals list
      // setLastUpdated(Date.now());
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    }
  };

  const selectedReporteeGoals = selectedReportee
    ? getGoalsByUser(selectedReportee).filter(g =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : teamGoals.filter(g =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getReporteeStats = (userId: string) => {
    const userGoals = getGoalsByUser(userId);
    const avgProg = userGoals.length > 0
      ? Math.round(userGoals.reduce((sum, g) => sum + g.progress, 0) / userGoals.length)
      : 0;
    return { goalCount: userGoals.length, avgProgress: avgProg };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manager Dashboard</h1>
          <p className="text-slate-500">Track your team&apos;s progress and provide feedback</p>
        </div>
        {/* Only show "Add Goal" if a reportee is selected to provide context */}
        {selectedReportee && (
          <Button onClick={() => handleAddGoal()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Goal for Reportee
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Direct Reportees"
          value={directReports.length}
          icon={<Users className="h-6 w-6" />}
          color="green"
        />
        <StatsCard
          title="Indirect Reportees"
          value={indirectReports.length}
          icon={<UsersRound className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="Pending Reviews"
          value={pendingReviews}
          icon={<ClipboardCheck className="h-6 w-6" />}
          trend={{ value: 3, isPositive: false }}
          color="orange"
        />
        <StatsCard
          title="Team Progress"
          value={`${avgProgress}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          trend={{ value: 5, isPositive: true }}
          color="purple"
        />
      </div>

      {/* Reportees Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {/* <h2 className="text-lg font-semibold text-slate-900 mb-4">Team Members</h2> */}

        {selectedReportee ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedReportee('')}
                  className="gap-2 pl-0 hover:pl-2 transition-all"
                >
                  &larr; Back to Team
                </Button>
                <div className="h-6 w-px bg-slate-200" />
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 bg-emerald-100">
                    {(() => {
                      const r = allReportees.find(r => r.id === selectedReportee) || getUserById(selectedReportee);
                      return (r as any)?.photo ? <AvatarImage src={(r as any).photo} /> : <AvatarFallback>{(r as any)?.avatar || '??'}</AvatarFallback>;
                    })()}
                  </Avatar>
                  <h3 className="font-semibold text-lg">
                    {allReportees.find(r => r.id === selectedReportee)?.name || getUserById(selectedReportee)?.name}
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
                          // Open Add Goal modal pre-selected for this KRA
                          handleAddGoal(undefined, kra.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddGoal();
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
                              ownerId: selectedReportee,
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
        ) : (
          <Tabs value={reporteeTab} onValueChange={setReporteeTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="direct">Direct Reports ({directReports.length})</TabsTrigger>
              {/* <TabsTrigger value="indirect">Indirect Reports ({indirectReports.length})</TabsTrigger> */}
            </TabsList>

            <TabsContent value="direct">
              {isLoadingReportees ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
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
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => setSelectedReportee(selectedReportee === report.id ? '' : report.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 bg-emerald-100">
                              {(report as any).photo ? (
                                <AvatarImage src={(report as any).photo} />
                              ) : (
                                <AvatarFallback className="text-emerald-700 text-xs">
                                  {report.avatar}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="font-medium">{report.name}</p>
                              <p className="text-xs text-slate-500">{report.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{(report as any).department || '-'}</TableCell>
                        <TableCell>{report.designation || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={(report as any).status === 'Active' ? 'default' : 'secondary'} className={(report as any).status === 'Active' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : ""}>
                            {(report as any).status || 'Active'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* <TabsContent value="indirect">
              {indirectReports.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No indirect reports
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Active Goals</TableHead>
                      <TableHead>Avg Progress</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indirectReports.map(report => {
                      const stats = getReporteeStats(report.id);
                      return (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 bg-blue-100">
                                <AvatarFallback className="text-blue-700 text-xs">
                                  {report.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{report.name}</p>
                                <p className="text-xs text-slate-500">{report.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{report.designation}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{stats.goalCount} Goals</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={stats.avgProgress} className="w-20 h-2" />
                              <span className="text-sm font-medium">{stats.avgProgress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedReportee(report.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Goals
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent> */}
          </Tabs>
        )}
      </div>

      {/* Modals */}
      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onSave={handleSaveGoal}
        defaultPillarId={addGoalPillar}
        availableKras={userKras}
        hideAssignee={true} // Hide "Assigned To" since we are on manager dashboard for a specific reportee
        // We need to update AddGoalModal to accept defaultKraId if we want to pre-select it
        // For now, let's assume we might need to add that prop or handle it via availableKras logic
        defaultKraId={addGoalKraId}
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
