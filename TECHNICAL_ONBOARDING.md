# KRA360 - Technical Onboarding Guide

**Welcome to KRA360!** 🎯

This document provides a comprehensive technical onboarding for new developers joining the KRA360 project. Read through this carefully to understand the system architecture, technology stack, development workflows, and best practices.

---

## 1. Project Overview

### What Problem Does KRA360 Solve?

Traditional performance management systems like Zoho People operate on rigid review cycles (quarterly/annual), which:
- Create **bias** due to heavy manager influence
- Lack **continuous feedback** mechanisms
- Don't preserve **audit trails** when employees leave
- Overwrite local changes during synchronization

**KRA360** solves these problems by building a **local-first 360° feedback and goal tracking system** that:
- Enables **continuous, unbiased feedback** from peers and managers
- Maintains **independent goal tracking** separate from Zoho review cycles
- Implements **soft deletion** to preserve historical data
- Gives **HR/Admin full control** over data synchronization

### Who Are the Users?

The system serves three distinct user roles:

1. **HR/Admin** 👔
   - Trigger manual sync of employees and goals from Zoho People
   - Review sync histories and audit trails
   - Control data flow between local system and Zoho

2. **Managers** 👨‍💼
   - View team goals and progress
   - Provide feedback (capped at 30% weight in calculations)
   - Review push previews before syncing to Zoho

3. **Employees** 👤
   - View all goals across the organization
   - Submit anonymous or attributed feedback
   - Track their own goal progress

### Core Business Goals

- **Reduce bias** in performance reviews through weighted feedback calculation
- **Enable continuous improvement** with real-time feedback
- **Maintain data integrity** with audit trails and soft deletion
- **Preserve local autonomy** while syncing with Zoho People when needed

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  (Next.js 16 + React 19 + TypeScript + Tailwind CSS)       │
│                                                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐  │
│  │Dashboard │  │  Goals    │  │ Feedback │  │  Sync    │  │
│  │   Views  │  │Management │  │   Form   │  │  Control │  │
│  └──────────┘  └───────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  Port: 3001 (dev)                                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/REST API
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                        SERVER                               │
│      (Node.js + Express + MongoDB + Mongoose)               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Layer (v1)                          │  │
│  │  Routes → Controllers → Services → Database          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────┐  ┌──────────┐  ┌────────────┐              │
│  │  Sync     │  │ Feedback │  │  Progress  │              │
│  │  Service  │  │ Service  │  │  Service   │              │
│  └─────┬─────┘  └──────────┘  └────────────┘              │
│        │                                                    │
│        │ OAuth 2.0                                          │
│        ▼                                                    │
│  ┌───────────────┐                                          │
│  │ Zoho People   │                                          │
│  │ Integration   │                                          │
│  └───────────────┘                                          │
│                                                             │
│  Port: 3000                                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
                  ┌──────────┐
                  │ MongoDB  │
                  │  Atlas   │
                  └──────────┘
```

**Architecture Pattern**: Traditional client-server architecture
- **Frontend**: Next.js App Router (SSR + CSR)
- **Backend**: RESTful API with Express.js
- **Database**: MongoDB (NoSQL Document Store)
- **Integration**: Zoho People API via OAuth 2.0

---

## 2. System Architecture

### Backend Architecture

**Location**: `kra360-service/`

#### **Service Layer** (`src/services/`)

The business logic is organized by domain:

- **`employeeSyncService.js`**: Syncs employees from Zoho with soft deletion
- **`goalSyncService.js`**: Pulls goals from Zoho, tracks local edits
- **`feedbackService.js`**: Manages feedback submission and retrieval
- **`kraService.js`**: Handles KRA (Key Result Area) operations
- **Progress Calculation Service** (in `progress/`): Calculates unbiased progress with manager weight capping

#### **API Layer** (`src/api/`)

- **Routes** (`routes/v1.js`): RESTful endpoints with role-based middleware
- **Controllers** (`controllers/`): Thin HTTP layer, delegates to services
- **Middleware** (`middleware/`): Authentication, authorization, error handling

#### **Integration Layer** (`src/integrations/zoho/`)

- **Zoho Client**: OAuth 2.0 authentication, API requests
- **Token Management**: Refresh token rotation for different user roles

#### **Database Layer** (`src/database/`)

- **Models** (`models/`):
  - `Employee.js`: User records with soft deletion (`isActive` flag)
  - `Goal.js`: Goal tracking with local edit tracking
  - `Feedback.js`: Feedback entries with anonymity support
  - `KRA.js`: Key Result Areas (pillars)
  - `SyncSnapshot.js`: Audit trail for all sync operations

---

### Frontend Architecture

**Location**: `kra360-client/`

#### **App Router Structure** (`app/`)

Next.js 16 uses the App Router pattern:

```
app/
├── layout.tsx           # Root layout with providers
├── page.tsx             # Landing page
├── dashboard/
│   └── page.tsx         # Role-based dashboard dispatcher
├── goals/
│   └── page.tsx         # Goals management UI
├── feedback/
│   └── page.tsx         # Feedback submission
├── sync/
│   └── page.tsx         # HR sync control panel
├── team/
│   └── page.tsx         # Team view
├── pillars/
│   └── page.tsx         # Pillar-based goal organization
└── reports/
    └── page.tsx         # Analytics and reporting
