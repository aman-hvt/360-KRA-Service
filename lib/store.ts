import { User, Goal, Feedback, SyncLog, Notification, Role, PillarId } from './types';
import { PILLARS } from './types';
export { PILLARS } from './types';

// Mock Data Aliases for backward compatibility
export const mockPillars = PILLARS;
export { goals as mockGoals };
export { users as mockEmployees };

export const mockDepartments = [
  { id: 'IT', name: 'IT' },
  { id: 'Product', name: 'Product' },
  { id: 'Sales', name: 'Sales' },
  { id: 'Human Resources', name: 'Human Resources' },
  { id: 'Engineering', name: 'Engineering' }
];


// Mock Users Data
export const users: User[] = [
  {
    id: '697c404b59c69bae48d3e82c',
    name: 'Anjali Singh',
    email: '95anjalisingh10@gmail.com',
    avatar: 'AS',
    role: 'hr',
    designation: 'Administration',
    department: 'HR',
    createdAt: '2024-01-15'
  },
  {
    id: 'hr-2',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    avatar: 'MC',
    role: 'hr',
    designation: 'HR Manager',
    department: 'Human Resources',
    createdAt: '2024-02-01'
  },
  {
    id: '697c404b59c69bae48d3e828',
    name: 'Aman Tyagi',
    email: 'amantyagi5783@gmail.com',
    avatar: 'AT',
    role: 'manager',
    designation: 'Manager',
    department: 'IT',
    createdAt: '2024-01-10'
  },
  {
    id: 'mgr-2',
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    avatar: 'ED',
    role: 'manager',
    designation: 'Product Manager',
    department: 'Product',
    createdAt: '2024-01-20'
  },
  {
    id: 'mgr-3',
    name: 'Robert Brown',
    email: 'robert.brown@company.com',
    avatar: 'RB',
    role: 'manager',
    designation: 'Sales Manager',
    department: 'Sales',
    createdAt: '2024-02-05'
  },
  {
    id: '697c404c59c69bae48d3e834',
    name: 'Vishal Verma',
    email: 'samantro.vv@gmail.com',
    avatar: 'VV',
    role: 'employee',
    designation: 'Team Member',
    department: 'IT',
    managerId: '697c404b59c69bae48d3e828',
    createdAt: '2024-01-25'
  },
  {
    id: 'emp-2',
    name: 'James Martinez',
    email: 'james.martinez@company.com',
    avatar: 'JM',
    role: 'employee',
    designation: 'Product Designer',
    department: 'Product',
    managerId: 'mgr-2',
    createdAt: '2024-02-10'
  },
  {
    id: 'emp-3',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@company.com',
    avatar: 'LA',
    role: 'employee',
    designation: 'Sales Representative',
    department: 'Sales',
    managerId: 'mgr-3',
    createdAt: '2024-02-15'
  },
  {
    id: 'emp-4',
    name: 'Kevin Lee',
    email: 'kevin.lee@company.com',
    avatar: 'KL',
    role: 'employee',
    designation: 'Junior Developer',
    department: 'Engineering',
    managerId: '697c404b59c69bae48d3e828',
    createdAt: '2024-03-01'
  },
  {
    id: 'emp-5',
    name: 'Maria Garcia',
    email: 'maria.garcia@company.com',
    avatar: 'MG',
    role: 'employee',
    designation: 'UX Researcher',
    department: 'Product',
    managerId: 'mgr-2',
    createdAt: '2024-03-05'
  },
  {
    id: 'emp-6',
    name: 'Tom Harris',
    email: 'tom.harris@company.com',
    avatar: 'TH',
    role: 'employee',
    designation: 'Account Executive',
    department: 'Sales',
    managerId: 'mgr-3',
    createdAt: '2024-03-10'
  }
];

