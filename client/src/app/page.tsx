"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  Wallet,
  BookOpen,
  ShoppingBag,
  Megaphone,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Award,
  FileSpreadsheet,
  Send,
  Sparkles,
  DollarSign,
  Layers,
  Globe,
  Building2,
} from "lucide-react";

type CurrencyCode = "USD" | "NGN" | "GHS" | "XOF" | "GBP" | "EUR" | "USDT";
type InstallmentScheduleType = "TWICE_WEEKLY_8" | "WEEKLY_4";

interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  rateFromUsd: number;
  region: string;
}

interface RankDefinition {
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  minDirectReferrals: number;
  minTeamMembers: number;
  minCompletedCourses: number;
  minTeamVolumeCents: number;
  gen1CommissionPct: number;
  gen2CommissionPct: number;
  gen3CommissionPct: number;
  gen4CommissionPct: number;
  gen5CommissionPct: number;
  royaltyPoolMultiplier: number;
  plainEnglishSummary: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  country: string;
  preferredCurrency: CurrencyCode;
  role: "SUPER_ADMIN" | "FINANCE_ADMIN" | "CONTENT_MANAGER" | "MEMBER";
  referralCode: string;
  referredById: string | null;
  materializedPath: string;
  networkLevel: 1 | 2 | 3 | 4 | 5;
  xpPoints: number;
  directReferralsCount: number;
  totalTeamMembersCount: number;
  personalVolumeCents: number;
  teamVolumeCents: number;
  completedCourseIds: string[];
  enrolledCourseIds: string[];
  availableBalanceCents: number;
  escrowCapitalCents: number;
  totalCapitalReturnedCents: number;
  totalCommissionsEarnedCents: number;
  totalRoyaltiesEarnedCents: number;
  adCreditsCents: number;
}

interface TradePack {
  id: string;
  name: string;
  tierBadge: string;
  description: string;
  priceCents: number;
  defaultSchedule: InstallmentScheduleType;
  allowUserScheduleChoice: boolean;
  royaltyUnits: number;
  bundledCourseIds: string[];
  physicalOrDigitalItems: string[];
  xpReward: number;
}

interface InstallmentItem {
  installmentNumber: number;
  dueDay: number;
  percentage: number;
  amountCents: number;
  status: "PENDING" | "PAID";
  paidAt?: string;
}

interface InstallmentContract {
  id: string;
  userId: string;
  userName: string;
  packId: string;
  packName: string;
  sourceChannel: string;
  principalCents: number;
  returnedCapitalCents: number;
  royaltyEarningsCents: number;
  royaltyUnits: number;
  scheduleType: InstallmentScheduleType;
  totalInstallments: 4 | 8;
  paidInstallments: number;
  currentDayElapsed: number;
  phaseStatus: "PHASE_1_CAPITAL_RECOVERY" | "POST_28_ROYALTY_ACTIVE" | "COMPLETED";
  installments: InstallmentItem[];
  createdAt: string;
}

interface OfflineSaleRecord {
  id: string;
  buyerUserId: string;
  buyerName: string;
  packId: string;
  packName: string;
  amountCents: number;
  localCurrency: CurrencyCode;
  localAmountFormatted: string;
  schedulePreference: InstallmentScheduleType;
  paymentMethod: string;
  receiptReference: string;
  fieldAgentNote: string;
  submittedByRole: string;
  status: "PENDING_VERIFICATION" | "APPROVED" | "REJECTED";
  createdAt: string;
}

interface BusinessDividendDeclaration {
  id: string;
  title: string;
  periodType: "WEEKLY" | "TWICE_WEEKLY";
  grossBusinessProfitCents: number;
  declaredMemberPoolCents: number;
  companyRetainedSpreadCents: number;
  eligibleContractsCount: number;
  totalWeightedUnits: number;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
  category: string;
  priceCents: number;
  isStandalonePaid: boolean;
  xpReward: number;
  instructor: string;
  description: string;
  lessons: Array<{
    id: string;
    title: string;
    durationMinutes: number;
    format: string;
  }>;
}

interface AdCampaign {
  id: string;
  promoterUserId: string;
  promoterName: string;
  title: string;
  category: string;
  targetRegion: string;
  ctaUrl: string;
  budgetCents: number;
  impressions: number;
  clicks: number;
  status: string;
}

interface LedgerLog {
  id: string;
  timestamp: string;
  category: string;
  userId: string;
  userName: string;
  amountCents: number;
  direction: "CREDIT" | "DEBIT" | "TREASURY";
  description: string;
}

interface PlatformState {
  activeUser: User;
  users: User[];
  ranks: RankDefinition[];
  currencies: CurrencyConfig[];
  packs: TradePack[];
  contracts: InstallmentContract[];
  offlineSales: OfflineSaleRecord[];
  dividendDeclarations: BusinessDividendDeclaration[];
  courses: Course[];
  adCampaigns: AdCampaign[];
  ledgerLogs: LedgerLog[];
  treasury: {
    withdrawalAndP2PFeesCents: number;
    sponsoredAdsRevenueCents: number;
    standaloneCourseRevenueCents: number;
    retainedBusinessSpreadCents: number;
    totalFounderRevenueCents: number;
    activeWorkingCapitalDeployedCents: number;
    totalCapitalReturnedToMembersCents: number;
    totalRoyaltiesPaidToMembersCents: number;
  };
}

