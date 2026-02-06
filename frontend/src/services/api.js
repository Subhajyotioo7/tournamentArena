
// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to create headers
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Generic API request handler
const apiRequest = async (endpoint, options = {}) => {
  const url = `${import.meta.env.VITE_API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: getHeaders(options.auth !== false),
  };

  try {
    const response = await fetch(url, config);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check if backend is running.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.detail || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ============= AUTH SERVICES =============
export const authService = {
  login: async (username, password) => {
    return apiRequest('/api/login/', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ username, password }),
    });
  },

  register: async (userData) => {
    return apiRequest('/api/register/', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(userData),
    });
  },

  getProfile: async () => {
    return apiRequest('/api/me/');
  },
};

// ============= WALLET SERVICES =============
export const walletService = {
  getBalance: async () => {
    return apiRequest('/wallet/balance/');
  },

  getTransactions: async () => {
    return apiRequest('/wallet/transactions/');
  },

  addMoney: async (amount) => {
    return apiRequest('/wallet/add-money/', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  requestWithdrawal: async (withdrawalData) => {
    return apiRequest('/wallet/withdraw/request/', {
      method: 'POST',
      body: JSON.stringify(withdrawalData),
    });
  },
  getMyWithdrawals: async () => {
    return apiRequest('/wallet/withdraw/my/');
  },

  updateProfile: async (profileData) => {
    // Note: If sending multi-part data for files, this needs adjustment
    // but for now we assume JSON for simplicity or handle File manually
    return apiRequest('/wallet/profile/update/', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  },

  getDetailedProfile: async () => {
    return apiRequest('/wallet/profile/');
  },

  getSiteConfig: async () => {
    return apiRequest('/wallet/site-config/');
  },

  submitDepositRequest: async (depositData) => {
    return apiRequest('/wallet/deposit/request/', {
      method: 'POST',
      body: JSON.stringify(depositData),
    });
  }
};

// ============= TOURNAMENT SERVICES =============
export const tournamentService = {
  getAll: async () => {
    return apiRequest('/tournaments/tournaments/', { auth: false });
  },

  getById: async (id) => {
    return apiRequest(`/tournaments/tournaments/${id}/`, { auth: false });
  },

  create: async (tournamentData) => {
    return apiRequest('/tournaments/create/', {
      method: 'POST',
      body: JSON.stringify(tournamentData),
    });
  },

  getPrizeDistribution: async (tournamentId) => {
    return apiRequest(`/tournaments/tournament/${tournamentId}/prizes/`);
  },

  setPrizeDistribution: async (tournamentId, distributions) => {
    return apiRequest(`/tournaments/tournament/${tournamentId}/set-prizes/`, {
      method: 'POST',
      body: JSON.stringify({ distributions }),
    });
  },

  getParticipants: async (tournamentId) => {
    return apiRequest(`/tournaments/tournament/${tournamentId}/participants/`);
  },
};

// ============= ROOM SERVICES =============
export const roomService = {
  create: async (tournamentId) => {
    return apiRequest(`/tournaments/tournament/${tournamentId}/create-room/`, {
      method: 'POST',
    });
  },

  join: async (roomId) => {
    return apiRequest(`/tournaments/room/${roomId}/join/`, {
      method: 'POST',
    });
  },

  joinSolo: async (roomId) => {
    return apiRequest(`/tournaments/room/${roomId}/join-solo/`, {
      method: 'POST',
    });
  },

  verifyPayment: async (roomId, paymentData) => {
    return apiRequest(`/tournaments/room/${roomId}/verify-payment/`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  getResults: async (roomId) => {
    return apiRequest(`/tournaments/room/${roomId}/results/`);
  },

  declareResults: async (roomId, results) => {
    return apiRequest(`/tournaments/room/${roomId}/declare-results/`, {
      method: 'POST',
      body: JSON.stringify({ results }),
    });
  },

  approvePayouts: async (roomId) => {
    return apiRequest(`/tournaments/room/${roomId}/approve-payouts/`, {
      method: 'POST',
    });
  },
};

// ============= ADMIN SERVICES =============
export const adminService = {
  getPendingPayouts: async () => {
    return apiRequest('/tournaments/pending-payouts/');
  },

  getWithdrawals: async () => {
    return apiRequest('/wallet/withdraw/all/');
  },

  approveWithdrawal: async (withdrawalId) => {
    return apiRequest(`/wallet/withdraw/approve/${withdrawalId}/`, {
      method: 'POST',
    });
  },

  rejectWithdrawal: async (withdrawalId, adminNote) => {
    return apiRequest(`/wallet/withdraw/reject/${withdrawalId}/`, {
      method: 'POST',
      body: JSON.stringify({ admin_note: adminNote }),
    });
  },

  getPendingVerifications: async () => {
    return apiRequest('/wallet/verifications/pending/');
  },

  verifyProfileSection: async (profileId, section, action, reason = '') => {
    return apiRequest(`/wallet/verifications/verify/${profileId}/`, {
      method: 'POST',
      body: JSON.stringify({ section, action, reason }),
    });
  },

  getPendingDeposits: async () => {
    return apiRequest('/wallet/deposit/pending/');
  },

  verifyDeposit: async (depositId, action, adminNote = '') => {
    return apiRequest(`/wallet/deposit/verify/${depositId}/`, {
      method: 'POST',
      body: JSON.stringify({ action, admin_note: adminNote }),
    });
  }
};

export default {
  auth: authService,
  wallet: walletService,
  tournament: tournamentService,
  room: roomService,
  admin: adminService,
};

// ===== SAFE SHORTCUT EXPORTS =====

export const apiGet = (url, auth = true) =>
  apiRequest(url, { method: "GET", auth });

export const apiPost = (url, body = {}, auth = true) =>
  apiRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    auth,
  });

