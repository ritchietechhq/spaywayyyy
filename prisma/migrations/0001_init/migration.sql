-- Spayway Prisma PostgreSQL Schema (Local Supabase 127.0.0.1:54322)

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'FINANCE_ADMIN', 'CONTENT_MANAGER', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "CurrencyCode" AS ENUM ('USD', 'NGN', 'GHS', 'XOF', 'GBP', 'EUR', 'USDT', 'USDC');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ContractPhaseStatus" AS ENUM ('PHASE_1_CAPITAL_RECOVERY', 'PHASE_2_DAILY_PROFIT_60', 'POST_60_ROYALTY_90', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "InstallmentScheduleType" AS ENUM ('DAILY_60', 'DAILY_90_EXTENDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "WithdrawalChannel" AS ENUM ('BANK_OR_MOBILE_MONEY', 'CRYPTO_USDT_USDC', 'P2P_MEMBER_TRANSFER', 'INTERNAL_REPURCHASE_0_FEE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "LedgerDirection" AS ENUM ('CREDIT', 'DEBIT', 'TREASURY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE,
  "phone" TEXT UNIQUE,
  "countryCode" TEXT NOT NULL DEFAULT '+234',
  "country" TEXT NOT NULL DEFAULT 'Nigeria',
  "passwordHash" TEXT NOT NULL,
  "preferredCurrency" "CurrencyCode" NOT NULL DEFAULT 'USDT',
  "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
  "referralCode" TEXT NOT NULL UNIQUE,
  "usedInvitationCode" TEXT NOT NULL,
  "referredById" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "materializedPath" TEXT NOT NULL,
  "networkLevel" INTEGER NOT NULL DEFAULT 1,
  "directReferralsCount" INTEGER NOT NULL DEFAULT 0,
  "totalTeamMembersCount" INTEGER NOT NULL DEFAULT 0,
  "personalVolumeCents" INTEGER NOT NULL DEFAULT 0,
  "teamVolumeCents" INTEGER NOT NULL DEFAULT 0,
  "kycVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuthSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "token" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AuthSession_userId_idx" ON "AuthSession"("userId");

CREATE TABLE IF NOT EXISTS "UserWallet" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "usdtBalanceCents" INTEGER NOT NULL DEFAULT 0,
  "usdcBalanceCents" INTEGER NOT NULL DEFAULT 0,
  "spwPoints" INTEGER NOT NULL DEFAULT 0,
  "savingsJarCents" INTEGER NOT NULL DEFAULT 0,
  "escrowCapitalCents" INTEGER NOT NULL DEFAULT 0,
  "totalCapitalReturnedCents" INTEGER NOT NULL DEFAULT 0,
  "totalCommissionsEarnedCents" INTEGER NOT NULL DEFAULT 0,
  "totalRoyaltiesEarnedCents" INTEGER NOT NULL DEFAULT 0,
  "adCreditsCents" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "WithdrawalMethod" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "channel" "WithdrawalChannel" NOT NULL,
  "label" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "WithdrawalMethod_userId_idx" ON "WithdrawalMethod"("userId");

CREATE TABLE IF NOT EXISTS "FlashExchangeOrder" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fromAsset" TEXT NOT NULL,
  "toAsset" TEXT NOT NULL,
  "fromAmountCents" INTEGER NOT NULL,
  "toAmountCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "FlashExchangeOrder_userId_idx" ON "FlashExchangeOrder"("userId");

CREATE TABLE IF NOT EXISTS "SavingsJarTransaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "direction" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SavingsJarTransaction_userId_idx" ON "SavingsJarTransaction"("userId");

