export const LoanStatusEnum = {
  ACTIVE: 'ACTIVE',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  RESTRUCTURED: 'RESTRUCTURED',
  WRITTEN_OFF: 'WRITTEN_OFF',
} as const;
export type LoanStatus = (typeof LoanStatusEnum)[keyof typeof LoanStatusEnum];

export const LoanOperationTypeEnum = {
  NORMAL: 'NORMAL',
  REENGAGEMENT: 'REENGAGEMENT',
  REFINANCE: 'REFINANCE',
} as const;
export type LoanOperationType = (typeof LoanOperationTypeEnum)[keyof typeof LoanOperationTypeEnum];

export const InterestTypeEnum = {
  FLAT: 'FLAT',
  REDUCING: 'REDUCING',
  COMPOUND: 'COMPOUND',
  FIXED: 'FIXED',
  INDEFINITE: 'INDEFINITE',
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
} as const;
export type UserRole = (typeof UserRoleEnum)[keyof typeof UserRoleEnum];

export const ScheduleStatusEnum = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;
export type ScheduleStatus = (typeof ScheduleStatusEnum)[keyof typeof ScheduleStatusEnum];

export const AllocationTypeEnum = {
  PRINCIPAL: 'PRINCIPAL',
  INTEREST: 'INTEREST',
  PENALTY: 'PENALTY',
} as const;
export type AllocationType = (typeof AllocationTypeEnum)[keyof typeof AllocationTypeEnum];

export const CollectionChannelEnum = {
  CALL: 'CALL',
  WHATSAPP: 'WHATSAPP',
  VISIT: 'VISIT',
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  OTHER: 'OTHER',
} as const;
export type CollectionChannel = (typeof CollectionChannelEnum)[keyof typeof CollectionChannelEnum];

export const CollectionResultEnum = {
  CONTACTED: 'CONTACTED',
  NO_ANSWER: 'NO_ANSWER',
  WRONG_NUMBER: 'WRONG_NUMBER',
  PAYMENT_PROMISE: 'PAYMENT_PROMISE',
  EXTENSION_REQUEST: 'EXTENSION_REQUEST',
  DISPUTE: 'DISPUTE',
  REFUSED: 'REFUSED',
  OTHER: 'OTHER',
} as const;
export type CollectionResult = (typeof CollectionResultEnum)[keyof typeof CollectionResultEnum];

export const PaymentPromiseStatusEnum = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  FULFILLED: 'FULFILLED',
  BROKEN: 'BROKEN',
  CANCELLED: 'CANCELLED',
} as const;
export type PaymentPromiseStatus =
  (typeof PaymentPromiseStatusEnum)[keyof typeof PaymentPromiseStatusEnum];

export interface CreateCollectionInteractionDto {
  loanId: string;
  channel: CollectionChannel;
  result: CollectionResult;
  notes: string;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  promiseAmount?: number;
  promiseDate?: string;
}

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
  id: number;
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
  loanNumber: number;
  clientId: number;
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
  portfolio?: { id: string; name: string } | null;
  schedule?: Array<{
    dueDate: string;
    status: ScheduleStatus;
    amount: number;
    paidAmount?: number | null;
  }>;
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
  clientId: number;
  productId: string;
  principal: number;
  interestRate?: number;
  term: number;
  startDate: string;
  firstPaymentDate?: string;
  notes?: string;
  portfolioId?: string;
  amortizationType?: InterestType;
  paymentFrequency?: PaymentFrequency;
  customPayment?: number;
  operationType?: LoanOperationType;
  sourceLoanIds?: string[];
  paidInstallments?: number;
  paidLateFee?: number;
  lateFeeEnabled?: boolean;
  lateFeeMode?: 'PER_INSTALLMENT' | 'DAILY';
  lateFeeCalculation?: 'PERCENTAGE' | 'AMOUNT';
  lateFeeValue?: number;
  lateFeeGraceDays?: number;
  generateReceipt?: boolean;
}

export interface LoanReceiptSnapshot {
  company: {
    name: string;
    taxId: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  client: {
    id: number;
    name: string;
    identification: string | null;
  };
  loan: {
    id: string;
    number: number;
    product: string;
    operationType: LoanOperationType;
    principal: number;
    disbursedAmount: number;
    paymentFrequency: PaymentFrequency;
    term: number;
    firstPaymentDate: string | null;
    purpose: string | null;
    createdAt: string;
  };
  issuance: {
    receiptNumber: number;
    issuedAt: string;
    generatedBy: string;
  };
}

export interface LoanReceipt {
  id: string;
  loanId: string;
  receiptNumber: number;
  snapshot: LoanReceiptSnapshot;
  generatedById: string;
  createdAt: string;
}

export interface UpdateLoanDto {
  notes?: string;
  status?: LoanStatus;
  portfolioId?: string | null;
  interestRate?: number;
  lateFeeEnabled?: boolean;
  lateFeeMode?: 'PER_INSTALLMENT' | 'DAILY';
  lateFeeCalculation?: 'PERCENTAGE' | 'AMOUNT';
  lateFeeValue?: number;
  lateFeeGraceDays?: number;
}

export interface AddLoanCapitalDto {
  amount: number;
  effectiveDate: string;
  notes?: string;
}

export interface LoanPayoffQuote {
  payoffDate: string;
  capitalOutstanding: number;
  earnedInterest: number;
  unearnedInterestDiscount: number;
  fees: number;
  totalToPay: number;
  dailyInterest: number;
  daysGenerated: number;
}

export const InvestorStatusEnum = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type InvestorStatus = (typeof InvestorStatusEnum)[keyof typeof InvestorStatusEnum];

export const InvestorInvestmentStatusEnum = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  CLOSED: 'CLOSED',
} as const;
export type InvestorInvestmentStatus =
  (typeof InvestorInvestmentStatusEnum)[keyof typeof InvestorInvestmentStatusEnum];

