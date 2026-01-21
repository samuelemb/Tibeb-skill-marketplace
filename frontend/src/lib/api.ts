import type {
  User,
  UserRole,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  Job,
  CreateJobData,
  Proposal,
  CreateProposalData,
  Message,
  Conversation,
  SendMessageData,
  Notification,
  Review,
  CreateReviewData,
  ReviewAverage,
  PortfolioItem,
  CreatePortfolioItemData,
  PublicUserProfile,
  Skill,
  EscrowInitResponse,
  EscrowPayment,
  EscrowDispute,
  Wallet,
  WalletTransaction,
  PaginatedResponse,
  JobFilters,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type ApiSuccess<T> = {
  success: boolean;
  data: T;
};

type PaginatedApiSuccess<T> = ApiSuccess<T[]> & {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
};

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('tibeb_token', token);
  } else {
    localStorage.removeItem('tibeb_token');
  }
};

export const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  return localStorage.getItem('tibeb_token');
};

// Base fetch wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const rawMessage =
      (error && (error.message || error.error || error.details)) ||
      `HTTP error! status: ${response.status}`;
    const message =
      typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage);
    throw new Error(message);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;
  
  return JSON.parse(text);
}

function unwrapData<T>(response: ApiSuccess<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiSuccess<T>).data;
  }
  return response as T;
}

function normalizeUser(user: Partial<User>, roleOverride?: UserRole): User {
  return {
    ...user,
    role: user.role ?? roleOverride,
    emailVerified: user.emailVerified ?? false,
  } as User;
}

function normalizeJob(job: Job & { _count?: { proposals?: number } }): Job {
  return {
    ...job,
    proposalCount: job.proposalCount ?? job._count?.proposals ?? 0,
    client: job.client ? normalizeUser(job.client, 'CLIENT') : job.client,
  };
}

function normalizeProposal(proposal: Proposal): Proposal {
  return {
    ...proposal,
    freelancer: proposal.freelancer ? normalizeUser(proposal.freelancer, 'FREELANCER') : proposal.freelancer,
    job: proposal.job ? normalizeJob(proposal.job as Job & { _count?: { proposals?: number } }) : proposal.job,
  };
}

function normalizeMessage<T extends Message>(message: T): T {
  return {
    ...message,
    sender: message.sender ? normalizeUser(message.sender) : message.sender,
    receiver: message.receiver ? normalizeUser(message.receiver) : message.receiver,
  };
}

