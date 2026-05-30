export type PeriodStatus = "UNPAID" | "PAID" | "LATE";

export type UserRole = "CREATOR" | "JOINER";

export type OnboardingStep =
  | "login"
  | "pairing"
  | "profile"
  | "start-date"
  | "target"
  | "complete";

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  fullName: string | null;
  coupleSpaceId: string | null;
  profileSetupDone: boolean;
  isSpaceCreator: boolean;
  role: UserRole | null;
  savingStreak: number;
}

export interface CoupleSpace {
  id: string;
  pairingCode: string;
  createdByUserId: string;
  memberIds: string[];
  startMonth: number | null;
  startYear: number | null;
  poolBalance: number;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface CoupleMember {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isCreator: boolean;
  role: UserRole | null;
  savingStreak: number;
}

export interface PaymentSettings {
  coupleSpaceId: string;
  qrisImageUrl: string | null;
  accountHolderName: string;
  vaBca: string | null;
  vaBni: string | null;
  vaBri: string | null;
  vaPermata: string | null;
  vaMandiri: string | null;
  vaCimb: string | null;
  useMidtrans: boolean;
  paymentInstructions: string;
}

export interface VaBankOption {
  key: keyof Pick<
    PaymentSettings,
    "vaBca" | "vaBni" | "vaBri" | "vaPermata" | "vaMandiri" | "vaCimb"
  >;
  label: string;
  color: string;
  shortLabel: string;
}

export interface SavingsPeriod {
  id: string;
  coupleSpaceId: string;
  userId: string;
  userDisplayName: string;
  monthYear: string;
  weekNumber: number;
  baseAmount: number;
  penaltyAmount: number;
  dueDate: string;
  status: PeriodStatus;
}

export interface Transaction {
  id: string;
  periodId: string | null;
  targetId: string | null;
  paidBy: string;
  paidByName: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  midtransOrderId?: string;
  createdAt: string;
  monthYear?: string;
  weekNumber?: number;
}

export interface SavingsTarget {
  id: string;
  coupleSpaceId: string;
  name: string;
  imageUrl: string;
  targetAmount: number;
  collectedAmount: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface TargetAllocation {
  id: string;
  targetId: string;
  amount: number;
  allocatedBy: string;
  allocatedByName: string;
  createdAt: string;
}

export interface PoolDeposit {
  id: string;
  amount: number;
  depositedBy: string;
  depositedByName: string;
  note: string | null;
  createdAt: string;
}

export interface PaymentSelection {
  periodIds: string[];
  label: string;
  totalAmount: number;
}

export interface NudgePayload {
  fromUserId: string;
  fromName: string;
  periodId: string;
  monthYear: string;
  weekNumber: number;
  message: string;
}

export interface PendingPaymentClaim {
  orderId: string;
  paidBy: string;
  paidByName: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  periodLabels: string[];
}