```

#### **Component Architecture** (`components/`)

- **Layout Components**:
  - `dashboard-layout.tsx`: Wrapper with sidebar + topbar
  - `sidebar.tsx`: Navigation with role-based menu items
  - `topbar.tsx`: User profile, notifications, search

- **Role-Specific Dashboards**:
  - `hr-dashboard.tsx`: Sync controls, system stats
  - `manager-dashboard.tsx`: Team overview, goal tracking
  - `employee-dashboard.tsx`: Personal goals, feedback received

- **Domain Components**:
  - `goal-card.tsx`: Goal display with progress visualization
  - `goal-modal.tsx`: Goal creation/editing form
  - `feedback-modal.tsx`: Feedback submission form
  - `pillar-card.tsx`: KRA pillar representation

- **UI Components** (`components/ui/`): 57+ Radix UI + shadcn/ui components

#### **State Management** (`lib/`)

- **`store.ts`**: Mock data store (currently client-side only)
  - Users, Goals, Feedback, SyncLogs, Notifications
  - Helper functions for data filtering and aggregation

- **`role-context.tsx`**: React Context for role-based UI switching

- **`types.ts`**: TypeScript interfaces and type definitions

---

### Data Flow

#### **Employee Sync Flow**

```
HR clicks "Pull Employees"
    ↓
Backend: POST /api/v1/sync/employees
    ↓
Zoho API: Fetch employee list
    ↓
For each employee:
  - If new → Create with default role
  - If exists → Update info, preserve local role
  - If missing in Zoho → Mark isActive=false (soft delete)
    ↓
Create SyncSnapshot for audit trail
    ↓
Return sync summary to client
```

#### **Feedback Submission Flow**

```
User submits feedback on a goal
    ↓
POST /api/v1/feedback
    ↓
Validate: User cannot feedback own goal
    ↓
Store feedback with isAnonymous flag
    ↓
Trigger progress recalculation:
  - Aggregate all feedback ratings
  - Cap manager weight at 30%
  - Calculate weighted average
    ↓
Update goal.progress field
    ↓
Create audit log entry
    ↓
Return success response
```

#### **Push to Zoho Flow**

```
Manager/HR clicks "Push to Zoho"
    ↓
GET /api/v1/sync/goals/push-preview
    ↓
Backend generates diff:
  - Local progress vs. Zoho current value
  - Show changes in preview UI
    ↓
User reviews and confirms
    ↓
POST /api/v1/sync/goals/push-confirm
    ↓
Send updates to Zoho People API
    ↓
Create SyncSnapshot
    ↓
Return confirmation
```

---

### Third-Party Services

| Service | Purpose | Integration Method |
|---------|---------|-------------------|
| **Zoho People** | HRIS, Employee data, Goal storage | OAuth 2.0 REST API |
| **MongoDB Atlas** | Primary database | Mongoose ODM |
| **Vercel Analytics** | Usage tracking | Next.js integration |

---

## 3. Tech Stack & Tooling

### Languages & Frameworks

**Frontend**:
- **Next.js**: 16.0.10 (React framework with App Router)
- **React**: 19.2.0 (UI library)
- **TypeScript**: ^5 (Type safety)
- **Tailwind CSS**: ^4.1.9 (Utility-first CSS)

**Backend**:
- **Node.js**: >= 20.0.0 LTS (Runtime)
- **Express**: ^4.18.2 (Web framework)
- **Mongoose**: ^8.0.3 (MongoDB ODM)
- **JavaScript (CommonJS)**: Standard

### Key Libraries

**Frontend**:
- **Radix UI**: 20+ accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library (^0.454.0)
- **React Hook Form**: Form state management (^7.60.0)
- **Zod**: Schema validation (3.25.76)
- **date-fns**: Date manipulation (4.1.0)
- **Recharts**: Data visualization (2.15.4)
- **Sonner**: Toast notifications (^1.7.4)

**Backend**:
- **Axios**: HTTP client for Zoho API (^1.6.2)
- **Joi**: Request validation (^17.11.0)
- **Winston**: Structured logging (^3.11.0)
- **Swagger UI Express**: API documentation (^5.0.1)
- **Dotenv**: Environment configuration (^16.3.1)

### Infrastructure

- **Development**: Local (Windows)
- **Database**: MongoDB (local or MongoDB Atlas)
- **Version Control**: GitLab (Hexaview AI University)
- **CI/CD**: Not configured yet
- **Deployment**: TBD (likely Vercel for frontend, Node.js hosting for backend)

### Dev Tools

**Frontend**:
- **Linting**: ESLint (Next.js config)
- **Type Checking**: TypeScript compiler
- **Package Manager**: npm
- **Dev Server**: `next dev -p 3001` (custom port)

**Backend**:
- **Linting**: Not configured
- **Testing**: Jest (unit + integration)
- **Dev Server**: Nodemon (auto-reload)
- **Package Manager**: npm

---

## 4. Codebase Walkthrough

### Repository Structure

```
Desktop/
├── kra360-client/          # Frontend (Next.js)
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── *-dashboard.tsx # Role-specific dashboards
│   │   └── *.tsx           # Domain components
│   ├── lib/                # Utilities and state
│   │   ├── store.ts        # Mock data store
│   │   ├── types.ts        # TypeScript types
│   │   ├── role-context.tsx # Role switching context
│   │   └── utils.ts        # Helpers
│   ├── hooks/              # Custom React hooks
│   ├── styles/             # Global styles
│   ├── public/             # Static assets
│   ├── .next/              # Build output
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   ├── tailwind.config.*
│   └── API_ENDPOINTS.md    # Frontend→Backend API reference
│
└── kra360-service/         # Backend (Node.js)
    ├── src/
    │   ├── api/
    │   │   ├── controllers/   # HTTP handlers
    │   │   ├── middleware/    # Auth, error handling
    │   │   └── routes/        # Route definitions
    │   ├── core/
    │   │   ├── config/        # Environment config
    │   │   └── logger/        # Winston logger
    │   ├── database/
    │   │   ├── models/        # Mongoose schemas
    │   │   └── index.js       # DB connection
    │   ├── services/          # Business logic
    │   │   ├── employeeSyncService.js
    │   │   ├── goalSyncService.js
    │   │   ├── feedbackService.js
    │   │   ├── kraService.js
    │   │   ├── feedback/
    │   │   ├── progress/
    │   │   └── sync/
    │   ├── integrations/
    │   │   └── zoho/          # Zoho API client
    │   ├── utils/             # Shared utilities
    │   ├── docs/              # Swagger/OpenAPI specs
    │   ├── app.js             # Express app setup
    │   └── server.js          # Entry point
    ├── tests/
    │   ├── unit/
    │   ├── integration/
    │   └── mocks/
    ├── specs/                 # Feature specifications
    │   └── 001-360-feedback/
    │       ├── spec.md        # Feature spec
    │       ├── plan.md        # Implementation plan
    │       ├── tasks.md       # Task breakdown
    │       └── data-model.md  # Database schema
    ├── logs/                  # Application logs
    ├── .env.example           # Environment template
    ├── package.json
    ├── jest.config.js
    ├── CONSTITUTION.md        # Project rules
    ├── PHASE1_SUMMARY.md
    └── README.md
