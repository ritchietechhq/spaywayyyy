import { NextRequest, NextResponse } from "next/server";
import { globalStore } from "../../../../../server/src/engine/store";

const SERVER_URL = process.env.BACKEND_SERVER_URL || "http://127.0.0.1:4000";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || "u-ada";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 600);
    const res = await fetch(`${SERVER_URL}/api/state?userId=${encodeURIComponent(userId)}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback to direct server engine instance when running standalone
  }

  return NextResponse.json(globalStore.getStateSnapshot(userId));
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 600);
    const res = await fetch(`${SERVER_URL}/api/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok || res.status === 400) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }
  } catch {
    // Fallback to direct server engine instance
  }

  try {
    const { action, payload, activeUserId } = body;
    let result: unknown = null;

    switch (action) {
      case "PURCHASE_PACK":
        result = globalStore.purchasePack(payload);
        break;
      case "ADVANCE_INSTALLMENT":
        result = globalStore.advanceInstallmentCycle(payload);
        break;
      case "RECORD_OFFLINE_SALE":
        result = globalStore.recordOfflineSale(payload);
        break;
      case "APPROVE_OFFLINE_SALE":
        result = globalStore.approvePendingOfflineSale(payload);
        break;
      case "DECLARE_DIVIDEND_POOL":
        result = globalStore.declareBusinessDividend(payload);
        break;
      case "REGISTER_REFERRAL":
        result = globalStore.registerReferredMember(payload);
        break;
      case "COMPLETE_COURSE":
        result = globalStore.completeCourse(payload);
        break;
      case "LAUNCH_AD_CAMPAIGN":
        result = globalStore.launchAdCampaign(payload);
        break;
      case "WALLET_OUTFLOW":
        result = globalStore.processWalletOutflow(payload);
        break;
      case "CHANGE_CURRENCY": {
        const user = globalStore.users.get(payload.userId);
        if (user) {
          user.preferredCurrency = payload.currency;
        }
        result = { updated: true };
        break;
      }
      default:
        return NextResponse.json(
          { ok: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      ok: true,
      result,
      state: globalStore.getStateSnapshot(
        activeUserId || payload?.userId || "u-ada"
      ),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Server operation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
