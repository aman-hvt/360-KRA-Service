# Frontend Authentication Setup - Complete! ✅

## Changes Implemented

I've successfully implemented the frontend changes for temporary authentication with Zoho IDs. Here's what was done:

---

## 📁 Files Created

### 1. `.env.local` (NEW)
- **Purpose**: Environment configuration for API base URL
- **Content**: `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1`
- **Note**: This file is gitignored by default in Next.js

### 2. `lib/api.ts` (NEW)
- **Purpose**: Centralized API client with error handling
- **Features**:
  - Custom `APIError` class for typed error handling
  - Generic `apiRequest()` function for all HTTP calls
  - Organized API namespaces:
    - `authAPI.loginWithZohoId()`
    - `goalsAPI.getGoals()`, `getGoalById()`
    - `feedbackAPI.submitFeedback()`, `getFeedbackForGoal()`
    - `employeesAPI.getEmployees()`, `getEmployeeById()`
    - `syncAPI.syncEmployees()`, `syncGoals()`

---

## ✏️ Files Modified

### 3. `lib/types.ts` (MODIFIED)
**Changes**:
- Added `BackendRole` type for backend role values
- Added `mapBackendRoleToFrontend()` helper function
  - Maps: `Admin/Director` → `hr`
  - Maps: `Manager/Team Incharge` → `manager`
  - Maps: `Team Member` → `employee`
- Updated `User` interface to match backend response:
  - Added `zohoUserId?: string`
  - Changed `designation` and `department` to `string | null`
  - Added `status?: string` for employee status
  - Added `photo?: string | null` for Zoho photo URL
  - Made `avatar`, `createdAt` optional

### 4. `lib/role-context.tsx` (MODIFIED)
**Major refactor from mock to real authentication**:

**Removed**:
- ❌ `setRole()` function (old mock method)
- ❌ `ROLE_SPECIFIC_IDS` hardcoded MongoDB IDs
- ❌ Import from `./store` (mock data)

**Added**:
- ✅ `login(zohoUserId: string)` async function
  - Calls `authAPI.loginWithZohoId()`
  - Transforms backend response to frontend User type
  - Generates avatar initials from name
  - Maps backend role to frontend role
  - Stores user in sessionStorage
- ✅ `isLoading` state for loading indicator
- ✅ `error` state for error messages
- ✅ `clearError()` function
- ✅ Session persistence on page refresh
- ✅ Automatic session restoration from sessionStorage

**Session Storage**:
- Key: `kra360_user`
- Value: JSON stringified User object
- Lifetime: Browser session (or until logout)

### 5. `components/landing-page.tsx` (MODIFIED)
**Changes**:
- Added `ROLE_ZOHO_IDS` mapping:
  ```typescript
  {
    hr: '1234567890123456789',       // TODO: Replace with real Zoho ID
    manager: '9876543210987654321',   // TODO: Replace with real Zoho ID
    employee: '5555555555555555555'   // TODO: Replace with real Zoho ID
  }
  ```
- Made `handleRoleSelect()` async
- Added API call to `login(zohoUserId)`
- Added success/error toast notifications
- Added loading state to buttons:
  - Shows "Logging in..." text when `isLoading`
  - Disables all buttons during login
  - Adds opacity and cursor-not-allowed styles
- Added error handling with user-friendly messages

---

## 🔧 Next Steps (REQUIRED)

### **CRITICAL: You Must Update Zoho IDs**

The current Zoho IDs in `landing-page.tsx` are **dummy values**. You need to replace them with actual Zoho User IDs from your database.

#### **Option 1: Query MongoDB Directly**

```bash
# Connect to your MongoDB
mongosh "mongodb://localhost:27017/kra360-feedback"

# Find an Admin/Director (for HR role)
db.employees.findOne({ 
  role: { $in: ["Admin", "Director"] }, 
  employeeStatus: "Active" 
}, { zohoUserId: 1, firstName: 1, lastName: 1, email: 1, role: 1 })

# Find a Manager (for Manager role)
db.employees.findOne({ 
  role: "Manager", 
  employeeStatus: "Active" 
}, { zohoUserId: 1, firstName: 1, lastName: 1, email: 1, role: 1 })

# Find a Team Member (for Employee role)
db.employees.findOne({ 
  role: "Team Member", 
  employeeStatus: "Active" 
}, { zohoUserId: 1, firstName: 1, lastName: 1, email: 1, role: 1 })
```

#### **Option 2: Create a Helper Endpoint (Recommended)**

Create a temporary backend endpoint to list available users:

**Backend**: `src/api/controllers/authController.js`
```javascript
// GET /api/v1/auth/available-users
async getAvailableUsers(req, res) {
  const hr = await Employee.findOne({ 
    role: { $in: ['Admin', 'Director'] }, 
    employeeStatus: 'Active' 
  });
  const manager = await Employee.findOne({ 
    role: 'Manager', 
    employeeStatus: 'Active' 
  });
  const employee = await Employee.findOne({ 
    role: 'Team Member', 
    employeeStatus: 'Active' 
  });

  res.json({
    hr: hr ? { zohoUserId: hr.zohoUserId, name: hr.getFullName(), email: hr.email } : null,
    manager: manager ? { zohoUserId: manager.zohoUserId, name: manager.getFullName(), email: manager.email } : null,
    employee: employee ? { zohoUserId: employee.zohoUserId, name: employee.getFullName(), email: employee.email } : null
  });
}
```

