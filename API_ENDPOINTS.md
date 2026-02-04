# API Endpoints & Integration Details

This document provides a reference for all external API integrations within the codebase, including purpose, endpoints, and exact code locations.

## Sync Integration

### 1. Pull Employees (Zoho Sync)
Triggers a synchronization process to pull the latest employee data from the external Zoho integration.

- **Endpoint**: `POST http://localhost:3000/api/v1/sync/employees`
- **Body**: `''` (Empty string)
- **Usage Locations**:

    **A. Goals Page (Header Button)**
    - **File**: `app/goals/page.tsx`
    - **Line**: 191
    - **Context**: "Pull Employees" button click handler for HR/Manager roles.

    **B. Sync Page (Pull Action)**
    - **File**: `app/sync/page.tsx`
    - **Line**: 70
    - **Context**: `handleSync` function when `action === 'pull-employees'`.

### 2. Pull Goals
Triggers a synchronization to pull goals for a specific employee from the external system.

- **Endpoint**: `POST http://localhost:3000/api/v1/sync/goals`
- **Headers**:
    - `x-employee-id`: `<User ID>` (e.g., `697b5cb4d001e9aaebffd049`)
- **Body**: `''` (Empty string)
- **Usage Locations**:

    **A. Sync Page (Pull Action)**
    - **File**: `app/sync/page.tsx`
    - **Line**: 80
    - **Context**: `handleSync` function when `action === 'pull-goals'`.