```

### Entry Points

**Frontend Entry Point**:
- `app/layout.tsx`: Root layout, wraps app in providers
- `app/page.tsx`: Landing page (likely login/role selection)
- `app/dashboard/page.tsx`: Main app entry after authentication

**Backend Entry Point**:
- `src/server.js`: Starts HTTP server, connects to MongoDB
- `src/app.js`: Configures Express middleware and routes

### Configuration & Environment Variables

**Frontend** (`kra360-client/`):
- No `.env` file currently (hardcoded API URLs in components)
- Configuration: `next.config.mjs`, `tailwind.config.*`

**Backend** (`kra360-service/`):
- `.env` (not in repo, copy from `.env.example`)
- Key variables:
  ```env
  NODE_ENV=development
  PORT=3000
  MONGO_URI=mongodb://localhost:27017/kra360-feedback
  ZOHO_CLIENT_ID=your_client_id_here
  ZOHO_CLIENT_SECRET=your_client_secret_here
  ZOHO_REFRESH_TOKEN_HR=your_hr_refresh_token_here
  CORS_ORIGIN=http://localhost:3001
  MANAGER_MAX_WEIGHT=0.3
  ```

### Key Design Patterns

**Backend**:
- **Layered Architecture**: Routes → Controllers → Services → Database
- **Service Layer Pattern**: Business logic isolated from HTTP layer
- **Repository Pattern**: Mongoose models act as repositories
- **Middleware Chain**: Express middleware for auth, validation, error handling

**Frontend**:
- **Compound Component Pattern**: Layout components with composition
- **Context + Hooks**: Role management via React Context
- **Server + Client Components**: Next.js hybrid rendering
- **Component Library Pattern**: Reusable UI components with shadcn/ui

---

## 5. Core Features

### Feature 1: Continuous Feedback Submission

**What it does**: Any employee can provide feedback on any goal with optional anonymity.

**End-to-End Flow**:
1. User navigates to Goals page
2. Clicks "Give Feedback" on a goal
3. FeedbackModal opens with form:
   - Rating (0-100 scale or 1-5 stars)
   - Comment (text)
   - Anonymous toggle
4. Submit → `POST /api/v1/feedback`
5. Backend validates (no self-feedback)
6. Store feedback in DB with `isAnonymous` flag
7. Trigger progress recalculation
8. Return success, show toast notification

**Important Business Logic**:
- Employees **cannot** provide feedback on their own goals
- Anonymous feedback hides author in API responses (but logs in DB for audit)
- Manager feedback is **capped at 30% weight** in progress calculation

**Files Involved**:
- Frontend: `components/feedback-modal.tsx`, `app/feedback/page.tsx`
- Backend: `src/api/controllers/feedbackController.js`, `src/services/feedbackService.js`
- Database: `src/database/models/Feedback.js`

---

### Feature 2: HR Manual Synchronization Control

**What it does**: HR/Admin users manually trigger data sync between local system and Zoho People.

**End-to-End Flow**:

**Pull Employees**:
1. HR navigates to Sync page
2. Clicks "Pull Employees from Zoho"
3. Frontend: `POST http://localhost:3000/api/v1/sync/employees`
4. Backend fetches employees from Zoho API
5. For each employee:
   - New → Create with default role "Employee"
   - Existing → Update info, **preserve local role**
   - Missing in Zoho → Set `isActive=false` (soft delete)
6. Create `SyncSnapshot` for audit trail
7. Return summary to frontend
8. Display sync results

**Pull Goals**:
1. HR/Manager triggers goal sync
2. Frontend: `POST http://localhost:3000/api/v1/sync/goals`
   - Header: `x-employee-id: <userId>`