export default function PlatformPortalPage() {
  const [state, setState] = useState<PlatformState | null>(null);
  const [activeUserId, setActiveUserId] = useState<string>("u-ada");
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("NGN");
  const [activeTab, setActiveTab] = useState<
    | "INSTALLMENTS"
    | "OFFLINE_SALES"
    | "NETWORK_TREE"
    | "WALLET_P2P"
    | "ACADEMY"
    | "ADMIN_TREASURY"
  >("INSTALLMENTS");
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Pack purchase schedule preferences per pack
  const [packSchedules, setPackSchedules] = useState<
    Record<string, InstallmentScheduleType>
  >({
    "pack-student-750": "TWICE_WEEKLY_8",
    "pack-campus-2500": "TWICE_WEEKLY_8",
    "pack-merchant-10000": "WEEKLY_4",
    "pack-executive-50000": "TWICE_WEEKLY_8",
  });

  // Offline Sale Form State
  const [offlineBuyerId, setOfflineBuyerId] = useState<string>("u-ada");
  const [offlinePackId, setOfflinePackId] = useState<string>("pack-student-750");
  const [offlineSchedule, setOfflineSchedule] =
    useState<InstallmentScheduleType>("TWICE_WEEKLY_8");
  const [offlineMethod, setOfflineMethod] = useState<string>("POS_TERMINAL");
  const [offlineReceipt, setOfflineReceipt] = useState<string>("POS-LAG-77419");
  const [offlineNote, setOfflineNote] = useState<string>(
    "Paid offline in cash/POS at Campus Hub; physical study guide delivered."
  );

  // New Referral Form State
  const [refName, setRefName] = useState<string>("Zainab Musa (ABU Zaria)");
  const [refCountry, setRefCountry] = useState<string>("Nigeria");
  const [refPackId, setRefPackId] = useState<string>("pack-student-750");
  const [refSchedule, setRefSchedule] =
    useState<InstallmentScheduleType>("TWICE_WEEKLY_8");

  // Wallet Outflow Form State
  const [outflowChannel, setOutflowChannel] = useState<
    "BANK_OR_MOBILE_MONEY" | "CRYPTO_USDT_USDC" | "P2P_MEMBER_TRANSFER"
  >("BANK_OR_MOBILE_MONEY");
  const [outflowUsdAmount, setOutflowUsdAmount] = useState<string>("7.50");
  const [outflowDestination, setOutflowDestination] = useState<string>(
    "OPay / GTBank 0148899201 — Instant West Africa Payout"
  );
  const [p2pRecipientId, setP2pRecipientId] = useState<string>("u-chidi");

  // Promoter Ad Campaign Form State
  const [adTitle, setAdTitle] = useState<string>(
    "Join Our Campus Co-op Network with $7.50 (₦12,000) — Twice-Weekly Payouts!"
  );
  const [adRegion, setAdRegion] = useState<string>(
    "Nigeria, Ghana & Francophone West Africa"
  );
  const [adBudgetUsd, setAdBudgetUsd] = useState<string>("10");

  // Super Admin Dividend Pool Form State
  const [divTitle, setDivTitle] = useState<string>(
    "Weekly West Africa Offline Merch & Book Trading Profit Pool"
  );
  const [divPeriod, setDivPeriod] = useState<"WEEKLY" | "TWICE_WEEKLY">(
    "TWICE_WEEKLY"
  );
  const [divGrossUsd, setDivGrossUsd] = useState<string>("500");
  const [divPoolUsd, setDivPoolUsd] = useState<string>("220");

  // 5-20 Year Projection Slider State
  const [projUsers, setProjUsers] = useState<number>(100000);
  const [projYears, setProjYears] = useState<number>(10);

  const fetchState = useCallback(async (uid: string) => {
    const res = await fetch(`/api/platform?userId=${encodeURIComponent(uid)}`);
    const data = await res.json();
    setState(data);
    if (data?.activeUser?.preferredCurrency) {
      setSelectedCurrency(data.activeUser.preferredCurrency);
    }
  }, []);

  useEffect(() => {
    fetchState(activeUserId);
  }, [activeUserId, fetchState]);

  const dispatchAction = async (
    action: string,
    payload: Record<string, unknown>,
    successText?: string
  ) => {
    setLoading(true);
    setBannerMsg(null);
    try {
      const res = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload, activeUserId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setBannerMsg(`⚠️ ${data.error || "Operation failed"}`);
      } else {
        setState(data.state);
        if (successText) setBannerMsg(`✅ ${successText}`);
      }
    } catch {
      setBannerMsg("⚠️ Network error communicating with server.");
    } finally {
      setLoading(false);
    }
  };

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] text-slate-200">
        <div className="flex items-center gap-3 text-lg font-medium">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
          Loading Global & West Africa Community Platform...
        </div>
      </div>
    );
  }

  const { activeUser } = state;
  const currencyMap = new Map(state.currencies.map((c) => [c.code, c]));
  const currentCurrencyCfg =
    currencyMap.get(selectedCurrency) || state.currencies[0];

  const fmtMoney = (usdCents: number, forceUsd = false) => {
    const usdVal = usdCents / 100;
    if (forceUsd) {
      return `$${usdVal.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    const converted = usdVal * currentCurrencyCfg.rateFromUsd;
    if (selectedCurrency === "NGN" || selectedCurrency === "XOF") {
      return `${currentCurrencyCfg.symbol}${Math.round(
        converted
      ).toLocaleString("en-US")}`;
    }
    return `${currentCurrencyCfg.symbol}${converted.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const userRank =
    state.ranks.find((r) => r.level === activeUser.networkLevel) ||
    state.ranks[0];
  const nextRank = state.ranks.find(
    (r) => r.level === activeUser.networkLevel + 1
  );

  const userContracts = state.contracts.filter(
    (c) =>
      activeUser.role === "SUPER_ADMIN" ||
      activeUser.role === "FINANCE_ADMIN" ||
      c.userId === activeUser.id
  );

  const pendingOfflineSales = state.offlineSales.filter(
    (o) => o.status === "PENDING_VERIFICATION"
  );

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 pb-20">
      {/* TOP BAR: Role Persona Switcher + Multi-Currency Selector */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0d1322]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
              NW
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Networkinng Co-op
                </h1>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                  $7.50 (₦12,000) Entry • 28-Day Capital Return
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Client/Server Architecture • Offline & Online Sales • Twice-Weekly & Weekly Broken Installments
              </p>
            </div>
          </div>

          {/* Persona / RBAC Role Switcher & Currency Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-xs">
              <Users className="h-4 w-4 text-amber-400" />
              <span className="text-slate-400">Active View:</span>
              <select
                aria-label="Switch active user role persona"
                value={activeUserId}
                onChange={(e) => {
                  setActiveUserId(e.target.value);
                  setOfflineBuyerId(e.target.value);
                }}
                className="bg-transparent font-semibold text-white focus:outline-none"
              >
                {state.users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                    [{u.role}] {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 text-xs">
              <Globe className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-200">Currency:</span>
              <select
                aria-label="Select display currency"
                value={selectedCurrency}
                onChange={(e) => {
                  const code = e.target.value as CurrencyCode;
                  setSelectedCurrency(code);
                  dispatchAction("CHANGE_CURRENCY", {
                    userId: activeUser.id,
                    currency: code,
                  });
                }}
                className="bg-transparent font-bold text-emerald-300 focus:outline-none"
              >
                {state.currencies.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.code} ({c.symbol}) — {c.region}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 space-y-6">
        {/* Notification Banner */}
        {bannerMsg && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
            <span>{bannerMsg}</span>
            <button
              onClick={() => setBannerMsg(null)}
              className="text-xs font-semibold underline hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* SUMMARY KPI BAR */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Available Wallet Balance</span>
              <Wallet className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {fmtMoney(activeUser.availableBalanceCents)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              USD Base: {fmtMoney(activeUser.availableBalanceCents, true)} • Instant Cashout/Re-buy
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>28-Day Capital In Recovery</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-300">
              {fmtMoney(activeUser.escrowCapitalCents)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Returned so far: {fmtMoney(activeUser.totalCapitalReturnedCents)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Networking Level & Gen 1–5</span>
              <Award className="h-4 w-4 text-sky-400" />
            </div>
            <div className="mt-2 text-lg font-bold text-sky-300">
              Lvl {activeUser.networkLevel}: {userRank.title}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Earned: {fmtMoney(activeUser.totalCommissionsEarnedCents)} • Team: {activeUser.totalTeamMembersCount}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Post-28-Day Profit Royalties</span>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-purple-300">
              {fmtMoney(activeUser.totalRoyaltiesEarnedCents)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Rank Dividend Boost: <strong className="text-purple-300">{userRank.royaltyPoolMultiplier}x Share</strong>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
            <div className="flex items-center justify-between text-xs text-emerald-300">
              <span>Founder Maintenance Treasury</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-300">
              {fmtMoney(state.treasury.totalFounderRevenueCents)}
            </div>
            <div className="mt-1 text-xs text-emerald-200/80">
              Working Capital Active: {fmtMoney(state.treasury.activeWorkingCapitalDeployedCents)}
            </div>
          </div>
        </section>

        {/* NAVIGATION TABS */}
        <nav className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {[
            {
              id: "INSTALLMENTS",
              label: "1. 28-Day Broken Installments & Packs ($7.50+)",
              icon: ShoppingBag,
            },
            {
              id: "OFFLINE_SALES",
              label: `2. Offline Sales & POS Portal (${pendingOfflineSales.length} Pending)`,
              icon: FileSpreadsheet,
            },
            {
              id: "NETWORK_TREE",
              label: "3. 5-Level Network & Plain-English Guide",
              icon: Layers,
            },
            {
              id: "WALLET_P2P",
              label: "4. Wallet, Cash-Out, P2P & 0% Re-Buy",
              icon: Wallet,
            },
            {
              id: "ACADEMY",
              label: "5. Student Academy (LMS Courses)",
              icon: BookOpen,
            },
            {
              id: "ADMIN_TREASURY",
              label: "6. Promoter Ads, Post-28 Dividends & 20-Yr Plan",
              icon: Building2,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as typeof activeTab)
                }
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* TAB 1: 28-DAY BROKEN INSTALLMENTS & TRADE PACKS ($7.50 ENTRY) */}
        {activeTab === "INSTALLMENTS" && (
          <div className="space-y-8">
            {/* How the 28-Day Broken Installment Engine Works */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 p-5">
              <h2 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                How Your 28-Day Broken Installment Capital Recovery Works
              </h2>
              <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                Whether a student starts with the accessible <strong>{fmtMoney(750)} ($7.50 USD)</strong> Starter Pack or a regional distributor pack, the company deploys the working capital into fast-moving offline &amp; online merchandise and promotions while paying you back <strong>100% of your capital in broken installments over 28 days</strong>:
                choose <strong>Twice-a-Week (8 installments of 12.5% every 3.5 days)</strong> or <strong>Once-a-Week (4 installments of 25% every 7 days)</strong>. Once Day 28 is complete and you have 100% of your money back, your pack enters <strong>Phase 2 (Post-28-Day Business Royalty Pool)</strong> where you continue earning weekly/twice-weekly dividends based on how well the company&apos;s business performs!
              </p>
            </div>

            {/* PRODUCT / TRADE ALLOCATION PACKS */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">
                Activate a Product &amp; Capital Pack (Starts at $7.50 USD / {fmtMoney(750)})
              </h3>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {state.packs.map((pack) => {
                  const chosenSched =
                    packSchedules[pack.id] || pack.defaultSchedule;
                  const perInstallmentCents =
                    chosenSched === "TWICE_WEEKLY_8"
                      ? pack.priceCents * 0.125
                      : pack.priceCents * 0.25;

                  return (
                    <div
                      key={pack.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-5 hover:border-emerald-500/50 transition"
                    >
                      <div>
                        <span className="inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                          {pack.tierBadge}
                        </span>
                        <h4 className="mt-3 text-base font-bold text-white">
                          {pack.name}
                        </h4>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-extrabold text-emerald-400">
                            {fmtMoney(pack.priceCents)}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({fmtMoney(pack.priceCents, true)} USD)
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                          {pack.description}
                        </p>

                        <div className="mt-3 rounded-xl bg-slate-950/80 p-3 text-xs space-y-1.5 border border-slate-800">
                          <div className="flex justify-between">
                            <span className="text-slate-400">28-Day Capital Back:</span>
                            <span className="font-bold text-white">
                              100% ({fmtMoney(pack.priceCents)})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Broken Payout:</span>
                            <span className="font-semibold text-emerald-300">
                              {chosenSched === "TWICE_WEEKLY_8"
                                ? `8 × ${fmtMoney(perInstallmentCents)}`
                                : `4 × ${fmtMoney(perInstallmentCents)}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Post-28 Royalty Weight:</span>
                            <span className="font-semibold text-purple-300">
                              {pack.royaltyUnits} Units
                            </span>
                          </div>
                        </div>

                        {/* Schedule Selector */}
                        <div className="mt-3">
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Choose Broken Installment Schedule:
                          </label>
                          <select
                            value={chosenSched}
                            onChange={(e) =>
                              setPackSchedules({
                                ...packSchedules,
                                [pack.id]: e.target
                                  .value as InstallmentScheduleType,
                              })
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white"
                          >
                            <option value="TWICE_WEEKLY_8">
                              Twice a Week (8 × 12.5% every 3.5 days)
                            </option>
                            <option value="WEEKLY_4">
                              Once a Week (4 × 25% every 7 days)
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 pt-3 border-t border-slate-800">
                        <button
                          disabled={loading}
                          onClick={() =>
                            dispatchAction(
                              "PURCHASE_PACK",
                              {
                                userId: activeUser.id,
                                packId: pack.id,
                                scheduleType: chosenSched,
                                paymentSource: "ONLINE_GATEWAY",
                              },
                              `Activated ${pack.name} on ${
                                chosenSched === "TWICE_WEEKLY_8"
                                  ? "Twice-Weekly (8×12.5%)"
                                  : "Weekly (4×25%)"
                              } schedule!`
                            )
                          }
                          className="w-full rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                        >
                          Buy Online ({fmtMoney(pack.priceCents)})
                        </button>

                        <button
                          disabled={loading}
                          onClick={() =>
                            dispatchAction(
                              "PURCHASE_PACK",
                              {
                                userId: activeUser.id,
                                packId: pack.id,
                                scheduleType: chosenSched,
                                paymentSource: "INTERNAL_WALLET_0_FEE",
                              },
                              `Re-purchased ${pack.name} from Wallet with 0% Fee!`
                            )
                          }
                          className="w-full rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 transition"
                        >
                          Re-Buy with Wallet Balance (0% Fee)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTIVE 28-DAY BROKEN INSTALLMENT & POST-28 ROYALTY CONTRACTS */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Active 28-Day Broken Installment Contracts &amp; Post-28-Day Royalty Units
                  </h3>
                  <p className="text-xs text-slate-400">
                    Test the twice-weekly (3.5d) and weekly (7d) broken capital returns right now using the simulator controls below.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={loading}
                    onClick={() =>
                      dispatchAction(
                        "ADVANCE_INSTALLMENT",
                        { completeFull28Days: false },
                        "Processed next scheduled broken installment for all active contracts!"
                      )
                    }
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                  >
                    <Clock className="h-4 w-4" />
                    Pay Next Broken Installment (All Active)
                  </button>
                  <button
                    disabled={loading}
                    onClick={() =>
                      dispatchAction(
                        "ADVANCE_INSTALLMENT",
                        { completeFull28Days: true },
                        "Completed full 28-day capital return (100% principal back) and transitioned contracts to Post-28-Day Royalty Pool!"
                      )
                    }
                    className="flex items-center gap-1.5 rounded-xl bg-purple-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-400 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Fast-Forward to Day 28 (100% Capital Back)
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {userContracts.map((ctr) => {
                  const pctRecovered = Math.min(
                    100,
                    Math.round(
                      (ctr.returnedCapitalCents / ctr.principalCents) * 100
                    )
                  );
                  const isPost28 =
                    ctr.phaseStatus === "POST_28_ROYALTY_ACTIVE";

                  return (
                    <div
                      key={ctr.id}
                      className={`rounded-2xl border p-4 ${
                        isPost28
                          ? "border-purple-500/40 bg-purple-950/15"
                          : "border-slate-800 bg-slate-950/70"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {ctr.packName}
                            </span>
                            <span className="text-xs text-slate-400">
                              • Owner: <strong className="text-slate-200">{ctr.userName}</strong>
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                isPost28
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              }`}
                            >
                              {isPost28
                                ? "PHASE 2: 100% CAPITAL RETURNED • EARNING WEEKLY BUSINESS ROYALTIES"
                                : `PHASE 1: DAY ${ctr.currentDayElapsed}/28 (${ctr.paidInstallments}/${ctr.totalInstallments} Installments Paid)`}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            Schedule:{" "}
                            <strong>
                              {ctr.scheduleType === "TWICE_WEEKLY_8"
                                ? "Twice-Weekly (8 × 12.5% every 3.5 days)"
                                : "Once-Weekly (4 × 25% every 7 days)"}
                            </strong>{" "}
                            • Source: {ctr.sourceChannel} • Royalty Weight:{" "}
                            <strong className="text-purple-300">
                              {ctr.royaltyUnits} Units
                            </strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right text-xs">
                            <div className="text-slate-400">
                              Capital Returned / Principal
                            </div>
                            <div className="font-bold text-emerald-400 text-sm">
                              {fmtMoney(ctr.returnedCapitalCents)} /{" "}
                              {fmtMoney(ctr.principalCents)} ({pctRecovered}%)
                            </div>
                            {ctr.royaltyEarningsCents > 0 && (
                              <div className="text-purple-300 font-semibold">
                                + {fmtMoney(ctr.royaltyEarningsCents)} Post-28 Dividends
                              </div>
                            )}
                          </div>

                          {!isPost28 && (
                            <button
                              disabled={loading}
                              onClick={() =>
                                dispatchAction(
                                  "ADVANCE_INSTALLMENT",
                                  {
                                    contractId: ctr.id,
                                    completeFull28Days: false,
                                  },
                                  `Paid next broken installment for ${ctr.packName}!`
                                )
                              }
                              className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition"
                            >
                              + Pay Next Installment
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Broken Installment Pills (4 or 8 slices) */}
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                        {ctr.installments.map((inst) => (
                          <div
                            key={inst.installmentNumber}
                            className={`rounded-lg border p-2 text-center text-[11px] ${
                              inst.status === "PAID"
                                ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                                : "border-slate-800 bg-slate-900/60 text-slate-400"
                            }`}
                          >
                            <div className="font-bold">
                              #{inst.installmentNumber} (Day {inst.dueDay})
                            </div>
                            <div className="mt-0.5 font-semibold text-white">
                              {fmtMoney(inst.amountCents)}
                            </div>
                            <div className="mt-0.5 text-[10px]">
                              {inst.status === "PAID" ? "✓ PAID" : `${inst.percentage}% Pending`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OFFLINE SALES & FIELD AGENT RECEIPT VERIFICATION PORTAL */}
        {activeTab === "OFFLINE_SALES" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Log Offline Sale Form (Member Claim OR Direct Staff Entry) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <FileSpreadsheet className="h-5 w-5" />
                <h2>
                  {activeUser.role === "SUPER_ADMIN" ||
                  activeUser.role === "FINANCE_ADMIN"
                    ? "Admin Direct Offline Sale Entry (Auto-Approves)"
                    : "Member / Field Agent Offline Sale Claim Form"}
                </h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Since most product &amp; study material sales happen offline in cash, POS, or local bank transfer, log the offline sale here. When Finance Admin approves (or enters it directly), the buyer&apos;s 28-day installment schedule and upline commissions trigger immediately!
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Buyer Member Account:
                  </label>
                  <select
                    value={offlineBuyerId}
                    onChange={(e) => setOfflineBuyerId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    {state.users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.referralCode} — {u.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Offline Product / Capital Pack Sold:
                  </label>
                  <select
                    value={offlinePackId}
                    onChange={(e) => setOfflinePackId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    {state.packs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {fmtMoney(p.priceCents)} ({fmtMoney(p.priceCents, true)} USD)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      28-Day Payout Schedule:
                    </label>
                    <select
                      value={offlineSchedule}
                      onChange={(e) =>
                        setOfflineSchedule(
                          e.target.value as InstallmentScheduleType
                        )
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    >
                      <option value="TWICE_WEEKLY_8">
                        Twice-Weekly (8 × 12.5%)
                      </option>
                      <option value="WEEKLY_4">Weekly (4 × 25%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Offline Payment Channel:
                    </label>
                    <select
                      value={offlineMethod}
                      onChange={(e) => setOfflineMethod(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    >
                      <option value="POS_TERMINAL">POS Terminal Receipt</option>
                      <option value="CASH_HAND_TO_HAND">Cash Hand-to-Hand</option>
                      <option value="LOCAL_BANK_TRANSFER">
                        Local Bank Transfer (NIP)
                      </option>
                      <option value="MOBILE_MONEY_WEST_AFRICA">
                        Mobile Money (MoMo / Wave / OPay)
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    POS / Bank / Voucher Receipt Reference:
                  </label>
                  <input
                    type="text"
                    value={offlineReceipt}
                    onChange={(e) => setOfflineReceipt(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Field Agent / Delivery Note:
                  </label>
                  <textarea
                    rows={2}
                    value={offlineNote}
                    onChange={(e) => setOfflineNote(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    disabled={loading}
                    onClick={() =>
                      dispatchAction(
                        "RECORD_OFFLINE_SALE",
                        {
                          buyerUserId: offlineBuyerId,
                          packId: offlinePackId,
                          localCurrency: selectedCurrency,
                          schedulePreference: offlineSchedule,
                          paymentMethod: offlineMethod,
                          receiptReference: offlineReceipt,
                          fieldAgentNote: offlineNote,
                          submittedByUserId: activeUser.id,
                          autoApproveIfAdmin: false,
                        },
                        "Offline sale logged into the Finance Admin verification queue!"
                      )
                    }
                    className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                  >
                    Submit Offline Sale Claim (For Verification Queue)
                  </button>

                  {(activeUser.role === "SUPER_ADMIN" ||
                    activeUser.role === "FINANCE_ADMIN") && (
                    <button
                      disabled={loading}
                      onClick={() =>
                        dispatchAction(
                          "RECORD_OFFLINE_SALE",
                          {
                            buyerUserId: offlineBuyerId,
                            packId: offlinePackId,
                            localCurrency: selectedCurrency,
                            schedulePreference: offlineSchedule,
                            paymentMethod: offlineMethod,
                            receiptReference: offlineReceipt,
                            fieldAgentNote: offlineNote,
                            submittedByUserId: activeUser.id,
                            autoApproveIfAdmin: true,
                          },
                          "Offline sale directly approved! 28-Day Installment Contract & Upline Commissions activated!"
                        )
                      }
                      className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                    >
                      Admin Direct Log &amp; Instant Approve (1-Step)
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Offline Sales Verification Queue & History */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Offline Sales &amp; Receipt Verification Queue
                  </h3>
                  <p className="text-xs text-slate-400">
                    Switch Active View at top-right to <strong>[FINANCE_ADMIN] Tunde</strong> or <strong>[SUPER_ADMIN] Ritchie</strong> to approve pending claims with 1 click.
                  </p>
                </div>
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
                  {pendingOfflineSales.length} Awaiting Approval
                </span>
              </div>

              <div className="space-y-3">
                {state.offlineSales.map((sale) => (
                  <div
                    key={sale.id}
                    className={`rounded-xl border p-4 text-xs ${
                      sale.status === "PENDING_VERIFICATION"
                        ? "border-amber-500/40 bg-amber-950/15"
                        : "border-slate-800 bg-slate-950/60"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-white text-sm">
                          {sale.buyerName}
                        </span>
                        <span className="ml-2 text-emerald-300 font-semibold">
                          • {sale.packName} ({fmtMoney(sale.amountCents)} /{" "}
                          {sale.localAmountFormatted})
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-bold ${
                          sale.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </div>

                    <div className="mt-2 text-slate-300">
                      <strong>Receipt Ref:</strong> {sale.receiptReference} (
                      {sale.paymentMethod}) •{" "}
                      <strong>Schedule:</strong>{" "}
                      {sale.schedulePreference === "TWICE_WEEKLY_8"
                        ? "Twice-Weekly (8×12.5%)"
                        : "Weekly (4×25%)"}
                    </div>
                    <div className="mt-1 text-slate-400 italic">
                      &ldquo;{sale.fieldAgentNote}&rdquo;
                    </div>

                    {sale.status === "PENDING_VERIFICATION" && (
                      <div className="mt-3 flex items-center justify-end gap-2">
                        {activeUser.role === "SUPER_ADMIN" ||
                        activeUser.role === "FINANCE_ADMIN" ? (
                          <button
                            disabled={loading}
                            onClick={() =>
                              dispatchAction(
                                "APPROVE_OFFLINE_SALE",
                                {
                                  offlineSaleId: sale.id,
                                  approverUserId: activeUser.id,
                                },
                                `Approved offline sale ${sale.receiptReference}! 28-Day contract & upline commissions triggered!`
                              )
                            }
                            className="rounded-lg bg-emerald-500 px-3.5 py-1.5 font-bold text-slate-950 hover:bg-emerald-400 transition"
                          >
                            ✓ Approve Receipt &amp; Start 28-Day Cycle
                          </button>
                        ) : (
                          <span className="text-[11px] text-amber-300">
                            Switch to [FINANCE_ADMIN] or [SUPER_ADMIN] in top bar to click Approve
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 5-TIER NETWORKING TREE & PLAIN-ENGLISH GUIDE */}
        {activeTab === "NETWORK_TREE" && (
          <div className="space-y-6">
            {/* Plain-English 5-Level Ladder */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h2 className="text-lg font-bold text-white">
                Plain-English Guide to the 5 Networking Levels (Associate → Ambassador)
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Commissions are paid <strong>ONLY when a member activates a Product/Capital Pack</strong> (online or approved offline), protecting company working capital. Climbing levels unlocks deeper generations (up to 5 levels deep) and multiplies your share of the Post-28-Day Business Profit Pool!
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
                {state.ranks.map((rk) => {
                  const isCurrent = rk.level === activeUser.networkLevel;
                  return (
                    <div
                      key={rk.level}
                      className={`rounded-xl border p-4 flex flex-col justify-between ${
                        isCurrent
                          ? "border-sky-400 bg-sky-950/30 shadow-lg shadow-sky-500/10"
                          : "border-slate-800 bg-slate-950/70"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-sky-300">
                            LEVEL {rk.level}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-emerald-400">
                              ● YOUR RANK
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 font-bold text-white text-sm">
                          {rk.title}
                        </h3>
                        <p className="mt-2 text-[11px] text-slate-300 leading-relaxed">
                          {rk.plainEnglishSummary}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Gen 1 (Direct):</span>
                          <span className="font-bold text-emerald-400">
                            {rk.gen1CommissionPct}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Gen 2–5 Depth:</span>
                          <span className="font-semibold text-slate-200">
                            {[
                              rk.gen2CommissionPct,
                              rk.gen3CommissionPct,
                              rk.gen4CommissionPct,
                              rk.gen5CommissionPct,
                            ]
                              .filter((x) => x > 0)
                              .map((x) => `${x}%`)
                              .join(" / ") || "Gen 1 Only"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Post-28 Profit Boost:</span>
                          <span className="font-bold text-purple-300">
                            {rk.royaltyPoolMultiplier}x Share
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulator: Invite a New Student/Member + Genealogy Tree */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
                <h3 className="text-base font-bold text-white">
                  Simulate Referring a New Student / Member
                </h3>
                <p className="text-xs text-slate-400">
                  Your Personal Referral Code:{" "}
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono font-bold text-emerald-300">
                    {activeUser.referralCode}
                  </span>
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      New Student / Member Full Name:
                    </label>
                    <input
                      type="text"
                      value={refName}
                      onChange={(e) => setRefName(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Country (West Africa / Global):
                      </label>
                      <input
                        type="text"
                        value={refCountry}
                        onChange={(e) => setRefCountry(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        28-Day Schedule:
                      </label>
                      <select
                        value={refSchedule}
                        onChange={(e) =>
                          setRefSchedule(
                            e.target.value as InstallmentScheduleType
                          )
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      >
                        <option value="TWICE_WEEKLY_8">
                          Twice-Weekly (8×12.5%)
                        </option>
                        <option value="WEEKLY_4">Weekly (4×25%)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Starter Pack They Activate:
                    </label>
                    <select
                      value={refPackId}
                      onChange={(e) => setRefPackId(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    >
                      {state.packs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {fmtMoney(p.priceCents)} ({fmtMoney(p.priceCents, true)} USD)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    disabled={loading}
                    onClick={() =>
                      dispatchAction(
                        "REGISTER_REFERRAL",
                        {
                          sponsorUserId: activeUser.id,
                          newMemberName: refName,
                          country: refCountry,
                          preferredCurrency: selectedCurrency,
                          initialPackId: refPackId,
                          scheduleType: refSchedule,
                        },
                        `${refName} joined under ${activeUser.name}! Instant Gen 1–5 upline commissions & 28-day schedule created!`
                      )
                    }
                    className="w-full rounded-xl bg-sky-500 px-4 py-2.5 font-bold text-slate-950 hover:bg-sky-400 transition"
                  >
                    + Enroll Referred Member &amp; Pay Upline Commissions
                  </button>
                </div>

                {nextRank && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-1">
                    <div className="font-bold text-sky-300">
                      Next Rank Target: Level {nextRank.level} ({nextRank.title})
                    </div>
                    <div className="text-slate-400">
                      Direct Referrals: {activeUser.directReferralsCount} /{" "}
                      {nextRank.minDirectReferrals} • Courses Completed:{" "}
                      {activeUser.completedCourseIds.length} /{" "}
                      {nextRank.minCompletedCourses} • Team Volume:{" "}
                      {fmtMoney(activeUser.teamVolumeCents)} /{" "}
                      {fmtMoney(nextRank.minTeamVolumeCents)}
                    </div>
                  </div>
                )}
              </div>

              {/* Materialized Path Genealogy Tree */}
              <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
                <h3 className="text-base font-bold text-white">
                  Live Community Genealogy Tree (100k-User Materialized Path Index)
                </h3>
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {state.users.map((u) => {
                    const depth =
                      u.materializedPath.split("/").filter(Boolean).length - 1;
                    return (
                      <div
                        key={u.id}
                        style={{ marginLeft: `${Math.min(depth * 20, 80)}px` }}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">
                              {u.name}
                            </span>
                            <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                              Level {u.networkLevel}
                            </span>
                            <span className="text-slate-400">
                              ({u.country})
                            </span>
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                            Path: {u.materializedPath} • Code: {u.referralCode}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-emerald-400">
                            Wallet: {fmtMoney(u.availableBalanceCents)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Team Sales: {fmtMoney(u.teamVolumeCents)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WALLET, CASH-OUT, P2P & LEDGER */}
        {activeTab === "WALLET_P2P" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="h-4 w-4 text-emerald-400" />
                Cash-Out (Bank / Mobile Money / Crypto) or P2P Transfer
              </h2>
              <p className="text-xs text-slate-400">
                External Bank/Mobile Money &amp; Crypto withdrawals carry a{" "}
                <strong>3% maintenance fee</strong> routed to the Founder Treasury. Member-to-Member P2P transfers carry a <strong>1% fee</strong>. Internal Pack Re-Purchases carry a <strong>0% fee</strong>.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Select Outflow Channel:
                  </label>
                  <select
                    value={outflowChannel}
                    onChange={(e) =>
                      setOutflowChannel(
                        e.target.value as typeof outflowChannel
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="BANK_OR_MOBILE_MONEY">
                      Local Bank / West Africa Mobile Money (3% Fee)
                    </option>
                    <option value="CRYPTO_USDT_USDC">
                      Crypto USDT / USDC TRC20/BEP20 (3% Fee)
                    </option>
                    <option value="P2P_MEMBER_TRANSFER">
                      Peer-to-Peer (P2P) Member Wallet Transfer (1% Fee)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Amount in USD (Available:{" "}
                    {fmtMoney(activeUser.availableBalanceCents, true)} /{" "}
                    {fmtMoney(activeUser.availableBalanceCents)}):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={outflowUsdAmount}
                    onChange={(e) => setOutflowUsdAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>

                {outflowChannel === "P2P_MEMBER_TRANSFER" ? (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Recipient Student / Member:
                    </label>
                    <select
                      value={p2pRecipientId}
                      onChange={(e) => setP2pRecipientId(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    >
                      {state.users
                        .filter((u) => u.id !== activeUser.id)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.referralCode})
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Bank Account / Mobile Money / USDT Wallet Address:
                    </label>
                    <input
                      type="text"
                      value={outflowDestination}
                      onChange={(e) => setOutflowDestination(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    />
                  </div>
                )}

                <button
                  disabled={loading}
                  onClick={() => {
                    const cents = Math.round(
                      ( parseFloat(outflowUsdAmount) || 0 ) * 100
                    );
                    dispatchAction(
                      "WALLET_OUTFLOW",
                      {
                        userId: activeUser.id,
                        channel: outflowChannel,
                        grossAmountCents: cents,
                        destinationDetails: outflowDestination,
                        recipientUserId: p2pRecipientId,
                      },
                      `Processed ${outflowChannel} for $${outflowUsdAmount} (${fmtMoney(
                        cents
                      )})!`
                    );
                  }}
                  className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 font-bold text-slate-950 hover:bg-emerald-400 transition"
                >
                  Execute Wallet Withdrawal / P2P Transfer
                </button>
              </div>
            </div>

            {/* Real-Time Double-Entry Financial Ledger */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
              <h3 className="text-base font-bold text-white">
                Immutable Double-Entry Financial &amp; Installment Ledger
              </h3>
              <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
                {state.ledgerLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {log.description}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {log.category} • {log.userName}
                      </div>
                    </div>
                    <div
                      className={`font-bold whitespace-nowrap ${
                        log.direction === "CREDIT"
                          ? "text-emerald-400"
                          : log.direction === "TREASURY"
                          ? "text-amber-300"
                          : "text-rose-400"
                      }`}
                    >
                      {log.direction === "DEBIT" ? "-" : "+"}
                      {fmtMoney(log.amountCents)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STUDENT ACADEMY (LMS COURSES & XP) */}
        {activeTab === "ACADEMY" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h2 className="text-lg font-bold text-white">
                Student Skill &amp; Entrepreneurship Academy (LMS)
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Courses are unlocked automatically when you buy a Capital/Product Pack, OR can be taken standalone. Completing courses awards XP and satisfies the learning requirement to climb from <strong>Level 1 (Associate)</strong> to <strong>Level 2 (Builder)</strong> and beyond!
              </p>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
                {state.courses.map((course) => {
                  const isEnrolled = activeUser.enrolledCourseIds.includes(
                    course.id
                  );
                  const isCompleted = activeUser.completedCourseIds.includes(
                    course.id
                  );

                  return (
                    <div
                      key={course.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-5"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 font-bold text-sky-300">
                            {course.category}
                          </span>
                          <span className="font-bold text-amber-300">
                            +{course.xpReward} XP
                          </span>
                        </div>
                        <h3 className="mt-3 text-base font-bold text-white">
                          {course.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          Instructor: {course.instructor}
                        </p>
                        <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                          {course.description}
                        </p>

                        <div className="mt-3 space-y-1.5 border-t border-slate-800 pt-3 text-xs">
                          {course.lessons.map((les) => (
                            <div
                              key={les.id}
                              className="flex items-center justify-between text-slate-300"
                            >
                              <span>• {les.title}</span>
                              <span className="text-[10px] text-slate-500">
                                {les.durationMinutes}m ({les.format})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800">
                        {isCompleted ? (
                          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 py-2 text-xs font-bold text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" />
                            Completed &amp; Certified
                          </div>
                        ) : (
                          <button
                            disabled={loading}
                            onClick={() =>
                              dispatchAction(
                                "COMPLETE_COURSE",
                                {
                                  userId: activeUser.id,
                                  courseId: course.id,
                                },
                                `Completed "${course.title}" (+${course.xpReward} XP) and evaluated Networking Rank!`
                              )
                            }
                            className="w-full rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 transition"
                          >
                            {isEnrolled
                              ? "Complete Lessons & Claim Certificate (+XP)"
                              : `Enroll & Complete (${
                                  course.priceCents === 0
                                    ? "Free"
                                    : fmtMoney(course.priceCents)
                                })`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PROMOTER ADS, SUPER ADMIN POST-28 DIVIDEND DECLARATION & 20-YEAR PLAN */}
        {activeTab === "ADMIN_TREASURY" && (
          <div className="space-y-6">
            {/* 4 Founder Maintenance Revenue Streams Breakdown */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="text-xs text-slate-400">
                  1. Retained Business Profit Spread
                </div>
                <div className="mt-1 text-xl font-bold text-emerald-400">
                  {fmtMoney(state.treasury.retainedBusinessSpreadCents)}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Company profit retained from offline/online trading after paying Post-28-Day member dividends.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="text-xs text-slate-400">
                  2. Sponsored Ads &amp; Promoter Module
                </div>
                <div className="mt-1 text-xl font-bold text-amber-300">
                  {fmtMoney(state.treasury.sponsoredAdsRevenueCents)}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  100% of ad campaign boosts paid by promoters &amp; vendors to advertise on the platform.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="text-xs text-slate-400">
                  3. Standalone Course &amp; Material Margin
                </div>
                <div className="mt-1 text-xl font-bold text-sky-300">
                  {fmtMoney(state.treasury.standaloneCourseRevenueCents)}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Direct revenue from standalone skill courses and certifications.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="text-xs text-slate-400">
                  4. Withdrawal (3%) &amp; P2P (1%) Fees
                </div>
                <div className="mt-1 text-xl font-bold text-purple-300">
                  {fmtMoney(state.treasury.withdrawalAndP2PFeesCents)}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Maintenance fees from external cash-outs and P2P transfers to pay servers &amp; staff.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left: Super Admin Post-28-Day Business Profit Pool Declaration */}
              <div className="lg:col-span-6 rounded-2xl border border-purple-500/40 bg-purple-950/15 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-purple-200 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-purple-400" />
                    Super Admin: Declare Post-28-Day Business Profit Pool
                  </h3>
                  <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[11px] font-bold text-purple-300">
                    SUPER_ADMIN ONLY
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Once a member has received 100% of their capital back in 28 days, their contract enters{" "}
                  <code className="text-purple-300">POST_28_ROYALTY_ACTIVE</code>. Whenever your offline/online business generates profit, declare the weekly or twice-weekly pool here. The server automatically distributes the member pool weighted by{" "}
                  <strong>Units × Rank Multiplier (1.0x–3.0x)</strong> and logs the rest to your Founder Treasury!
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Profit Distribution Title:
                    </label>
                    <input
                      type="text"
                      value={divTitle}
                      onChange={(e) => setDivTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Payout Frequency:
                      </label>
                      <select
                        value={divPeriod}
                        onChange={(e) =>
                          setDivPeriod(
                            e.target.value as "WEEKLY" | "TWICE_WEEKLY"
                          )
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-white"
                      >
                        <option value="TWICE_WEEKLY">Twice-Weekly</option>
                        <option value="WEEKLY">Once-Weekly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Gross Profit (USD):
                      </label>
                      <input
                        type="number"
                        value={divGrossUsd}
                        onChange={(e) => setDivGrossUsd(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Member Pool (USD):
                      </label>
                      <input
                        type="number"
                        value={divPoolUsd}
                        onChange={(e) => setDivPoolUsd(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    onClick={() =>
                      dispatchAction(
                        "DECLARE_DIVIDEND_POOL",
                        {
                          declaredByUserId: "u-founder",
                          title: divTitle,
                          periodType: divPeriod,
                          grossBusinessProfitCents: Math.round(
                            (parseFloat(divGrossUsd) || 0) * 100
                          ),
                          declaredMemberPoolCents: Math.round(
                            (parseFloat(divPoolUsd) || 0) * 100
                          ),
                        },
                        `Declared ${divPeriod} Post-28-Day Business Royalty Pool ($${divPoolUsd} distributed to members; Retained spread added to Founder Treasury)!`
                      )
                    }
                    className="w-full rounded-xl bg-purple-500 px-4 py-2.5 font-bold text-white hover:bg-purple-400 transition"
                  >
                    Declare &amp; Distribute Post-28-Day Business Royalties Now
                  </button>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-300">
                    Recent Post-28-Day Business Dividend Distributions:
                  </div>
                  {state.dividendDeclarations.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-lg border border-slate-800 bg-slate-950/80 p-2.5 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {d.title} ({d.periodType})
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Gross: {fmtMoney(d.grossBusinessProfitCents)} • Retained by Company:{" "}
                          <strong className="text-emerald-400">
                            {fmtMoney(d.companyRetainedSpreadCents)}
                          </strong>
                        </div>
                      </div>
                      <div className="text-right font-bold text-purple-300">
                        Pool: {fmtMoney(d.declaredMemberPoolCents)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Marketing & Sponsored Ad Campaign Module */}
              <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-amber-400" />
                  Marketing &amp; Promoter Sponsored Ad Module
                </h3>
                <p className="text-xs text-slate-400">
                  Members, campus leaders, and external brands pay to boost flyers, products, or referral links across the community feed. 100% of ad budgets go to your Founder Maintenance Treasury.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Sponsored Campaign Headline:
                    </label>
                    <input
                      type="text"
                      value={adTitle}
                      onChange={(e) => setAdTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Target Region:
                      </label>
                      <input
                        type="text"
                        value={adRegion}
                        onChange={(e) => setAdRegion(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Ad Spend Budget (USD):
                      </label>
                      <input
                        type="number"
                        value={adBudgetUsd}
                        onChange={(e) => setAdBudgetUsd(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                  <button
                    disabled={loading}
                    onClick={() =>
                      dispatchAction(
                        "LAUNCH_AD_CAMPAIGN",
                        {
                          promoterUserId: activeUser.id,
                          title: adTitle,
                          category: "CAMPUS_EVENT",
                          targetRegion: adRegion,
                          budgetCents: Math.round(
                            (parseFloat(adBudgetUsd) || 5) * 100
                          ),
                        },
                        `Launched Sponsored Ad Campaign! $${adBudgetUsd} routed to Founder Maintenance Treasury.`
                      )
                    }
                    className="w-full rounded-xl bg-amber-500 px-4 py-2.5 font-bold text-slate-950 hover:bg-amber-400 transition"
                  >
                    Launch Promoted Ad Campaign (${adBudgetUsd} /{" "}
                    {fmtMoney(Math.round((parseFloat(adBudgetUsd) || 5) * 100))})
                  </button>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-300">
                    Active Sponsored Campaigns on Feed:
                  </div>
                  {state.adCampaigns.map((ad) => (
                    <div
                      key={ad.id}
                      className="rounded-lg border border-slate-800 bg-slate-950/80 p-2.5 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {ad.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          By {ad.promoterName} • {ad.targetRegion} •{" "}
                          {ad.impressions.toLocaleString()} views / {ad.clicks}{" "}
                          clicks
                        </div>
                      </div>
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300">
                        {fmtMoney(ad.budgetCents)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5-20 YEAR / 100,000-USER LONG-TERM GROWTH SIMULATOR */}
            <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                    5–20 Year &amp; 100,000-User West Africa / Global Scale Projection
                  </h3>
                  <p className="text-xs text-slate-400">
                    Interactive projection modeling the $7.50–$100 pack mix across your 5–20 year horizon.
                  </p>
                </div>
                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <label className="block text-slate-400">
                      Target Active Users:{" "}
                      <strong className="text-white">
                        {projUsers.toLocaleString()}
                      </strong>
                    </label>
                    <input
                      type="range"
                      min={5000}
                      max={250000}
                      step={5000}
                      value={projUsers}
                      onChange={(e) => setProjUsers(Number(e.target.value))}
                      className="w-40 accent-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400">
                      Horizon:{" "}
                      <strong className="text-white">{projYears} Years</strong>
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={20}
                      step={1}
                      value={projYears}
                      onChange={(e) => setProjYears(Number(e.target.value))}
                      className="w-32 accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <div className="text-slate-400">
                    Revolving 28-Day Working Capital Pool
                  </div>
                  <div className="mt-1 text-lg font-bold text-white">
                    {fmtMoney(projUsers * 1850)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Avg $18.50 blended pack per active member
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <div className="text-slate-400">
                    Annual Promoter Ad &amp; LMS Revenue
                  </div>
                  <div className="mt-1 text-lg font-bold text-amber-300">
                    {fmtMoney(projUsers * 420)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    100% retained for system maintenance
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <div className="text-slate-400">
                    Cumulative {projYears}-Year Member Earnings
                  </div>
                  <div className="mt-1 text-lg font-bold text-sky-300">
                    {fmtMoney(projUsers * 950 * projYears)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Commissions + Post-28-Day Business Royalties
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
                  <div className="text-emerald-300">
                    Projected {projYears}-Year Founder Treasury
                  </div>
                  <div className="mt-1 text-lg font-bold text-emerald-400">
                    {fmtMoney(projUsers * 610 * projYears)}
                  </div>
                  <div className="text-[11px] text-emerald-200/70">
                    Retained trade spread + Ads + Courses + Fees
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
