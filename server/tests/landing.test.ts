import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { globalStore } from "../src/engine/store.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "client");
const prismaSchema = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "..", "prisma", "schema.prisma"),
  "utf8"
);
const landingHtml = readFileSync(join(root, "landing.html"), "utf8");
const landingCss = readFileSync(join(root, "styles", "spayway.css"), "utf8");
const authHtml = readFileSync(join(root, "auth.html"), "utf8");
const authJs = readFileSync(join(root, "scripts", "auth.js"), "utf8");
const authCss = readFileSync(join(root, "styles", "auth.css"), "utf8");
const appHtml = readFileSync(join(root, "app.html"), "utf8");
const appJs = readFileSync(join(root, "scripts", "app.js"), "utf8");
const appCss = readFileSync(join(root, "styles", "app.css"), "utf8");

describe("Spayway Balanced Public Landing Page (/), Auth Portal (/auth), Prisma Schema & Isolated Workspace (/app)", () => {
  it("contains balanced hero layout and Sign In / Register CTAs linking to /auth without theme/currency clutter", () => {
    const ids = ["pillars", "discover", "academy", "faq"];
    for (const id of ids) {
      assert.match(landingHtml, new RegExp(`id="${id}"`), `missing section #${id}`);
    }
    assert.match(landingHtml, /\/auth\?mode=signin/);
    assert.match(landingHtml, /\/auth\?mode=register/);
    assert.doesNotMatch(landingHtml, /themeSwitcher/);
    assert.doesNotMatch(landingHtml, /data-cur=/);
    assert.match(landingHtml, /hero-arch-grid/);
    assert.match(landingHtml, /<footer class="footer">/);
  });

  it("uses a solid-color design with no gradients or glassmorphism across /, /auth, and /app", () => {
    assert.doesNotMatch(landingCss, /linear-gradient|radial-gradient|backdrop-filter/i);
    assert.doesNotMatch(authCss, /linear-gradient|radial-gradient|backdrop-filter/i);
    assert.doesNotMatch(appCss, /linear-gradient|radial-gradient|backdrop-filter/i);
  });

  it("requires Invitation Code on /auth and removes the '181 Countries' / 'All Countries' label", () => {
    assert.doesNotMatch(authHtml, /countryCountLabel|All Countries|181 Countries/);
    assert.doesNotMatch(authJs, /countryCountLabel/);
    assert.match(authHtml, /id="inviteInput"[\s\S]*?required/);
    assert.match(authHtml, /Invitation Code \*/);
    for (const code of ["\\+234", "\\+233", "\\+225", "\\+44", "\\+1", "\\+971", "\\+91"]) {
      assert.match(authJs, new RegExp(code), `missing country dial code ${code}`);
    }
  });

  it("enforces required & valid Invitation Code in backend registration and isolates each user's workspace", () => {
    assert.throws(
      () =>
        globalStore.createCleanUser({
          phone: "8011112222",
          countryCode: "+234",
          password: "password123",
          invitationCode: "",
        }),
      /Invitation Code is required/
    );

    assert.throws(
      () =>
        globalStore.createCleanUser({
          phone: "8011112222",
          countryCode: "+234",
          password: "password123",
          invitationCode: "INVALID-CODE-999",
        }),
      /Invalid Invitation Code/
    );

    const regA = globalStore.createCleanUser({
      phone: "8099887766",
      countryCode: "+234",
      password: "secretPassword1",
      invitationCode: "SPAYWAY",
    });
    assert.ok(regA.token.startsWith("spw_"));
    assert.equal(regA.user.availableBalanceCents, 0);

    // Second user registers using User A's referralCode
    const regB = globalStore.createCleanUser({
      email: "userb@spayway.app",
      password: "secretPassword2",
      invitationCode: regA.user.referralCode,
    });
    assert.equal(regB.user.referredById, regA.user.id);

    // Isolate User A's wallet & participation from User B
    globalStore.rechargeWallet({ userId: regA.user.id, amountCents: 5000 });
    globalStore.executeFlashExchange({
      userId: regA.user.id,
      direction: "usdt_to_usdc",
      amountCents: 2000,
    });
    globalStore.allocateSavingsJar({
      userId: regA.user.id,
      direction: "DEPOSIT_TO_JAR",
      amountCents: 1000,
    });
    globalStore.toggleArticleLike({ userId: regA.user.id, articleId: "art-1" });

    const snapA = globalStore.getStateSnapshot(regA.user.id);
    const snapB = globalStore.getStateSnapshot(regB.user.id);

    assert.equal(snapA.activeUser.availableBalanceCents, 2000);
    assert.equal(snapA.isolatedWorkspace.usdcBalanceCents, 2000);
    assert.equal(snapA.isolatedWorkspace.savingsJarCents, 1000);
    assert.deepEqual(snapA.isolatedWorkspace.likedArticleIds, ["art-1"]);

    // User B remains completely isolated at 0
    assert.equal(snapB.activeUser.availableBalanceCents, 0);
    assert.equal(snapB.isolatedWorkspace.usdcBalanceCents, 0);
    assert.equal(snapB.isolatedWorkspace.savingsJarCents, 0);
    assert.deepEqual(snapB.isolatedWorkspace.likedArticleIds, []);
  });

  it("maps all 20+ modules in prisma/schema.prisma", () => {
    for (const modelName of [
      "model User",
      "model AuthSession",
      "model UserWallet",
      "model WithdrawalMethod",
      "model FlashExchangeOrder",
      "model SavingsJarTransaction",
      "model TradePack",
      "model InstallmentContract",
      "model InstallmentItem",
      "model Article",
      "model ArticleLike",
      "model ArticleComment",
      "model TaskDefinition",
      "model UserTaskCompletion",
      "model UserMilestoneProgress",
      "model SupportFaq",
      "model SupportTicket",
      "model WithdrawalOrTransferRecord",
      "model LedgerLog",
      "model FounderTreasury",
    ]) {
      assert.match(prismaSchema, new RegExp(modelName), `missing Prisma ${modelName}`);
    }
  });

  it("does NOT expose internal earning patterns, daily dividend payouts, or referral percentages on the public landing page", () => {
    const privateStructurePatterns = [
      /\$1\.25\s*\/\s*day/i,
      /\$4\.80\s*\/\s*day/i,
      /\$12\.50\s*\/\s*day/i,
      /capital back in \d+ days/i,
      /24 days/i,
      /25 days/i,
      /5%\s*\/\s*2%\s*\/\s*1%/i,
      /daily dividend/i,
    ];
    for (const re of privateStructurePatterns) {
      assert.doesNotMatch(
        landingHtml,
        re,
        `Public landing page must not expose private earning pattern: ${re}`
      );
    }
  });

  it("includes the 3-column in-app workspace in /app (Home, Discover, Stake, Team, Personal Center, Milestone, Upline, Support Center, Savings Jar)", () => {
    assert.doesNotMatch(appHtml, /cdn\.tailwindcss\.com/);
    for (const item of [
      "Home",
      "Discover",
      "Stake",
      "Team",
      "Personal Center",
      "Milestone",
      "Upline",
      "Support Center",
      "Customer Support",
      "Savings Jar",
      "Flexible Asset List",
      "Income Composition",
      "Article ranking",
      "Your participation",
      "Candlestick Chart",
      "Current Price",
      "Hot news",
      "floating-dock",
      "mobile-bottom-nav",
      "sidebar-user-card",
    ]) {
      assert.match(appJs, new RegExp(item), `missing app feature ${item}`);
    }
  });

  it("provides a ready-to-use Test Account (test@spayway.app / Spayway123! / TEST777) and supports all dashboard actions", () => {
    const loginRes = globalStore.loginUser({
      identifier: "test@spayway.app",
      password: "Spayway123!",
    });
    assert.equal(loginRes.user.id, "u-test");
    assert.equal(loginRes.user.referralCode, "TEST777");
    assert.ok(loginRes.token.startsWith("spw_"));

    const snapBefore = globalStore.getStateSnapshot("u-test");
    assert.ok(snapBefore.activeUser.availableBalanceCents >= 25000);
    assert.equal(snapBefore.isolatedWorkspace.usdcBalanceCents, 5000);
    assert.equal(snapBefore.isolatedWorkspace.savingsJarCents, 3500);
    assert.ok(snapBefore.userContracts.length >= 1);

    // Test converting SPW Points -> USDT via Flash Exchange
    const usdtBefore = snapBefore.activeUser.availableBalanceCents;
    const fxRes = globalStore.executeFlashExchange({
      userId: "u-test",
      direction: "spw_to_usdt",
      amountCents: 1000, // 10 SPW -> real SPW/USD rate
    });
    assert.equal(
      globalStore.users.get("u-test")!.availableBalanceCents,
      usdtBefore + fxRes.toAmountCents
    );

    // Test unlocking next milestone stage (Stage 3)
    const msRes = globalStore.unlockNextMilestone({ userId: "u-test" });
    assert.equal(msRes.stageNumber, 3);

    // Test claiming daily Savings Jar yield
    const yieldRes = globalStore.claimSavingsYield({ userId: "u-test" });
    assert.ok(yieldRes.yieldCents >= 50);

    // Test Article View & Favorite
    globalStore.incrementArticleView({ articleId: "art-1" });
    const favRes = globalStore.toggleArticleFavorite({
      userId: "u-test",
      articleId: "art-1",
    });
    assert.equal(favRes.favorited, true);
  });
});
