import type {
  AdCampaign,
  BusinessDividendDeclaration,
  Course,
  CurrencyCode,
  FounderTreasurySummary,
  InstallmentContract,
  InstallmentScheduleType,
  LedgerLog,
  OfflinePaymentMethod,
  OfflineSaleRecord,
  TradePack,
  User,
  WithdrawalOrTransferRecord,
} from "../models/types.ts";
import { CURRENCIES } from "./currency.ts";
import { declareAndDistributePost28Royalties } from "./dividends.ts";
import {
  createDailyDividendContract,
  processNextInstallmentPayout,
} from "./installments.ts";
import {
  distributeUplineCommissions,
  evaluateAndUpgradeUserRank,
  RANK_DEFINITIONS,
} from "./networking.ts";
import {
  approveOfflineSaleRecord,
  submitOfflineSaleRecord,
} from "./offline-sales.ts";
import {
  executeP2PTransfer,
  requestExternalWithdrawal,
} from "./wallet.ts";
import {
  generateSessionToken,
  hashPassword,
  isPostgresReachable,
  pgExec,
  pgQueryJson,
  sqlLit,
  verifyPassword,
} from "../db/prisma.ts";
import { marketRateEngine } from "./rates.ts";

export interface UserIsolatedWorkspace {
  usdcBalanceCents: number;
  savingsJarCents: number;
  passwordHash: string;
  phone: string;
  countryCode: string;
  usedInvitationCode: string;
  likedArticleIds: string[];
  favoriteArticleIds: string[];
  comments: Array<{ id: string; articleId: string; articleTitle: string; text: string; createdAt: string }>;
  completedTaskIds: string[];
  withdrawalMethods: Array<{ id: string; channel: string; label: string; destination: string }>;
  flashExchanges: Array<{ id: string; fromAsset: string; toAsset: string; fromAmountCents: number; toAmountCents: number; createdAt: string }>;
  supportTickets: Array<{ id: string; subject: string; message: string; status: string; createdAt: string }>;
  milestones: Array<{ stageNumber: number; isUnlocked: boolean }>;
}

export class PlatformStore {
  users: Map<string, User> = new Map();
  userWorkspaces: Map<string, UserIsolatedWorkspace> = new Map();
  sessions: Map<string, string> = new Map(); // token -> userId
  articles: Array<{
    id: string;
    authorId: string;
    authorName: string;
    category: string;
    title: string;
    excerpt: string;
    body?: string;
    views: number;
    likes: number;
    favorites?: number;
    comments: number;
    date: string;
  }> = [];
  taskDefinitions: Array<{ id: string; title: string; rewardLabel: string; spwReward: number }> = [
    { id: "t1", title: "Verify Member Account Profile", rewardLabel: "Verified Badge + 10 SPW", spwReward: 10 },
    { id: "t2", title: "Read & Like 1 Community Dispatch in Discover", rewardLabel: "+15 SPW Points", spwReward: 15 },
    { id: "t3", title: "Share Invitation Code with Regional Chapter", rewardLabel: "+25 SPW Points", spwReward: 25 },
    { id: "t4", title: "Execute a 1:1 Flash Exchange or Savings Jar Allocation", rewardLabel: "+20 SPW Points", spwReward: 20 },
    { id: "t5", title: "Save a Verified USDT / Bank Withdrawal Method", rewardLabel: "+30 SPW Points", spwReward: 30 },
  ];
  supportFaqs: Array<{ id: string; question: string; answer: string }> = [
    { id: "faq-1", question: "How do I fund or recharge my wallet?", answer: "Click Recharge in Personal Center -> Assets to deposit USDT into your Flexible Wallet." },
    { id: "faq-2", question: "What is the minimum external withdrawal?", answer: "Minimum external withdrawal is $15.00 USDT with a 3% administrative gateway fee." },
    { id: "faq-3", question: "How do P2P member transfers work?", answer: "Send liquid USDT directly to any verified member ID or Invitation Code with 0% internal fee." },
    { id: "faq-4", question: "How does Pack Isolation work?", answer: "Each membership tier ($30, $50, $120, $350) runs on an independent 60-day daily dividend timeline (with Days 61–90 extended royalties on $120 & $350 packs)." },
    { id: "faq-5", question: "How does the 3-Generation Referral System work?", answer: "You earn 5% on Gen 1 direct pack activations, 2% on Gen 2, and 1% on Gen 3 automatically." },
  ];
  packs: TradePack[] = [];
  contracts: InstallmentContract[] = [];
  offlineSales: OfflineSaleRecord[] = [];
  dividendDeclarations: BusinessDividendDeclaration[] = [];
  courses: Course[] = [];
  adCampaigns: AdCampaign[] = [];
  withdrawals: WithdrawalOrTransferRecord[] = [];
  ledgerLogs: LedgerLog[] = [];
  treasury: FounderTreasurySummary = {
    withdrawalAndP2PFeesCents: 3450,
    sponsoredAdsRevenueCents: 24000,
    standaloneCourseRevenueCents: 9500,
    retainedBusinessSpreadCents: 52000,
    totalFounderRevenueCents: 88950,
    activeWorkingCapitalDeployedCents: 118000,
    totalCapitalReturnedToMembersCents: 44500,
    totalRoyaltiesPaidToMembersCents: 16500,
  };

  constructor() {
    this.seedInitialData();
    this.hydrateFromPostgres();
  }

  getOrCreateUserWorkspace(userId: string): UserIsolatedWorkspace {
    let ws = this.userWorkspaces.get(userId);
    if (!ws) {
      ws = {
        usdcBalanceCents: 0,
        savingsJarCents: 0,
        passwordHash: "",
        phone: "",
        countryCode: "+234",
        usedInvitationCode: "SPAYWAY",
        likedArticleIds: [],
        favoriteArticleIds: [],
        comments: [],
        completedTaskIds: [],
        withdrawalMethods: [],
        flashExchanges: [],
        supportTickets: [],
        milestones: [1, 2, 3, 4, 5, 6, 7].map((n) => ({
          stageNumber: n,
          isUnlocked: n === 1,
        })),
      };
      this.userWorkspaces.set(userId, ws);
    }
    return ws;
  }

  hydrateFromPostgres() {
    if (!isPostgresReachable()) return;
    const testUser = this.users.get("u-test");
    const testWs = this.getOrCreateUserWorkspace("u-test");
    if (testUser) {
      pgExec(`
        INSERT INTO "User" ("id", "name", "email", "phone", "countryCode", "country", "passwordHash", "preferredCurrency", "role", "referralCode", "usedInvitationCode", "referredById", "materializedPath", "networkLevel", "directReferralsCount", "totalTeamMembersCount", "personalVolumeCents", "teamVolumeCents")
        VALUES (
          'u-test',
          ${sqlLit(testUser.name)},
          'test@spayway.app',
          '+2348012345678',
          '+234',
          'Nigeria',
          ${sqlLit(testWs.passwordHash)},
          'USDT',
          'MEMBER',
          'TEST777',
          'SPAYWAY',
          'u-founder',
          '/u-founder/u-test/',
          2,
          2,
          3,
          5000,
          17000
        )
        ON CONFLICT ("id") DO NOTHING;

        INSERT INTO "UserWallet" ("id", "userId", "usdtBalanceCents", "usdcBalanceCents", "spwPoints", "savingsJarCents", "escrowCapitalCents", "totalCapitalReturnedCents", "totalCommissionsEarnedCents", "totalRoyaltiesEarnedCents", "adCreditsCents")
        VALUES ('w-test', 'u-test', 25000, 5000, 45, 3500, 3400, 1600, 850, 400, 500)
        ON CONFLICT ("userId") DO NOTHING;
      `);
    }

    const dbUsers = pgQueryJson<any>(`
      SELECT u.*,
             COALESCE(w."usdtBalanceCents", 0) AS "usdtBalanceCents",
             COALESCE(w."usdcBalanceCents", 0) AS "usdcBalanceCents",
             COALESCE(w."spwPoints", 0) AS "spwPoints",
             COALESCE(w."savingsJarCents", 0) AS "savingsJarCents",
             COALESCE(w."escrowCapitalCents", 0) AS "escrowCapitalCents",
             COALESCE(w."totalCapitalReturnedCents", 0) AS "totalCapitalReturnedCents",
             COALESCE(w."totalCommissionsEarnedCents", 0) AS "totalCommissionsEarnedCents",
             COALESCE(w."totalRoyaltiesEarnedCents", 0) AS "totalRoyaltiesEarnedCents",
             COALESCE(w."adCreditsCents", 0) AS "adCreditsCents"
      FROM "User" u
      LEFT JOIN "UserWallet" w ON w."userId" = u."id"
    `);
    for (const row of dbUsers) {
      if (row.id === "u-founder" || row.id === "u-master-code") continue;
      const u: User = {
        id: row.id,
        name: row.name,
        email: row.email || `${row.id}@spayway.app`,
        country: row.country || "Nigeria",
        preferredCurrency: row.preferredCurrency || "USDT",
        role: row.role || "MEMBER",
        referralCode: row.referralCode,
        referredById: row.referredById,
        materializedPath: row.materializedPath,
        networkLevel: (row.networkLevel as 1 | 2 | 3) || 1,
        xpPoints: Number(row.spwPoints || 0),
        directReferralsCount: Number(row.directReferralsCount || 0),
        totalTeamMembersCount: Number(row.totalTeamMembersCount || 0),
        personalVolumeCents: Number(row.personalVolumeCents || 0),
        teamVolumeCents: Number(row.teamVolumeCents || 0),
        completedCourseIds: [],
        enrolledCourseIds: [],
        availableBalanceCents: Number(row.usdtBalanceCents || 0),
        escrowCapitalCents: Number(row.escrowCapitalCents || 0),
        totalCapitalReturnedCents: Number(row.totalCapitalReturnedCents || 0),
        totalCommissionsEarnedCents: Number(row.totalCommissionsEarnedCents || 0),
        totalRoyaltiesEarnedCents: Number(row.totalRoyaltiesEarnedCents || 0),
        adCreditsCents: Number(row.adCreditsCents || 0),
        createdAt: row.createdAt || new Date().toISOString(),
      };
      this.users.set(u.id, u);
      const ws = this.getOrCreateUserWorkspace(u.id);
      ws.usdcBalanceCents = Number(row.usdcBalanceCents || 0);
      ws.savingsJarCents = Number(row.savingsJarCents || 0);
      ws.passwordHash = row.passwordHash || ws.passwordHash || "";
      ws.phone = row.phone || ws.phone || "";
      ws.countryCode = row.countryCode || ws.countryCode || "+234";
      ws.usedInvitationCode = row.usedInvitationCode || ws.usedInvitationCode || "SPAYWAY";
    }

    const dbSessions = pgQueryJson<any>(`SELECT "token", "userId" FROM "AuthSession" WHERE "expiresAt" > NOW()`);
    for (const s of dbSessions) {
      this.sessions.set(s.token, s.userId);
    }
  }