3. Backend fetches goals for specific employee from Zoho
4. Create/update local goal records
5. Track local edits for conflict detection
6. Create `SyncSnapshot`
7. Return success

**Important Business Logic**:
- **Soft Deletion**: Employees are never hard-deleted, `isActive` flag is used
- **Role Preservation**: Local role assignments (HR, Manager) are **never overwritten** by Zoho sync
- **Manual Only**: No automatic/scheduled syncs, all user-initiated

**Files Involved**:
- Frontend: `app/sync/page.tsx`, `app/goals/page.tsx`
- Backend: `src/api/controllers/syncController.js`, `src/services/employeeSyncService.js`, `src/services/goalSyncService.js`
- Database: `src/database/models/Employee.js`, `src/database/models/Goal.js`, `src/database/models/SyncSnapshot.js`

---

### Feature 3: Unbiased Progress Calculation

**What it does**: Automatically calculates goal progress from feedback with manager influence capped at 30%.

**End-to-End Flow**:
1. New feedback is submitted on a goal
2. Progress service is triggered
3. Fetch all feedback for goal
4. Categorize feedback by role:
   - Manager feedback (from goal.assignedBy)
   - Peer feedback (all others)
5. Calculate weighted average:
   ```javascript
   managerWeight = Math.min(managerCount / totalFeedback, 0.3)
   peerWeight = 1 - managerWeight
   
   progress = (managerAvg * managerWeight) + (peerAvg * peerWeight)
   ```
6. Update `goal.progress` field
7. Create audit log entry

**Important Business Logic**:
- Manager weight **never exceeds 30%** (Constitution Rule 5.1)
- Self-feedback has **0% weight** (either blocked or ignored)
- Progress is **deterministic**: same inputs always yield same output
- All calculations are **logged for auditability**

**Files Involved**:
- Backend: `src/services/progress/` (progress calculation service)
- Database: `src/database/models/Goal.js`, `src/database/models/Feedback.js`

---

### Feature 4: Role-Based Dashboards

**What it does**: Different user interfaces based on user role (HR, Manager, Employee).

**End-to-End Flow**:
1. User logs in (currently simulated with role selection)
2. `RoleProvider` context sets `currentRole`
3. Dashboard page (`app/dashboard/page.tsx`) reads role
4. Conditionally renders:
   - `HRDashboard`: Sync controls, system stats, all users
   - `ManagerDashboard`: Team goals, direct reports, analytics
   - `EmployeeDashboard`: Personal goals, feedback received

**Important Business Logic**:
- Role is currently stored in client-side context (mock authentication)
- Future: Role will come from authenticated user record in backend

**Files Involved**:
- Frontend: `lib/role-context.tsx`, `app/dashboard/page.tsx`, `components/{hr,manager,employee}-dashboard.tsx`

---

## 6. Authentication & Authorization

### Current Auth Mechanism

**⚠️ CRITICAL**: The system currently uses **mock authentication** for development.

**Frontend**:
- `RoleProvider` context allows manual role switching
- No actual user authentication
- No JWT or session management

**Backend**:
- `middleware/auth.js` has authentication middleware defined
- Currently **not fully implemented**
- Routes expect authentication but don't enforce it yet

### Planned Auth Mechanism

Based on specifications:
- **JWT-based authentication**
- Login with email/password
- Tokens stored in HTTP-only cookies or localStorage
- User role fetched from `Employee.localRole` field

### Role-Based Access Control (RBAC)

**Three roles defined**:

| Role | Permissions |
|------|-------------|
| **HR/Admin** | - Trigger employee sync<br>- Trigger goal sync<br>- View all users/goals<br>- Access sync history<br>- Push to Zoho |
| **Manager** | - View team goals<br>- Provide feedback<br>- Review push previews<br>- View direct reports |
| **Employee** | - View all goals<br>- Provide feedback<br>- View own progress |

**RBAC Middleware** (`src/api/middleware/auth.js`):
```javascript
authenticate       // Verify JWT token
adminOrDirector    // HR/Admin only
managementOnly     // HR/Admin/Manager
allEmployees       // All authenticated users
```

**Route Protection Example**:
```javascript
// Only HR/Admin can sync employees
router.post('/sync/employees', authenticate, adminOrDirector, syncController.syncEmployees)

// All employees can submit feedback
router.post('/feedback', authenticate, allEmployees, feedbackController.submitFeedback)
```

### Security Considerations

1. **Zoho API Credentials**: Stored in `.env`, **NEVER commit to Git**
2. **Refresh Tokens**: Separate tokens for HR, Admin, Employee roles
3. **Anonymous Feedback**: Author ID is stored in DB (audit), but **never exposed** in API responses
4. **Soft Deletion**: Preserves data for audit, prevents data loss
5. **CORS**: Configured to allow only specific origins (`http://localhost:3001`)

---

## 7. Database & Data Models

### Schema Overview

**Database**: MongoDB (NoSQL document store)
**ODM**: Mongoose

**Collections**:
- `employees`: User records with soft deletion
- `goals`: Goal tracking with local edit tracking
- `feedbacks`: Feedback entries
- `kras`: Key Result Areas (pillars)
- `syncsnapshots`: Audit trail for all sync operations

### Important Tables/Collections

#### **Employee** (`src/database/models/Employee.js`)

