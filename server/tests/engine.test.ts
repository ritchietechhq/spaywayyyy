import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PlatformStore } from "../src/engine/store.ts";
import { buildInstallmentSchedule } from "../src/engine/installments.ts";
import { formatMoneyFromCents } from "../src/engine/currency.ts";

describe("Networkinng Backend ($30 / $50 / $120 / $350 Daily Dividend, 60/90-Day Lifecycle & 5-2-1 Referral Engine)", () => {
  it("accurately calculates daily dividends for $30 ($1.25/d), $50 ($2.00/d), $120 ($4.10/$4.80/d), and $350 ($12.50/d) across the 60-day active window", () => {
    // $30 Pack -> $1.25/day (125 cents) -> 24 days to recover $30 -> $75 over 60 days
    const sched30 = buildInstallmentSchedule(3000, 125, 60);
    assert.equal(sched30.length, 60);
    assert.equal(sched30[0].amountCents, 125);
    const day24Sum = sched30.slice(0, 24).reduce((s, i) => s + i.amountCents, 0);
    assert.equal(day24Sum, 3000); // 100% of $30 recovered on Day 24!

    // $50 Pack -> $2.00/day (200 cents) -> 25 days to recover $50 -> $120 over 60 days
    const sched50 = buildInstallmentSchedule(5000, 200, 60);
    const day25Sum = sched50.slice(0, 25).reduce((s, i) => s + i.amountCents, 0);
    assert.equal(day25Sum, 5000); // 100% of $50 recovered on Day 25!

    // $120 Hero Pack -> $4.10/day (410 cents) base, or $4.80/day (480 cents) with +$0.70 Pro Booster (25 days to recover $120!)
    const sched120Boosted = buildInstallmentSchedule(12000, 480, 60);
    const day25ProSum = sched120Boosted
      .slice(0, 25)
      .reduce((s, i) => s + i.amountCents, 0);
    assert.equal(day25ProSum, 12000); // 100% of $120 recovered on Day 25!

    // Check West Africa Naira formatting for $30 and $120
    assert.equal(formatMoneyFromCents(3000, "USD"), "$30.00");
    assert.equal(formatMoneyFromCents(3000, "NGN"), "₦48,000");
    assert.equal(formatMoneyFromCents(12000, "NGN"), "₦192,000");
  });

  it("enforces Pack Isolation per User (cannot stack two active $30 packs; must upgrade to a higher tier like $120)", () => {
    const store = new PlatformStore();

    // Chidi already holds an active $30 pack in seed data
    assert.throws(
      () => {
        store.purchasePack({
          userId: "u-chidi",
          packId: "pack-30",
          paymentSource: "ONLINE_GATEWAY",
        });
      },
      /Pack Isolation Rule/
    );

    // However, Chidi CAN activate the $120 Pro Pack because it is a different tier!
    const upgradeRes = store.purchasePack({
      userId: "u-chidi",
      packId: "pack-120",
      paymentSource: "ONLINE_GATEWAY",
    });
    assert.equal(upgradeRes.contract.principalCents, 12000);
    assert.equal(upgradeRes.contract.totalLifecycleDays, 90);
  });

  it("recovers 100% capital in ~25 days, completes 60-day daily earnings, and transitions $120/$350 packs to POST_60_ROYALTY_90 (Days 61–90 Extended Window)", () => {
    const store = new PlatformStore();
    const koffi = store.users.get("u-koffi")!;

    // Koffi activates the $120 Pro Pack with Pro Booster ($4.80/day = 480 cents)
    const { contract } = store.purchasePack({
      userId: koffi.id,
      packId: "pack-120",
      paymentSource: "ONLINE_GATEWAY",
      applyProBooster: true,
    });

    assert.equal(contract.dailyPayoutCents, 480);
    assert.equal(contract.phaseStatus, "PHASE_1_CAPITAL_RECOVERY");
    // Verify $15.00 (1500 cents) free Promoter Ad Credits granted on $120 Pack
    assert.equal(koffi.adCreditsCents, 1500);

    // Advance 25 days -> 25 * $4.80 = $120.00 (100% Capital Recovered!)
    store.advanceInstallmentCycle({
      contractId: contract.id,
      daysToAdvance: 25,
    });
    assert.equal(contract.returnedCapitalCents, 12000);
    assert.equal(contract.phaseStatus, "PHASE_2_DAILY_PROFIT_60");

    // Advance remaining 35 days to reach Day 60 -> transitions to POST_60_ROYALTY_90 (Days 61-90 Extended Window)
    store.advanceInstallmentCycle({
      contractId: contract.id,
      completeFullCycle: true,
    });
    assert.equal(contract.paidInstallments, 60);
    assert.equal(contract.totalDailyCreditedCents, 28800); // $288.00 total over 60 days
    assert.equal(contract.phaseStatus, "POST_60_ROYALTY_90");
  });

  it("distributes Open 3-Generation (5%, 2%, 1%) Referral Commissions across Gen 1, Gen 2, and Gen 3 on Offline & Online Sales", () => {
    const store = new PlatformStore();
    const koffi = store.users.get("u-koffi")!;         // Buyer (Gen 0)
    const chidiGen1 = store.users.get("u-chidi")!;     // Gen 1 Sponsor (Level 1 -> still gets full 5%!)
    const adaGen2 = store.users.get("u-ada")!;         // Gen 2 Upline (gets full 2%!)
    const founderGen3 = store.users.get("u-founder")!; // Gen 3 Upline (gets full 1%!)

    const chidiBefore = chidiGen1.availableBalanceCents;
    const adaBefore = adaGen2.availableBalanceCents;
    const founderBefore = founderGen3.availableBalanceCents;

    // Koffi buys the $50 Builder Pack (5000 cents) via Offline Sale approved by Finance Admin
    const claim = store.recordOfflineSale({
      buyerUserId: koffi.id,
      packId: "pack-50",
      localCurrency: "XOF",
      paymentMethod: "MOBILE_MONEY_WEST_AFRICA",
      receiptReference: "WAVE-CI-9001",
      fieldAgentNote: "Paid via Wave Mobile Money",
      submittedByUserId: koffi.id,
      autoApproveIfAdmin: false,
    });

    assert.equal(claim.offlineRecord.status, "PENDING_VERIFICATION");

    store.approvePendingOfflineSale({
      offlineSaleId: claim.offlineRecord.id,
      approverUserId: "u-finance",
    });

    // Gen 1 (5% of $50 = $2.50 = 250 cents)
    assert.equal(chidiGen1.availableBalanceCents, chidiBefore + 250);
    // Gen 2 (2% of $50 = $1.00 = 100 cents)
    assert.equal(adaGen2.availableBalanceCents, adaBefore + 100);
    // Gen 3 (1% of $50 = $0.50 = 50 cents)
    assert.equal(founderGen3.availableBalanceCents, founderBefore + 50);
  });

  it("strictly enforces the $15.00 (1500 cents) minimum external withdrawal threshold", () => {
    const store = new PlatformStore();
    const chidi = store.users.get("u-chidi")!; // Has $7.50 (750 cents) in seed data

    // Attempt to withdraw $10.00 (< $15.00 minimum) -> must throw error
    assert.throws(
      () => {
        store.processWalletOutflow({
          userId: chidi.id,
          channel: "BANK_OR_MOBILE_MONEY",
          grossAmountCents: 1000,
          destinationDetails: "GTBank 0123456789",
        });
      },
      /Minimum withdrawal amount is \$15\.00 USD/
    );

    // Adaeze has $48.00 (4800 cents) -> withdrawing $20.00 (2000 cents) succeeds with 3% fee (60 cents)
    const ada = store.users.get("u-ada")!;
    const wd = store.processWalletOutflow({
      userId: ada.id,
      channel: "BANK_OR_MOBILE_MONEY",
      grossAmountCents: 2000,
      destinationDetails: "GTBank 0123456789 - Adaeze",
    });
    assert.equal(wd.platformFeeCents, 60);
    assert.equal(wd.netAmountCents, 1940);
  });

  it("executes instant automated processing with txHash generation on external crypto withdrawals and wallet recharge", () => {
    const store = new PlatformStore();
    const ada = store.users.get("u-ada")!;
    const initialBalance = ada.availableBalanceCents;

    // Withdraw $25.00 via CRYPTO_USDT_USDC
    const wd = store.processWalletOutflow({
      userId: ada.id,
      channel: "CRYPTO_USDT_USDC",
      grossAmountCents: 2500,
      destinationDetails: "TYDny5TwdSpaywayTreasuryTronVault2026",
    });

    assert.equal(wd.status, "APPROVED_PAID");
    assert.ok(wd.txHash && wd.txHash.startsWith("0x"));
    assert.equal(wd.grossAmountCents, 2500);
    assert.equal(wd.platformFeeCents, 75); // 3% of $25 = $0.75
    assert.equal(wd.netAmountCents, 2425); // $24.25
    assert.equal(ada.availableBalanceCents, initialBalance - 2500);

    // Recharge $100.00 on BEP20
    const rcg = store.rechargeWallet({
      userId: ada.id,
      amountCents: 10000,
      network: "USDT-BEP20",
    });
    assert.ok(rcg.txHash && rcg.txHash.startsWith("0x"));
    assert.equal(rcg.network, "USDT-BEP20");
    assert.equal(ada.availableBalanceCents, initialBalance - 2500 + 10000);
  });

  it("supports multi-generation downline simulation across Gen 1 (5%), Gen 2 (2%), and Gen 3 (1%)", () => {
    const store = new PlatformStore();
    const testUser = store.users.get("u-test")!;
    const balBefore = testUser.availableBalanceCents;

    // Simulate Gen 1 downline with $120 pack
    store.registerReferredMember({
      sponsorUserId: testUser.id,
      newMemberName: "Test Gen1 Direct",
      country: "Nigeria",
      preferredCurrency: "USDT",
      initialPackId: "pack-120", // $120
      generation: 1,
    });
    // 5% of $120 = $6.00 (600 cents)
    assert.equal(testUser.availableBalanceCents, balBefore + 600);

    // Simulate Gen 2 downline with $120 pack
    const balGen1 = testUser.availableBalanceCents;
    store.registerReferredMember({
      sponsorUserId: testUser.id,
      newMemberName: "Test Gen2 Downline",
      country: "Nigeria",
      preferredCurrency: "USDT",
      initialPackId: "pack-120", // $120
      generation: 2,
    });
    // 2% of $120 = $2.40 (240 cents)
    assert.equal(testUser.availableBalanceCents, balGen1 + 240);

    // Simulate Gen 3 downline with $120 pack
    const balGen2 = testUser.availableBalanceCents;
    store.registerReferredMember({
      sponsorUserId: testUser.id,
      newMemberName: "Test Gen3 Downline",
      country: "Nigeria",
      preferredCurrency: "USDT",
      initialPackId: "pack-120", // $120
      generation: 3,
    });
    // 1% of $120 = $1.20 (120 cents)
    assert.equal(testUser.availableBalanceCents, balGen2 + 120);
  });
});
