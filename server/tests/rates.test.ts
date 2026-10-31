import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { marketRateEngine } from "../src/engine/rates.ts";
import { globalStore } from "../src/engine/store.ts";

describe("Market Rate Engine & Multi-Timeframe Track-Back Sync", () => {
  it("provides snapshots for SPW/USD, USDC/USDT, USDT/NGN, and USDT/GHS with exact metrics", () => {
    const snap = marketRateEngine.getSnapshot();
    assert.ok(snap.spwUsd > 1.0, "SPW should trade above 1.00 USD");
    assert.ok(snap.usdcUsdt > 0.99 && snap.usdcUsdt < 1.01, "USDC/USDT should be stable around 1.00");
    assert.ok(snap.usdtNgn > 1000, "USDT/NGN should reflect live FX spot");
    assert.ok(snap.usdtGhs > 10, "USDT/GHS should reflect live FX spot");

    const pairs = ["SPW/USD", "USDC/USDT", "USDT/NGN", "USDT/GHS"] as const;
    pairs.forEach((p) => {
      const summary = snap.pairs[p];
      assert.ok(summary, `Missing pair summary for ${p}`);
      assert.ok(summary.currentPrice > 0, `${p} price must be positive`);
      assert.ok(summary.high24h >= summary.low24h, `${p} high >= low`);
      assert.ok(summary.volume24h > 0, `${p} volume > 0`);
    });
  });

  it("builds continuous OHLCV track-back series for 24H, 7D, 30D, and 90D timeframes", () => {
    const snap = marketRateEngine.getSnapshot();
    const timeframes = ["24H", "7D", "30D", "90D"] as const;

    timeframes.forEach((tf) => {
      const spwCandles = snap.pairs["SPW/USD"].candles[tf];
      assert.ok(Array.isArray(spwCandles) && spwCandles.length >= 10, `Timeframe ${tf} must have >= 10 candles`);

      // Verify candle continuity (track-back integrity)
      for (let i = 1; i < spwCandles.length; i++) {
        const prev = spwCandles[i - 1];
        const curr = spwCandles[i];
        assert.equal(
          curr.open,
          prev.close,
          `Candle continuity broken at index ${i} in ${tf}: curr.open (${curr.open}) !== prev.close (${prev.close})`
        );
        assert.ok(curr.high >= Math.max(curr.open, curr.close), `High must be >= max(open, close) at index ${i}`);
        assert.ok(curr.low <= Math.min(curr.open, curr.close), `Low must be <= min(open, close) at index ${i}`);
        assert.ok(curr.volume > 0, `Volume must be positive at index ${i}`);
      }
    });
  });

  it("records market tick on Flash Exchange and updates market rates", () => {
    const testUser = globalStore.users.get("u-test");
    assert.ok(testUser, "u-test user must exist");

    const fxOrder = globalStore.executeFlashExchange({
      userId: "u-test",
      direction: "usdt_to_usdc",
      amountCents: 2000, // $20 USDT
    });

    assert.equal(fxOrder.fromAsset, "USDT");
    assert.equal(fxOrder.toAsset, "USDC");
    assert.ok(fxOrder.toAmountCents > 0);

    const latestCandle = marketRateEngine.pairs["USDC/USDT"].candles["24H"].slice(-1)[0];
    assert.equal(latestCandle.eventNote, "Member Swap (USDT → USDC)");
  });

  it("syncs rates through globalStore.syncRates()", async () => {
    const prevSyncedAt = marketRateEngine.lastSyncedAt;
    const updated = await globalStore.syncRates();
    assert.ok(updated.spwUsd > 0);
    assert.ok(updated.pairs["SPW/USD"]);
    assert.ok(updated.lastSyncedAt);
  });
});