function normalizeNotification(notification: Notification): Notification {
  return notification;
}

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiRequest<ApiSuccess<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const data = unwrapData(response);
    const normalized = {
      ...data,
      user: normalizeUser(data.user),
    };
    setAuthToken(normalized.token);
    return normalized;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiRequest<ApiSuccess<AuthResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const payload = unwrapData(response);
    const normalized = {
      ...payload,
      user: normalizeUser(payload.user),
    };
    setAuthToken(normalized.token);
    return normalized;
  },

  getMe: async (): Promise<User> => {
    const response = await apiRequest<ApiSuccess<User>>('/auth/me');
    return normalizeUser(unwrapData(response));
  },

  verify: async (email: string, code: string): Promise<AuthResponse> => {
    const response = await apiRequest<ApiSuccess<AuthResponse>>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    const data = unwrapData(response);
    const normalized = {
      ...data,
      user: normalizeUser(data.user),
    };
    setAuthToken(normalized.token);
    return normalized;
  },

  resendCode: async (email: string): Promise<{ message: string }> => {
    const response = await apiRequest<ApiSuccess<{ message: string }>>('/auth/resend-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return unwrapData(response);
  },

  requestReset: async (email: string): Promise<{ message: string }> => {
    const response = await apiRequest<ApiSuccess<{ message: string }>>('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return unwrapData(response);
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiRequest<ApiSuccess<{ message: string }>>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
    return unwrapData(response);
  },

  logout: () => {
    setAuthToken(null);
  },
};

// Jobs API
export const jobsApi = {
  getAll: async (filters?: JobFilters, page = 1, limit = 10): Promise<PaginatedResponse<Job>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.minBudget) params.append('minBudget', filters.minBudget.toString());
      if (filters.maxBudget) params.append('maxBudget', filters.maxBudget.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
    }

    const response = await apiRequest<PaginatedApiSuccess<Job>>(`/jobs?${params.toString()}`);
    return {
      data: response.data.map((job) => normalizeJob(job as Job & { _count?: { proposals?: number } })),
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      totalPages: response.pagination.totalPages,
    };
  },

  getById: async (id: string): Promise<Job> => {
    const response = await apiRequest<ApiSuccess<Job>>(`/jobs/${id}`);
    return normalizeJob(unwrapData(response) as Job & { _count?: { proposals?: number } });
  },

  getMyJobs: async (clientId: string, page = 1, limit = 10): Promise<PaginatedResponse<Job>> => {
    const params = new URLSearchParams();
    params.append('clientId', clientId);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    const response = await apiRequest<PaginatedApiSuccess<Job>>(`/jobs?${params.toString()}`);
    return {
      data: response.data.map((job) => normalizeJob(job as Job & { _count?: { proposals?: number } })),
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      totalPages: response.pagination.totalPages,
    };
  },

  create: async (data: CreateJobData): Promise<Job> => {
    const response = await apiRequest<ApiSuccess<Job>>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeJob(unwrapData(response) as Job & { _count?: { proposals?: number } });
  },

  update: async (id: string, data: Partial<CreateJobData>): Promise<Job> => {
    const response = await apiRequest<ApiSuccess<Job>>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeJob(unwrapData(response) as Job & { _count?: { proposals?: number } });
  },

  updateStatus: async (id: string, status: string): Promise<Job> => {
    const response = await apiRequest<ApiSuccess<Job>>(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return normalizeJob(unwrapData(response) as Job & { _count?: { proposals?: number } });
  },

  publish: async (id: string): Promise<Job> => {
    const response = await apiRequest<ApiSuccess<Job>>(`/jobs/${id}/publish`, {
      method: 'PATCH',
    });
    return normalizeJob(unwrapData(response) as Job & { _count?: { proposals?: number } });
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest(`/jobs/${id}`, {
      method: 'DELETE',
    });
  },

  report: async (id: string, reason?: string): Promise<void> => {
    await apiRequest(`/jobs/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// Proposals API
export const proposalsApi = {
  getForJob: async (jobId: string): Promise<Proposal[]> => {
    const response = await apiRequest<ApiSuccess<Proposal[]>>(`/proposals?jobId=${jobId}`);
    return unwrapData(response).map((proposal) => normalizeProposal(proposal));
  },

  getById: async (id: string): Promise<Proposal> => {
    const response = await apiRequest<ApiSuccess<Proposal>>(`/proposals/${id}`);
    return normalizeProposal(unwrapData(response));
  },

  getMyProposals: async (freelancerId: string): Promise<Proposal[]> => {
    const response = await apiRequest<ApiSuccess<Proposal[]>>(`/proposals?freelancerId=${freelancerId}`);
    return unwrapData(response).map((proposal) => normalizeProposal(proposal));
  },

  create: async (data: CreateProposalData): Promise<Proposal> => {
    const response = await apiRequest<ApiSuccess<Proposal>>('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeProposal(unwrapData(response));
  },

  offer: async (id: string): Promise<Proposal> => {
    const response = await apiRequest<ApiSuccess<Proposal>>(`/proposals/${id}/offer`, {
      method: 'POST',
    });
    return normalizeProposal(unwrapData(response));
  },

  accept: async (id: string): Promise<unknown> => {
    const response = await apiRequest<ApiSuccess<unknown>>(`/proposals/${id}/accept`, {
      method: 'POST',
    });
    return unwrapData(response);
  },

  reject: async (id: string): Promise<Proposal> => {
    const response = await apiRequest<ApiSuccess<Proposal>>(`/proposals/${id}/reject`, {
      method: 'POST',
    });
    return normalizeProposal(unwrapData(response));
  },

  withdraw: async (id: string): Promise<Proposal> => {
    const response = await apiRequest<ApiSuccess<Proposal>>(`/proposals/${id}`, {
      method: 'DELETE',
    });
    return normalizeProposal(unwrapData(response));
  },
};

// Skills API
export const skillsApi = {
  getMine: async (): Promise<Skill[]> => {
    const response = await apiRequest<ApiSuccess<Skill[]>>('/skills');
    return unwrapData(response);
  },

  search: async (query: string): Promise<Skill[]> => {
    const response = await apiRequest<ApiSuccess<Skill[]>>(`/skills/search?search=${encodeURIComponent(query)}`);
    return unwrapData(response);
  },

  add: async (skillName: string): Promise<Skill> => {
    const response = await apiRequest<ApiSuccess<Skill>>('/skills', {
      method: 'POST',
      body: JSON.stringify({ skillName }),
    });
    return unwrapData(response);
  },

  remove: async (skillId: string): Promise<void> => {
    await apiRequest(`/skills/${skillId}`, {
      method: 'DELETE',
    });
  },
};

// Messages API
export const messagesApi = {
  getConversations: async (userId: string): Promise<Conversation[]> => {
    const response = await apiRequest<ApiSuccess<Array<Message & { job?: Job; contract?: { id: string } }>>>('/messages');
    const messages = unwrapData(response).map((message) => normalizeMessage(message));
    const conversationMap = new Map<string, Conversation>();

    messages.forEach((message) => {
      if (!message.jobId) {
        return;
      }

      const key = message.jobId;
      const otherUser =
        message.senderId === userId ? message.receiver : message.sender;

      if (!otherUser) {
        return;
      }

      const existing = conversationMap.get(key);
      const lastMessage =
        !existing || new Date(message.createdAt) > new Date(existing.lastMessage?.createdAt || 0)
          ? message
          : existing.lastMessage;
      const unreadCount =
        (existing?.unreadCount || 0) +
        (message.receiverId === userId && !message.isRead ? 1 : 0);

      conversationMap.set(key, {
        jobId: message.jobId,
        job: message.job ? normalizeJob(message.job as Job & { _count?: { proposals?: number } }) : message.job,
        otherUser: normalizeUser(otherUser as User),
        lastMessage,
        unreadCount,
      });
    });

    return Array.from(conversationMap.values()).sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  },

  getMessages: async (jobId: string): Promise<Message[]> => {
    const response = await apiRequest<ApiSuccess<Message[]>>(`/messages?jobId=${jobId}`);
    return unwrapData(response).map((message) => normalizeMessage(message));
  },

  send: async (data: SendMessageData): Promise<Message> => {
    const response = await apiRequest<ApiSuccess<Message>>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeMessage(unwrapData(response));
  },

  markAsRead: async (messageId: string): Promise<void> => {
    return apiRequest(`/messages/${messageId}/read`, {
      method: 'PATCH',
    });
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const response = await apiRequest<ApiSuccess<{ unreadCount: number }>>('/messages/unread-count');
    return unwrapData(response);
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async (params?: { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<Notification[]> => {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.append('limit', params.limit.toString());
    if (params?.offset !== undefined) query.append('offset', params.offset.toString());
    if (params?.unreadOnly !== undefined) query.append('unreadOnly', params.unreadOnly.toString());
    const endpoint = query.toString() ? `/notifications?${query.toString()}` : '/notifications';
    const response = await apiRequest<ApiSuccess<Notification[]>>(endpoint);
    return unwrapData(response).map((notification) => normalizeNotification(notification));
  },

  getPage: async (params?: { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<{ data: Notification[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean } }> => {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.append('limit', params.limit.toString());
    if (params?.offset !== undefined) query.append('offset', params.offset.toString());
    if (params?.unreadOnly !== undefined) query.append('unreadOnly', params.unreadOnly.toString());
    const endpoint = query.toString() ? `/notifications?${query.toString()}` : '/notifications';
    const response = await apiRequest<{
      success: boolean;
      data: Notification[];
      pagination: { total: number; limit: number; offset: number; hasMore: boolean };
    }>(endpoint);
    return {
      data: response.data.map((notification) => normalizeNotification(notification)),
      pagination: response.pagination,
    };
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const response = await apiRequest<ApiSuccess<{ unreadCount: number }>>('/notifications/unread-count');
    return unwrapData(response);
  },

  markAsRead: async (id: string): Promise<void> => {
    return apiRequest(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async (): Promise<void> => {
    return apiRequest('/notifications/read-all', {
      method: 'PATCH',
    });
  },
};

// Reviews API
export const reviewsApi = {
  getForUser: async (userId: string): Promise<Review[]> => {
    const response = await apiRequest<ApiSuccess<Review[]>>(`/reviews/user/${userId}`);
    return unwrapData(response);
  },

  getAverage: async (userId: string): Promise<ReviewAverage> => {
    const response = await apiRequest<ApiSuccess<ReviewAverage>>(`/reviews/user/${userId}/average`);
    return unwrapData(response);
  },

  create: async (data: CreateReviewData): Promise<Review> => {
    const response = await apiRequest<ApiSuccess<Review | { review: Review }>>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const payload = unwrapData(response);
    if (payload && typeof payload === 'object' && 'review' in payload) {
      return (payload as { review: Review }).review;
    }
    return payload as Review;
  },
};

// Portfolio API
export const portfolioApi = {
  getMine: async (): Promise<PortfolioItem[]> => {
    const response = await apiRequest<ApiSuccess<PortfolioItem[]>>('/portfolio');
    return unwrapData(response);
  },

  getByUser: async (userId: string): Promise<PortfolioItem[]> => {
    const response = await apiRequest<ApiSuccess<PortfolioItem[]>>(`/portfolio/user/${userId}`);
    return unwrapData(response);
  },

  getById: async (id: string): Promise<PortfolioItem> => {
    const response = await apiRequest<ApiSuccess<PortfolioItem>>(`/portfolio/${id}`);
    return unwrapData(response);
  },

  create: async (data: CreatePortfolioItemData): Promise<PortfolioItem> => {
    const response = await apiRequest<ApiSuccess<PortfolioItem>>('/portfolio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrapData(response);
  },

  update: async (id: string, data: Partial<CreatePortfolioItemData>): Promise<PortfolioItem> => {
    const response = await apiRequest<ApiSuccess<PortfolioItem>>(`/portfolio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return unwrapData(response);
  },

  remove: async (id: string): Promise<void> => {
    await apiRequest(`/portfolio/${id}`, {
      method: 'DELETE',
    });
  },
};

// Users API
export const usersApi = {
  getPublicProfile: async (userId: string): Promise<PublicUserProfile> => {
    const response = await apiRequest<ApiSuccess<PublicUserProfile>>(`/users/${userId}/public`);
    return unwrapData(response);
  },
};

// Payments API
export const paymentsApi = {
  initEscrow: async (jobId: string): Promise<EscrowInitResponse> => {
    const response = await apiRequest<ApiSuccess<EscrowInitResponse>>('/payments/chapa/initialize', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    });
    return unwrapData(response);
  },

  verifyEscrow: async (txRef: string): Promise<EscrowPayment> => {
    const response = await apiRequest<ApiSuccess<EscrowPayment>>(`/payments/chapa/verify/${txRef}`);
    return unwrapData(response);
  },

  getEscrowStatus: async (jobId: string): Promise<EscrowPayment | null> => {
    const response = await apiRequest<ApiSuccess<EscrowPayment | null>>(`/payments/escrow/${jobId}`);
    return unwrapData(response);
  },

  refundEscrow: async (jobId: string, reason?: string): Promise<EscrowPayment> => {
    const response = await apiRequest<ApiSuccess<EscrowPayment>>(`/payments/escrow/${jobId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return unwrapData(response);
  },

  disputeEscrow: async (jobId: string, reason?: string): Promise<EscrowDispute> => {
    const response = await apiRequest<ApiSuccess<EscrowDispute>>(`/payments/escrow/${jobId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return unwrapData(response);
  },
};

// Wallet API
export const walletApi = {
  getMyWallet: async (): Promise<Wallet> => {
    const response = await apiRequest<ApiSuccess<Wallet>>('/wallet');
    return unwrapData(response);
  },

  getMyTransactions: async (params?: { limit?: number; offset?: number }): Promise<{
    wallet: Wallet;
    transactions: WalletTransaction[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  }> => {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.append('limit', params.limit.toString());
    if (params?.offset !== undefined) query.append('offset', params.offset.toString());
    const endpoint = query.toString() ? `/wallet/transactions?${query.toString()}` : '/wallet/transactions';
    const response = await apiRequest<{
      success: boolean;
      data: Wallet;
      transactions: WalletTransaction[];
      pagination: { total: number; limit: number; offset: number; hasMore: boolean };
    }>(endpoint);
    return {
      wallet: response.data,
      transactions: response.transactions,
      pagination: response.pagination,
    };
  },
};

// Profile API
export const profileApi = {
  update: async (data: Partial<User>): Promise<User> => {
    const response = await apiRequest<ApiSuccess<User>>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeUser(unwrapData(response));
  },

  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message);
    }

    const result = await response.json();
    const data = result.data ?? result;
    return normalizeUser(data as User);
  },
};
