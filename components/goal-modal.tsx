"use client";

import React from "react"

import { useState, useEffect } from 'react';
import { Goal, PILLARS, KRA_OPTIONS, PillarId, GoalFeedback, FeedbackResponse, UserKra } from '@/lib/types';
import { getUserById, users } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Settings,
  Users,
  Lightbulb,
  Heart,
  Calendar,
  Star,
  Clock,
  Check,
  ChevronsUpDown,
  MessageSquare,
  Lock
} from 'lucide-react';
import { useRole } from '@/lib/role-context';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const pillarIcons: Record<string, React.ReactNode> = {
  target: <Target className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  lightbulb: <Lightbulb className="h-4 w-4" />,
  heart: <Heart className="h-4 w-4" />
};

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Partial<Goal>) => void;
  defaultPillarId?: PillarId;
  hideAssignee?: boolean;
  availableKras?: UserKra[];
  defaultKraId?: string;
}

const EMPTY_ARRAY: UserKra[] = [];

export function AddGoalModal({ isOpen, onClose, onSave, defaultPillarId, hideAssignee, availableKras = EMPTY_ARRAY, defaultKraId }: AddGoalModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pillarId: defaultPillarId || 1,
    kra: '',
    kraId: '',
    metrics: '',
    weightage: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    ownerId: '',
    progress: 0
  });

  const { currentRole, currentUser } = useRole();
  const [openAssignee, setOpenAssignee] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.role === 'employee' &&
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  React.useEffect(() => {
    // If not manager/hr OR hideAssignee is true, default owner is current user
    if ((currentRole === 'employee' || hideAssignee) && currentUser) {
      setFormData(prev => {
        if (prev.ownerId === currentUser.id) return prev;
        return { ...prev, ownerId: currentUser.id };
      });
    }

    // Pre-fill KRA if defaultKraId is provided
    if (defaultKraId && availableKras.length > 0) {
      const kra = availableKras.find(k => k.id === defaultKraId);
      if (kra) {
        // Find index to map to pillar style if needed, or just set it
        const index = availableKras.findIndex(k => k.id === defaultKraId);
        const stylePillar = PILLARS[index % PILLARS.length];

        setFormData(prev => {
          // Avoid update if already set
          if (prev.kraId === kra.id) return prev;

          return {
            ...prev,
            kra: kra.kraName,
            kraId: kra.id,
            pillarId: stylePillar.id
          };
        });
      }
    }
  }, [currentRole, currentUser, hideAssignee, defaultKraId, availableKras]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      pillarId: formData.pillarId as PillarId,
      status: 'not-started',
      syncStatus: 'pending'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pillar Selection */}
          <div className="space-y-2">
            <Label>Select KRA *</Label>
            <div className="grid grid-cols-4 gap-3">
              {availableKras && availableKras.length > 0 ? (
                // Dynamic KRAs from API
                availableKras.map((kra, index) => {
                  // Map to a PILLAR style based on index
                  const stylePillar = PILLARS[index % PILLARS.length];
                  const isSelected = formData.kra === kra.kraName;

                  return (
                    <button
                      key={kra.id}
                      type="button"
                      onClick={() => {
                        setFormData(d => ({
                          ...d,
                          kra: kra.kraName,
                          kraId: kra.id,
                          pillarId: stylePillar.id // Map to a valid pillar ID for backend compatibility
                        }));
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all h-28 w-full hover:scale-[1.02] active:scale-[0.98]",
                        isSelected
                          ? "border-current shadow-md bg-opacity-5"
                          : "border-slate-100 hover:border-slate-300 bg-white"
                      )}
                      style={{
                        borderColor: isSelected ? stylePillar.color : undefined,
                        backgroundColor: isSelected ? `${stylePillar.color}08` : undefined,
                        color: isSelected ? stylePillar.color : undefined
                      }}
                    >
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-transform shrink-0",
                          isSelected ? "scale-110" : ""
                        )}
                        style={{
                          backgroundColor: `${stylePillar.color}15`,
                          color: stylePillar.color
                        }}
                      >
                        {pillarIcons[stylePillar.icon]}
                      </div>
                      <span className={cn(
                        "text-xs font-medium text-center leading-tight break-words w-full px-1",
                        isSelected ? "text-current" : "text-slate-600"
                      )}>
                        {kra.kraName || 'Unknown KRA'}
                      </span>
                    </button>
                  );
                })
              ) : (
                // Fallback: Static Pillars
                PILLARS.map(pillar => (
                  <button
                    key={pillar.id}
                    type="button"
                    onClick={() => setFormData(d => ({ ...d, pillarId: pillar.id }))}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                      formData.pillarId === pillar.id
                        ? "border-current shadow-md"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                    style={{
                      borderColor: formData.pillarId === pillar.id ? pillar.color : undefined,
                      color: formData.pillarId === pillar.id ? pillar.color : undefined
                    }}
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center mb-1"
                      style={{
                        backgroundColor: `${pillar.color}15`,
                        color: pillar.color
                      }}
                    >
                      {pillarIcons[pillar.icon]}
                    </div>
                    <span className="text-xs text-center text-slate-600 line-clamp-2">
                      {pillar.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
                placeholder="Enter goal name"
                required
              />
            </div>

            {(currentRole === 'manager' || currentRole === 'hr') && !hideAssignee && (
              <div className="space-y-2">
                <Label>Assign To *</Label>
                <Popover open={openAssignee} onOpenChange={setOpenAssignee}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openAssignee}
                      className="w-full justify-between"
                    >
                      {formData.ownerId
                        ? users.find((user) => user.id === formData.ownerId)?.name
                        : "Select employee..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search employee..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandGroup>
                          {filteredUsers.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.name}
                              onSelect={() => {
                                setFormData(d => ({ ...d, ownerId: user.id }));
                                setOpenAssignee(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.ownerId === user.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-[10px]">{user.avatar}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span>{user.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{user.designation}</span>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="kra">KRA *</Label>
              <Select
                value={formData.kra}
                onValueChange={v => setFormData(d => ({ ...d, kra: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select KRA" />
                </SelectTrigger>
                <SelectContent>
                  {/* If dynamic KRAs are being used, the "Cards" selection effectively sets the KRA.
                      The dropdown can be used to switch or just show the selected one.
                  */}
                  {availableKras && availableKras.length > 0 ? (
                    availableKras.map(kra => (
                      <SelectItem key={kra.id} value={kra.kraName}>{kra.kraName}</SelectItem>
                    ))
                  ) : (
                    KRA_OPTIONS.map(kra => (
                      <SelectItem key={kra} value={kra}>{kra}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData(d => ({ ...d, description: e.target.value }))}
              placeholder="Describe the goal and expected outcomes"
              rows={3}
            />
          </div>


          <div className="space-y-2">
            <Label htmlFor="metrics">Metrics / KPIs</Label>
            <Input
              id="metrics"
              value={formData.metrics}
              onChange={e => setFormData(d => ({ ...d, metrics: e.target.value }))}
              placeholder="How will success be measured?"
            />
          </div>
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center text-sm">
              <Label htmlFor="progress">Progress</Label>
              <span className="font-medium text-muted-foreground">{formData.progress}%</span>
            </div>
            <Slider
              id="progress"
              defaultValue={[formData.progress]}
              max={100}
              step={1}
              value={[formData.progress]}
              onValueChange={(vals) => setFormData(d => ({ ...d, progress: vals[0] }))}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={v => setFormData(d => ({ ...d, priority: v as 'low' | 'medium' | 'high' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={e => setFormData(d => ({ ...d, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData(d => ({ ...d, dueDate: e.target.value }))}
                required
              />
            </div>
          </div>



          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ViewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onEdit?: () => void;
}

export function ViewGoalModal({ isOpen, onClose, goal, onEdit }: ViewGoalModalProps) {
  // All hooks must be at the top, before any conditional returns
  const { currentUser, currentRole } = useRole();
  const [feedbacks, setFeedbacks] = useState<GoalFeedback[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Derived values
  const owner = goal ? getUserById(goal.ownerId) : null;
  const assigner = goal ? getUserById(goal.assignedBy) : null;
  const pillar = goal ? PILLARS.find(p => p.id === goal.pillarId) : null;

  // Check if current user can view feedback
  const canViewFeedback =
    currentRole === 'hr' ||
    currentRole === 'manager' ||
    (goal && goal.ownerId === currentUser?.id);

  // Fetch feedback when modal opens
  useEffect(() => {
    if (isOpen && goal?.id && canViewFeedback && currentUser?.id) {
      const fetchFeedback = async () => {
        setIsLoadingFeedback(true);
        setFeedbackError(null);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/feedback/goal/${goal.id}`, {
            headers: {
              'x-employee-id': currentUser.id
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch feedback: ${response.statusText}`);
          }

          const data: FeedbackResponse = await response.json();
          if (data.status === 'success' && Array.isArray(data.data)) {
            setFeedbacks(data.data);
          } else {
            setFeedbacks([]);
          }
        } catch (error) {
          console.error('Error fetching feedback:', error);
          setFeedbackError(error instanceof Error ? error.message : 'Failed to load feedback');
          setFeedbacks([]);
        } finally {
          setIsLoadingFeedback(false);
        }
      };

      fetchFeedback();
    }
  }, [isOpen, goal?.id, canViewFeedback, currentUser?.id]);

  // Helper to format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // NOW we can do the early return, after all hooks
  if (!goal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              KRA: {goal.kra}
            </Badge>
          </div>
          <DialogTitle className="text-xl mt-2">{goal.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="feedback">
              <MessageSquare className="h-4 w-4 mr-1" />
              Feedback ({feedbacks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            <p className="text-slate-600">{goal.description}</p>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-500">Owner</Label>
                  {owner && (
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-8 w-8 bg-slate-200">
                        <AvatarFallback>{owner.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{owner.name}</p>
                        <p className="text-sm text-slate-500">{owner.designation}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-slate-500">KRA</Label>
                  <p className="font-medium mt-1">{goal.kra}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Metrics</Label>
                  <p className="font-medium mt-1">{goal.metrics}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-slate-500">Assigned By</Label>
                  {assigner && (
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-8 w-8 bg-slate-200">
                        <AvatarFallback>{assigner.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{assigner.name}</p>
                        <p className="text-sm text-slate-500">{assigner.designation}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  <div>
                    <Label className="text-slate-500">Start Date</Label>
                    <p className="font-medium mt-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(goal.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Due Date</Label>
                    <p className="font-medium mt-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(goal.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-500">Priority</Label>
                  <Badge variant="secondary" className="mt-1 capitalize">{goal.priority}</Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6 mt-4">
            <div className="text-center p-8 bg-slate-50 rounded-xl">
              <div className="relative inline-flex">
                <svg className="h-32 w-32 -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke={pillar?.color || '#3B82F6'}
                    strokeWidth="8"
                    strokeDasharray={`${(goal.progress / 100) * 352} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-slate-900">
                  {goal.progress}%
                </span>
              </div>
              <p className="text-slate-600 mt-4">Overall Progress</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Status</span>
                <Badge variant="secondary" className="capitalize">
                  {goal.status.replace('-', ' ')}
                </Badge>
              </div>
              <Progress value={goal.progress} className="h-3" />
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4 mt-4">
            {!canViewFeedback ? (
              <div className="text-center py-8 text-slate-500">
                <Lock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>You don't have permission to view feedback on this goal</p>
              </div>
            ) : isLoadingFeedback ? (
              <div className="text-center py-8 text-slate-500">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p>Loading feedback...</p>
              </div>
            ) : feedbackError ? (
              <div className="text-center py-8 text-red-500">
                <p>Error: {feedbackError}</p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No feedback received yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((fb: GoalFeedback) => (
                  <div key={fb._id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      {fb.isAnonymous ? (
                        <Avatar className="h-10 w-10 bg-slate-300">
                          <AvatarFallback>
                            <Lock className="h-5 w-5 text-slate-600" />
                          </AvatarFallback>
                        </Avatar>
                      ) : fb.providerId ? (
                        <Avatar className="h-10 w-10">
                          {fb.providerId.photo && (
                            <AvatarImage src={fb.providerId.photo} alt={`${fb.providerId.firstName} ${fb.providerId.lastName}`} />
                          )}
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {fb.providerId.firstName[0]}{fb.providerId.lastName?.[0] || ''}
                          </AvatarFallback>
                        </Avatar>
                      ) : null}

                      {/* Feedback Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <p className="font-medium text-slate-900">
                              {fb.isAnonymous ? 'Anonymous' : `${fb.providerId?.firstName} ${fb.providerId?.lastName || ''}`}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(fb.createdAt)}
                            </p>
                          </div>
                          {fb.rating && fb.rating > 0 && (
                            <div className="flex items-center bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500 mr-1" />
                              <span className="text-xs font-semibold text-amber-700">{fb.rating}.0</span>
                            </div>
                          )}
                        </div>
                        <p className="text-slate-700 mt-2">{fb.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onSave: (goal: Goal) => void;
  availableKras?: UserKra[];
}

export function EditGoalModal({ isOpen, onClose, goal, onSave, availableKras = [] }: EditGoalModalProps) {
  const [formData, setFormData] = useState<Goal | null>(goal);

  React.useEffect(() => {
    // Only reset formData when modal opens or when a different goal is selected
    if (isOpen && goal) {
      console.log("EditGoalModal Opened", { goal, availableKras });
      setFormData(goal);
    }
  }, [goal?.id, isOpen]); // Only depend on goal ID and isOpen, not availableKras

  if (!formData) return null;

  // Derive pillar from KRA context if available
  let pillar = PILLARS.find(p => p.id === formData.pillarId);

  if (availableKras.length > 0 && formData.kra) {
    // Find the KRA object that matches the goal's KRA name
    const kraIndex = availableKras.findIndex(k => k.kraName === formData.kra);
    if (kraIndex !== -1) {
      pillar = PILLARS[kraIndex % PILLARS.length];
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Goal Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e => setFormData(d => d ? { ...d, name: e.target.value } : null)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-kra">KRA</Label>
              <Input
                id="edit-kra"
                value={formData.kra}
                disabled
                className="bg-white cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea
              id="edit-desc"
              value={formData.description}
              onChange={e => setFormData(d => d ? { ...d, description: e.target.value } : null)}
              rows={3}
            />
          </div>



          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={v => setFormData(d => d ? { ...d, priority: v as 'low' | 'medium' | 'high' } : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
                onChange={e => setFormData(d => d ? { ...d, dueDate: e.target.value } : null)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Progress</Label>
              <span className="text-sm font-medium">{formData.progress}%</span>
            </div>
            <Slider
              value={[formData.progress]}
              onValueChange={([v]) => setFormData(d => d ? { ...d, progress: v } : null)}
              max={100}
              step={5}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
