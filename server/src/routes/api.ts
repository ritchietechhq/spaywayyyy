import { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { globalStore } from "../engine/store.ts";

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  const parsedUrl = new URL(req.url || "/", "http://localhost:4000");
  const authHeader = req.headers.authorization || "";
  const tokenUser = globalStore.resolveUserFromToken(authHeader);

  if (req.method === "GET" && parsedUrl.pathname === "/health") {
    sendJson(res, 200, {
      status: "ok",
      service: "spayway-server",
      version: "1.0.0",
    });
    return;
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/state") {
    const queryUserId = parsedUrl.searchParams.get("userId");
    const effectiveUserId = tokenUser?.id || queryUserId || "u-member";
    sendJson(res, 200, globalStore.getStateSnapshot(effectiveUserId));
    return;
  }

  if (req.method === "GET" && parsedUrl.pathname === "/api/rates") {
    sendJson(res, 200, globalStore.getStateSnapshot().marketRates);
    return;
  }

  if (req.method === "POST" && parsedUrl.pathname === "/api/action") {
    try {
      const body = await readJsonBody(req);
      const { action, payload = {}, activeUserId } = body;
      const effectiveUserId =
        tokenUser?.id || activeUserId || payload.userId || "u-member";
      let result: unknown = null;

      switch (action) {
        case "CREATE_ACCOUNT":
        case "REGISTER_ACCOUNT": {
          const { user, token } = globalStore.createCleanUser(payload);
          sendJson(res, 200, {
            ok: true,
            token,
            result: user,
            state: globalStore.getStateSnapshot(user.id),
          });
          return;
        }
        case "LOGIN_ACCOUNT": {
          const { user, token } = globalStore.loginUser(payload);
          sendJson(res, 200, {
            ok: true,
            token,
            result: user,
            state: globalStore.getStateSnapshot(user.id),
          });
          return;
        }
        case "RECHARGE_WALLET":
          result = globalStore.rechargeWallet({
            userId: effectiveUserId,
            amountCents: payload.amountCents,
            network: payload.network,
            txHash: payload.txHash,
          });
          break;
        case "FLASH_EXCHANGE":
          result = globalStore.executeFlashExchange({
            userId: effectiveUserId,
            direction: payload.direction,
            amountCents: payload.amountCents,
          });
          break;
        case "SAVINGS_JAR":
          result = globalStore.allocateSavingsJar({
            userId: effectiveUserId,
            direction: payload.direction || "DEPOSIT_TO_JAR",
            amountCents: payload.amountCents,
          });
          break;
        case "SAVE_WITHDRAWAL_METHOD":
          result = globalStore.saveWithdrawalMethod({
            userId: effectiveUserId,
            channel: payload.channel,
            label: payload.label,
            destination: payload.destination,
          });
          break;
        case "LIKE_ARTICLE":
          result = globalStore.toggleArticleLike({
            userId: effectiveUserId,
            articleId: payload.articleId,
          });
          break;
        case "FAVORITE_ARTICLE":
          result = globalStore.toggleArticleFavorite({
            userId: effectiveUserId,
            articleId: payload.articleId,
          });
          break;
        case "VIEW_ARTICLE":
          result = globalStore.incrementArticleView({
            articleId: payload.articleId,
          });
          break;
        case "UNLOCK_MILESTONE":
          result = globalStore.unlockNextMilestone({
            userId: effectiveUserId,
          });
          break;
        case "UPDATE_PROFILE":
          result = globalStore.updateUserProfile({
            userId: effectiveUserId,
            name: payload.name,
            preferredCurrency: payload.preferredCurrency,
          });
          break;
        case "CLAIM_SAVINGS_YIELD":
          result = globalStore.claimSavingsYield({
            userId: effectiveUserId,
          });
          break;
        case "SYNC_RATES":
          result = await globalStore.syncRates();
          break;
        case "COMMENT_ARTICLE":
          result = globalStore.commentOnArticle({
            userId: effectiveUserId,
            articleId: payload.articleId,
            text: payload.text,
          });
          break;
        case "PUBLISH_ARTICLE":
          result = globalStore.publishCreatorArticle({
            userId: effectiveUserId,
            category: payload.category,
            title: payload.title,
            excerpt: payload.excerpt,
          });
          break;
        case "COMPLETE_TASK":
          result = globalStore.completeUserTask({
            userId: effectiveUserId,
            taskId: payload.taskId,
          });
          break;
        case "SUBMIT_SUPPORT_TICKET":
          result = globalStore.submitSupportTicket({
            userId: effectiveUserId,
            subject: payload.subject,
            message: payload.message,
          });
          break;
        case "PURCHASE_PACK":
          result = globalStore.purchasePack({
            ...payload,
            userId: payload.userId || effectiveUserId,
          });
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
          result = globalStore.processWalletOutflow({
            ...payload,
            userId: payload.userId || effectiveUserId,
          });
          break;
        case "CHANGE_CURRENCY": {
          const user = globalStore.users.get(effectiveUserId);
          if (user) {
            user.preferredCurrency = payload.currency;
          }
          result = { updated: true };
          break;
        }
        default:
          sendJson(res, 400, { ok: false, error: `Unknown action: ${action}` });
          return;
      }

      sendJson(res, 200, {
        ok: true,
        result,
        state: globalStore.getStateSnapshot(effectiveUserId),
      });
      return;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Server operation failed";
      sendJson(res, 400, { ok: false, error: message });
      return;
    }
  }

  sendJson(res, 404, { error: "Route not found" });
}