export const InvestorInvestmentPaymentStatusEnum = {
  PAID: 'PAID',
  PENDING: 'PENDING',
  OVERDUE: 'OVERDUE',
} as const;
export type InvestorInvestmentPaymentStatus =
  (typeof InvestorInvestmentPaymentStatusEnum)[keyof typeof InvestorInvestmentPaymentStatusEnum];

export const InvestorInvestmentMovementTypeEnum = {
  CAPITAL_ADDITION: 'CAPITAL_ADDITION',
} as const;
export type InvestorInvestmentMovementType =
  (typeof InvestorInvestmentMovementTypeEnum)[keyof typeof InvestorInvestmentMovementTypeEnum];

export interface CreateInvestorDto {
  name: string;
  email?: string;
  phone?: string;
  phone2?: string;
  cedula?: string;
  birthDate?: string;
  nationality?: string;
  type?: string;
  photo?: string;
  capital: number;
  monthlyPayment: number;
  rate: number;
  startDate?: string;
  term?: string;
  bank?: string;
  notes?: string;
}

export interface InvestorItem extends CreateInvestorDto {
  id: string;
  code: string;
  status: InvestorStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  totalCapital?: number;
  totalMonthlyReturn?: number;
  activeInvestments?: number;
  investments?: InvestorInvestmentSummary[];
}

export interface CreateInvestorInvestmentDto {
  capital: number;
  monthlyPayment?: number;
  rate: number;
  startDate?: string;
  term?: string;
  notes?: string;
}

export interface AddInvestorCapitalDto {
  amount: number;
  movementDate: string;
  notes?: string;
}

export interface InvestorInvestmentSummary {
  id: string;
  investorId: string;
  code: string;
  capital: number;
  monthlyPayment: number;
  rate: number;
  startDate?: string;
  term?: string;
  status: InvestorInvestmentStatus;
  notes?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  nextDueDate?: string;
  currentPeriodMonth?: number;
  currentPeriodYear?: number;
  paymentStatus?: InvestorInvestmentPaymentStatus;
}

export interface InvestorInvestmentMovementItem {
  id: string;
  investmentId: string;
  type: InvestorInvestmentMovementType;
  amount: number;
  movementDate: string;
  notes?: string;
  createdById: string;
  createdAt: string;
}

export interface InvestorInvestmentDetail extends InvestorInvestmentSummary {
  investor?: InvestorItem;
  payments?: InvestorPaymentItem[];
  movements?: InvestorInvestmentMovementItem[];
}

export interface CreateInvestorPaymentDto {
  investorId?: string;
  investmentId?: string;
  amount: number;
  periodMonth: number;
  periodYear: number;
  paymentDate: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

export interface InvestorPaymentItem {
  id: string;
  receiptNumber: number;
  investorId: string;
  investmentId?: string;
  amount: number;
  periodMonth: number;
  periodYear: number;
  paymentDate: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  receivedById: string;
  receivedBy?: { id: string; name: string };
  createdAt: string;
}

export interface CreateDocumentDto {
  clientId?: number;
  investorId?: string;
  loanId?: string;
  name: string;
  category: string;
  notes?: string;
}

export type DocumentType = 'cedula' | 'recibo' | 'acto_notarial' | 'otro';
export type DocumentProcessingStatus =
  | 'pending'
  | 'processed'
  | 'needs_review'
  | 'failed'
  | 'not_applicable';

export interface DocumentItem extends CreateDocumentDto {
  id: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  originalFileUrl?: string;
  processedFileUrl?: string;
  documentType?: DocumentType;
  detectionConfidence?: number;
  processingStatus?: DocumentProcessingStatus;
  processingNotes?: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentCaptureSessionItem {
  token: string;
  clientId: number;
  clientName: string;
  expiresAt: string;
  uploadCount?: number;
  maxUploads?: number;
}

export interface ClientPhotoCaptureSessionItem {
  token: string;
  clientId?: number;
  clientName: string;
  expiresAt: string;
  photoReady: boolean;
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
  clientId?: number;
}

export interface LoanRequestItem extends CreateRequestDto {
  id: string;
  code: string;
  status: RequestStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  client?: { id: number; firstName: string; lastName: string };
}

export interface CreatePaymentDto {
  loanId: string;
  clientId: number;
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

export type GlobalSearchRole = 'CLIENT' | 'LOAN' | 'INVESTOR' | 'BORROWER';

export interface GlobalSearchResult {
  id: string;
  kind: 'CLIENT' | 'LOAN' | 'INVESTOR';
  title: string;
  description: string;
  href: string;
  roles: GlobalSearchRole[];
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
  clientId?: number | null;
  loanId?: string | null;
  collectionInteractionId?: string | null;
  createdAt: string;
  updatedAt: string;
}
