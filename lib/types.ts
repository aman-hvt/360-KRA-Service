export type Role = 'hr' | 'manager' | 'employee';

// Backend role types from the API
export type BackendRole = 'Admin' | 'Director' | 'Manager' | 'Team Incharge' | 'Team Member';

export type PillarId = 1 | 2 | 3 | 4 | 5;

export interface Pillar {
  id: PillarId;
  name: string;
  icon: string;
  color: string;
  description: string;
}

/**
 * Map backend role to frontend role
 * Backend: 'Admin', 'Director', 'Manager', 'Team Incharge', 'Team Member'
 * Frontend: 'hr', 'manager', 'employee'
 */
export function mapBackendRoleToFrontend(backendRole: string): Role {
  switch (backendRole) {
    case 'Admin':
    case 'Director':
      return 'hr';
    case 'Manager':
    case 'Team Incharge':
      return 'manager';
    case 'Team Member':
    default:
      return 'employee';
  }
}

/**
 * User interface matching backend API response
 */
export interface User {
  id: string;                    // MongoDB _id
  zohoUserId?: string;           // Zoho People user ID
  name: string;                  // Full name
  email: string;                 // Email address
  avatar?: string;               // Avatar/initials (frontend computed)
  role: Role;                    // Frontend role (hr/manager/employee)
  designation: string | null;    // Job title
  department: string | null;     // Department name
  status?: string;               // Employee status (Active/Inactive)
  photo?: string | null;         // Photo URL from Zoho
  managerId?: string;            // Manager's user ID
  createdAt?: string;            // Creation timestamp
}

/**
 * Feedback provider information (populated from backend)
 */
export interface FeedbackProvider {
  _id: string;
  firstName: string;
  lastName: string;
  photo?: string;
}

/**
 * Feedback on a goal
 */
export interface GoalFeedback {
  _id: string;
  goalId: string;
  providerId: FeedbackProvider | null;
  comment: string;
  rating?: number;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Feedback API response
 */
export interface FeedbackResponse {
  status: string;
  count: number;
  data: GoalFeedback[];
}

/**
 * KRA with populated users for Feedback Center
 */
export interface FeedbackKRA {
  _id: string;
  kraName: string;
  userIds: FeedbackProvider[];
}

/**
 * Goal details in feedback response (populated)
 */
export interface FeedbackGoalDetails {
  _id: string;
  kraId?: FeedbackKRA;
  description: string;
  goalNameOnZoho: string;
  status: string;
}

/**
 * Feedback item for Received/Given tabs (with populated data)
 */
export interface FeedbackCenterItem {
  _id: string;
  goalId: FeedbackGoalDetails;
  providerId: FeedbackProvider | null;
  recipientId: FeedbackProvider | null;
  comment: string;
  rating?: number;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Feedback Center API response
 */
export interface FeedbackCenterResponse {
  status: string;
  count: number;
  data: FeedbackCenterItem[];
}

/**
 * Sync changes applied in a sync operation
 */
export interface SyncChanges {
  inserted: number;
  updated: number;
  inactivated: number;
  _id: string;
}

/**
 * Sync history item from backend
 */
export interface SyncHistoryItem {
  _id: string;
  syncType: string;
  initiatedBy: string | null;
  status: string;
  recordsProcessed: number;
  changesApplied: SyncChanges;
  errorDetails: string | null;
  completedAt: string;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

/**
 * Sync history API response
 */
export interface SyncHistoryResponse {
  status: string;
  data: {
    history: SyncHistoryItem[];
    count: number;
  };
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  pillarId: PillarId;
  kra: string;
  kraId?: string;
  metrics: string;
  weightage?: string;
  priority: 'low' | 'medium' | 'high';
  progress: number;
  startDate: string;
  dueDate: string;
  ownerId: string;
  assignedBy: string;
  status: 'not-started' | 'in-progress' | 'at-risk' | 'completed' | 'overdue';
  syncStatus: 'synced' | 'pending' | 'error';
  positionInPillar: number;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  goalId: string;
  providerId: string;
  recipientId: string;
  rating?: number;
  progressSuggestion: number;
  comment: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface SyncLog {
  id: string;
  action: 'pull-employees' | 'pull-goals' | 'push-progress';
  status: 'success' | 'failed' | 'pending';
  details: string;
  timestamp: string;
  performedBy: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'feedback' | 'goal-due' | 'sync' | 'review' | 'pillar-alert';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const PILLARS: Pillar[] = [
  {
    id: 1,
    name: 'Strategic Excellence',
    icon: 'target',
    color: '#3B82F6',
    description: 'Drive strategic initiatives and long-term vision'
  },
  {
    id: 2,
    name: 'Operational Performance',
    icon: 'settings',
    color: '#10B981',
    description: 'Optimize processes and operational efficiency'
  },
  {
    id: 3,
    name: 'People Development',
    icon: 'users',
    color: '#8B5CF6',
    description: 'Foster growth and develop team capabilities'
  },
  {
    id: 4,
    name: 'Innovation & Growth',
    icon: 'lightbulb',
    color: '#F59E0B',
    description: 'Drive innovation and explore new opportunities'
  },
  {
    id: 5,
    name: 'Customer Success',
    icon: 'heart',
    color: '#EC4899',
    description: 'Deliver exceptional customer experiences'
  }
];

export const KRA_OPTIONS = [
  'Revenue Growth',
  'Cost Optimization',
  'Process Improvement',
  'Team Development',
  'Customer Satisfaction',
  'Product Innovation',
  'Market Expansion',
  'Quality Assurance',
  'Compliance',
  'Employee Engagement'
];

export interface KraItem {
  id: string;
  kraName: string;
  description: string;
  pillarId: PillarId;
  metrics: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  status: 'In Progress' | 'Completed' | 'Not Started' | 'At Risk';
  progress: number;
  weightage: number;
}

export interface ZohoGoal {
  id: string;
  zohoGoalId: string;
  goalNameOnZoho: string;
  description: string;
  priority: string;
  startDate: string;
  dueDate: string;
  zohoProgress: number;
  localProgress: number;
  originalProgress: number;
  status: string;
  syncStatus: string;
  lastEditedLocally: string | null;
  lastSyncedAt: string;
  hasLocalChanges: boolean;
}

export interface UserKra {
  id: string;
  kraIdOnZoho: string;
  kraName: string;
  goalCount: number;
  goals: ZohoGoal[];
}
