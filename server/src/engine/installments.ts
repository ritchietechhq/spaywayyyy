import type {
  InstallmentContract,
  InstallmentItem,
  InstallmentScheduleType,
  LedgerLog,
  TradePack,
  User,
} from "../models/types.ts";

/**
 * Generates the 60-Day Daily Dividend Schedule (Days 1 to 60).
 * Every day pays `dailyPayoutCents` (e.g. $1.25, $2.00, $4.10/$4.80, or $12.50).
 * Full capital is recovered by Day ~24–29, and daily payouts continue through Day 60.
 * On Day 60, $120 and $350 packs transition into the Days 61–90 Extended Royalty Pool!
 */
export function buildInstallmentSchedule(
  principalCents: number,
  dailyPayoutCents: number,
  activeDays = 60
): InstallmentItem[] {
  const dailyPct = Number(((dailyPayoutCents / principalCents) * 100).toFixed(2));
  const items: InstallmentItem[] = [];

  for (let day = 1; day <= activeDays; day++) {
    items.push({
      installmentNumber: day,
      dueDay: day,
      percentage: dailyPct,
      amountCents: dailyPayoutCents,
      status: "PENDING",
    });
  }

  return items;
}

export function createDailyDividendContract(params: {
  user: User;
  pack: TradePack;
  scheduleType?: InstallmentScheduleType;
  sourceChannel: "ONLINE_WALLET" | "ONLINE_GATEWAY" | "OFFLINE_APPROVED";
  applyProBooster?: boolean;
}): InstallmentContract {
  const { user, pack, sourceChannel } = params;

  // Apply the +$0.70/day Pro Booster on the $120 Pack if the user has completed a course or applyProBooster is true
  const qualifiesForBooster =
    pack.boosterDailyPayoutCents > 0 &&
    (Boolean(params.applyProBooster) || user.completedCourseIds.length > 0);

  const effectiveDailyCents = qualifiesForBooster
    ? pack.baseDailyPayoutCents + pack.boosterDailyPayoutCents
    : pack.baseDailyPayoutCents;

  const capitalReturnTargetDays = Math.ceil(
    pack.priceCents / effectiveDailyCents
  );

  const scheduleToUse: InstallmentScheduleType =
    pack.totalLifecycleDays === 90 ? "DAILY_90_EXTENDED" : "DAILY_60";

  const installments = buildInstallmentSchedule(
    pack.priceCents,
    effectiveDailyCents,
    pack.activeDailyEarningDays
  );

  // Add principal to user's capital-in-recovery tracker
  user.escrowCapitalCents = Number(
    (user.escrowCapitalCents + pack.priceCents).toFixed(2)
  );

  // Grant free Promoter Ad Credits if included in pack (e.g. $15 free ad credits on the $120 Hero Pack)
  if (pack.freeAdCreditsCents > 0) {
    user.adCreditsCents = Number(
      (user.adCreditsCents + pack.freeAdCreditsCents).toFixed(2)
    );
  }

  // Unlock bundled courses automatically
  for (const courseId of pack.bundledCourseIds) {
    if (!user.enrolledCourseIds.includes(courseId)) {
      user.enrolledCourseIds.push(courseId);
    }
  }

  return {
    id: `ctr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: user.id,
    userName: user.name,
    packId: pack.id,
    packName: pack.name,
    sourceChannel,
    principalCents: pack.priceCents,
    dailyPayoutCents: effectiveDailyCents,
    boosterApplied: qualifiesForBooster,
    returnedCapitalCents: 0,
    dailyProfitEarnedCents: 0,
    totalDailyCreditedCents: 0,
    royaltyEarningsCents: 0,
    royaltyUnits: pack.royaltyUnits,
    scheduleType: scheduleToUse,
    capitalReturnTargetDays,
    totalInstallments: pack.activeDailyEarningDays,
    paidInstallments: 0,
    currentDayElapsed: 0,
    totalLifecycleDays: pack.totalLifecycleDays,
    phaseStatus: "PHASE_1_CAPITAL_RECOVERY",
    installments,
    createdAt: new Date().toISOString(),
  };
}

// Keep alias for compatibility with offline-sales module
export const create28DayContract = createDailyDividendContract;

/**
 * Advances the daily dividend clock by `daysToAdvance` (default 1 day, or up to full 60 days if completeFull60Days = true).
 * - First recovers 100% of `principalCents` (~24–29 days) -> transitions to `PHASE_2_DAILY_PROFIT_60`.
 * - Continues paying daily profit through Day 60.
 * - On Day 60, if `totalLifecycleDays === 90` ($120 & $350 packs), transitions to `POST_60_ROYALTY_90` (Days 61–90 Extended Royalty Pool)!
 */
export function processNextInstallmentPayout(
  contract: InstallmentContract,
  user: User,
  ledgerLogs: LedgerLog[],
  completeFullCycle = false,
  daysToAdvance = 1
): {
  installmentsPaidNow: number;
  amountCreditedCents: number;
  reachedFullCapitalRecovery: boolean;
  reachedDay60: boolean;
} {
  let installmentsPaidNow = 0;
  let amountCreditedCents = 0;
  const maxSteps = completeFullCycle ? 60 : Math.max(1, daysToAdvance);

  for (const inst of contract.installments) {
    if (inst.status === "PENDING") {
      inst.status = "PAID";
      inst.paidAt = new Date().toISOString();

      contract.paidInstallments += 1;
      contract.currentDayElapsed = inst.dueDay;

      // Determine how much of today's payout is Capital Return vs. Net Daily Profit
      const remainingPrincipalToRecover = Math.max(
        0,
        Number((contract.principalCents - contract.returnedCapitalCents).toFixed(2))
      );
      const capitalPortion = Math.min(
        remainingPrincipalToRecover,
        inst.amountCents
      );
      const profitPortion = Number(
        (inst.amountCents - capitalPortion).toFixed(2)
      );

      contract.returnedCapitalCents = Number(
        (contract.returnedCapitalCents + capitalPortion).toFixed(2)
      );
      contract.dailyProfitEarnedCents = Number(
        (contract.dailyProfitEarnedCents + profitPortion).toFixed(2)
      );
      contract.totalDailyCreditedCents = Number(
        (contract.totalDailyCreditedCents + inst.amountCents).toFixed(2)
      );

      user.availableBalanceCents = Number(
        (user.availableBalanceCents + inst.amountCents).toFixed(2)
      );
      user.escrowCapitalCents = Math.max(
        0,
        Number((user.escrowCapitalCents - capitalPortion).toFixed(2))
      );
      user.totalCapitalReturnedCents = Number(
        (user.totalCapitalReturnedCents + capitalPortion).toFixed(2)
      );

      if (
        contract.returnedCapitalCents >= contract.principalCents &&
        contract.phaseStatus === "PHASE_1_CAPITAL_RECOVERY"
      ) {
        contract.phaseStatus = "PHASE_2_DAILY_PROFIT_60";
        contract.completedCapitalRecoveryAt = new Date().toISOString();
      }

      installmentsPaidNow += 1;
      amountCreditedCents = Number(
        (amountCreditedCents + inst.amountCents).toFixed(2)
      );

      if (installmentsPaidNow >= maxSteps) {
        break;
      }
    }
  }

  if (installmentsPaidNow > 0) {
    ledgerLogs.unshift({
      id: `log-inst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      category: "DAILY_DIVIDEND_PAYOUT",
      userId: user.id,
      userName: user.name,
      amountCents: amountCreditedCents,
      direction: "CREDIT",
      description: `${contract.packName}: ${installmentsPaidNow} day(s) Daily Dividend credited (Day ${contract.currentDayElapsed}/${contract.totalInstallments} — Capital Recovered: $${(contract.returnedCapitalCents / 100).toFixed(2)} / $${(contract.principalCents / 100).toFixed(2)})`,
    });
  }

  let reachedDay60 = false;
  if (contract.paidInstallments >= contract.totalInstallments) {
    reachedDay60 = true;
    contract.completed60DayAt = new Date().toISOString();
    if (contract.totalLifecycleDays === 90) {
      contract.phaseStatus = "POST_60_ROYALTY_90";
    } else {
      contract.phaseStatus = "COMPLETED";
    }
  }

  return {
    installmentsPaidNow,
    amountCreditedCents,
    reachedFullCapitalRecovery:
      contract.returnedCapitalCents >= contract.principalCents,
    reachedDay60,
  };
}