// Mock Goals Data
export const goals: Goal[] = [
  // Strategic Excellence Goals
  {
    id: 'goal-1',
    name: 'Q1 Revenue Target Achievement',
    description: 'Achieve 120% of Q1 revenue targets through strategic initiatives',
    pillarId: 1,
    kra: 'Revenue Growth',
    metrics: '$2.5M in new bookings',
    priority: 'high',
    progress: 75,
    startDate: '2024-01-01',
    dueDate: '2024-03-31',
    ownerId: 'emp-3',
    assignedBy: 'mgr-3',
    status: 'in-progress',
    syncStatus: 'synced',
    positionInPillar: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-02-15'
  },
  {
    id: 'goal-2',
    name: 'Market Expansion Strategy',
    description: 'Develop and execute market expansion plan for APAC region',
    pillarId: 1,
    kra: 'Market Expansion',
    metrics: '3 new market entries',
    priority: 'high',
    progress: 45,
    startDate: '2024-01-15',
    dueDate: '2024-06-30',
    ownerId: 'mgr-3',
    assignedBy: '697c404b59c69bae48d3e82c',
    status: 'in-progress',
    syncStatus: 'synced',
    positionInPillar: 2,
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20'
  },
  // Operational Performance Goals
  {
    id: 'goal-3',
    name: 'CI/CD Pipeline Optimization',
    description: 'Reduce deployment time by 50% through pipeline improvements',
    pillarId: 2,
    kra: 'Process Improvement',
    metrics: 'Deployment time < 15 mins',
    priority: 'medium',
    progress: 60,
    startDate: '2024-02-01',
    dueDate: '2024-04-30',
    ownerId: '697c404c59c69bae48d3e834',
    assignedBy: '697c404b59c69bae48d3e828',
    status: 'in-progress',
    syncStatus: 'synced',
    positionInPillar: 1,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-25'
  },
  {
    id: 'goal-4',
    name: 'Cost Reduction Initiative',
    description: 'Identify and implement cost savings of 15% in operations',
    pillarId: 2,
    kra: 'Cost Optimization',
    metrics: '15% cost reduction',
    priority: 'high',
    progress: 30,
    startDate: '2024-01-20',
    dueDate: '2024-05-31',
    ownerId: '697c404b59c69bae48d3e828',
    assignedBy: '697c404b59c69bae48d3e82c',
    status: 'at-risk',
    syncStatus: 'pending',
    positionInPillar: 2,
    createdAt: '2024-01-20',
    updatedAt: '2024-02-18'
  },
  // People Development Goals
  {
    id: 'goal-5',
    name: 'Team Skills Assessment',
    description: 'Complete skills gap analysis for entire engineering team',
    pillarId: 3,
    kra: 'Team Development',
    metrics: '100% team coverage',
    priority: 'medium',
    progress: 85,
    startDate: '2024-01-10',
    dueDate: '2024-02-28',
    ownerId: '697c404b59c69bae48d3e828',
    assignedBy: '697c404b59c69bae48d3e82c',
    status: 'in-progress',
    syncStatus: 'synced',
    positionInPillar: 1,
    createdAt: '2024-01-10',
    updatedAt: '2024-02-22'
  },
  {
    id: 'goal-6',
    name: 'Mentorship Program Launch',
    description: 'Design and launch cross-functional mentorship program',
    pillarId: 3,
    kra: 'Employee Engagement',
    metrics: '20 mentor-mentee pairs',
    priority: 'medium',
    progress: 50,
    startDate: '2024-02-15',
    dueDate: '2024-04-15',
    ownerId: 'hr-2',
    assignedBy: '697c404b59c69bae48d3e82c',
    status: 'in-progress',
    syncStatus: 'synced',
    positionInPillar: 2,
    createdAt: '2024-02-15',
    updatedAt: '2024-02-28'
  },
  // Innovation & Growth Goals
  {
    id: 'goal-7',
    name: 'AI Feature Integration',
    description: 'Integrate AI-powered features into core product',
    pillarId: 4,
    kra: 'Product Innovation',
    metrics: '3 AI features shipped',
    priority: 'high',
    progress: 40,
    startDate: '2024-01-25',
    dueDate: '2024-05-31',
    ownerId: 'emp-4',
    assignedBy: '697c404b59c69bae48d3e828',
    status: 'in-progress',
    syncStatus: 'synced',
    positionInPillar: 1,
    createdAt: '2024-01-25',
    updatedAt: '2024-02-20'
  },
  {
    id: 'goal-8',
    name: 'Design System Overhaul',
    description: 'Modernize design system with new component library',
    pillarId: 4,
    kra: 'Product Innovation',
    metrics: '50 new components',
    priority: 'medium',
    progress: 65,
    startDate: '2024-02-01',
    dueDate: '2024-04-30',
    ownerId: 'emp-2',
    assignedBy: 'mgr-2',
    status: 'in-progress',
    syncStatus: 'synced',
    positionInPillar: 2,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-25'
  },
  // Customer Success Goals
  {
    id: 'goal-9',
    name: 'NPS Score Improvement',
    description: 'Increase NPS score from 45 to 60 through customer initiatives',
    pillarId: 5,
    kra: 'Customer Satisfaction',
    metrics: 'NPS >= 60',
    priority: 'high',
    progress: 55,
    startDate: '2024-01-05',
    dueDate: '2024-06-30',
    ownerId: 'emp-6',
    assignedBy: 'mgr-3',
    status: 'in-progress',
    syncStatus: 'synced',
    positionInPillar: 1,
    createdAt: '2024-01-05',
    updatedAt: '2024-02-18'
  },
  {
    id: 'goal-10',
    name: 'Customer Onboarding Revamp',
    description: 'Redesign customer onboarding to reduce time-to-value',
    pillarId: 5,
    kra: 'Customer Satisfaction',
    metrics: 'TTV < 7 days',
    priority: 'high',
    progress: 70,
    startDate: '2024-02-10',
    dueDate: '2024-04-15',
    ownerId: 'emp-5',
    assignedBy: 'mgr-2',
    status: 'in-progress',
    syncStatus: 'synced',
    positionInPillar: 2,
    createdAt: '2024-02-10',
    updatedAt: '2024-02-28'
  }
];

