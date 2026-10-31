import type {
  BusinessDividendDeclaration,
  FounderTreasurySummary,
  InstallmentContract,
  LedgerLog,
  User,
} from "../models/types.ts";
import { getRankDefinition } from "./networking.ts";

export function declareAndDistributePost28Royalties(params: {
  title: string;
  periodType: "DAILY" | "TWICE_WEEKLY" | "WEEKLY";
  grossBusinessProfitCents: number;
  declaredMemberPoolCents: number;
  declaredByUserId: string;
  contracts: InstallmentContract[];
  usersMap: Map<string, User>;
  treasury: FounderTreasurySummary;
  ledgerLogs: LedgerLog[];
}): {
  declaration: BusinessDividendDeclaration;
  distributions: Array<{
    contractId: string;
    userId: string;
    userName: string;
    weightedUnits: number;
    payoutCents: number;
  }>;
} {
  const {
    title,
    periodType,
    grossBusinessProfitCents,
    declaredMemberPoolCents,
    declaredByUserId,
    contracts,
    usersMap,
    treasury,
    ledgerLogs,
  } = params;

  // Eligible contracts are those in the Days 61-90 Extended Business Royalty Window ($120 Pro & $350 Executive)
  const eligibleContracts = contracts.filter(
    (c) => c.phaseStatus === "POST_60_ROYALTY_90"
  );

  const weightedList: Array<{
    contract: InstallmentContract;
    user: User;
    weightedUnits: number;
  }> = [];

  let totalWeightedUnits = 0;

  for (const contract of eligibleContracts) {
    const user = usersMap.get(contract.userId);
    if (!user) continue;
    const rankDef = getRankDefinition(user.networkLevel);
    const weightedUnits = Number(
      (contract.royaltyUnits * rankDef.royaltyPoolMultiplier).toFixed(4)
    );
    totalWeightedUnits = Number(
      (totalWeightedUnits + weightedUnits).toFixed(4)
    );
    weightedList.push({ contract, user, weightedUnits });
  }

  const companyRetainedSpreadCents = Math.max(
    0,
    Number((grossBusinessProfitCents - declaredMemberPoolCents).toFixed(2))
  );

  treasury.retainedBusinessSpreadCents = Number(
    (treasury.retainedBusinessSpreadCents + companyRetainedSpreadCents).toFixed(
      2
    )
  );
  treasury.totalFounderRevenueCents = Number(
    (treasury.totalFounderRevenueCents + companyRetainedSpreadCents).toFixed(2)
  );

  const distributions: Array<{
    contractId: string;
    userId: string;
    userName: string;
    weightedUnits: number;
    payoutCents: number;
  }> = [];

  if (totalWeightedUnits > 0 && declaredMemberPoolCents > 0) {
    for (const item of weightedList) {
      const shareRatio = item.weightedUnits / totalWeightedUnits;
      const payoutCents = Number(
        (declaredMemberPoolCents * shareRatio).toFixed(2)
      );

      if (payoutCents > 0) {
        item.contract.royaltyEarningsCents = Number(
          (item.contract.royaltyEarningsCents + payoutCents).toFixed(2)
        );
        item.user.availableBalanceCents = Number(
          (item.user.availableBalanceCents + payoutCents).toFixed(2)
        );
        item.user.totalRoyaltiesEarnedCents = Number(
          (item.user.totalRoyaltiesEarnedCents + payoutCents).toFixed(2)
        );
        item.user.xpPoints += 20;

        treasury.totalRoyaltiesPaidToMembersCents = Number(
          (treasury.totalRoyaltiesPaidToMembersCents + payoutCents).toFixed(2)
        );

        distributions.push({
          contractId: item.contract.id,
          userId: item.user.id,
          userName: item.user.name,
          weightedUnits: item.weightedUnits,
          payoutCents,
        });

        ledgerLogs.unshift({
          id: `log-roy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toISOString(),
          category: "POST_60_BUSINESS_ROYALTY",
          userId: item.user.id,
          userName: item.user.name,
          amountCents: payoutCents,
          direction: "CREDIT",
          description: `${title} (${periodType}): Days 61–90 Extended Business Royalty on ${item.contract.packName} (${item.weightedUnits}x weighted units)`,
        });
      }
    }
  }

  const declaration: BusinessDividendDeclaration = {
    id: `div-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    periodType,
    grossBusinessProfitCents,
    declaredMemberPoolCents,
    companyRetainedSpreadCents,
    eligibleContractsCount: eligibleContracts.length,
    totalWeightedUnits,
    declaredByUserId,
    createdAt: new Date().toISOString(),
  };

  return { declaration, distributions };
}