CREATE TABLE IF NOT EXISTS "TradePack" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "tierBadge" TEXT NOT NULL,
  "isHeroMagnet" BOOLEAN NOT NULL DEFAULT false,
  "popularityTag" TEXT,
  "description" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "baseDailyPayoutCents" INTEGER NOT NULL,
  "boosterDailyPayoutCents" INTEGER NOT NULL DEFAULT 0,
  "capitalReturnDays" INTEGER NOT NULL,
  "activeDailyEarningDays" INTEGER NOT NULL DEFAULT 60,
  "totalLifecycleDays" INTEGER NOT NULL DEFAULT 90,
  "daysToHit15DollarWithdrawal" DOUBLE PRECISION NOT NULL,
  "defaultSchedule" "InstallmentScheduleType" NOT NULL DEFAULT 'DAILY_60',
  "allowUserScheduleChoice" BOOLEAN NOT NULL DEFAULT true,
  "royaltyUnits" INTEGER NOT NULL DEFAULT 0,
  "freeAdCreditsCents" INTEGER NOT NULL DEFAULT 0,
  "xpReward" INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS "InstallmentContract" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "packId" TEXT NOT NULL REFERENCES "TradePack"("id"),
  "sourceChannel" TEXT NOT NULL DEFAULT 'ONLINE_WALLET',
  "principalCents" INTEGER NOT NULL,
  "dailyPayoutCents" INTEGER NOT NULL,
  "boosterApplied" BOOLEAN NOT NULL DEFAULT false,
  "returnedCapitalCents" INTEGER NOT NULL DEFAULT 0,
  "dailyProfitEarnedCents" INTEGER NOT NULL DEFAULT 0,
  "totalDailyCreditedCents" INTEGER NOT NULL DEFAULT 0,
  "royaltyEarningsCents" INTEGER NOT NULL DEFAULT 0,
  "royaltyUnits" INTEGER NOT NULL DEFAULT 0,
  "scheduleType" "InstallmentScheduleType" NOT NULL DEFAULT 'DAILY_60',
  "capitalReturnTargetDays" INTEGER NOT NULL,
  "totalInstallments" INTEGER NOT NULL DEFAULT 60,
  "paidInstallments" INTEGER NOT NULL DEFAULT 0,
  "currentDayElapsed" INTEGER NOT NULL DEFAULT 0,
  "totalLifecycleDays" INTEGER NOT NULL DEFAULT 90,
  "phaseStatus" "ContractPhaseStatus" NOT NULL DEFAULT 'PHASE_1_CAPITAL_RECOVERY',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedCapitalRecoveryAt" TIMESTAMP(3),
  "completed60DayAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "InstallmentContract_user_pack_active_idx" ON "InstallmentContract"("userId", "packId", "isActive");

CREATE TABLE IF NOT EXISTS "InstallmentItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contractId" TEXT NOT NULL REFERENCES "InstallmentContract"("id") ON DELETE CASCADE,
  "installmentNumber" INTEGER NOT NULL,
  "dueDay" INTEGER NOT NULL,
  "percentage" DOUBLE PRECISION NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP(3),
  UNIQUE("contractId", "installmentNumber")
);

CREATE TABLE IF NOT EXISTS "Article" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "authorName" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "viewsCount" INTEGER NOT NULL DEFAULT 0,
  "likesCount" INTEGER NOT NULL DEFAULT 0,
  "commentsCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ArticleLike" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "articleId" TEXT NOT NULL REFERENCES "Article"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("articleId", "userId")
);
CREATE INDEX IF NOT EXISTS "ArticleLike_userId_idx" ON "ArticleLike"("userId");

CREATE TABLE IF NOT EXISTS "ArticleComment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "articleId" TEXT NOT NULL REFERENCES "Article"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ArticleComment_userId_idx" ON "ArticleComment"("userId");
CREATE INDEX IF NOT EXISTS "ArticleComment_articleId_idx" ON "ArticleComment"("articleId");

CREATE TABLE IF NOT EXISTS "TaskDefinition" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "rewardLabel" TEXT NOT NULL,
  "spwReward" INTEGER NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS "UserTaskCompletion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "taskId" TEXT NOT NULL REFERENCES "TaskDefinition"("id") ON DELETE CASCADE,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "taskId")
);

CREATE TABLE IF NOT EXISTS "UserMilestoneProgress" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "stageNumber" INTEGER NOT NULL,
  "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
  "unlockedAt" TIMESTAMP(3),
  UNIQUE("userId", "stageNumber")
);

CREATE TABLE IF NOT EXISTS "SupportFaq" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'General',
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "reply" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx" ON "SupportTicket"("userId");