// Mock Feedback Data
export const feedbacks: Feedback[] = [
  {
    id: 'fb-1',
    goalId: 'goal-1',
    providerId: 'mgr-3',
    recipientId: 'emp-3',
    rating: 4,
    progressSuggestion: 80,
    comment: 'Great progress on the revenue targets. Keep pushing for the final stretch!',
    isAnonymous: false,
    createdAt: '2024-02-15'
  },
  {
    id: 'fb-2',
    goalId: 'goal-3',
    providerId: '697c404b59c69bae48d3e828',
    recipientId: '697c404c59c69bae48d3e834',
    rating: 5,
    progressSuggestion: 65,
    comment: 'Excellent work on the pipeline optimization. The deployment times are significantly improved.',
    isAnonymous: false,
    createdAt: '2024-02-20'
  },
  {
    id: 'fb-3',
    goalId: 'goal-7',
    providerId: '697c404c59c69bae48d3e834',
    recipientId: 'emp-4',
    rating: 4,
    progressSuggestion: 45,
    comment: 'The AI feature implementation is on track. Consider exploring more use cases.',
    isAnonymous: true,
    createdAt: '2024-02-18'
  },
  {
    id: 'fb-4',
    goalId: 'goal-8',
    providerId: 'mgr-2',
    recipientId: 'emp-2',
    rating: 5,
    progressSuggestion: 70,
    comment: 'The new design system components look fantastic. Great attention to detail!',
    isAnonymous: false,
    createdAt: '2024-02-22'
  },
  {
    id: 'fb-5',
    goalId: 'goal-9',
    providerId: 'mgr-3',
    recipientId: 'emp-6',
    rating: 4,
    progressSuggestion: 60,
    comment: 'NPS improvements are showing. Continue focusing on customer touchpoints.',
    isAnonymous: false,
    createdAt: '2024-02-25'
  }
];

