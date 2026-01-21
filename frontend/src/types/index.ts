// User types
export type UserRole = 'CLIENT' | 'FREELANCER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  avatarUrl?: string;
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  company?: string;
  location?: string;
  createdAt?: string;
  emailVerified?: boolean;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Job types
export type JobStatus = 'DRAFT' | 'OPEN' | 'CONTRACTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Contract {
  id: string;
  jobId?: string;
  clientId: string;
  freelancerId: string;
  client?: User;
  freelancer?: User;
  status?: string;
  agreedAmount?: number | null;
  createdAt?: string;
  completedAt?: string | null;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requiredSkills?: string | null;
  timeline?: string | null;
  budget?: number | null;
  status: JobStatus;
  clientId: string;
  client?: User;
  contract?: Contract | null;
  proposalCount?: number;
  createdAt: string;
  updatedAt: string;
  category: string;
}

export interface CreateJobData {
  title: string;
  description: string;
  requiredSkills: string;
  timeline: string;
  budget: number;
  category: string;
}

// Proposal types
export type ProposalStatus = 'PENDING' | 'OFFERED' | 'ACCEPTED' | 'REJECTED';

export interface Proposal {
  id: string;
  jobId: string;
  job?: Job;
  freelancerId: string;
  freelancer?: User;
  message: string;
  relevantExperience?: string | null;
  deliveryTime?: string | null;
  proposedAmount?: number | null;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProposalData {
  jobId: string;
  message: string;
  relevantExperience: string;
  deliveryTime: string;
  proposedAmount?: number | null;
}

// Skill types
export interface Skill {
  id: string;
  name: string;
  addedAt?: string;
}

// Message types
export interface Message {
  id: string;
  jobId?: string | null;
  contractId?: string | null;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  jobId: string;
  job?: Job;
  otherUser: User;
  lastMessage?: Message;
  unreadCount: number;
}

export interface SendMessageData {
  jobId: string;
  receiverId: string;
  content: string;
}

// Notification types
export type NotificationType =
  | 'PROPOSAL_RECEIVED'
  | 'OFFER_SENT'
  | 'OFFER_ACCEPTED'
  | 'OFFER_REJECTED'
  | 'NEW_MESSAGE'
  | 'proposal'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'proposal_offered'
  | 'message'
  | 'job_status_change';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

// Review types
export interface Review {
  id: string;
  jobId: string;
  job?: Job;
  reviewerId: string;
  reviewer?: User;
  revieweeId: string;
  reviewee?: User;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewData {
  jobId: string;
  revieweeId: string;
  rating: number;
  comment: string;
}

export interface ReviewAverage {
  averageRating: number;
  totalReviews: number;
}

// Portfolio types
export interface PortfolioItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  projectUrl?: string | null;
  technologies?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface CreatePortfolioItemData {
  title: string;
  description: string;
  imageUrl?: string | null;
  projectUrl?: string | null;
  technologies?: string | null;
}

export interface PublicUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role?: UserRole;
  createdAt?: string;
  skills?: string[];
}

// Payments
export interface EscrowInitResponse {
  checkoutUrl: string;
  txRef: string;
}

export interface EscrowPayment {
  id: string;
  jobId: string;
  contractId: string;
  clientId: string;
  freelancerId: string;
  amount: number;
  platformFee: number;
  currency: string;
  status: string;
  txRef: string;
  checkoutUrl?: string | null;
  paidAt?: string | null;
  refundedAt?: string | null;
  releasedAt?: string | null;
  createdAt?: string;
}

export interface EscrowDispute {
  id: string;
  escrowPaymentId: string;
  jobId: string;
  contractId: string;
  raisedById: string;
  type: string;
  status: string;
  reason?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface JobReport {
  id: string;
  jobId: string;
  reporterId: string;
  reason?: string | null;
  status: 'OPEN' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  resolvedAt?: string | null;
  job?: Job;
  reporter?: User;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  currency: string;
  reference?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Search/Filter types
export interface JobFilters {
  search?: string;
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  status?: JobStatus;
  sortBy?: 'relevance' | 'date' | 'budget_asc' | 'budget_desc';
}
