/**
 * API Client for KRA360
 * Centralized API communication layer
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Generic API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Parse response
    const data = await response.json();

    // Handle error responses
    if (!response.ok) {
      throw new APIError(
        data.error?.message || data.message || 'Request failed',
        response.status,
        data.error?.details || data.details
      );
    }

    // Return the data field if it exists, otherwise return the whole response
    return data.data || data;
  } catch (error) {
    // Network errors or JSON parsing errors
    if (error instanceof APIError) {
      throw error;
    }

    throw new APIError(
      error instanceof Error ? error.message : 'Network error occurred',
      undefined,
      error
    );
  }
}

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Login with Zoho User ID (temporary authentication)
   */
  async loginWithZohoId(zohoUserId: string): Promise<{
    id: string;
    zohoUserId: string;
    email: string;
    name: string;
    department: string | null;
    designation: string | null;
    role: string;
    status: string;
    photo: string | null;
  }> {
    return apiRequest('/auth/login-by-zoho-id', {
      method: 'POST',
      body: JSON.stringify({ zohoUserId }),
    });
  },
};

/**
 * Goals API
 */
export const goalsAPI = {
  /**
   * Get all goals
   */
  async getGoals(): Promise<any[]> {
    return apiRequest('/goals');
  },

  /**
   * Get goal by ID
   */
  async getGoalById(id: string): Promise<any> {
    return apiRequest(`/goals/${id}`);
  },
};

/**
 * Feedback API
 */
export const feedbackAPI = {
  /**
   * Submit feedback
   */
  async submitFeedback(data: {
    goalId: string;
    rating: number;
    comment: string;
    isAnonymous: boolean;
  }): Promise<any> {
    return apiRequest('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get feedback for a goal
   */
  async getFeedbackForGoal(goalId: string): Promise<any[]> {
    return apiRequest(`/feedback/goal/${goalId}`);
  },

  /**
   * Get feedback received by current user
   */
  async getFeedbackReceived(): Promise<any[]> {
    return apiRequest('/feedback/received');
  },

  /**
   * Get feedback given by current user
   */
  async getFeedbackGiven(): Promise<any[]> {
    return apiRequest('/feedback/given');
  },
};

/**
 * Employees API
 */
export const employeesAPI = {
  /**
   * Get all employees
   */
  async getEmployees(): Promise<any[]> {
    return apiRequest('/employees');
  },

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string): Promise<any> {
    return apiRequest(`/employees/${id}`);
  },
};

/**
 * Sync API
 */
export const syncAPI = {
  /**
   * Sync employees from Zoho
   */
  async syncEmployees(): Promise<any> {
    return apiRequest('/sync/employees', {
      method: 'POST',
    });
  },

  /**
   * Sync goals from Zoho
   */
  async syncGoals(employeeId: string): Promise<any> {
    return apiRequest('/sync/goals', {
      method: 'POST',
      headers: {
        'x-employee-id': employeeId,
      },
    });
  },

  /**
   * Get sync history
   */
  async getSyncHistory(): Promise<any[]> {
    return apiRequest('/sync/employees/history');
  },
};