  seedInitialData() {
    // 1. Seed Courses (LMS)
    this.courses = [
      {
        id: "crs-101",
        title: "Campus & Community Networking Mastery",
        category: "ENTREPRENEURSHIP",
        priceCents: 0,
        isStandalonePaid: false,
        xpReward: 100,
        instructor: "Dr. Kofi Mensah & Ritchie Academy",
        description:
          "How students and entrepreneurs build high-trust offline & online distribution networks across West Africa.",
        lessons: [
          {
            id: "les-1",
            title: "Understanding the 60-Day Daily Dividend & 90-Day Royalty Window",
            durationMinutes: 15,
            format: "VIDEO",
          },
          {
            id: "les-2",
            title: "Offline Field Sales & POS/Receipt Logging",
            durationMinutes: 20,
            format: "PDF_GUIDE",
          },
          {
            id: "les-3",
            title: "Maximizing the 3-Generation (5% / 2% / 1%) Referral System",
            durationMinutes: 25,
            format: "PRACTICAL_TASK",
          },
        ],
      },
      {
        id: "crs-102",
        title: "Digital Marketing, WhatsApp Funnels & Promoter Ads",
        category: "DIGITAL_MARKETING",
        priceCents: 1000, // $10.00 standalone or bundled
        isStandalonePaid: true,
        xpReward: 150,
        instructor: "Amina Bello (Growth Lead)",
        description:
          "Turn WhatsApp, TikTok, and campus flyers into steady daily product sales and 3-tier referral bonuses.",
        lessons: [
          {
            id: "les-4",
            title: "High-Converting WhatsApp Status Scripts for the $120 Pro Pack",
            durationMinutes: 18,
            format: "VIDEO",
          },
          {
            id: "les-5",
            title: "Running Sponsored Campaigns on the Platform Ad Engine",
            durationMinutes: 22,
            format: "PRACTICAL_TASK",
          },
        ],
      },
      {
        id: "crs-103",
        title: "Financial Literacy, Cooperative Capital & Cashflow",
        category: "FINANCIAL_LITERACY",
        priceCents: 1500, // $15.00 standalone or bundled
        isStandalonePaid: true,
        xpReward: 200,
        instructor: "Chukwudi Okafor, CFA",
        description:
          "Manage your daily dividends, unlock the +$0.70/day Pro Booster on the $120 Pack, and build long-term cooperative wealth.",
        lessons: [
          {
            id: "les-6",
            title: "Understanding Working Capital & Inventory Turnover",
            durationMinutes: 30,
            format: "VIDEO",
          },
          {
            id: "les-7",
            title: "Compounding Daily Dividends vs. $15 Minimum Cash Withdrawals",
            durationMinutes: 20,
            format: "PDF_GUIDE",
          },
        ],
      },
    ];

    // 2. Seed the 4 Registration Packages ($30, $50, $120 HERO MAGNET, $350)
    // Isolated per user (1 active pack per tier per user)
    this.packs = [
      {
        id: "pack-30",
        name: "Starter Registration Pack ($30)",
        tierBadge: "ENTRY LEVEL • 12-DAY CASHOUT WAIT",
        isHeroMagnet: false,
        description:
          "Entry registration level ($30 / ₦48,000). Pays $1.25 daily dividend (full $30 capital back in 24 days; $75 total over 60 days). Takes 12 days to reach the $15 minimum withdrawal. Expires strictly at Day 60.",
        priceCents: 3000, // $30.00
        baseDailyPayoutCents: 125, // $1.25 / day
        boosterDailyPayoutCents: 0,
        capitalReturnDays: 24,
        activeDailyEarningDays: 60,
        totalLifecycleDays: 60,
        daysToHit15DollarWithdrawal: 12,
        defaultSchedule: "DAILY_60",
        allowUserScheduleChoice: false,
        royaltyUnits: 0, // Ends at Day 60 (no Days 61-90 extension)
        freeAdCreditsCents: 0,
        bundledCourseIds: ["crs-101"],
        physicalOrDigitalItems: [
          "Student Entrepreneur Handbook (PDF)",
          "3-Generation Referral Access (5%, 2%, 1%)",
        ],
        xpReward: 60,
      },
      {
        id: "pack-50",
        name: "Builder Registration Pack ($50)",
        tierBadge: "BUILDER LEVEL • 8-DAY CASHOUT",
        isHeroMagnet: false,
        description:
          "Builder registration level ($50 / ₦80,000). Pays $2.00 daily dividend (full $50 capital back in 25 days; $120 total over 60 days). Reaches the $15 minimum withdrawal every 7.5 days. Expires strictly at Day 60.",
        priceCents: 5000, // $50.00
        baseDailyPayoutCents: 200, // $2.00 / day
        boosterDailyPayoutCents: 0,
        capitalReturnDays: 25,
        activeDailyEarningDays: 60,
        totalLifecycleDays: 60,
        daysToHit15DollarWithdrawal: 7.5,
        defaultSchedule: "DAILY_60",
        allowUserScheduleChoice: false,
        royaltyUnits: 0, // Ends at Day 60
        freeAdCreditsCents: 0,
        bundledCourseIds: ["crs-101", "crs-102"],
        physicalOrDigitalItems: [
          "Campus Merch Sample & Digital Marketing Course",
          "3-Generation Referral Access (5%, 2%, 1%)",
        ],
        xpReward: 120,
      },
      {
        id: "pack-120",
        name: "Pro Value Magnet Pack ($120)",
        tierBadge: "⭐ MOST POPULAR • BEST VALUE",
        isHeroMagnet: true,
        popularityTag: "🔥 82% of Members Choose $120 • Twice-Weekly Cash-Out!",
        description:
          "Our #1 Value Package! Pays $4.10/day base + $0.70/day Course/Promoter Boost = $4.80/day ($288 in 60 days)! Hits the $15 withdrawal every 3.1–3.6 days (Twice a Week!), PLUS includes the FREE 30-Day Extended Royalty Window (Days 61–90) and $15 Free Promoter Ad Credits!",
        priceCents: 12000, // $120.00 (~₦192,000)
        baseDailyPayoutCents: 410, // $4.10 / day base
        boosterDailyPayoutCents: 70, // +$0.70 / day boost = $4.80 / day!
        capitalReturnDays: 25, // 25 days w/ booster (29 days base)
        activeDailyEarningDays: 60,
        totalLifecycleDays: 90, // Includes Days 61-90 Extended Business Royalty Window!
        daysToHit15DollarWithdrawal: 3.1, // Twice-Weekly $15 Cash-Out!
        defaultSchedule: "DAILY_90_EXTENDED",
        allowUserScheduleChoice: false,
        royaltyUnits: 15,
        freeAdCreditsCents: 1500, // $15.00 Free Ad Credits!
        bundledCourseIds: ["crs-101", "crs-102", "crs-103"],
        physicalOrDigitalItems: [
          "Physical/Digital Pro Merch Kit + All 3 Academy Courses",
          "$15.00 Free Sponsored Promoter Ad Credits",
          "Days 61–90 Extended Business Royalty Window (15 Units)",
        ],
        xpReward: 400,
      },
      {
        id: "pack-350",
        name: "Executive Hub Syndicate ($350)",
        tierBadge: "EXECUTIVE HUB • 48-HR CASHOUT",
        isHeroMagnet: false,
        description:
          "For regional leaders and high-volume distributors ($350 / ₦560,000). Pays $12.50 daily dividend (full $350 capital back in 28 days; $750 in 60 days). Hits the $15 withdrawal every 1.2 days + 50 Units in the Days 61–90 Extended Royalty Pool!",
        priceCents: 35000, // $350.00 (~₦560,000)
        baseDailyPayoutCents: 1250, // $12.50 / day
        boosterDailyPayoutCents: 0,
        capitalReturnDays: 28,
        activeDailyEarningDays: 60,
        totalLifecycleDays: 90,
        daysToHit15DollarWithdrawal: 1.2,
        defaultSchedule: "DAILY_90_EXTENDED",
        allowUserScheduleChoice: false,
        royaltyUnits: 50,
        freeAdCreditsCents: 5000, // $50.00 Free Ad Credits
        bundledCourseIds: ["crs-101", "crs-102", "crs-103"],
        physicalOrDigitalItems: [
          "Regional Hub Inventory Consignment Box",
          "$50.00 Free Promoter Ad Credits + VIP Certificate",
          "Days 61–90 Extended Business Royalty Window (50 Units)",
        ],
        xpReward: 1200,
      },
    ];

    // 3. Seed Users across the 4 RBAC Roles (3-Level Referral System: L1, L2, L3)
    const usersList: User[] = [
      {
        id: "u-founder",
        name: "Ritchie (Founder & Super Admin)",
        email: "founder@spayway.app",
        country: "Nigeria",
        preferredCurrency: "NGN",
        role: "SUPER_ADMIN",
        referralCode: "RITCHIE-HQ",
        referredById: null,
        materializedPath: "/u-founder/",
        networkLevel: 3,
        xpPoints: 9500,
        directReferralsCount: 24,
        totalTeamMembersCount: 310,
        personalVolumeCents: 150000,
        teamVolumeCents: 1850000,
        completedCourseIds: ["crs-101", "crs-102", "crs-103"],
        enrolledCourseIds: ["crs-101", "crs-102", "crs-103"],
        availableBalanceCents: 95000,
        escrowCapitalCents: 0,
        totalCapitalReturnedCents: 65000,
        totalCommissionsEarnedCents: 48000,
        totalRoyaltiesEarnedCents: 24500,
        adCreditsCents: 15000,
        createdAt: "2026-08-01T08:00:00Z",
      },
      {
        id: "u-finance",
        name: "Tunde Bakare (Finance & Offline Sales Admin)",
        email: "finance@spayway.app",
        country: "Nigeria",
        preferredCurrency: "NGN",
        role: "FINANCE_ADMIN",
        referralCode: "FINANCE-01",
        referredById: "u-founder",
        materializedPath: "/u-founder/u-finance/",
        networkLevel: 2,
        xpPoints: 1200,
        directReferralsCount: 6,
        totalTeamMembersCount: 18,
        personalVolumeCents: 35000,
        teamVolumeCents: 95000,
        completedCourseIds: ["crs-101", "crs-103"],
        enrolledCourseIds: ["crs-101", "crs-102", "crs-103"],
        availableBalanceCents: 14500,
        escrowCapitalCents: 0,
        totalCapitalReturnedCents: 12000,
        totalCommissionsEarnedCents: 6500,
        totalRoyaltiesEarnedCents: 2200,
        adCreditsCents: 2500,
        createdAt: "2026-08-05T10:00:00Z",
      },
      {
        id: "u-content",
        name: "Ama Serwaa (Academy & Products Admin)",
        email: "academy@spayway.app",
        country: "Ghana",
        preferredCurrency: "GHS",
        role: "CONTENT_MANAGER",
        referralCode: "ACADEMY-GH",
        referredById: "u-founder",
        materializedPath: "/u-founder/u-content/",
        networkLevel: 2,
        xpPoints: 850,
        directReferralsCount: 4,
        totalTeamMembersCount: 9,
        personalVolumeCents: 12000,
        teamVolumeCents: 32000,
        completedCourseIds: ["crs-101", "crs-102"],
        enrolledCourseIds: ["crs-101", "crs-102", "crs-103"],
        availableBalanceCents: 8800,
        escrowCapitalCents: 0,
        totalCapitalReturnedCents: 12000,
        totalCommissionsEarnedCents: 3100,
        totalRoyaltiesEarnedCents: 950,
        adCreditsCents: 1500,
        createdAt: "2026-08-10T12:00:00Z",
      },
      {
        id: "u-ada",
        name: "Adaeze Nwosu (Pro Builder - UNILAG)",
        email: "adaeze@student.ng",
        country: "Nigeria",
        preferredCurrency: "NGN",
        role: "MEMBER",
        referralCode: "ADA-UNILAG",
        referredById: "u-founder",
        materializedPath: "/u-founder/u-ada/",
        networkLevel: 2,
        xpPoints: 580,
        directReferralsCount: 3,
        totalTeamMembersCount: 6,
        personalVolumeCents: 12000,
        teamVolumeCents: 28000,
        completedCourseIds: ["crs-101"],
        enrolledCourseIds: ["crs-101", "crs-102", "crs-103"],
        availableBalanceCents: 4800, // $48.00 (~₦76,800) — above $15 minimum withdrawal!
        escrowCapitalCents: 7200,
        totalCapitalReturnedCents: 4800,
        totalCommissionsEarnedCents: 1850,
        totalRoyaltiesEarnedCents: 2400,
        adCreditsCents: 1500,
        createdAt: "2026-09-18T09:30:00Z",
      },
      {
        id: "u-chidi",
        name: "Chidi Okafor (Campus Starter - Enugu)",
        email: "chidi@campus.ng",
        country: "Nigeria",
        preferredCurrency: "NGN",
        role: "MEMBER",
        referralCode: "CHIDI-07",
        referredById: "u-ada",
        materializedPath: "/u-founder/u-ada/u-chidi/",
        networkLevel: 1,
        xpPoints: 140,
        directReferralsCount: 1,
        totalTeamMembersCount: 1,
        personalVolumeCents: 3000,
        teamVolumeCents: 3000,
        completedCourseIds: [],
        enrolledCourseIds: ["crs-101"],
        availableBalanceCents: 750, // $7.50 (6 days of $1.25/day — needs $15.00 to withdraw!)
        escrowCapitalCents: 2250,
        totalCapitalReturnedCents: 750,
        totalCommissionsEarnedCents: 150,
        totalRoyaltiesEarnedCents: 0,
        adCreditsCents: 0,
        createdAt: "2026-10-15T14:00:00Z",
      },
      {
        id: "u-koffi",
        name: "Koffi Kouame (Abidjan Rep)",
        email: "koffi@campus.ci",
        country: "Côte d'Ivoire",
        preferredCurrency: "XOF",
        role: "MEMBER",
        referralCode: "KOFFI-CI",
        referredById: "u-chidi",
        materializedPath: "/u-founder/u-ada/u-chidi/u-koffi/",
        networkLevel: 1,
        xpPoints: 90,
        directReferralsCount: 0,
        totalTeamMembersCount: 0,
        personalVolumeCents: 3000,
        teamVolumeCents: 0,
        completedCourseIds: [],
        enrolledCourseIds: ["crs-101"],
        availableBalanceCents: 500, // $5.00 (4 days of $1.25/day)
        escrowCapitalCents: 2500,
        totalCapitalReturnedCents: 500,
        totalCommissionsEarnedCents: 0,
        totalRoyaltiesEarnedCents: 0,
        adCreditsCents: 0,
        createdAt: "2026-10-20T11:00:00Z",
      },
      {
        id: "u-member",
        name: "USER-1088554",
        email: "member@spayway.app",
        country: "Nigeria",
        preferredCurrency: "USDT",
        role: "MEMBER",
        referralCode: "1088554",
        referredById: "u-founder",
        materializedPath: "/u-founder/u-member/",
        networkLevel: 1,
        xpPoints: 0,
        directReferralsCount: 0,
        totalTeamMembersCount: 0,
        personalVolumeCents: 0,
        teamVolumeCents: 0,
        completedCourseIds: [],
        enrolledCourseIds: [],
        availableBalanceCents: 0,
        escrowCapitalCents: 0,
        totalCapitalReturnedCents: 0,
        totalCommissionsEarnedCents: 0,
        totalRoyaltiesEarnedCents: 0,
        adCreditsCents: 0,
        createdAt: "2026-10-28T08:00:00Z",
      },
      {
        id: "u-test",
        name: "TEST-MEMBER",
        email: "test@spayway.app",
        country: "Nigeria",
        preferredCurrency: "USDT",
        role: "MEMBER",
        referralCode: "TEST777",
        referredById: "u-founder",
        materializedPath: "/u-founder/u-test/",
        networkLevel: 2,
        xpPoints: 45,
        directReferralsCount: 2,
        totalTeamMembersCount: 3,
        personalVolumeCents: 5000,
        teamVolumeCents: 17000,
        completedCourseIds: ["crs-101"],
        enrolledCourseIds: ["crs-101", "crs-102"],
        availableBalanceCents: 25000, // 250.00 USDT ready for testing!
        escrowCapitalCents: 3400,
        totalCapitalReturnedCents: 1600,
        totalCommissionsEarnedCents: 850,
        totalRoyaltiesEarnedCents: 400,
        adCreditsCents: 500,
        createdAt: "2026-10-20T09:00:00Z",
      },
      {
        id: "u-test-gen1",
        name: "Amaka Eze (Gen 1 - Lagos)",
        email: "amaka@spayway.app",
        country: "Nigeria",
        preferredCurrency: "USDT",
        role: "MEMBER",
        referralCode: "AMAKA-G1",
        referredById: "u-test",
        materializedPath: "/u-founder/u-test/u-test-gen1/",
        networkLevel: 1,
        xpPoints: 30,
        directReferralsCount: 1,
        totalTeamMembersCount: 1,
        personalVolumeCents: 12000,
        teamVolumeCents: 5000,
        completedCourseIds: [],
        enrolledCourseIds: ["crs-101"],
        availableBalanceCents: 2400,
        escrowCapitalCents: 9600,
        totalCapitalReturnedCents: 2400,
        totalCommissionsEarnedCents: 250,
        totalRoyaltiesEarnedCents: 0,
        adCreditsCents: 0,
        createdAt: "2026-10-22T11:00:00Z",
      },
      {
        id: "u-test-gen2",
        name: "Samuel Mensah (Gen 2 - Accra)",
        email: "samuel@spayway.app",
        country: "Ghana",
        preferredCurrency: "USDT",
        role: "MEMBER",
        referralCode: "SAM-G2",
        referredById: "u-test-gen1",
        materializedPath: "/u-founder/u-test/u-test-gen1/u-test-gen2/",
        networkLevel: 1,
        xpPoints: 15,
        directReferralsCount: 0,
        totalTeamMembersCount: 0,
        personalVolumeCents: 5000,
        teamVolumeCents: 0,
        completedCourseIds: [],
        enrolledCourseIds: ["crs-101"],
        availableBalanceCents: 1000,
        escrowCapitalCents: 4000,
        totalCapitalReturnedCents: 1000,
        totalCommissionsEarnedCents: 0,
        totalRoyaltiesEarnedCents: 0,
        adCreditsCents: 0,
        createdAt: "2026-10-24T15:00:00Z",
      },
    ];

    for (const u of usersList) {
      this.users.set(u.id, u);
    }

    // Configure Test Account isolated workspace (u-test)
    const testWs = this.getOrCreateUserWorkspace("u-test");
    testWs.usdcBalanceCents = 5000; // 50.00 USDC
    testWs.savingsJarCents = 3500; // 35.00 USDT in Savings Jar
    testWs.phone = "+2348012345678";
    testWs.countryCode = "+234";
    testWs.usedInvitationCode = "SPAYWAY";
    testWs.passwordHash = hashPassword("Spayway123!");
    testWs.completedTaskIds = ["t1"];
    testWs.withdrawalMethods = [
      {
        id: "wm-test-1",
        channel: "CRYPTO_USDT_USDC",
        label: "Primary USDT-TRC20 Wallet",
        destination: "TSpaywayTestWallet998877665544332211",
      },
    ];
    testWs.milestones = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
      stageNumber: n,
      isUnlocked: n <= 2,
    }));

    // 4. Seed Active Contracts
    const ada = this.users.get("u-ada")!;
    const chidi = this.users.get("u-chidi")!;
    const tunde = this.users.get("u-finance")!;
    const testUser = this.users.get("u-test")!;
    const pack30 = this.packs[0];
    const pack50 = this.packs[1];
    const pack120 = this.packs[2];
    const pack350 = this.packs[3];

    // Contract 1: Adaeze's active $120 Pro Magnet Pack (10 days elapsed at $4.80/day boosted)
    const adaProContract = createDailyDividendContract({
      user: ada,
      pack: pack120,
      sourceChannel: "ONLINE_GATEWAY",
      applyProBooster: true,
    });
    for (let i = 0; i < 10; i++) {
      adaProContract.installments[i].status = "PAID";
      adaProContract.installments[i].paidAt = "2026-10-26T10:00:00Z";
    }
    adaProContract.paidInstallments = 10;
    adaProContract.currentDayElapsed = 10;
    adaProContract.returnedCapitalCents = 4800; // $48.00 recovered so far in 10 days (100% back on Day 25!)
    adaProContract.totalDailyCreditedCents = 4800;
    ada.escrowCapitalCents = 7200; // $72.00 remaining to full capital recovery

    // Contract 2: Tunde's $350 Executive Pack that completed Day 60 and is now in POST_60_ROYALTY_90 (Days 61-90 Extended Royalty Pool)
    const tundeExecContract = createDailyDividendContract({
      user: tunde,
      pack: pack350,
      sourceChannel: "OFFLINE_APPROVED",
    });
    tundeExecContract.installments.forEach((inst) => {
      inst.status = "PAID";
      inst.paidAt = "2026-10-20T12:00:00Z";
    });
    tundeExecContract.paidInstallments = 60;
    tundeExecContract.currentDayElapsed = 65; // Day 65 of 90
    tundeExecContract.returnedCapitalCents = 35000; // 100% of $350 recovered
    tundeExecContract.dailyProfitEarnedCents = 40000; // +$400 daily profit
    tundeExecContract.totalDailyCreditedCents = 75000; // $750 total over 60 days
    tundeExecContract.royaltyEarningsCents = 2200;
    tundeExecContract.phaseStatus = "POST_60_ROYALTY_90";
    tunde.escrowCapitalCents = 0;

    // Contract 3: Chidi's $30 Starter Pack (6 days elapsed at $1.25/day = $7.50 earned; needs 6 more days to reach $15 min withdrawal)
    const chidiStarterContract = createDailyDividendContract({
      user: chidi,
      pack: pack30,
      sourceChannel: "OFFLINE_APPROVED",
    });
    for (let i = 0; i < 6; i++) {
      chidiStarterContract.installments[i].status = "PAID";
      chidiStarterContract.installments[i].paidAt = "2026-10-25T10:00:00Z";
    }
    chidiStarterContract.paidInstallments = 6;
    chidiStarterContract.currentDayElapsed = 6;
    chidiStarterContract.returnedCapitalCents = 750; // $7.50 recovered so far
    chidiStarterContract.totalDailyCreditedCents = 750;
    chidi.escrowCapitalCents = 2250;

    // Contract 4: Test Member's active $50 Builder Registration Pack (8 days elapsed at $2.00/day = $16.00 earned)
    const testBuilderContract = createDailyDividendContract({
      user: testUser,
      pack: pack50,
      sourceChannel: "ONLINE_GATEWAY",
    });
    for (let i = 0; i < 8; i++) {
      testBuilderContract.installments[i].status = "PAID";
      testBuilderContract.installments[i].paidAt = "2026-10-27T10:00:00Z";
    }
    testBuilderContract.paidInstallments = 8;
    testBuilderContract.currentDayElapsed = 8;
    testBuilderContract.returnedCapitalCents = 1600;
    testBuilderContract.totalDailyCreditedCents = 1600;
    testUser.escrowCapitalCents = 3400;

    this.contracts = [adaProContract, chidiStarterContract, tundeExecContract, testBuilderContract];

    // 5. Seed Offline Sales Queue
    this.offlineSales = [
      {
        id: "off-seed-pending-1",
        buyerUserId: "u-chidi",
        buyerName: "Chidi Okafor (Campus Starter - Enugu)",
        packId: "pack-120",
        packName: "Pro Value Magnet Pack ($120)",
        amountCents: 12000,
        localCurrency: "NGN",
        localAmountFormatted: "₦192,000",
        schedulePreference: "DAILY_90_EXTENDED",
        paymentMethod: "POS_TERMINAL",
        receiptReference: "POS-ENUGU-88412",
        fieldAgentNote:
          "Chidi upgraded to the $120 Pro Pack via Moniepoint POS at Enugu Campus Hub to unlock Twice-Weekly $15 cash-outs!",
        submittedByRole: "MEMBER",
        submittedByUserId: "u-chidi",
        status: "PENDING_VERIFICATION",
        createdAt: "2026-10-28T09:15:00Z",
      },
    ];

    // 6. Seed Past Days 61-90 Business Royalty Declarations
    this.dividendDeclarations = [
      {
        id: "div-seed-1",
        title: "Days 61–90 Extended Royalty Pool Distribution (West Africa Merch Trade)",
        periodType: "WEEKLY",
        grossBusinessProfitCents: 65000,
        declaredMemberPoolCents: 22000,
        companyRetainedSpreadCents: 43000,
        eligibleContractsCount: 1,
        totalWeightedUnits: 75,
        declaredByUserId: "u-founder",
        createdAt: "2026-10-24T18:00:00Z",
      },
    ];

    // 7. Seed Sponsored Ad Campaigns
    this.adCampaigns = [
      {
        id: "ad-seed-1",
        promoterUserId: "u-ada",
        promoterName: "Adaeze Nwosu (Pro Builder - UNILAG)",
        title: "Why 82% of Members Start with the $120 Pro Pack ($4.80/Day + Twice-Weekly Cashouts!)",
        category: "CAMPUS_EVENT",
        targetRegion: "Lagos, Abuja & Port Harcourt",
        ctaUrl: "https://spayway.app/join?ref=ADA-UNILAG",
        budgetCents: 1500,
        impressions: 6280,
        clicks: 540,
        status: "ACTIVE",
        createdAt: "2026-10-22T11:00:00Z",
      },
    ];

    // 8. Seed Initial Ledger Logs
    this.ledgerLogs = [
      {
        id: "log-seed-1",
        timestamp: "2026-10-26T10:00:00Z",
        category: "DAILY_DIVIDEND_PAYOUT",
        userId: "u-ada",
        userName: "Adaeze Nwosu (Pro Builder - UNILAG)",
        amountCents: 480,
        direction: "CREDIT",
        description:
          "Pro Value Magnet Pack ($120): Daily Dividend $4.80 ($4.10 base + $0.70 Pro Boost) — Day 10/60",
      },
      {
        id: "log-seed-2",
        timestamp: "2026-10-25T10:00:00Z",
        category: "DAILY_DIVIDEND_PAYOUT",
        userId: "u-chidi",
        userName: "Chidi Okafor (Campus Starter - Enugu)",
        amountCents: 125,
        direction: "CREDIT",
        description:
          "Starter Registration Pack ($30): Daily Dividend $1.25 — Day 6/60 ($7.50 accumulated toward $15 min withdrawal)",
      },
    ];

    this.articles = [
      {
        id: "art-1",
        authorId: "u-founder",
        authorName: "Spayway Research",
        category: "Economy",
        title: "Cross-Border Trade Settlement & Regional Liquidity Corridors",
        excerpt: "How verified merchant chapters streamline regional trade settlement across West Africa.",
        views: 0,
        likes: 0,
        comments: 0,
        date: "Today",
      },
      {
        id: "art-2",
        authorId: "u-founder",
        authorName: "Protocol Desk",
        category: "Technology",
        title: "Isolated Pack Accounting: Independent Contract Timelines",
        excerpt: "Why isolating each membership contract ensures transparent ledger verification.",
        views: 0,
        likes: 0,
        comments: 0,
        date: "Today",
      },
      {
        id: "art-3",
        authorId: "u-founder",
        authorName: "Academy Team",
        category: "Finance",
        title: "Using Flexible Wallet, Points Wallet, and Savings Jar Effectively",
        excerpt: "Best practices for managing liquid USDT, Points credits, and Savings Jar allocations.",
        views: 0,
        likes: 0,
        comments: 0,
        date: "Yesterday",
      },
      {
        id: "art-4",
        authorId: "u-founder",
        authorName: "Community Hub",
        category: "Society",
        title: "Building High-Trust Offline Community Chapters & Trade Hubs",
        excerpt: "Field playbook for organizing regional member meetups and merchant onboarding.",
        views: 0,
        likes: 0,
        comments: 0,
        date: "2d ago",
      },
    ];
  }

  getStateSnapshot(activeUserId = "u-member") {
    const activeUser =
      this.users.get(activeUserId) || this.users.get("u-member") || this.users.get("u-ada")!;
    const isolatedWorkspace = this.getOrCreateUserWorkspace(activeUser.id);

    // Strictly isolate contracts, withdrawals, and ledger logs for the active user
    const userContracts = this.contracts.filter((c) => c.userId === activeUser.id);
    const userWithdrawals = this.withdrawals.filter(
      (w) => w.userId === activeUser.id || w.recipientUserId === activeUser.id
    );
    const userLedgerLogs = this.ledgerLogs.filter((l) => l.userId === activeUser.id);

    return {
      activeUser,
      isolatedWorkspace,
      articles: this.articles,
      taskDefinitions: this.taskDefinitions,
      supportFaqs: this.supportFaqs,
      users: Array.from(this.users.values()),
      ranks: RANK_DEFINITIONS,
      currencies: Object.values(CURRENCIES),
      packs: this.packs,
      contracts: this.contracts,
      userContracts,
      offlineSales: this.offlineSales,
      dividendDeclarations: this.dividendDeclarations,
      courses: this.courses,
      adCampaigns: this.adCampaigns,
      withdrawals: this.withdrawals,
      userWithdrawals,
      ledgerLogs: this.ledgerLogs.slice(0, 60),
      userLedgerLogs,
      treasury: this.treasury,
      marketRates: marketRateEngine.getSnapshot(),
    };
  }

  /**
   * Online or Internal Wallet 0%-Fee Pack Purchase
   * Enforces User Pack Isolation: Each user can only hold 1 active contract per Pack ID!
   */
  purchasePack(params: {
    userId: string;
    packId: string;
    scheduleType?: InstallmentScheduleType;
    paymentSource: "ONLINE_GATEWAY" | "INTERNAL_WALLET_0_FEE";
    applyProBooster?: boolean;
  }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    const pack = this.packs.find((p) => p.id === params.packId);
    if (!pack) throw new Error("Pack not found");

    // Enforce Pack Isolation per User (1 active pack per tier per user)
    const existingActiveForPack = this.contracts.find(
      (c) =>
        c.userId === user.id &&
        c.packId === pack.id &&
        c.phaseStatus !== "COMPLETED"
    );
    if (existingActiveForPack) {
      throw new Error(
        `Pack Isolation Rule: ${user.name} already holds an active ${pack.name}. Each pack tier is isolated to 1 active pack per user—upgrade to a higher tier (like the $120 Pro Pack) to scale your daily earnings!`
      );
    }

    if (params.paymentSource === "INTERNAL_WALLET_0_FEE") {
      if (user.availableBalanceCents < pack.priceCents) {
        throw new Error(
          "Insufficient available wallet balance for 0%-fee internal re-purchase."
        );
      }
      user.availableBalanceCents = Number(
        (user.availableBalanceCents - pack.priceCents).toFixed(2)
      );
    }

    const contract = createDailyDividendContract({
      user,
      pack,
      scheduleType: params.scheduleType || pack.defaultSchedule,
      sourceChannel:
        params.paymentSource === "INTERNAL_WALLET_0_FEE"
          ? "ONLINE_WALLET"
          : "ONLINE_GATEWAY",
      applyProBooster: params.applyProBooster,
    });

    this.contracts.unshift(contract);
    this.treasury.activeWorkingCapitalDeployedCents = Number(
      (
        this.treasury.activeWorkingCapitalDeployedCents + pack.priceCents
      ).toFixed(2)
    );

    this.ledgerLogs.unshift({
      id: `log-buy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      category: "PACK_PURCHASE",
      userId: user.id,
      userName: user.name,
      amountCents: pack.priceCents,
      direction:
        params.paymentSource === "INTERNAL_WALLET_0_FEE" ? "DEBIT" : "CREDIT",
      description: `${user.name} activated ${pack.name} ($${(
        contract.dailyPayoutCents / 100
      ).toFixed(2)}/day for ${pack.activeDailyEarningDays} days • ${
        pack.totalLifecycleDays
      }-Day Lifecycle) via ${params.paymentSource}`,
    });

    const commissionResult = distributeUplineCommissions(
      user,
      pack.priceCents,
      pack.name,
      this.users,
      this.ledgerLogs
    );

    return { contract, commissionResult };
  }

  /**
   * Advances daily dividends by `daysToAdvance` (default 1 day, or full 60 days if completeFull28Days/completeFullCycle = true)
   */
  advanceInstallmentCycle(params: {
    contractId?: string;
    completeFull28Days?: boolean;
    completeFullCycle?: boolean;
    daysToAdvance?: number;
  }) {
    const completeAll60 = Boolean(
      params.completeFullCycle || params.completeFull28Days
    );
    const steps = params.daysToAdvance || 1;

    const targets = params.contractId
      ? this.contracts.filter((c) => c.id === params.contractId)
      : this.contracts.filter(
          (c) =>
            c.phaseStatus === "PHASE_1_CAPITAL_RECOVERY" ||
            c.phaseStatus === "PHASE_2_DAILY_PROFIT_60"
        );

    let totalCreditedCents = 0;
    let totalInstallmentsPaid = 0;

    for (const contract of targets) {
      const owner = this.users.get(contract.userId);
      if (!owner) continue;
      const res = processNextInstallmentPayout(
        contract,
        owner,
        this.ledgerLogs,
        completeAll60,
        steps
      );
      totalCreditedCents = Number(
        (totalCreditedCents + res.amountCreditedCents).toFixed(2)
      );
      totalInstallmentsPaid += res.installmentsPaidNow;
      this.treasury.totalCapitalReturnedToMembersCents = Number(
        (
          this.treasury.totalCapitalReturnedToMembersCents +
          res.amountCreditedCents
        ).toFixed(2)
      );
    }

    return { totalInstallmentsPaid, totalCreditedCents };
  }

  /**
   * Submit Offline Sale (Member Claim OR Direct Finance/Super Admin Entry)
   */
  recordOfflineSale(params: {
    buyerUserId: string;
    packId: string;
    localCurrency: CurrencyCode;
    schedulePreference?: InstallmentScheduleType;
    paymentMethod: OfflinePaymentMethod;
    receiptReference: string;
    fieldAgentNote: string;
    submittedByUserId: string;
    autoApproveIfAdmin?: boolean;
  }) {
    const buyer = this.users.get(params.buyerUserId);
    if (!buyer) throw new Error("Buyer user not found");
    const submitter = this.users.get(params.submittedByUserId) || buyer;
    const pack = this.packs.find((p) => p.id === params.packId);
    if (!pack) throw new Error("Pack not found");

    const res = submitOfflineSaleRecord({
      buyer,
      pack,
      localCurrency: params.localCurrency,
      schedulePreference: params.schedulePreference || pack.defaultSchedule,
      paymentMethod: params.paymentMethod,
      receiptReference: params.receiptReference,
      fieldAgentNote: params.fieldAgentNote,
      submittedByRole: submitter.role,
      submittedByUserId: submitter.id,
      autoApproveIfAdmin: Boolean(params.autoApproveIfAdmin),
      usersMap: this.users,
      contracts: this.contracts,
      treasury: this.treasury,
      ledgerLogs: this.ledgerLogs,
    });

    this.offlineSales.unshift(res.offlineRecord);
    return res;
  }

  /**
   * Finance Admin or Super Admin approves a pending offline sale claim
   */
  approvePendingOfflineSale(params: {
    offlineSaleId: string;
    approverUserId: string;
  }) {
    const approver = this.users.get(params.approverUserId);
    if (
      !approver ||
      (approver.role !== "SUPER_ADMIN" && approver.role !== "FINANCE_ADMIN")
    ) {
      throw new Error(
        "Only SUPER_ADMIN or FINANCE_ADMIN can approve offline sales."
      );
    }

    const record = this.offlineSales.find(
      (o) => o.id === params.offlineSaleId
    );
    if (!record) throw new Error("Offline sale record not found");
    if (record.status === "APPROVED") {
      throw new Error("Offline sale is already approved.");
    }

    const buyer = this.users.get(record.buyerUserId);
    if (!buyer) throw new Error("Buyer not found");
    const pack = this.packs.find((p) => p.id === record.packId);
    if (!pack) throw new Error("Pack not found");

    const contract = approveOfflineSaleRecord({
      record,
      approverUserId: approver.id,
      buyer,
      pack,
      usersMap: this.users,
      contracts: this.contracts,
      treasury: this.treasury,
      ledgerLogs: this.ledgerLogs,
    });

    return { record, contract };
  }

  /**
   * Super Admin declares Days 61-90 Extended Business Royalty Pool
   */
  declareBusinessDividend(params: {
    declaredByUserId: string;
    title: string;
    periodType: "DAILY" | "TWICE_WEEKLY" | "WEEKLY";
    grossBusinessProfitCents: number;
    declaredMemberPoolCents: number;
  }) {
    const admin = this.users.get(params.declaredByUserId);
    if (!admin || admin.role !== "SUPER_ADMIN") {
      throw new Error(
        "Only SUPER_ADMIN can declare Business Royalty Pools."
      );
    }

    const res = declareAndDistributePost28Royalties({
      title: params.title,
      periodType: params.periodType,
      grossBusinessProfitCents: params.grossBusinessProfitCents,
      declaredMemberPoolCents: params.declaredMemberPoolCents,
      declaredByUserId: admin.id,
      contracts: this.contracts,
      usersMap: this.users,
      treasury: this.treasury,
      ledgerLogs: this.ledgerLogs,
    });

    this.dividendDeclarations.unshift(res.declaration);
    return res;
  }

  /**
   * Register a new referred member and activate their chosen pack ($30, $50, $120, or $350)
   */
  registerReferredMember(params: {
    sponsorUserId: string;
    newMemberName: string;
    country: string;
    preferredCurrency: CurrencyCode;
    initialPackId: string;
    scheduleType?: InstallmentScheduleType;
    generation?: number;
  }) {
    let effectiveSponsor = this.users.get(params.sponsorUserId);
    if (!effectiveSponsor) throw new Error("Sponsor user not found");

    const gen = Number(params.generation) || 1;

    if (gen === 2) {
      // Find or create an existing Gen 1 member under effectiveSponsor
      let gen1 = Array.from(this.users.values()).find(
        (u) => u.referredById === effectiveSponsor!.id
      );
      if (!gen1) {
        const gen1Id = `u-gen1-${Math.random().toString(36).slice(2, 6)}`;
        gen1 = {
          id: gen1Id,
          name: `${effectiveSponsor.name}'s Gen 1 Partner`,
          email: `partner-${gen1Id}@campus.org`,
          country: params.country,
          preferredCurrency: params.preferredCurrency,
          role: "MEMBER",
          referralCode: `PARTNER-${Math.floor(100 + Math.random() * 899)}`,
          referredById: effectiveSponsor.id,
          materializedPath: `${effectiveSponsor.materializedPath}${gen1Id}/`,
          networkLevel: 1,
          xpPoints: 50,
          directReferralsCount: 0,
          totalTeamMembersCount: 0,
          personalVolumeCents: 0,
          teamVolumeCents: 0,
          completedCourseIds: [],
          enrolledCourseIds: ["crs-101"],
          availableBalanceCents: 0,
          escrowCapitalCents: 0,
          totalCapitalReturnedCents: 0,
          totalCommissionsEarnedCents: 0,
          totalRoyaltiesEarnedCents: 0,
          adCreditsCents: 0,
          createdAt: new Date().toISOString(),
        };
        this.users.set(gen1.id, gen1);
        effectiveSponsor.directReferralsCount += 1;
        effectiveSponsor.totalTeamMembersCount += 1;
      }
      effectiveSponsor = gen1;
    } else if (gen === 3) {
      // Find or create Gen 1 and Gen 2 downlines
      let gen1 = Array.from(this.users.values()).find(
        (u) => u.referredById === effectiveSponsor!.id
      );
      if (!gen1) {
        const gen1Id = `u-gen1-${Math.random().toString(36).slice(2, 6)}`;
        gen1 = {
          id: gen1Id,
          name: `${effectiveSponsor.name}'s Gen 1 Leader`,
          email: `leader-${gen1Id}@campus.org`,
          country: params.country,
          preferredCurrency: params.preferredCurrency,
          role: "MEMBER",
          referralCode: `LEAD-${Math.floor(100 + Math.random() * 899)}`,
          referredById: effectiveSponsor.id,
          materializedPath: `${effectiveSponsor.materializedPath}${gen1Id}/`,
          networkLevel: 1,
          xpPoints: 50,
          directReferralsCount: 0,
          totalTeamMembersCount: 0,
          personalVolumeCents: 0,
          teamVolumeCents: 0,
          completedCourseIds: [],
          enrolledCourseIds: ["crs-101"],
          availableBalanceCents: 0,
          escrowCapitalCents: 0,
          totalCapitalReturnedCents: 0,
          totalCommissionsEarnedCents: 0,
          totalRoyaltiesEarnedCents: 0,
          adCreditsCents: 0,
          createdAt: new Date().toISOString(),
        };
        this.users.set(gen1.id, gen1);
        effectiveSponsor.directReferralsCount += 1;
        effectiveSponsor.totalTeamMembersCount += 1;
      }
      let gen2 = Array.from(this.users.values()).find(
        (u) => u.referredById === gen1!.id
      );
      if (!gen2) {
        const gen2Id = `u-gen2-${Math.random().toString(36).slice(2, 6)}`;
        gen2 = {
          id: gen2Id,
          name: `${gen1.name}'s Gen 2 Associate`,
          email: `assoc-${gen2Id}@campus.org`,
          country: params.country,
          preferredCurrency: params.preferredCurrency,
          role: "MEMBER",
          referralCode: `ASSOC-${Math.floor(100 + Math.random() * 899)}`,
          referredById: gen1.id,
          materializedPath: `${gen1.materializedPath}${gen2Id}/`,
          networkLevel: 1,
          xpPoints: 50,
          directReferralsCount: 0,
          totalTeamMembersCount: 0,
          personalVolumeCents: 0,
          teamVolumeCents: 0,
          completedCourseIds: [],
          enrolledCourseIds: ["crs-101"],
          availableBalanceCents: 0,
          escrowCapitalCents: 0,
          totalCapitalReturnedCents: 0,
          totalCommissionsEarnedCents: 0,
          totalRoyaltiesEarnedCents: 0,
          adCreditsCents: 0,
          createdAt: new Date().toISOString(),
        };
        this.users.set(gen2.id, gen2);
        gen1.directReferralsCount += 1;
        gen1.totalTeamMembersCount += 1;
      }
      effectiveSponsor = gen2;
    }

    const sponsor = effectiveSponsor;

    const newId = `u-${Date.now().toString(36).slice(-4)}-${Math.random()
      .toString(36)
      .slice(2, 5)}`;
    const cleanCode =
      params.newMemberName
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 5)
        .toUpperCase() +
      "-" +
      Math.floor(10 + Math.random() * 89);

    const newUser: User = {
      id: newId,
      name: params.newMemberName,
      email: `${cleanCode.toLowerCase()}@campus.org`,
      country: params.country,
      preferredCurrency: params.preferredCurrency,
      role: "MEMBER",
      referralCode: cleanCode,
      referredById: sponsor.id,
      materializedPath: `${sponsor.materializedPath}${newId}/`,
      networkLevel: 1,
      xpPoints: 50,
      directReferralsCount: 0,
      totalTeamMembersCount: 0,
      personalVolumeCents: 0,
      teamVolumeCents: 0,
      completedCourseIds: [],
      enrolledCourseIds: ["crs-101"],
      availableBalanceCents: 0,
      escrowCapitalCents: 0,
      totalCapitalReturnedCents: 0,
      totalCommissionsEarnedCents: 0,
      totalRoyaltiesEarnedCents: 0,
      adCreditsCents: 0,
      createdAt: new Date().toISOString(),
    };

    this.users.set(newUser.id, newUser);

    sponsor.directReferralsCount += 1;
    const ancestorIds = sponsor.materializedPath.split("/").filter(Boolean);
    for (const ancId of ancestorIds) {
      const anc = this.users.get(ancId);
      if (anc) {
        anc.totalTeamMembersCount += 1;
        evaluateAndUpgradeUserRank(anc);
      }
    }

    const purchase = this.purchasePack({
      userId: newUser.id,
      packId: params.initialPackId,
      scheduleType: params.scheduleType,
      paymentSource: "ONLINE_GATEWAY",
    });

    return { newUser, contract: purchase.contract };
  }

  completeCourse(params: { userId: string; courseId: string }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    const course = this.courses.find((c) => c.id === params.courseId);
    if (!course) throw new Error("Course not found");

    if (!user.enrolledCourseIds.includes(course.id)) {
      if (course.isStandalonePaid && course.priceCents > 0) {
        this.treasury.standaloneCourseRevenueCents = Number(
          (
            this.treasury.standaloneCourseRevenueCents + course.priceCents
          ).toFixed(2)
        );
        this.treasury.totalFounderRevenueCents = Number(
          (this.treasury.totalFounderRevenueCents + course.priceCents).toFixed(
            2
          )
        );
      }
      user.enrolledCourseIds.push(course.id);
    }

    if (!user.completedCourseIds.includes(course.id)) {
      user.completedCourseIds.push(course.id);
      user.xpPoints += course.xpReward;
    }

    const rankCheck = evaluateAndUpgradeUserRank(user);
    return { user, course, rankCheck };
  }

  launchAdCampaign(params: {
    promoterUserId: string;
    title: string;
    category: AdCampaign["category"];
    targetRegion: string;
    budgetCents: number;
  }) {
    const user = this.users.get(params.promoterUserId);
    if (!user) throw new Error("User not found");

    const campaign: AdCampaign = {
      id: `ad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      promoterUserId: user.id,
      promoterName: user.name,
      title: params.title,
      category: params.category,
      targetRegion: params.targetRegion,
      ctaUrl: `https://spayway.app/join?ref=${user.referralCode}`,
      budgetCents: params.budgetCents,
      impressions: Math.round(params.budgetCents * 3.5),
      clicks: Math.round(params.budgetCents * 0.3),
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    this.adCampaigns.unshift(campaign);
    this.treasury.sponsoredAdsRevenueCents = Number(
      (this.treasury.sponsoredAdsRevenueCents + params.budgetCents).toFixed(2)
    );
    this.treasury.totalFounderRevenueCents = Number(
      (this.treasury.totalFounderRevenueCents + params.budgetCents).toFixed(2)
    );

    this.ledgerLogs.unshift({
      id: `log-ad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      category: "AD_PROMOTION_REVENUE",
      userId: user.id,
      userName: user.name,
      amountCents: params.budgetCents,
      direction: "TREASURY",
      description: `Sponsored Campaign "${params.title}" launched — Ad Revenue routed to Founder Treasury`,
    });

    return campaign;
  }

  processWalletOutflow(params: {
    userId: string;
    channel: "BANK_OR_MOBILE_MONEY" | "CRYPTO_USDT_USDC" | "P2P_MEMBER_TRANSFER";
    grossAmountCents: number;
    destinationDetails: string;
    recipientUserId?: string;
  }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");

    if (params.channel === "P2P_MEMBER_TRANSFER") {
      const targetRaw = (params.recipientUserId || "").trim();
      if (!targetRaw) {
        throw new Error("Recipient User ID or Invitation Code is required for P2P transfer.");
      }
      let recipient = this.users.get(targetRaw);
      if (!recipient) {
        const lower = targetRaw.toLowerCase();
        for (const u of this.users.values()) {
          if (
            u.referralCode.toLowerCase() === lower ||
            u.email.toLowerCase() === lower ||
            u.name.toLowerCase() === lower
          ) {
            recipient = u;
            break;
          }
        }
      }
      if (!recipient) throw new Error("Recipient user not found.");

      const record = executeP2PTransfer({
        sender: user,
        recipient,
        grossAmountCents: params.grossAmountCents,
        treasury: this.treasury,
        ledgerLogs: this.ledgerLogs,
      });
      this.withdrawals.unshift(record);
      return record;
    }

    const record = requestExternalWithdrawal({
      user,
      channel: params.channel,
      grossAmountCents: params.grossAmountCents,
      currency: user.preferredCurrency,
      destinationDetails: params.destinationDetails,
      treasury: this.treasury,
      ledgerLogs: this.ledgerLogs,
    });
    this.withdrawals.unshift(record);
    return record;
  }

  createCleanUser(params: {
    name?: string;
    email?: string;
    phone?: string;
    countryCode?: string;
    countryName?: string;
    password?: string;
    invitationCode?: string;
    referralCodeInput?: string;
    preferredCurrency?: CurrencyCode;
  }) {
    const invCode = (params.invitationCode || params.referralCodeInput || "")
      .trim()
      .toUpperCase();
    if (!invCode) {
      throw new Error(
        "Invitation Code is required. Enter your sponsor code or master code SPAYWAY / 1000001."
      );
    }

    // Validate Invitation Code against master codes or existing members in DB/Memory
    let sponsor: User | undefined;
    if (invCode === "SPAYWAY" || invCode === "1000001" || invCode === "RITCHIE-HQ") {
      sponsor = this.users.get("u-founder")!;
    } else {
      for (const u of this.users.values()) {
        if (
          u.referralCode.toUpperCase() === invCode ||
          u.id.toUpperCase() === invCode
        ) {
          sponsor = u;
          break;
        }
      }
      if (!sponsor && isPostgresReachable()) {
        const rows = pgQueryJson<any>(
          `SELECT * FROM "User" WHERE UPPER("referralCode") = ${sqlLit(invCode)} LIMIT 1`
        );
        if (rows.length > 0) {
          const r = rows[0];
          sponsor = this.users.get(r.id) || this.users.get("u-founder")!;
        }
      }
    }

    if (!sponsor) {
      throw new Error(
        `Invalid Invitation Code "${invCode}". Please enter a valid member referral code or master code SPAYWAY / 1000001.`
      );
    }

    const code = String(Math.floor(1000000 + Math.random() * 9000000));
    const newId = `u-${code}`;
    const dial = (params.countryCode || "+234").trim();
    const cleanPhone = params.phone
      ? `${dial}${params.phone.trim().replace(/^0+/, "")}`
      : "";
    const cleanEmail = params.email ? params.email.trim().toLowerCase() : "";

    // Check uniqueness for phone/email
    for (const existing of this.users.values()) {
      const exWs = this.getOrCreateUserWorkspace(existing.id);
      if (cleanEmail && existing.email.toLowerCase() === cleanEmail) {
        throw new Error("An account with this email address is already registered.");
      }
      if (cleanPhone && exWs.phone === cleanPhone) {
        throw new Error("An account with this phone number is already registered.");
      }
    }

    const displayHandle =
      (params.name && params.name.trim()) ||
      cleanPhone ||
      (cleanEmail ? cleanEmail.split("@")[0] : "") ||
      `USER-${code}`;

    const pwHash = hashPassword(params.password || "spayway123");

    const newUser: User = {
      id: newId,
      name: displayHandle,
      email: cleanEmail || `${newId}@spayway.app`,
      country: params.countryName || "Nigeria",
      preferredCurrency: params.preferredCurrency || "USDT",
      role: "MEMBER",
      referralCode: code,
      referredById: sponsor.id,
      materializedPath: `${sponsor.materializedPath}${newId}/`,
      networkLevel: Math.min(3, sponsor.networkLevel + 1) as 1 | 2 | 3,
      xpPoints: 0,
      directReferralsCount: 0,
      totalTeamMembersCount: 0,
      personalVolumeCents: 0,
      teamVolumeCents: 0,
      completedCourseIds: [],
      enrolledCourseIds: [],
      availableBalanceCents: 0,
      escrowCapitalCents: 0,
      totalCapitalReturnedCents: 0,
      totalCommissionsEarnedCents: 0,
      totalRoyaltiesEarnedCents: 0,
      adCreditsCents: 0,
      createdAt: new Date().toISOString(),
    };

    this.users.set(newUser.id, newUser);
    sponsor.directReferralsCount += 1;

    const ws = this.getOrCreateUserWorkspace(newUser.id);
    ws.passwordHash = pwHash;
    ws.phone = cleanPhone;
    ws.countryCode = dial;
    ws.usedInvitationCode = invCode;

    const sessionToken = generateSessionToken();
    this.sessions.set(sessionToken, newUser.id);

    // Persist User, UserWallet, Milestones (1..7), and AuthSession into local Supabase PostgreSQL (:54322)
    pgExec(`
      INSERT INTO "User" ("id", "name", "email", "phone", "countryCode", "country", "passwordHash", "preferredCurrency", "role", "referralCode", "usedInvitationCode", "referredById", "materializedPath", "networkLevel")
      VALUES (
        ${sqlLit(newUser.id)},
        ${sqlLit(newUser.name)},
        ${sqlLit(cleanEmail || null)},
        ${sqlLit(cleanPhone || null)},
        ${sqlLit(dial)},
        ${sqlLit(newUser.country)},
        ${sqlLit(pwHash)},
        'USDT',
        'MEMBER',
        ${sqlLit(newUser.referralCode)},
        ${sqlLit(invCode)},
        ${sqlLit(sponsor.id === "u-founder" ? "u-founder" : null)},
        ${sqlLit(newUser.materializedPath)},
        ${sqlLit(newUser.networkLevel)}
      )
      ON CONFLICT ("id") DO NOTHING;

      INSERT INTO "UserWallet" ("id", "userId", "usdtBalanceCents", "usdcBalanceCents", "spwPoints", "savingsJarCents")
      VALUES (${sqlLit("w-" + code)}, ${sqlLit(newUser.id)}, 0, 0, 0, 0)
      ON CONFLICT ("userId") DO NOTHING;

      INSERT INTO "UserMilestoneProgress" ("id", "userId", "stageNumber", "isUnlocked", "unlockedAt")
      VALUES
        (${sqlLit("ms-1-" + code)}, ${sqlLit(newUser.id)}, 1, TRUE, NOW()),
        (${sqlLit("ms-2-" + code)}, ${sqlLit(newUser.id)}, 2, FALSE, NULL),
        (${sqlLit("ms-3-" + code)}, ${sqlLit(newUser.id)}, 3, FALSE, NULL),
        (${sqlLit("ms-4-" + code)}, ${sqlLit(newUser.id)}, 4, FALSE, NULL),
        (${sqlLit("ms-5-" + code)}, ${sqlLit(newUser.id)}, 5, FALSE, NULL),
        (${sqlLit("ms-6-" + code)}, ${sqlLit(newUser.id)}, 6, FALSE, NULL),
        (${sqlLit("ms-7-" + code)}, ${sqlLit(newUser.id)}, 7, FALSE, NULL)
      ON CONFLICT ("userId", "stageNumber") DO NOTHING;

      INSERT INTO "AuthSession" ("id", "token", "userId", "expiresAt")
      VALUES (${sqlLit("ses-" + code)}, ${sqlLit(sessionToken)}, ${sqlLit(newUser.id)}, NOW() + INTERVAL '30 days')
      ON CONFLICT ("token") DO NOTHING;
    `);

    return { user: newUser, token: sessionToken };
  }

  loginUser(params: { identifier: string; countryCode?: string; password?: string }) {
    const raw = (params.identifier || "").trim().toLowerCase();
    if (!raw) throw new Error("Please enter your phone number or email address.");

    const dial = (params.countryCode || "+234").trim().toLowerCase();
    const withDial = `${dial}${raw.replace(/^0+/, "")}`;

    let matched: User | undefined;
    for (const u of this.users.values()) {
      const ws = this.getOrCreateUserWorkspace(u.id);
      if (
        u.email.toLowerCase() === raw ||
        u.email.toLowerCase() === withDial ||
        ws.phone.toLowerCase() === raw ||
        ws.phone.toLowerCase() === withDial ||
        u.name.toLowerCase() === raw ||
        u.name.toLowerCase() === withDial ||
        u.id.toLowerCase() === raw ||
        u.referralCode.toLowerCase() === raw
      ) {
        matched = u;
        break;
      }
    }

    if (!matched) {
      throw new Error(
        "Account not found. Please check your phone/email or Register a new account first."
      );
    }

    const ws = this.getOrCreateUserWorkspace(matched.id);
    if (ws.passwordHash && params.password) {
      if (!verifyPassword(params.password, ws.passwordHash)) {
        throw new Error("Incorrect password. Please try again.");
      }
    }

    const sessionToken = generateSessionToken();
    this.sessions.set(sessionToken, matched.id);

    pgExec(`
      INSERT INTO "AuthSession" ("id", "token", "userId", "expiresAt")
      VALUES (${sqlLit("ses-" + Date.now())}, ${sqlLit(sessionToken)}, ${sqlLit(matched.id)}, NOW() + INTERVAL '30 days')
      ON CONFLICT ("token") DO NOTHING;
    `);

    return { user: matched, token: sessionToken };
  }

  resolveUserFromToken(token?: string | null): User | null {
    if (!token) return null;
    const clean = token.replace(/^Bearer\s+/i, "").trim();
    const uid = this.sessions.get(clean);
    if (uid && this.users.has(uid)) {
      return this.users.get(uid)!;
    }
    return null;
  }

  rechargeWallet(params: { userId: string; amountCents: number; network?: string; txHash?: string }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    const cents = Math.max(0, Number(params.amountCents) || 0);
    if (cents <= 0) throw new Error("Enter a valid recharge amount");
    user.availableBalanceCents = Number(
      (user.availableBalanceCents + cents).toFixed(2)
    );
    const network = params.network || "USDT-TRC20";
    const txHash = params.txHash || `0x${Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join("")}`;
    const logId = `log-rcg-${Date.now()}`;
    const desc = `Wallet Recharge via ${network} credited (+$${(cents / 100).toFixed(2)} USDT • Tx: ${txHash.slice(0, 10)}...)`;
    this.ledgerLogs.unshift({
      id: logId,
      timestamp: new Date().toISOString(),
      category: "WALLET_RECHARGE",
      userId: user.id,
      userName: user.name,
      amountCents: cents,
      direction: "CREDIT",
      description: desc,
    });

    pgExec(`
      UPDATE "UserWallet"
      SET "usdtBalanceCents" = "usdtBalanceCents" + ${sqlLit(cents)}, "updatedAt" = NOW()
      WHERE "userId" = ${sqlLit(user.id)};

      INSERT INTO "LedgerLog" ("id", "category", "userId", "amountCents", "direction", "description")
      VALUES (${sqlLit(logId)}, 'WALLET_RECHARGE', ${sqlLit(user.id)}, ${sqlLit(cents)}, 'CREDIT', ${sqlLit(desc)})
      ON CONFLICT ("id") DO NOTHING;
    `);
    return { user, txHash, network, amountCents: cents };
  }

  executeFlashExchange(params: {
    userId: string;
    direction: "usdt_to_usdc" | "usdc_to_usdt" | "spw_to_usdt";
    amountCents: number;
  }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    const ws = this.getOrCreateUserWorkspace(user.id);
    const cents = Math.max(0, Math.round(Number(params.amountCents) || 0));
    if (cents <= 0) throw new Error("Enter a valid exchange amount");

    let fromAsset = "USDT";
    let toAsset = "USDC";
    let effectiveRate = 1.0;
    let fromAmountCents = cents;
    let toAmountCents = cents;

    if (params.direction === "usdt_to_usdc") {
      effectiveRate = marketRateEngine.usdcUsdt;
      if (user.availableBalanceCents < cents) {
        throw new Error("Insufficient USDT balance in Flexible Wallet.");
      }
      user.availableBalanceCents -= cents;
      toAmountCents = Math.round(cents / effectiveRate);
      ws.usdcBalanceCents += toAmountCents;
      marketRateEngine.recordMarketTick({
        pair: "USDC/USDT",
        priceDeltaPct: -0.0001,
        volumeUsd: cents / 100,
        eventNote: "Member Swap (USDT → USDC)",
      });
    } else if (params.direction === "spw_to_usdt") {
      fromAsset = "SPW";
      toAsset = "USDT";
      effectiveRate = marketRateEngine.spwUsd;
      const spwTokensNeeded = Math.max(1, Math.ceil(cents / 100));
      if (user.xpPoints < spwTokensNeeded) {
        throw new Error(`Insufficient SPW Points balance (Available: ${user.xpPoints} SPW).`);
      }
      user.xpPoints -= spwTokensNeeded;
      fromAmountCents = spwTokensNeeded * 100;
      toAmountCents = Math.round(spwTokensNeeded * effectiveRate * 100);
      user.availableBalanceCents += toAmountCents;
      marketRateEngine.recordMarketTick({
        pair: "SPW/USD",
        priceDeltaPct: 0.0004,
        volumeUsd: toAmountCents / 100,
        eventNote: "Member Liquidity Swap (SPW → USDT)",
      });
    } else {
      fromAsset = "USDC";
      toAsset = "USDT";
      effectiveRate = marketRateEngine.usdcUsdt;
      if (ws.usdcBalanceCents < cents) {
        throw new Error("Insufficient USDC balance in Flexible Wallet.");
      }
      ws.usdcBalanceCents -= cents;
      toAmountCents = Math.round(cents * effectiveRate);
      user.availableBalanceCents += toAmountCents;
      marketRateEngine.recordMarketTick({
        pair: "USDC/USDT",
        priceDeltaPct: 0.0001,
        volumeUsd: cents / 100,
        eventNote: "Member Swap (USDC → USDT)",
      });
    }

    const order = {
      id: `fx-${Date.now()}`,
      fromAsset,
      toAsset,
      fromAmountCents,
      toAmountCents,
      createdAt: new Date().toISOString(),
    };
    ws.flashExchanges.unshift(order);

    this.ledgerLogs.unshift({
      id: `log-${order.id}`,
      timestamp: order.createdAt,
      category: "P2P_TRANSFER",
      userId: user.id,
      userName: user.name,
      amountCents: toAmountCents,
      direction: "CREDIT",
      description: `Flash Exchange Swap (${fromAsset} → ${toAsset} @ ${effectiveRate.toFixed(4)}: $${(toAmountCents / 100).toFixed(2)})`,
    });

    pgExec(`
      UPDATE "UserWallet"
      SET "usdtBalanceCents" = ${sqlLit(user.availableBalanceCents)},
          "usdcBalanceCents" = ${sqlLit(ws.usdcBalanceCents)},
          "spwPoints" = ${sqlLit(user.xpPoints)},
          "updatedAt" = NOW()
      WHERE "userId" = ${sqlLit(user.id)};

      INSERT INTO "FlashExchangeOrder" ("id", "userId", "fromAsset", "toAsset", "fromAmountCents", "toAmountCents")
      VALUES (${sqlLit(order.id)}, ${sqlLit(user.id)}, ${sqlLit(fromAsset)}, ${sqlLit(toAsset)}, ${sqlLit(fromAmountCents)}, ${sqlLit(toAmountCents)})
      ON CONFLICT ("id") DO NOTHING;
    `);
    return order;
  }

  allocateSavingsJar(params: {
    userId: string;
    direction: "DEPOSIT_TO_JAR" | "REDEEM_TO_FLEXIBLE";
    amountCents: number;
  }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    const ws = this.getOrCreateUserWorkspace(user.id);
    const cents = Math.max(0, Math.round(Number(params.amountCents) || 0));
    if (cents <= 0) throw new Error("Enter a valid Savings Jar amount");

    if (params.direction === "REDEEM_TO_FLEXIBLE") {
      if (ws.savingsJarCents < cents) {
        throw new Error("Insufficient Savings Jar balance.");
      }
      ws.savingsJarCents -= cents;
      user.availableBalanceCents += cents;
    } else {
      if (user.availableBalanceCents < cents) {
        throw new Error("Insufficient Flexible Wallet USDT balance.");
      }
      user.availableBalanceCents -= cents;
      ws.savingsJarCents += cents;
    }

    const txId = `sav-${Date.now()}`;
    pgExec(`
      UPDATE "UserWallet"
      SET "usdtBalanceCents" = ${sqlLit(user.availableBalanceCents)},
          "savingsJarCents" = ${sqlLit(ws.savingsJarCents)},
          "updatedAt" = NOW()
      WHERE "userId" = ${sqlLit(user.id)};

      INSERT INTO "SavingsJarTransaction" ("id", "userId", "direction", "amountCents")
      VALUES (${sqlLit(txId)}, ${sqlLit(user.id)}, ${sqlLit(params.direction)}, ${sqlLit(cents)})
      ON CONFLICT ("id") DO NOTHING;
    `);
    return { usdtBalanceCents: user.availableBalanceCents, savingsJarCents: ws.savingsJarCents };
  }

  saveWithdrawalMethod(params: {
    userId: string;
    channel: string;
    label: string;
    destination: string;
  }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    const ws = this.getOrCreateUserWorkspace(user.id);
    const item = {
      id: `wm-${Date.now()}`,
      channel: params.channel || "CRYPTO_USDT_USDC",
      label: (params.label || "Primary USDT Wallet").trim(),
      destination: (params.destination || "").trim(),
    };
    if (!item.destination) throw new Error("Destination wallet/account is required.");
    ws.withdrawalMethods.unshift(item);

    pgExec(`
      INSERT INTO "WithdrawalMethod" ("id", "userId", "channel", "label", "destination")
      VALUES (${sqlLit(item.id)}, ${sqlLit(user.id)}, 'CRYPTO_USDT_USDC', ${sqlLit(item.label)}, ${sqlLit(item.destination)})
      ON CONFLICT ("id") DO NOTHING;
    `);
    return item;
  }

  toggleArticleLike(params: { userId: string; articleId: string }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    const ws = this.getOrCreateUserWorkspace(user.id);
    const article = this.articles.find((a) => a.id === params.articleId);
    if (!article) throw new Error("Article not found");

    const idx = ws.likedArticleIds.indexOf(article.id);
    let liked = false;
    if (idx === -1) {
      ws.likedArticleIds.push(article.id);
      article.likes += 1;
      article.views += 1;
      liked = true;
      pgExec(`
        INSERT INTO "ArticleLike" ("id", "articleId", "userId")
        VALUES (${sqlLit(`like-${user.id}-${article.id}`)}, ${sqlLit(article.id)}, ${sqlLit(user.id)})
        ON CONFLICT ("articleId", "userId") DO NOTHING;
        UPDATE "Article" SET "likesCount" = "likesCount" + 1, "viewsCount" = "viewsCount" + 1 WHERE "id" = ${sqlLit(article.id)};
      `);
    } else {
      ws.likedArticleIds.splice(idx, 1);
      article.likes = Math.max(0, article.likes - 1);
      pgExec(`
        DELETE FROM "ArticleLike" WHERE "articleId" = ${sqlLit(article.id)} AND "userId" = ${sqlLit(user.id)};
        UPDATE "Article" SET "likesCount" = GREATEST(0, "likesCount" - 1) WHERE "id" = ${sqlLit(article.id)};
      `);
    }
    return { liked, article };
  }

  commentOnArticle(params: { userId: string; articleId: string; text: string }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    const ws = this.getOrCreateUserWorkspace(user.id);
    const article = this.articles.find((a) => a.id === params.articleId);
    if (!article) throw new Error("Article not found");
    const cleanText = (params.text || "").trim();
    if (!cleanText) throw new Error("Comment text is required.");

    article.comments += 1;
    article.views += 1;
    const comment = {
      id: `cmt-${Date.now()}`,
      articleId: article.id,
      articleTitle: article.title,
      text: cleanText,
      createdAt: new Date().toISOString(),
    };
    ws.comments.unshift(comment);

    pgExec(`
      INSERT INTO "ArticleComment" ("id", "articleId", "userId", "text")
      VALUES (${sqlLit(comment.id)}, ${sqlLit(article.id)}, ${sqlLit(user.id)}, ${sqlLit(cleanText)})
      ON CONFLICT ("id") DO NOTHING;
      UPDATE "Article" SET "commentsCount" = "commentsCount" + 1, "viewsCount" = "viewsCount" + 1 WHERE "id" = ${sqlLit(article.id)};
    `);
    return comment;
  }

  publishCreatorArticle(params: {
    userId: string;
    category: string;
    title: string;
    excerpt: string;
  }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    const art = {
      id: `art-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      category: params.category || "Economy",
      title: (params.title || "").trim(),
      excerpt: (params.excerpt || "").trim(),
      views: 1,
      likes: 0,
      comments: 0,
      date: "Just now",
    };
    if (!art.title || !art.excerpt) {
      throw new Error("Article title and summary are required.");
    }
    this.articles.unshift(art);

    pgExec(`
      INSERT INTO "Article" ("id", "authorId", "authorName", "category", "title", "excerpt", "viewsCount")
      VALUES (${sqlLit(art.id)}, ${sqlLit(user.id)}, ${sqlLit(user.name)}, ${sqlLit(art.category)}, ${sqlLit(art.title)}, ${sqlLit(art.excerpt)}, 1)
      ON CONFLICT ("id") DO NOTHING;
    `);
    return art;
  }

  completeUserTask(params: { userId: string; taskId: string }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    const ws = this.getOrCreateUserWorkspace(user.id);
    const task = this.taskDefinitions.find((t) => t.id === params.taskId);
    if (!task) throw new Error("Task not found");

    if (!ws.completedTaskIds.includes(task.id)) {
      ws.completedTaskIds.push(task.id);
      user.xpPoints += task.spwReward;
      pgExec(`
        INSERT INTO "UserTaskCompletion" ("id", "userId", "taskId")
        VALUES (${sqlLit(`ut-${user.id}-${task.id}`)}, ${sqlLit(user.id)}, ${sqlLit(task.id)})
        ON CONFLICT ("userId", "taskId") DO NOTHING;
        UPDATE "UserWallet" SET "spwPoints" = "spwPoints" + ${sqlLit(task.spwReward)} WHERE "userId" = ${sqlLit(user.id)};
      `);
    }
    return { taskId: task.id, spwPoints: user.xpPoints };
  }

  submitSupportTicket(params: { userId: string; subject: string; message: string }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    const ws = this.getOrCreateUserWorkspace(user.id);
    const ticket = {
      id: `tkt-${Date.now()}`,
      subject: (params.subject || "").trim(),
      message: (params.message || "").trim(),
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };
    if (!ticket.subject || !ticket.message) {
      throw new Error("Ticket subject and message are required.");
    }
    ws.supportTickets.unshift(ticket);

    pgExec(`
      INSERT INTO "SupportTicket" ("id", "userId", "subject", "message", "status")
      VALUES (${sqlLit(ticket.id)}, ${sqlLit(user.id)}, ${sqlLit(ticket.subject)}, ${sqlLit(ticket.message)}, 'OPEN')
      ON CONFLICT ("id") DO NOTHING;
    `);
    return ticket;
  }

  incrementArticleView(params: { articleId: string }) {
    const article = this.articles.find((a) => a.id === params.articleId);
    if (!article) return null;
    article.views += 1;
    pgExec(`UPDATE "Article" SET "viewsCount" = "viewsCount" + 1 WHERE "id" = ${sqlLit(article.id)};`);
    return article;
  }

  toggleArticleFavorite(params: { userId: string; articleId: string }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    const ws = this.getOrCreateUserWorkspace(user.id);
    const article = this.articles.find((a) => a.id === params.articleId);
    if (!article) throw new Error("Article not found");

    const idx = ws.favoriteArticleIds.indexOf(article.id);
    let favorited = false;
    if (idx === -1) {
      ws.favoriteArticleIds.push(article.id);
      article.favorites = (article.favorites || 0) + 1;
      article.views += 1;
      favorited = true;
    } else {
      ws.favoriteArticleIds.splice(idx, 1);
      article.favorites = Math.max(0, (article.favorites || 1) - 1);
    }
    return { favorited, article };
  }

  unlockNextMilestone(params: { userId: string }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    const ws = this.getOrCreateUserWorkspace(user.id);
    const nextStage = ws.milestones.find((m) => !m.isUnlocked);
    if (!nextStage) {
      throw new Error("All 7 Milestone stages are already unlocked!");
    }
    nextStage.isUnlocked = true;
    user.xpPoints += 20;
    this.ledgerLogs.unshift({
      id: `log-ms-${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: "PACK_PURCHASE",
      userId: user.id,
      userName: user.name,
      amountCents: 2000,
      direction: "CREDIT",
      description: `Milestone Stage ${nextStage.stageNumber} Unlocked (+20 SPW Points credited)`,
    });
    pgExec(`
      INSERT INTO "UserMilestoneProgress" ("id", "userId", "stageNumber", "isUnlocked", "unlockedAt")
      VALUES (${sqlLit(`ms-${nextStage.stageNumber}-${user.id}`)}, ${sqlLit(user.id)}, ${sqlLit(nextStage.stageNumber)}, TRUE, NOW())
      ON CONFLICT ("userId", "stageNumber") DO UPDATE SET "isUnlocked" = TRUE, "unlockedAt" = NOW();

      UPDATE "UserWallet" SET "spwPoints" = ${sqlLit(user.xpPoints)} WHERE "userId" = ${sqlLit(user.id)};
    `);
    return { stageNumber: nextStage.stageNumber, spwPoints: user.xpPoints };
  }

  updateUserProfile(params: {
    userId: string;
    name?: string;
    preferredCurrency?: CurrencyCode;
  }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    if (params.name && params.name.trim()) {
      user.name = params.name.trim();
    }
    if (params.preferredCurrency) {
      user.preferredCurrency = params.preferredCurrency;
    }
    pgExec(`
      UPDATE "User"
      SET "name" = ${sqlLit(user.name)},
          "preferredCurrency" = ${sqlLit(user.preferredCurrency)},
          "updatedAt" = NOW()
      WHERE "id" = ${sqlLit(user.id)};
    `);
    return user;
  }

  claimSavingsYield(params: { userId: string }) {
    const user = this.users.get(params.userId);
    if (!user) throw new Error("User not found");
    const ws = this.getOrCreateUserWorkspace(user.id);
    if (ws.savingsJarCents <= 0) {
      throw new Error("Deposit USDT into your Savings Jar first to claim daily yield.");
    }
    const yieldCents = Math.max(50, Math.round(ws.savingsJarCents * 0.015));
    ws.savingsJarCents += yieldCents;
    const txId = `sav-yld-${Date.now()}`;
    this.ledgerLogs.unshift({
      id: `log-${txId}`,
      timestamp: new Date().toISOString(),
      category: "DAILY_DIVIDEND_PAYOUT",
      userId: user.id,
      userName: user.name,
      amountCents: yieldCents,
      direction: "CREDIT",
      description: `Savings Jar Daily Yield Credited (+$${(yieldCents / 100).toFixed(2)} USDT)`,
    });
    pgExec(`
      UPDATE "UserWallet"
      SET "savingsJarCents" = ${sqlLit(ws.savingsJarCents)}, "updatedAt" = NOW()
      WHERE "userId" = ${sqlLit(user.id)};
    `);
    return { yieldCents, savingsJarCents: ws.savingsJarCents };
  }

  async syncRates() {
    return await marketRateEngine.syncLiveExternalRates();
  }
}

export const globalStore = new PlatformStore();
