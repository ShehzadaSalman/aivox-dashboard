// API Service - Handles all backend API calls

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:3000";

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("authToken");
  }
  return null;
};

// Helper function to get API key from localStorage
const getApiKey = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("apiKey");
  }
  return null;
};

// Generic fetch wrapper
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const apiKey = getApiKey();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add authentication
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "An error occurred");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Authentication APIs
export const authAPI = {
  register: async (email, password, name, phone) => {
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, phone }),
    });
  },

  login: async (email, password) => {
    return apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  getMe: async () => {
    return apiRequest("/api/auth/me");
  },

  startPhoneVerification: async (email, phone = null) => {
    const payload = { email, ...(phone ? { phone } : {}) };
    return apiRequest("/api/auth/phone/start", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  verifyPhone: async (email, code) => {
    return apiRequest("/api/auth/phone/verify", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  },
};

// Agent Management APIs
export const agentAPI = {
  list: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/dashboard/agents?${queryString}`);
  },

  getById: async (agentId) => {
    return apiRequest(`/api/dashboard/agent-info/${agentId}`);
  },

  create: async (agentData) => {
    return apiRequest("/api/dashboard/agents", {
      method: "POST",
      body: JSON.stringify(agentData),
    });
  },

  update: async (agentId, agentData) => {
    return apiRequest(`/api/dashboard/agents/${agentId}`, {
      method: "PUT",
      body: JSON.stringify(agentData),
    });
  },

  delete: async (agentId) => {
    return apiRequest(`/api/dashboard/agents/${agentId}`, {
      method: "DELETE",
    });
  },

  sync: async () => {
    return apiRequest("/api/dashboard/sync-agents", {
      method: "POST",
    });
  },
};

// Call Management APIs
export const callAPI = {
  list: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/dashboard/calls?${queryString}`);
  },

  getById: async (callId) => {
    return apiRequest(`/api/dashboard/calls/${callId}`);
  },

  getHistory: async (agentId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/dashboard/call-history/${agentId}?${queryString}`);
  },

  getAllHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/dashboard/call-history?${queryString}`);
  },

  sync: async (agentId = null) => {
    const payload = {};
    if (agentId) {
      payload.agentId = agentId;
    }
    return apiRequest("/api/dashboard/sync-calls", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  search: async (query, params = {}) => {
    const queryString = new URLSearchParams({ query, ...params }).toString();
    return apiRequest(`/api/dashboard/search/calls?${queryString}`);
  },
};

// Lead Management APIs
export const leadAPI = {
  list: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const suffix = queryString ? `?${queryString}` : "";
    return apiRequest(`/api/dashboard/leads${suffix}`);
  },
  delete: async (leadId) => {
    return apiRequest(`/api/dashboard/leads/${leadId}`, {
      method: "DELETE",
    });
  },
};

// Analytics APIs
export const analyticsAPI = {
  getOverview: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/dashboard/analytics/overview?${queryString}`);
  },

  getAgents: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/dashboard/analytics/agents?${queryString}`);
  },

  getCalls: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/dashboard/analytics/calls?${queryString}`);
  },

  getSentiment: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/dashboard/analytics/sentiment?${queryString}`);
  },
};

// User Management APIs (Admin only)
export const userAPI = {
  list: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/dashboard/users?${queryString}`);
  },

  getById: async (userId) => {
    return apiRequest(`/api/dashboard/users/${userId}`);
  },

  update: async (userId, userData) => {
    return apiRequest(`/api/dashboard/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  delete: async (userId) => {
    return apiRequest(`/api/dashboard/users/${userId}`, {
      method: "DELETE",
    });
  },

  approve: async (userId) => {
    return apiRequest(`/api/dashboard/users/${userId}/approve`, {
      method: "POST",
    });
  },

  listAgents: async (userId) => {
    return apiRequest(`/api/dashboard/users/${userId}/agents`);
  },

  assignAgent: async (userId, agentId) => {
    return apiRequest("/api/dashboard/assignments", {
      method: "POST",
      body: JSON.stringify({ userId, agentId }),
    });
  },

  unassignAgent: async (userId, agentId) => {
    return apiRequest("/api/dashboard/assignments", {
      method: "DELETE",
      body: JSON.stringify({ userId, agentId }),
    });
  },
};

// Utility APIs
export const utilityAPI = {
  getStats: async () => {
    return apiRequest("/api/dashboard/stats");
  },

  getSyncStatus: async () => {
    return apiRequest("/api/dashboard/sync-status");
  },
};

// Search APIs
export const searchAPI = {
  searchCalls: async (query, params = {}) => {
    const queryString = new URLSearchParams({ query, ...params }).toString();
    return apiRequest(`/api/dashboard/search/calls?${queryString}`);
  },

  searchAgents: async (query, params = {}) => {
    const queryString = new URLSearchParams({ query, ...params }).toString();
    return apiRequest(`/api/dashboard/search/agents?${queryString}`);
  },
};

export default {
  auth: authAPI,
  agent: agentAPI,
  call: callAPI,
  lead: leadAPI,
  analytics: analyticsAPI,
  user: userAPI,
  utility: utilityAPI,
  search: searchAPI,
};