```javascript
{
  zohoEmployeeId: String,       // Zoho People ID
  name: String,                 // Full name
  email: String (unique),       // Email address
  localRole: String,            // 'Admin', 'Director', 'Manager', 'Employee'
  designation: String,          // Job title
  department: String,           // Department name
  managerId: ObjectId,          // Reference to manager
  isActive: Boolean,            // Soft deletion flag
  lastSyncedAt: Date,           // Last Zoho sync timestamp
  localMetadata: {              // Local-only fields
    assignedBy: String,
    assignedAt: Date
  }
}
```

**Key Points**:
- `isActive=false`: Soft-deleted employee (not in Zoho anymore)
- `localRole`: **Preserved during sync**, never overwritten
- `zohoEmployeeId`: Used to match with Zoho records

---

#### **Goal** (`src/database/models/Goal.js`)

```javascript
{
  zohoGoalId: String,           // Zoho goal ID
  employeeId: ObjectId,         // Goal owner (ref: Employee)
  kraId: ObjectId,              // KRA/Pillar (ref: KRA)
  title: String,                // Goal title
  description: String,          // Goal description
  targetValue: Number,          // Target metric
  currentProgress: Number,      // Calculated progress (0-100)
  status: String,               // 'Not Started', 'In Progress', 'Completed'
  startDate: Date,
  dueDate: Date,
  lastEditedLocally: Date,      // Track local modifications
  lastSyncedAt: Date
}
```

**Key Points**:
- `currentProgress`: Auto-calculated from feedback
- `lastEditedLocally`: Used to detect sync conflicts
- Goals can be **edited locally** after Zoho import

---

#### **Feedback** (`src/database/models/Feedback.js`)

```javascript
{
  goalId: ObjectId,             // Goal being reviewed
  providerId: ObjectId,         // Feedback author
  receiverId: ObjectId,         // Goal owner
  rating: Number,               // 0-100 scale
  comment: String,              // Text feedback
  isAnonymous: Boolean,         // Anonymity flag
  createdAt: Date
}
```

**Key Points**:
- `isAnonymous=true`: `providerId` is **hidden** in API responses
- Feedback is **append-only**, never modified or deleted
- Used for progress calculation

---

#### **KRA (Key Result Area)** (`src/database/models/KRA.js`)

```javascript
{
  name: String,                 // 'Strategic Excellence', 'Operational Performance', etc.
  pillarId: Number,             // 1-5 (matches frontend PILLARS)
  description: String,
  color: String,                // Hex color for UI
  icon: String                  // Icon name
}
```

**Key Points**:
- Represents the 5 pillars shown in the UI
- Goals are organized under KRAs

---

#### **SyncSnapshot** (`src/database/models/SyncSnapshot.js`)

```javascript
{
  syncType: String,             // 'pull-employees', 'pull-goals', 'push-progress'
  initiatedBy: ObjectId,        // User who triggered sync
  status: String,               // 'success', 'failed', 'pending'
  recordsProcessed: Number,     // Total records synced
  recordsCreated: Number,
  recordsUpdated: Number,
  recordsSoftDeleted: Number,
  details: String,              // Summary message
  errorLog: String,             // Error details if failed
  startedAt: Date,
  completedAt: Date
}
```

**Key Points**:
- **Audit trail** for all sync operations
- Never deleted, permanent record
- Used for debugging and compliance

---

### Relationships and Constraints

```
Employee (1) ─── manages ───> (N) Employee
    │                              │
    │                              │
    │ owns                         │ owns
    ▼                              ▼
  Goal (N) ◄─── belongs to ─── (1) KRA
    │
    │ has
    ▼
  Feedback (N)
```

**Constraints**:
- Employee email is unique
- Goals belong to exactly one KRA
- Feedback cannot be for self (validated in service layer)
- Soft-deleted employees (`isActive=false`) retain all relationships

---

## 8. APIs & Communication

### Key API Endpoints

**Base URL**: `http://localhost:3000/api/v1`

#### **Sync Endpoints**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/sync/employees` | Admin/Director | Pull employees from Zoho |
| GET | `/sync/employees/history` | Admin/Director | Get sync history |
| GET | `/sync/employees/last` | Admin/Director | Get last sync details |
| POST | `/sync/goals` | Admin/Director | Pull goals for user |
| GET | `/sync/goals/push-preview` | Management | Preview changes before push |
| POST | `/sync/goals/push-confirm` | Management | Confirm push to Zoho |

#### **Goal Endpoints**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/goals` | All | List all goals |
| GET | `/goals/:id` | All | Get goal details |

#### **Feedback Endpoints**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/feedback` | All | Submit feedback |
| GET | `/feedback/goal/:goalId` | All | Get feedback for goal |
| GET | `/feedback/received` | All | Get feedback received |
| GET | `/feedback/given` | All | Get feedback given |

#### **Employee Endpoints**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/employees` | All | List all employees |
| GET | `/employees/:id` | All | Get employee by ID |

#### **KRA Endpoints**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/kras/my-kras` | All | Get current user's KRAs |
| GET | `/kras/user/:userId` | All | Get user's KRAs |
| GET | `/kras/:id` | All | Get KRA by ID |

---

### Request/Response Patterns

