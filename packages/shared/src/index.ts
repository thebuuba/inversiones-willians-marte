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
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginDto {
  email: string;
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
