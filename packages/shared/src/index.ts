export const LoanStatusEnum = {
  ACTIVE: 'ACTIVE',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  RESTRUCTURED: 'RESTRUCTURED',
  WRITTEN_OFF: 'WRITTEN_OFF',
} as const;
export type LoanStatus = (typeof LoanStatusEnum)[keyof typeof LoanStatusEnum];

export const InterestTypeEnum = {
  FLAT: 'FLAT',
  REDUCING: 'REDUCING',
  COMPOUND: 'COMPOUND',
  FIXED: 'FIXED',
} as const;
export type InterestType = (typeof InterestTypeEnum)[keyof typeof InterestTypeEnum];

export const PaymentFrequencyEnum = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
} as const;
export type PaymentFrequency = (typeof PaymentFrequencyEnum)[keyof typeof PaymentFrequencyEnum];

export const UserRoleEnum = {
  ADMIN: 'ADMIN',
  COLLECTOR: 'COLLECTOR',
  MANAGER: 'MANAGER',
  VIEWER: 'VIEWER',
} as const;
export type UserRole = (typeof UserRoleEnum)[keyof typeof UserRoleEnum];

export const ScheduleStatusEnum = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  OVERDUE: 'OVERDUE',
} as const;
export type ScheduleStatus = (typeof ScheduleStatusEnum)[keyof typeof ScheduleStatusEnum];

export const AllocationTypeEnum = {
  PRINCIPAL: 'PRINCIPAL',
  INTEREST: 'INTEREST',
  PENALTY: 'PENALTY',
} as const;
export type AllocationType = (typeof AllocationTypeEnum)[keyof typeof AllocationTypeEnum];

export interface CreateClientDto {
  firstName: string;
  lastName: string;
  phone?: string;
  altPhone?: string;
  email?: string;
  identification?: string;
  address?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  dependents?: number;
  photo?: string;
  notes?: string;
}

export interface Client extends CreateClientDto {
  id: string;
  createdById: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { loans: number };
}

export interface ClientDetail extends Client {
  loans: LoanSummary[];
}

export interface LoanSummary {
  id: string;
  clientId: string;
  productId: string;
  principal: number;
  interestRate: number;
  interestType: InterestType;
  totalAmount: number;
  paymentFreq: PaymentFrequency;
  term: number;
  startDate: string;
  endDate?: string;
  status: LoanStatus;
  balance: number;
  notes?: string;
  product?: LoanProductSummary;
  _count?: { payments: number };
}

export interface LoanProductSummary {
  id: string;
  name: string;
  interestType: InterestType;
  interestRate: number;
  paymentFrequency: PaymentFrequency;
}

export interface CreateUserDto {
  name: string;
  username?: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface CreateLoanDto {
  clientId: string;
  productId: string;
  principal: number;
  term: number;
  startDate: string;
  notes?: string;
}

export const InvestorStatusEnum = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type InvestorStatus = (typeof InvestorStatusEnum)[keyof typeof InvestorStatusEnum];

export interface CreateInvestorDto {
  name: string;
  email?: string;
  phone?: string;
  capital: number;
  monthlyPayment: number;
  rate: number;
  notes?: string;
}

export interface InvestorItem extends CreateInvestorDto {
  id: string;
  code: string;
  status: InvestorStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentDto {
  clientId?: string;
  investorId?: string;
  loanId?: string;
  name: string;
  category: string;
  notes?: string;
}

export interface DocumentItem extends CreateDocumentDto {
  id: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

export const RequestStatusEnum = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type RequestStatus = (typeof RequestStatusEnum)[keyof typeof RequestStatusEnum];

export interface CreateRequestDto {
  firstName: string;
  lastName: string;
  identification?: string;
  phone?: string;
  amount: number;
  description?: string;
  reference?: string;
  clientId?: string;
}

export interface LoanRequestItem extends CreateRequestDto {
  id: string;
  code: string;
  status: RequestStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  client?: { id: string; firstName: string; lastName: string };
}

export interface CreatePaymentDto {
  loanId: string;
  clientId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

export const TaskPriorityEnum = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type TaskPriority = (typeof TaskPriorityEnum)[keyof typeof TaskPriorityEnum];

export const TaskStatusEnum = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
export type TaskStatus = (typeof TaskStatusEnum)[keyof typeof TaskStatusEnum];

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueDate?: string;
  time?: string;
  priority?: TaskPriority;
  category?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  dueDate?: string;
  time?: string;
  priority?: TaskPriority;
  category?: string;
  status?: TaskStatus;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  time?: string | null;
  priority: TaskPriority;
  category: string;
  status: TaskStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