**Standard Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Standard Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [ ... ]
  }
}
```

**Pagination** (when applicable):
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### Error Handling Strategy

**Backend** (`src/api/middleware/errorHandler.js`):
- Centralized error handling middleware
- Logs all errors with Winston
- Returns consistent error format
- Sanitizes errors in production (no stack traces)

**Frontend**:
- Try-catch blocks around API calls
- Toast notifications for user feedback (Sonner library)
- Error boundaries for React component errors

---

### API Versioning Approach

- **Current Version**: v1
- **URL Structure**: `/api/v1/*`
- **Future**: New versions will use `/api/v2/*`, maintaining backward compatibility

---

## 9. Development Workflow

### How to Run the Project Locally

#### **Prerequisites**:
1. Node.js >= 20.0.0
2. MongoDB (local or Atlas URI)
3. Zoho API credentials (Client ID, Secret, Refresh Tokens)

#### **Backend Setup**:

```bash
# 1. Navigate to backend directory
cd c:\Users\arshid.bhat\Desktop\kra360-service

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and Zoho credentials

# 4. Start MongoDB (if local)
mongod --dbpath ./data

# 5. Start dev server (with auto-reload)
npm run dev

# Or production mode:
npm start
```

**Verify**: Visit `http://localhost:3000/health` → Should see `{"status":"OK",...}`

---

#### **Frontend Setup**:

```bash
# 1. Navigate to frontend directory
cd c:\Users\arshid.bhat\Desktop\kra360-client

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

**Verify**: Visit `http://localhost:3001` → Should see landing page

---

### Running Both Together

**Option 1: Two Terminal Windows**:
```bash
# Terminal 1: Backend
cd kra360-service && npm run dev

# Terminal 2: Frontend
cd kra360-client && npm run dev
```

**Option 2: Process Manager** (optional):
- Use tools like `concurrently` or `pm2` to run both simultaneously

---

### Branching Strategy

**Not explicitly defined, but recommended**:
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/xxx`: New features
- `bugfix/xxx`: Bug fixes
- `hotfix/xxx`: Critical production fixes

**Workflow**:
1. Create feature branch from `develop`
2. Implement feature
3. Test locally
4. Create merge request to `develop`
5. Code review
6. Merge to `develop`
7. Release to `main` when stable

---

### Commit Conventions

**Not enforced, but best practice**:

Use **Conventional Commits** format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Build/tooling changes

**Examples**:
```bash
feat(feedback): add anonymous feedback toggle
fix(sync): preserve local roles during employee sync
docs(readme): update installation instructions
```

---

### Code Review Process

**Not formalized, but recommended**:
1. Self-review before creating MR
2. Ensure tests pass
3. Update documentation
4. Request review from team lead/senior dev
5. Address feedback
6. Merge after approval

---

### Testing Expectations

**Backend**:
- **Unit Tests**: Test service logic in isolation
- **Integration Tests**: Test API endpoints with mock DB
- **Coverage Goal**: Aim for >80% coverage

**Run Tests**:
```bash
# All tests with coverage
npm test

# Watch mode
npm run test:watch

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

**Frontend**:
- Currently **no tests configured**
- Future: Add Jest + React Testing Library

---

## 10. Known Issues & Tech Debt

### Current Limitations

1. **No Real Authentication** ⚠️
   - Frontend uses mock role switching
   - Backend auth middleware not fully implemented
   - **Impact**: Security risk, can't deploy to production

2. **Frontend Uses Mock Data** 📊
   - `lib/store.ts` has hardcoded data
   - Not connected to backend API yet
   - **Impact**: Frontend and backend are disconnected

3. **No Environment Config in Frontend** 🔧
   - API URLs hardcoded in components
   - No `.env` file for frontend
   - **Impact**: Hard to switch between environments

4. **Incomplete Error Handling** ❌
   - Some API calls lack try-catch blocks
   - Error messages not always user-friendly
   - **Impact**: Poor UX when errors occur

5. **No Loading States** ⏳
   - API calls don't show loading indicators
   - Users don't know when requests are in progress
   - **Impact**: Confusing UX

---

### Areas Under Refactor

1. **Frontend-Backend Integration**
   - Need to replace mock data with actual API calls
   - Implement proper state management (React Query or SWR)

2. **Authentication System**
   - Implement JWT authentication
   - Add login/logout flows
   - Secure routes

3. **Type Safety**
   - Frontend types don't match backend models
   - Need shared type definitions or API contract

4. **Testing**
   - Add frontend tests
   - Increase backend test coverage
   - Add E2E tests (Playwright/Cypress)

---

### Performance Bottlenecks

1. **No Pagination** 📄
   - `/goals` endpoint returns all goals
   - Could be slow with 1000+ goals
   - **Solution**: Add cursor-based pagination

2. **N+1 Queries** 🔍
   - Some endpoints fetch related data in loops
   - **Solution**: Use Mongoose `populate()` or aggregation

3. **No Caching** 💾
   - Every request hits database
   - **Solution**: Add Redis for frequently accessed data

4. **Large Bundle Size** 📦
   - Frontend includes 57+ UI components
   - **Solution**: Code splitting, lazy loading

---

### Security Concerns

1. **Zoho Credentials in `.env`** 🔐
   - Currently stored in plaintext
   - **Risk**: If `.env` leaks, full Zoho access compromised
   - **Solution**: Use secret management service (AWS Secrets Manager, HashiCorp Vault)

2. **No Rate Limiting** 🚦
   - API endpoints not rate-limited
   - **Risk**: DoS attacks, API abuse
   - **Solution**: Add `express-rate-limit`

3. **CORS Configuration** 🌐
   - Currently allows `localhost:3001`
   - **Risk**: Need to update for production domains
   - **Solution**: Environment-specific CORS config

4. **Input Validation** ✅
   - Backend uses Joi for validation
   - Frontend validation is minimal
   - **Solution**: Add client-side validation with Zod

---

### Scaling Concerns

1. **Single MongoDB Instance** 🗄️
   - No replication or sharding
   - **Risk**: Single point of failure
   - **Solution**: Use MongoDB Atlas with replica sets

2. **Synchronous Zoho API Calls** ⏱️
   - Sync operations block HTTP response
   - Large syncs (10,000 employees) could timeout
   - **Solution**: Move syncs to background jobs (Bull/BullMQ)

3. **No CDN for Static Assets** 🖼️
   - Next.js serves static files directly
   - **Solution**: Use Vercel Edge Network or CloudFlare CDN

---

## 11. Best Practices & Gotchas

### Things to Be Careful About

1. **Never Hard-Delete Employees** 🚫
   - Always use `isActive=false` for soft deletion
   - **Why**: Preserves audit trails and historical feedback
   - **Enforced by**: `employeeSyncService.js`

2. **Preserve Local Roles During Sync** 👔
   - `localRole` field must **never** be overwritten by Zoho data
   - **Why**: Local role assignments are system-critical
   - **Check**: `employee.localMetadata.assignedBy` to see if locally assigned

3. **Manager Weight Cap** ⚖️
   - Manager feedback weight cannot exceed 30%
   - **Why**: Core principle to reduce bias
   - **Enforced by**: Progress calculation service

4. **Anonymous Feedback Privacy** 🔒
   - Never expose `providerId` if `isAnonymous=true`
   - **Why**: Violates user trust and system contract
   - **Enforced by**: Controller layer filters response

5. **Sync Operations Are Manual Only** ⏯️
   - Never add scheduled/automatic syncs without user approval
   - **Why**: Violates "Local System Is Authority" principle (Constitution 1.2)

---

### Common Mistakes New Devs Make

1. **Forgetting to Preserve Local Roles** ❌
   ```javascript
   // WRONG:
   employee.localRole = zohoData.role;
   
   // CORRECT:
   if (!employee.localMetadata.assignedBy) {
     employee.localRole = zohoData.role;
   }
   ```

2. **Exposing Anonymous Feedback** ❌
   ```javascript
   // WRONG:
   return feedback; // Includes providerId
   
   // CORRECT:
   if (feedback.isAnonymous) {
     delete feedback.providerId;
   }
   return feedback;
   ```

3. **Not Creating SyncSnapshot** ❌
   - Every sync operation must create a SyncSnapshot for audit
   - Missing snapshots = compliance violation

4. **Hard-Deleting Instead of Soft-Deleting** ❌
   ```javascript
   // WRONG:
   await Employee.deleteOne({ _id: employeeId });
   
   // CORRECT:
   await Employee.updateOne({ _id: employeeId }, { isActive: false });
   ```

5. **Not Validating Against Self-Feedback** ❌
   ```javascript
   // WRONG:
   await Feedback.create({ goalId, providerId, ... });
   
   // CORRECT:
   const goal = await Goal.findById(goalId);
   if (goal.employeeId.equals(providerId)) {
     throw new Error('Cannot provide feedback on own goal');
   }
   ```

---

### Coding Standards to Follow

**Backend**:
- Use **async/await**, avoid callbacks
- Always use **try-catch** for async operations
- Log all errors with **Winston**
- Use **Joi** for request validation
- Follow **service layer pattern**: Controllers should be thin
- Use **JSDoc** comments for functions

**Frontend**:
- Use **TypeScript** for all new files
- Follow **React Hooks** best practices
- Use **Tailwind CSS** utility classes (avoid inline styles)
- Extract reusable logic into **custom hooks**
- Use **shadcn/ui** components, don't reinvent
- Add **loading/error states** for all async operations

---

### Constitution Rules (MUST FOLLOW)

From `CONSTITUTION.md`:

**Rule 1: Documentation & Consistency** 📚
- Update Swagger/OpenAPI docs for all API changes
- Keep `API_ENDPOINTS.md` in sync

**Rule 2: Feature Implementation** 🏗️
- Never create functionality not in specs without approval
- Get explicit permission for architectural changes

**Rule 3: Data Integrity & Security** 🔐
- Always use RBAC for sensitive operations
- Follow role mapping:
  - Admin/Director: System-wide syncs
  - Management: Goal calculations and push to Zoho
  - All Employees: View goals, submit feedback

---

## 12. First Tasks for a New Developer

### Suggested Beginner-Friendly Tickets

Here are some great tasks to get familiar with the codebase:

**1. Add Loading States to Frontend** (⭐ Easy)
- **Goal**: Show spinners during API calls
- **Files**: `app/goals/page.tsx`, `components/feedback-modal.tsx`
- **Skills**: React, UI/UX
- **Impact**: Better user experience

**2. Create Environment Config for Frontend** (⭐ Easy)
- **Goal**: Add `.env.local` support for API URLs
- **Files**: Create `.env.example`, update API calls
- **Skills**: Next.js configuration
- **Impact**: Easier environment management

**3. Add Input Validation to Feedback Form** (⭐⭐ Medium)
- **Goal**: Validate feedback form with Zod before submission
- **Files**: `components/feedback-modal.tsx`
- **Skills**: React Hook Form, Zod
- **Impact**: Better data quality

**4. Implement Pagination for Goals API** (⭐⭐ Medium)
- **Goal**: Add page/limit query params to `/goals` endpoint
- **Files**: `src/api/controllers/goalController.js`, `src/services/goalService.js`
- **Skills**: Express, Mongoose
- **Impact**: Performance improvement

**5. Write Unit Tests for Feedback Service** (⭐⭐ Medium)
- **Goal**: Test feedback submission logic
- **Files**: `tests/unit/services/feedbackService.test.js`
- **Skills**: Jest, mocking
- **Impact**: Code quality and confidence

**6. Connect Frontend to Backend API** (⭐⭐⭐ Hard)
- **Goal**: Replace mock data with actual API calls
- **Files**: Multiple frontend components
- **Skills**: Next.js, API integration, state management
- **Impact**: Core functionality

---

### Areas to Explore First

**Day 1-2: Understand the Domain**
- Read `specs/001-360-feedback/spec.md` thoroughly
- Understand the 5 pillars (KRAs)
- Learn the difference between Zoho sync and local tracking
- Understand soft deletion and role preservation

**Day 3-4: Explore the Code**
- Start with backend: `src/server.js` → `src/app.js` → routes → controllers → services
- Review database models in `src/database/models/`
- Understand frontend structure: `app/` directory and components
- Run both servers locally and click through the UI

**Day 5: Read Conversations**
- Review conversation history (especially sync-related discussions)
- Understand how Zoho integration works
- Learn about the feedback calculation algorithm

**Week 2: First Contribution**
- Pick a beginner-friendly task from above
- Create a feature branch
- Make changes, test locally
- Create merge request

---

### How to Safely Make Your First Contribution

**Step-by-Step Process**:

1. **Pick a Small, Isolated Task**
   - Choose something with minimal dependencies
   - Avoid touching core business logic initially

2. **Create a Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-task-name
   ```

3. **Make Changes Incrementally**
   - Start with smallest possible change
   - Test after each change
   - Commit frequently with descriptive messages

4. **Test Your Changes**
   ```bash
   # Backend: Run tests
   cd kra360-service
   npm test
   
   # Frontend: Manual testing
   cd kra360-client
   npm run dev
   # Click through affected UI
   ```

5. **Update Documentation**
   - If you changed an API, update Swagger docs
   - If you added a feature, update README
   - If you changed behavior, update this onboarding doc

6. **Self-Review Checklist**
   - [ ] Code follows project conventions
   - [ ] No hardcoded values (use config/env)
   - [ ] Error handling added
   - [ ] Logging added (backend)
   - [ ] Tests pass
   - [ ] Documentation updated
   - [ ] Constitution rules followed

7. **Create Merge Request**
   - Write clear description of changes
   - Link to related issue/task
   - Tag reviewer
   - Be responsive to feedback

8. **Learn and Iterate**
   - Don't be afraid to ask questions
   - Use code review as learning opportunity
   - Read other developers' code

---

## 13. Useful Resources

### Internal Documentation
- **Feature Spec**: `kra360-service/specs/001-360-feedback/spec.md`
- **Implementation Plan**: `kra360-service/specs/001-360-feedback/plan.md`
- **Data Model**: `kra360-service/specs/001-360-feedback/data-model.md`
- **Task Breakdown**: `kra360-service/specs/001-360-feedback/tasks.md`
- **API Reference**: `kra360-client/API_ENDPOINTS.md`
- **Swagger Docs**: `http://localhost:3000/api-docs` (when server running)

### External Resources
- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev/
- **Express.js**: https://expressjs.com/
- **Mongoose**: https://mongoosejs.com/
- **shadcn/ui**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Zoho People API**: https://www.zoho.com/people/api/

### Team Contacts
- **Project Lead**: Aman Tyagi (amantyagi5783@gmail.com)
- **GitLab**: https://gitlab.com/hexaview/ai-initiatives/hexaview-ai-university/batch2/aman-tyagi-hvt/

---

## 14. Quick Reference Cheat Sheet

### Common Commands

```bash
# Backend
cd kra360-service
npm install                    # Install dependencies
npm run dev                    # Start dev server (with auto-reload)
npm start                      # Start production server
npm test                       # Run all tests
npm run test:watch             # Run tests in watch mode

# Frontend
cd kra360-client
npm install                    # Install dependencies
npm run dev                    # Start dev server (port 3001)
npm run build                  # Build for production
npm run lint                   # Run ESLint

# MongoDB
mongod --dbpath ./data         # Start local MongoDB
mongo                          # Open MongoDB shell
```

### File Locations

| What | Where |
|------|-------|
| Backend entry | `kra360-service/src/server.js` |
| Frontend entry | `kra360-client/app/layout.tsx` |
| API routes | `kra360-service/src/api/routes/v1.js` |
| Database models | `kra360-service/src/database/models/` |
| React components | `kra360-client/components/` |
| Types | `kra360-client/lib/types.ts` |
| Environment config | `kra360-service/.env` (copy from `.env.example`) |

### URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000/api/v1 |
| Health Check | http://localhost:3000/health |
| Swagger Docs | http://localhost:3000/api-docs |

---

## Welcome Aboard! 🚀

You're now ready to start contributing to KRA360! Remember:
- **Ask questions** when something is unclear
- **Read the specifications** before implementing features
- **Follow the Constitution** rules
- **Test your changes** thoroughly
- **Document as you go**

The team is here to help you succeed. Good luck, and happy coding! 💻✨
