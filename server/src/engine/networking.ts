import type { RankDefinition, User, LedgerLog } from "../models/types.ts";

export const RANK_DEFINITIONS: RankDefinition[] = [
  {
    level: 1,
    title: "Level 1: Associate Networker",
    minDirectReferrals: 0,
    minTeamMembers: 0,
    minCompletedCourses: 0,
    minTeamVolumeCents: 0,
    gen1CommissionPct: 5,
    gen2CommissionPct: 2,
    gen3CommissionPct: 1,
    royaltyPoolMultiplier: 1.0,
    plainEnglishSummary:
      "Full access to all 3 Referral Generations right from Day 1: earn 5% on Generation 1 (direct invites), 2% on Generation 2, and 1% on Generation 3 (8% total network payout), plus a 1.0x share in the Days 61–90 Royalty Pool.",
  },
  {
    level: 2,
    title: "Level 2: Senior Builder",
    minDirectReferrals: 3,
    minTeamMembers: 6,
    minCompletedCourses: 1,
    minTeamVolumeCents: 15000, // $150 team volume (e.g. 5 x $30 or 1 x $120 + 1 x $30)
    gen1CommissionPct: 5,
    gen2CommissionPct: 2,
    gen3CommissionPct: 1,
    royaltyPoolMultiplier: 1.5,
    plainEnglishSummary:
      "Invite 3 active members, complete 1 Academy course, and reach $150 team volume. Earn 5% Gen 1, 2% Gen 2, and 1% Gen 3 commissions + unlock the +$0.70/day Pro Booster on the $120 Pack and a 1.5x multiplier in the Days 61–90 Business Royalty Pool.",
  },
  {
    level: 3,
    title: "Level 3: Executive Ambassador",
    minDirectReferrals: 10,
    minTeamMembers: 30,
    minCompletedCourses: 2,
    minTeamVolumeCents: 120000, // $1,200 team volume (e.g. 10 x $120 packs)
    gen1CommissionPct: 5,
    gen2CommissionPct: 2,
    gen3CommissionPct: 1,
    royaltyPoolMultiplier: 3.0,
    plainEnglishSummary:
      "Lead a community of 30+ members and $1,200+ team volume. Earn 5% Gen 1, 2% Gen 2, and 1% Gen 3 commissions across your entire 3-tier organization + receive a TRIPLE (3.0x) dividend share in the Days 61–90 Business Royalty Pool.",
  },
];

export function getRankDefinition(level: 1 | 2 | 3): RankDefinition {
  return RANK_DEFINITIONS.find((r) => r.level === level) || RANK_DEFINITIONS[0];
}

export function evaluateAndUpgradeUserRank(user: User): {
  leveledUp: boolean;
  previousLevel: number;
  newLevel: 1 | 2 | 3;
} {
  const previousLevel = user.networkLevel;
  let qualifiedLevel: 1 | 2 | 3 = 1;

  for (const rank of RANK_DEFINITIONS) {
    const meetsReferrals = user.directReferralsCount >= rank.minDirectReferrals;
    const meetsTeam = user.totalTeamMembersCount >= rank.minTeamMembers;
    const meetsCourses =
      user.completedCourseIds.length >= rank.minCompletedCourses;
    const meetsVolume = user.teamVolumeCents >= rank.minTeamVolumeCents;

    if (meetsReferrals && meetsTeam && meetsCourses && meetsVolume) {
      qualifiedLevel = rank.level;
    }
  }

  if (qualifiedLevel > user.networkLevel) {
    user.networkLevel = qualifiedLevel;
  }

  return {
    leveledUp: user.networkLevel > previousLevel,
    previousLevel,
    newLevel: user.networkLevel,
  };
}

/**
 * Extracts up to 3 upline ancestor IDs from a user's materializedPath.
 * Example materializedPath: "/u-founder/u-ada/u-chidi/" -> ancestors for u-chidi are ["u-ada", "u-founder"]
 */
export function getUplineAncestorIds(user: User, maxGenerations = 3): string[] {
  const parts = user.materializedPath
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  const ancestors = parts.slice(0, -1).reverse();
  return ancestors.slice(0, maxGenerations);
}

/**
 * Distributes 3-Generation (5%, 2%, 1%) networking commissions on a new Product/Capital Pack purchase.
 * Open to all members across all 3 levels (max 8% total commission, preserving 92% working capital).
 */
export function distributeUplineCommissions(
  buyer: User,
  purchaseAmountCents: number,
  packName: string,
  usersMap: Map<string, User>,
  ledgerLogs: LedgerLog[]
): {
  totalCommissionPaidCents: number;
  payouts: Array<{
    uplineUserId: string;
    generation: number;
    amountCents: number;
  }>;
} {
  const ancestorIds = getUplineAncestorIds(buyer, 3);
  let totalCommissionPaidCents = 0;
  const payouts: Array<{
    uplineUserId: string;
    generation: number;
    amountCents: number;
  }> = [];

  buyer.personalVolumeCents += purchaseAmountCents;
  buyer.xpPoints += Math.max(15, Math.round(purchaseAmountCents / 100));

  ancestorIds.forEach((ancestorId, index) => {
    const generation = index + 1; // 1, 2, or 3
    const upline = usersMap.get(ancestorId);
    if (!upline) return;

    upline.teamVolumeCents += purchaseAmountCents;

    // 3-Level Open Referral Structure: Gen 1 = 5%, Gen 2 = 2%, Gen 3 = 1%
    let pct = 0;
    if (generation === 1) pct = 5;
    else if (generation === 2) pct = 2;
    else if (generation === 3) pct = 1;

    if (pct > 0) {
      const commissionCents = Number(
        ((purchaseAmountCents * pct) / 100).toFixed(2)
      );
      upline.availableBalanceCents = Number(
        (upline.availableBalanceCents + commissionCents).toFixed(2)
      );
      upline.totalCommissionsEarnedCents = Number(
        (upline.totalCommissionsEarnedCents + commissionCents).toFixed(2)
      );
      upline.xpPoints += 25;

      totalCommissionPaidCents = Number(
        (totalCommissionPaidCents + commissionCents).toFixed(2)
      );

      payouts.push({
        uplineUserId: upline.id,
        generation,
        amountCents: commissionCents,
      });

      ledgerLogs.unshift({
        id: `log-comm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        category: "NETWORK_COMMISSION",
        userId: upline.id,
        userName: upline.name,
        amountCents: commissionCents,
        direction: "CREDIT",
        description: `Gen ${generation} (${pct}%) Referral Bonus from ${buyer.name}'s ${packName}`,
      });
    }

    evaluateAndUpgradeUserRank(upline);
  });

  evaluateAndUpgradeUserRank(buyer);

  return { totalCommissionPaidCents, payouts };
}
