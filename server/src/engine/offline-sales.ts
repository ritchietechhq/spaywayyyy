import type {
  CurrencyCode,
  FounderTreasurySummary,
  InstallmentContract,
  InstallmentScheduleType,
  LedgerLog,
  OfflinePaymentMethod,
  OfflineSaleRecord,
  TradePack,
  User,
  UserRole,
} from "../models/types.ts";
import { formatMoneyFromCents } from "./currency.ts";
import { createDailyDividendContract } from "./installments.ts";
import { distributeUplineCommissions } from "./networking.ts";

export function submitOfflineSaleRecord(params: {
  buyer: User;
  pack: TradePack;
  localCurrency: CurrencyCode;
  schedulePreference: InstallmentScheduleType;
  paymentMethod: OfflinePaymentMethod;
  receiptReference: string;
  fieldAgentNote: string;
  submittedByRole: UserRole;
  submittedByUserId: string;
  autoApproveIfAdmin: boolean;
  usersMap: Map<string, User>;
  contracts: InstallmentContract[];
  treasury: FounderTreasurySummary;
  ledgerLogs: LedgerLog[];
}): {
  offlineRecord: OfflineSaleRecord;
  activatedContract?: InstallmentContract;
} {
  const {
    buyer,
    pack,
    localCurrency,
    schedulePreference,
    paymentMethod,
    receiptReference,
    fieldAgentNote,
    submittedByRole,
    submittedByUserId,
    autoApproveIfAdmin,
    usersMap,
    contracts,
    treasury,
    ledgerLogs,
  } = params;

  // Enforce Pack Isolation per User (1 active pack per tier per user)
  const existingActiveForPack = contracts.find(
    (c) =>
      c.userId === buyer.id &&
      c.packId === pack.id &&
      c.phaseStatus !== "COMPLETED"
  );
  if (existingActiveForPack) {
    throw new Error(
      `Pack Isolation Rule: ${buyer.name} already has an active ${pack.name}. Please upgrade to a higher tier (such as the $120 Pro Pack)!`
    );
  }

  const isStaff =
    submittedByRole === "SUPER_ADMIN" || submittedByRole === "FINANCE_ADMIN";
  const shouldApproveNow = isStaff && autoApproveIfAdmin;

  const record: OfflineSaleRecord = {
    id: `off-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    buyerUserId: buyer.id,
    buyerName: buyer.name,
    packId: pack.id,
    packName: pack.name,
    amountCents: pack.priceCents,
    localCurrency,
    localAmountFormatted: formatMoneyFromCents(pack.priceCents, localCurrency),
    schedulePreference,
    paymentMethod,
    receiptReference,
    fieldAgentNote,
    submittedByRole,
    submittedByUserId,
    status: shouldApproveNow ? "APPROVED" : "PENDING_VERIFICATION",
    createdAt: new Date().toISOString(),
  };

  if (shouldApproveNow) {
    const activated = approveOfflineSaleRecord({
      record,
      approverUserId: submittedByUserId,
      buyer,
      pack,
      usersMap,
      contracts,
      treasury,
      ledgerLogs,
    });
    return { offlineRecord: record, activatedContract: activated };
  }

  return { offlineRecord: record };
}

export function approveOfflineSaleRecord(params: {
  record: OfflineSaleRecord;
  approverUserId: string;
  buyer: User;
  pack: TradePack;
  usersMap: Map<string, User>;
  contracts: InstallmentContract[];
  treasury: FounderTreasurySummary;
  ledgerLogs: LedgerLog[];
}): InstallmentContract {
  const {
    record,
    approverUserId,
    buyer,
    pack,
    usersMap,
    contracts,
    treasury,
    ledgerLogs,
  } = params;

  record.status = "APPROVED";
  record.approvedByUserId = approverUserId;
  record.reviewedAt = new Date().toISOString();

  const contract = createDailyDividendContract({
    user: buyer,
    pack,
    scheduleType: record.schedulePreference,
    sourceChannel: "OFFLINE_APPROVED",
  });

  record.contractId = contract.id;
  contracts.unshift(contract);

  treasury.activeWorkingCapitalDeployedCents = Number(
    (treasury.activeWorkingCapitalDeployedCents + pack.priceCents).toFixed(2)
  );

  ledgerLogs.unshift({
    id: `log-off-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    category: "OFFLINE_SALE_APPROVED",
    userId: buyer.id,
    userName: buyer.name,
    amountCents: pack.priceCents,
    direction: "CREDIT",
    description: `Offline Sale Approved (${record.paymentMethod} Ref: ${record.receiptReference}) — ${pack.name} [${record.localAmountFormatted}]`,
  });

  distributeUplineCommissions(
    buyer,
    pack.priceCents,
    pack.name,
    usersMap,
    ledgerLogs
  );

  return contract;
}