CREATE TABLE IF NOT EXISTS "WithdrawalOrTransferRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "channel" "WithdrawalChannel" NOT NULL,
  "grossAmountCents" INTEGER NOT NULL,
  "platformFeeCents" INTEGER NOT NULL DEFAULT 0,
  "netAmountCents" INTEGER NOT NULL,
  "currency" "CurrencyCode" NOT NULL DEFAULT 'USDT',
  "destinationDetails" TEXT NOT NULL,
  "recipientUserId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "status" TEXT NOT NULL DEFAULT 'APPROVED_PAID',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "WithdrawalOrTransferRecord_userId_idx" ON "WithdrawalOrTransferRecord"("userId");

CREATE TABLE IF NOT EXISTS "LedgerLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "category" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "amountCents" INTEGER NOT NULL,
  "direction" "LedgerDirection" NOT NULL,
  "description" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "LedgerLog_userId_timestamp_idx" ON "LedgerLog"("userId", "timestamp");

CREATE TABLE IF NOT EXISTS "Course" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL DEFAULT 0,
  "isStandalonePaid" BOOLEAN NOT NULL DEFAULT false,
  "xpReward" INTEGER NOT NULL DEFAULT 100,
  "instructor" TEXT NOT NULL,
  "description" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "CourseLesson" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "format" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "UserCourseEnrollment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "courseId" TEXT NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  UNIQUE("userId", "courseId")
);

CREATE TABLE IF NOT EXISTS "OfflineSaleRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "buyerUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "packId" TEXT NOT NULL REFERENCES "TradePack"("id"),
  "amountCents" INTEGER NOT NULL,
  "localCurrency" "CurrencyCode" NOT NULL,
  "localAmountFormatted" TEXT NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "receiptReference" TEXT NOT NULL,
  "fieldAgentNote" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BusinessDividendDeclaration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "periodType" TEXT NOT NULL,
  "grossBusinessProfitCents" INTEGER NOT NULL,
  "declaredMemberPoolCents" INTEGER NOT NULL,
  "companyRetainedSpreadCents" INTEGER NOT NULL,
  "eligibleContractsCount" INTEGER NOT NULL,
  "totalWeightedUnits" INTEGER NOT NULL,
  "declaredByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AdCampaign" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "promoterUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "targetRegion" TEXT NOT NULL,
  "ctaUrl" TEXT NOT NULL,
  "budgetCents" INTEGER NOT NULL,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "FounderTreasury" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
  "withdrawalAndP2PFeesCents" INTEGER NOT NULL DEFAULT 0,
  "sponsoredAdsRevenueCents" INTEGER NOT NULL DEFAULT 0,
  "standaloneCourseRevenueCents" INTEGER NOT NULL DEFAULT 0,
  "retainedBusinessSpreadCents" INTEGER NOT NULL DEFAULT 0,
  "totalFounderRevenueCents" INTEGER NOT NULL DEFAULT 0,
  "activeWorkingCapitalDeployedCents" INTEGER NOT NULL DEFAULT 0,
  "totalCapitalReturnedToMembersCents" INTEGER NOT NULL DEFAULT 0,
  "totalRoyaltiesPaidToMembersCents" INTEGER NOT NULL DEFAULT 0
);

-- Seed Root Founder Node (Master Invitation Code: SPAYWAY and 1000001)
INSERT INTO "User" ("id", "name", "email", "phone", "countryCode", "country", "passwordHash", "preferredCurrency", "role", "referralCode", "usedInvitationCode", "referredById", "materializedPath", "networkLevel")
VALUES
  ('u-founder', 'Spayway Chapter Root', 'founder@spayway.app', '+2348000000001', '+234', 'Nigeria', 'root-seeded', 'USDT', 'SUPER_ADMIN', 'SPAYWAY', 'ROOT', NULL, '/u-founder/', 1),
  ('u-master-code', 'Spayway Master Chapter', 'master@spayway.app', '+2348000000002', '+234', 'Nigeria', 'root-seeded', 'USDT', 'SUPER_ADMIN', '1000001', 'SPAYWAY', 'u-founder', '/u-founder/u-master-code/', 1)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "UserWallet" ("id", "userId")
VALUES
  ('w-founder', 'u-founder'),
  ('w-master-code', 'u-master-code')
ON CONFLICT ("userId") DO NOTHING;