// Mock Sync Logs
export const syncLogs: SyncLog[] = [
  {
    id: 'sync-1',
    action: 'pull-employees',
    status: 'success',
    details: 'Synced 12 employees from HRIS',
    timestamp: '2024-02-28T10:30:00Z',
    performedBy: '697c404b59c69bae48d3e82c'
  },
  {
    id: 'sync-2',
    action: 'pull-goals',
    status: 'success',
    details: 'Synced 10 goals from performance system',
    timestamp: '2024-02-28T11:00:00Z',
    performedBy: '697c404b59c69bae48d3e82c'
  },
  {
    id: 'sync-3',
    action: 'push-progress',
    status: 'success',
    details: 'Pushed progress updates for 8 goals',
    timestamp: '2024-02-28T14:00:00Z',
    performedBy: 'hr-2'
  },
  {
    id: 'sync-4',
    action: 'pull-employees',
    status: 'failed',
    details: 'Connection timeout to HRIS',
    timestamp: '2024-02-27T09:00:00Z',
    performedBy: '697c404b59c69bae48d3e82c'
  }
];

// Mock Notifications
export const notifications: Notification[] = [
  {
    id: 'notif-1',
    userId: '697c404c59c69bae48d3e834',
    type: 'feedback',
    title: 'New Feedback Received',
    message: 'David Wilson gave feedback on your CI/CD Pipeline Optimization goal',
    isRead: false,
    createdAt: '2024-02-28T10:00:00Z'
  },
  {
    id: 'notif-2',
    userId: 'emp-3',
    type: 'goal-due',
    title: 'Goal Due Soon',
    message: 'Q1 Revenue Target Achievement is due in 5 days',
    isRead: false,
    createdAt: '2024-02-28T08:00:00Z'
  },
  {
    id: 'notif-3',
    userId: '697c404b59c69bae48d3e82c',
    type: 'sync',
    title: 'Sync Completed',
    message: 'Employee sync completed successfully',
    isRead: true,
    createdAt: '2024-02-28T10:30:00Z'
  },
  {
    id: 'notif-4',
    userId: '697c404b59c69bae48d3e828',
    type: 'review',
    title: 'Review Pending',
    message: 'You have 3 goals pending review',
    isRead: false,
    createdAt: '2024-02-27T16:00:00Z'
  }
];

// Helper functions
export function getUsersByRole(role: Role): User[] {
  return users.filter(u => u.role === role);
}

export function getGoalsByPillar(pillarId: PillarId): Goal[] {
  return goals.filter(g => g.pillarId === pillarId);
}

export function getGoalsByUser(userId: string): Goal[] {
  return goals.filter(g => g.ownerId === userId);
}

export function getGoalsByAssigner(assignerId: string): Goal[] {
  return goals.filter(g => g.assignedBy === assignerId);
}

export function getFeedbackForGoal(goalId: string): Feedback[] {
  return feedbacks.filter(f => f.goalId === goalId);
}

export function getFeedbackForUser(userId: string): Feedback[] {
  return feedbacks.filter(f => f.recipientId === userId);
}

export function getFeedbackByGiver(giverId: string): Feedback[] {
  return feedbacks.filter(f => f.providerId === giverId);
}

export function getDirectReports(managerId: string): User[] {
  return users.filter(u => u.managerId === managerId);
}

export function getUserById(userId: string): User | undefined {
  return users.find(u => u.id === userId);
}

export function getGoalById(goalId: string): Goal | undefined {
  return goals.find(g => g.id === goalId);
}

export function getPillarStats(pillarId: PillarId) {
  const pillarGoals = getGoalsByPillar(pillarId);
  const totalGoals = pillarGoals.length;
  const avgProgress = totalGoals > 0
    ? Math.round(pillarGoals.reduce((sum, g) => sum + g.progress, 0) / totalGoals)
    : 0;
  const completed = pillarGoals.filter(g => g.status === 'completed').length;
  const atRisk = pillarGoals.filter(g => g.status === 'at-risk').length;
  const overdue = pillarGoals.filter(g => g.status === 'overdue').length;

  return { totalGoals, avgProgress, completed, atRisk, overdue };
}

export function getOverallStats() {
  return {
    totalUsers: users.length,
    totalHR: getUsersByRole('hr').length,
    totalManagers: getUsersByRole('manager').length,
    totalEmployees: getUsersByRole('employee').length,
    totalGoals: goals.length,
    avgProgress: Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length),
    goalsAtRisk: goals.filter(g => g.status === 'at-risk').length,
    goalsCompleted: goals.filter(g => g.status === 'completed').length
  };
}
