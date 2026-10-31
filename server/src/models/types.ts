export type UserRole =
  | "SUPER_ADMIN"
  | "FINANCE_ADMIN"
  | "CONTENT_MANAGER"
  | "MEMBER";

export type CurrencyCode =
  | "USD"
  | "NGN"
  | "GHS"
  | "XOF"
  | "GBP"
  | "EUR"
  | "USDT";

export type InstallmentScheduleType = "DAILY_60" | "DAILY_90_EXTENDED";

export type ContractPhaseStatus =
  | "PHASE_1_CAPITAL_RECOVERY" // Days 1 to ~24-29: Recovering 100% initial registration capital via daily dividends
  | "PHASE_2_DAILY_PROFIT_60"  // Days ~25-60: 100% capital recovered; earning daily dividends up to Day 60
  | "POST_60_ROYALTY_90"       // Days 61-90 (Exclusive to $120 & $350): 30-Day Extended Business Royalty Pool
  | "COMPLETED";

export interface RankDefinition {
  level: 1 | 2 | 3;
  title: string;
  minDirectReferrals: number;
  minTeamMembers: number;
  minCompletedCourses: number;
  minTeamVolumeCents: number;
  gen1CommissionPct: number; // 5% open to all active members
  gen2CommissionPct: number; // 2% open to all active members
  gen3CommissionPct: number; // 1% open to all active members
  royaltyPoolMultiplier: number; // 1.0x, 1.5x, 3.0x for Days 61-90 Business Royalty Pool
  plainEnglishSummary: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  country: string;
  preferredCurrency: CurrencyCode;
  role: UserRole;
  referralCode: string;
  referredById: string | null;
  materializedPath: string; // e.g. "/u-founder/u-ada/u-chidi/"
  networkLevel: 1 | 2 | 3;
  xpPoints: number;
  directReferralsCount: number;
  totalTeamMembersCount: number;
  personalVolumeCents: number;
  teamVolumeCents: number;
  completedCourseIds: string[];
  enrolledCourseIds: string[];
  availableBalanceCents: number;
  escrowCapitalCents: number; // Remaining capital to be recovered within the first ~24-29 days
  totalCapitalReturnedCents: number;
  totalCommissionsEarnedCents: number;
  totalRoyaltiesEarnedCents: number;
  adCreditsCents: number;
  createdAt: string;
}

export interface TradePack {
  id: string;
  name: string;
  tierBadge: string;
  isHeroMagnet?: boolean; // True for the $120 Pro Value Package
  popularityTag?: string; // e.g. "82% of Members Choose $120"
  description: string;
  priceCents: number; // $30 (3000), $50 (5000), $120 (12000), $350 (35000)
  baseDailyPayoutCents: number; // $1.25 (125), $2.00 (200), $4.10 (410), $12.50 (1250)
  boosterDailyPayoutCents: number; // +$0.70 (70 cents) on $120 pack -> $4.80/day total!
  capitalReturnDays: number; // 24, 25, 25-29, 28
  activeDailyEarningDays: number; // 60 days
  totalLifecycleDays: 60 | 90; // 60 days for $30/$50; 90 days (Days 61-90 Royalty Extension) for $120/$350
  daysToHit15DollarWithdrawal: number; // 12 days, 7.5 days, 3.1-3.6 days, 1.2 days
  defaultSchedule: InstallmentScheduleType;
  allowUserScheduleChoice: boolean;
  royaltyUnits: number; // Weight for Days 61-90 Business Royalty Pool
  freeAdCreditsCents: number; // $15.00 (1500 cents) free Ad Credits on $120 Pack
  bundledCourseIds: string[];
  physicalOrDigitalItems: string[];
  xpReward: number;
}

export interface InstallmentItem {
  installmentNumber: number; // Day 1 .. Day 60
  dueDay: number;            // 1 .. 60
  percentage: number;        // Daily % of initial capital
  amountCents: number;       // Daily payout in USD cents
  status: "PENDING" | "PAID";
  paidAt?: string;
}