-- Seed 4 Official TradePacks ($30, $50, $120, $350)
INSERT INTO "TradePack" ("id", "name", "tierBadge", "isHeroMagnet", "popularityTag", "description", "priceCents", "baseDailyPayoutCents", "boosterDailyPayoutCents", "capitalReturnDays", "activeDailyEarningDays", "totalLifecycleDays", "daysToHit15DollarWithdrawal", "defaultSchedule", "allowUserScheduleChoice", "royaltyUnits", "freeAdCreditsCents", "xpReward")
VALUES
  ('pack-30', 'Starter Registration Pack ($30)', 'LEVEL 1 • $30 STARTER', false, 'Accessible Campus Entry', 'Entry-level $30 trade & skill pack with $1.25/day daily dividend across 60 days.', 3000, 125, 0, 24, 60, 60, 12, 'DAILY_60', false, 0, 0, 100),
  ('pack-50', 'Growth Registration Pack ($50)', 'LEVEL 2 • $50 GROWTH', false, 'Fast 7.5-Day Cashout', 'Balanced $50 pack delivering $2.00/day across 60 active days.', 5000, 200, 0, 25, 60, 60, 7.5, 'DAILY_60', false, 0, 500, 200),
  ('pack-120', 'Pro Value Magnet Pack ($120)', 'LEVEL 3 • $120 PRO MAGNET', true, 'MOST POPULAR', 'Flagship $120 pack with $4.10-$4.80/day across 60 days + Days 61-90 Extended Business Royalty Pool.', 12000, 410, 70, 25, 60, 90, 3.1, 'DAILY_90_EXTENDED', true, 15, 1500, 450),
  ('pack-350', 'Executive Partner Pack ($350)', 'LEVEL 4 • $350 EXECUTIVE', false, 'Highest Daily Cashflow', 'Executive $350 tier paying $12.50/day across 60 days + 3x weight in Days 61-90 Royalty Pool.', 35000, 1250, 0, 28, 60, 90, 1.2, 'DAILY_90_EXTENDED', true, 50, 4000, 1000)
ON CONFLICT ("id") DO NOTHING;

-- Seed TaskDefinitions
INSERT INTO "TaskDefinition" ("id", "title", "rewardLabel", "spwReward")
VALUES
  ('t1', 'Verify Member Account Profile', 'Verified Badge + 10 SPW', 10),
  ('t2', 'Read 1 Community Dispatch in Discover', '+15 SPW Points', 15),
  ('t3', 'Share Invitation Code with Regional Chapter', '+25 SPW Points', 25)
ON CONFLICT ("id") DO NOTHING;

-- Seed Initial Community Articles (0 views/likes/comments)
INSERT INTO "Article" ("id", "authorId", "authorName", "category", "title", "excerpt", "viewsCount", "likesCount", "commentsCount")
VALUES
  ('art-1', 'u-founder', 'Spayway Research', 'Economy', 'Cross-Border Trade Settlement & Regional Liquidity Corridors', 'How verified merchant chapters streamline regional trade settlement across West Africa.', 0, 0, 0),
  ('art-2', 'u-founder', 'Protocol Desk', 'Technology', 'Isolated Pack Accounting: Independent Contract Timelines', 'Why isolating each membership contract ensures transparent ledger verification.', 0, 0, 0),
  ('art-3', 'u-founder', 'Academy Team', 'Finance', 'Using Flexible Wallet, Points Wallet, and Savings Jar Effectively', 'Best practices for managing liquid USDT, Points credits, and Savings Jar allocations.', 0, 0, 0),
  ('art-4', 'u-founder', 'Community Hub', 'Society', 'Building High-Trust Offline Community Chapters & Trade Hubs', 'Field playbook for organizing regional member meetups and merchant onboarding.', 0, 0, 0)
ON CONFLICT ("id") DO NOTHING;

-- Seed Support FAQs
INSERT INTO "SupportFaq" ("id", "question", "answer", "category", "sortOrder")
VALUES
  ('faq-1', 'How do I fund or recharge my wallet?', 'Click Recharge in Personal Center to add USDT to your Flexible Wallet.', 'Wallet', 1),
  ('faq-2', 'What is the minimum withdrawal?', 'Minimum withdrawal is $15 USDT with a 3% administrative gateway fee.', 'Withdrawals', 2),
  ('faq-3', 'How do P2P transfers work?', 'Send liquid USDT directly to any verified member ID or referral code with 0% internal fee.', 'Transfers', 3)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "FounderTreasury" ("id") VALUES ('singleton') ON CONFLICT ("id") DO NOTHING;