Then visit: `http://localhost:3000/api/v1/auth/available-users`

---

## ⚠️ Backend Implementation Required

The frontend is ready, but the **backend needs one new endpoint**:

### **Endpoint**: `POST /api/v1/auth/login-by-zoho-id`

**Request**:
```json
{
  "zohoUserId": "1234567890123456789"
}
```

**Response** (Success - 200):
```json
{
  "data": {
    "id": "697c404b59c69bae48d3e82c",
    "zohoUserId": "1234567890123456789",
    "email": "user@example.com",
    "name": "John Doe",
    "department": "Engineering",
    "designation": "Senior Developer",
    "role": "Team Member",
    "status": "Active",
    "photo": null
  }
}
```

**Response** (Error - 404):
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Employee not found"
  }
}
```

**Backend Implementation Checklist**:
- [ ] Create `src/api/controllers/authController.js`
- [ ] Implement `loginByZohoId` function:
  - Validate `zohoUserId` (Joi schema)
  - Call `Employee.findByZohoId(zohoUserId)` (already exists!)
  - Check `employeeStatus === 'Active'`
  - Return `employee.toSafeObject()` (already exists!)
- [ ] Add route in `src/api/routes/v1.js`:
  ```javascript
  const authController = require('../controllers/authController');
  router.post('/auth/login-by-zoho-id', authController.loginByZohoId);
  ```
- [ ] Test with Postman/curl

---

## 🧪 Testing the Frontend

Once the backend endpoint is ready and Zoho IDs are updated:

### **Test Flow**:

1. **Start Backend**:
   ```bash
   cd c:\Users\arshid.bhat\Desktop\kra360-service
   npm run dev
   ```

2. **Start Frontend** (already running):
   ```bash
   cd c:\Users\arshid.bhat\Desktop\kra360-client
   npm run dev
   ```

3. **Open Browser**: `http://localhost:3001`

4. **Test HR Login**:
   - Click "Access as HR" button
   - Should show "Logging in..." briefly
   - Should see success toast
   - Should redirect to `/dashboard`
   - Dashboard should show HR-specific UI
   - Check browser console for user object

5. **Verify Session Persistence**:
   - Refresh the page
   - Should still be logged in (stay on dashboard)

6. **Test Logout**:
   - Click logout button (in topbar)
   - Should clear session
   - Should redirect to landing page

7. **Test Error Handling**:
   - Temporarily change Zoho ID to invalid value
   - Click button
   - Should see error toast
   - Should stay on landing page

---

## 📊 Data Flow Diagram

```
User clicks "HR" card
    ↓
Frontend: handleRoleSelect('hr')
    ↓
Lookup ROLE_ZOHO_IDS['hr'] → "1234567890..."
    ↓
Call login(zohoUserId)
    ↓
authAPI.loginWithZohoId(zohoUserId)
    ↓
POST http://localhost:3000/api/v1/auth/login-by-zoho-id
Body: { "zohoUserId": "1234567890..." }
    ↓
Backend: Employee.findByZohoId()
    ↓
Backend: Returns employee.toSafeObject()
    ↓
Frontend: Receive response
    ↓
Transform: mapBackendRoleToFrontend(response.role)
response.role = "Admin" → frontend role = "hr"
    ↓
Generate avatar initials: "John Doe" → "JD"
    ↓
Store in state: setCurrentUser(userData)
    ↓
Store in sessionStorage: key='kra360_user'
    ↓
Show success toast
    ↓
Navigate to /dashboard
    ↓
Dashboard reads currentUser from context
    ↓
Renders HRDashboard component
```

---

## 🔑 Key Features Implemented

✅ **Real API Integration**: Frontend now calls backend instead of using mock data  
✅ **Role Mapping**: Automatically converts backend roles to frontend roles  
✅ **Loading States**: Shows "Logging in..." on buttons  
✅ **Error Handling**: User-friendly error messages via toasts  
✅ **Session Persistence**: User stays logged in on page refresh  
✅ **Type Safety**: Full TypeScript support with proper interfaces  
✅ **Centralized API Client**: Easy to maintain and extend  
✅ **Environment Config**: API URL configurable via `.env.local`  

---

## 🚀 Future Improvements

When ready to move to full authentication:

1. Replace `ROLE_ZOHO_IDS` with login form (email + password)
2. Add JWT token generation in backend
3. Store JWT token in httpOnly cookie or localStorage
4. Add token refresh logic
5. Protect all API endpoints with JWT middleware
6. Add "Remember Me" functionality (localStorage vs sessionStorage)

---

## 📝 Summary

The frontend is **100% ready** for temporary authentication! 

**Next immediate actions**:
1. ✅ Implement backend endpoint (I can help with this!)
2. ✅ Update Zoho IDs in `landing-page.tsx`
3. ✅ Test the login flow

Would you like me to implement the backend endpoint now?