export interface InstallmentContract {
  id: string;
  userId: string;
  userName: string;
  packId: string;
  packName: string;
  sourceChannel: "ONLINE_WALLET" | "ONLINE_GATEWAY" | "OFFLINE_APPROVED";
  principalCents: number;
  dailyPayoutCents: number;
  boosterApplied: boolean;
  returnedCapitalCents: number; // Tracks up to 100% principal recovered in first ~25 days
  dailyProfitEarnedCents: number; // Tracks additional daily profit earned through Day 60
  totalDailyCreditedCents: number; // returnedCapitalCents + dailyProfitEarnedCents
  royaltyEarningsCents: number; // Days 61-90 Business Royalty Pool earnings
  royaltyUnits: number;
  scheduleType: InstallmentScheduleType;
  capitalReturnTargetDays: number;
  totalInstallments: number; // 60 daily payouts
  paidInstallments: number;  // 0..60 days paid
  currentDayElapsed: number; // 0..90
  totalLifecycleDays: 60 | 90;
  phaseStatus: ContractPhaseStatus;
  installments: InstallmentItem[];
  createdAt: string;
  completedCapitalRecoveryAt?: string;
  completed60DayAt?: string;
}

export type OfflinePaymentMethod =
  | "CASH_HAND_TO_HAND"
  | "POS_TERMINAL"
  | "LOCAL_BANK_TRANSFER"
  | "MOBILE_MONEY_WEST_AFRICA";

export interface OfflineSaleRecord {
  id: string;
  buyerUserId: string;
  buyerName: string;
  packId: string;
  packName: string;
  amountCents: number;
  localCurrency: CurrencyCode;
  localAmountFormatted: string;
  schedulePreference: InstallmentScheduleType;
  paymentMethod: OfflinePaymentMethod;
  receiptReference: string;
  fieldAgentNote: string;
  submittedByRole: UserRole;
  submittedByUserId: string;
  status: "PENDING_VERIFICATION" | "APPROVED" | "REJECTED";
  approvedByUserId?: string;
  contractId?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface BusinessDividendDeclaration {
  id: string;
  title: string;
  periodType: "DAILY" | "TWICE_WEEKLY" | "WEEKLY";
  grossBusinessProfitCents: number;
  declaredMemberPoolCents: number;
  companyRetainedSpreadCents: number;
  eligibleContractsCount: number;
  totalWeightedUnits: number;
  declaredByUserId: string;
  createdAt: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
  format: "VIDEO" | "PDF_GUIDE" | "PRACTICAL_TASK";
}

export interface Course {
  id: string;
  title: string;
  category: "ENTREPRENEURSHIP" | "DIGITAL_MARKETING" | "FINANCIAL_LITERACY" | "FIELD_SALES";
  priceCents: number;
  isStandalonePaid: boolean;
  xpReward: number;
  instructor: string;
  description: string;
  lessons: CourseLesson[];
}

export interface AdCampaign {
  id: string;
  promoterUserId: string;
  promoterName: string;
  title: string;
  category: "PRODUCT_PROMO" | "CAMPUS_EVENT" | "REFERRAL_RECRUITMENT" | "EXTERNAL_BRAND";
  targetRegion: string;
  ctaUrl: string;
  budgetCents: number;
  impressions: number;
  clicks: number;
  status: "ACTIVE" | "COMPLETED";
  createdAt: string;
}

export type WithdrawalChannel =
  | "BANK_OR_MOBILE_MONEY"
  | "CRYPTO_USDT_USDC"
  | "P2P_MEMBER_TRANSFER"
  | "INTERNAL_REPURCHASE_0_FEE";

export interface WithdrawalOrTransferRecord {
  id: string;
  userId: string;
  userName: string;
  channel: WithdrawalChannel;
  grossAmountCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  currency: CurrencyCode;
  destinationDetails: string;
  recipientUserId?: string;
  status: "PENDING_APPROVAL" | "APPROVED_PAID" | "REJECTED";
  createdAt: string;
  processedAt?: string;
  txHash?: string;
}

export interface LedgerLog {
  id: string;
  timestamp: string;
  category:
    | "PACK_PURCHASE"
    | "OFFLINE_SALE_APPROVED"
    | "DAILY_DIVIDEND_PAYOUT"
    | "NETWORK_COMMISSION"
    | "POST_60_BUSINESS_ROYALTY"
    | "WITHDRAWAL"
    | "WITHDRAWAL_FEE"
    | "WALLET_RECHARGE"
    | "P2P_TRANSFER"
    | "AD_PROMOTION_REVENUE"
    | "COURSE_PURCHASE";
  userId: string;
  userName: string;
  amountCents: number;
  direction: "CREDIT" | "DEBIT" | "TREASURY";
  description: string;
}

export interface FounderTreasurySummary {
  withdrawalAndP2PFeesCents: number;
  sponsoredAdsRevenueCents: number;
  standaloneCourseRevenueCents: number;
  retainedBusinessSpreadCents: number;
  totalFounderRevenueCents: number;
  activeWorkingCapitalDeployedCents: number;
  totalCapitalReturnedToMembersCents: number;
  totalRoyaltiesPaidToMembersCents: number;
}
