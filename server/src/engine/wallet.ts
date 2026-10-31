import type {
  CurrencyCode,
  FounderTreasurySummary,
  LedgerLog,
  User,
  WithdrawalOrTransferRecord,
} from "../models/types.ts";

export const MIN_WITHDRAWAL_CENTS = 1500;       // $15.00 USD minimum external withdrawal
export const EXTERNAL_WITHDRAWAL_FEE_PCT = 3.0; // 3% fee on Bank/Mobile Money & Crypto withdrawals
export const P2P_TRANSFER_FEE_PCT = 1.0;        // 1% fee on P2P transfers
export const INTERNAL_REPURCHASE_FEE_PCT = 0.0; // 0% fee when compounding/re-buying packs

export function generateTxHash(channel: string): string {
  if (channel === "CRYPTO_USDT_USDC" || channel.includes("CRYPTO")) {
    const chars = "0123456789abcdef";
    let hash = "0x";
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }
  return `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function requestExternalWithdrawal(params: {
  user: User;
  channel: "BANK_OR_MOBILE_MONEY" | "CRYPTO_USDT_USDC";
  grossAmountCents: number;
  currency: CurrencyCode;
  destinationDetails: string;
  treasury: FounderTreasurySummary;
  ledgerLogs: LedgerLog[];
}): WithdrawalOrTransferRecord {
  const {
    user,
    channel,
    grossAmountCents,
    currency,
    destinationDetails,
    treasury,
    ledgerLogs,
  } = params;

  if (grossAmountCents < MIN_WITHDRAWAL_CENTS) {
    throw new Error(
      `Minimum withdrawal amount is $15.00 USD (₦24,000). Requested: $${(
        grossAmountCents / 100
      ).toFixed(2)}.`
    );
  }
  if (user.availableBalanceCents < grossAmountCents) {
    throw new Error("Insufficient available wallet balance.");
  }

  const platformFeeCents = Number(
    ((grossAmountCents * EXTERNAL_WITHDRAWAL_FEE_PCT) / 100).toFixed(2)
  );
  const netAmountCents = Number(
    (grossAmountCents - platformFeeCents).toFixed(2)
  );

  user.availableBalanceCents = Number(
    (user.availableBalanceCents - grossAmountCents).toFixed(2)
  );

  treasury.withdrawalAndP2PFeesCents = Number(
    (treasury.withdrawalAndP2PFeesCents + platformFeeCents).toFixed(2)
  );
  treasury.totalFounderRevenueCents = Number(
    (treasury.totalFounderRevenueCents + platformFeeCents).toFixed(2)
  );

  const txHash = generateTxHash(channel);
  const nowIso = new Date().toISOString();

  const record: WithdrawalOrTransferRecord = {
    id: `wd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: user.id,
    userName: user.name,
    channel,
    grossAmountCents,
    platformFeeCents,
    netAmountCents,
    currency,
    destinationDetails,
    status: "APPROVED_PAID",
    txHash,
    createdAt: nowIso,
    processedAt: nowIso,
  };

  ledgerLogs.unshift({
    id: `log-wd-out-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowIso,
    category: "WITHDRAWAL",
    userId: user.id,
    userName: user.name,
    amountCents: netAmountCents,
    direction: "DEBIT",
    description: `External ${channel} Withdrawal to ${destinationDetails} (TxHash: ${txHash.slice(0, 10)}...)`,
  });

  ledgerLogs.unshift({
    id: `log-wd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowIso,
    category: "WITHDRAWAL_FEE",
    userId: user.id,
    userName: user.name,
    amountCents: platformFeeCents,
    direction: "TREASURY",
    description: `3% Platform Maintenance Fee on ${user.name}'s $${(
      grossAmountCents / 100
    ).toFixed(2)} ${channel} withdrawal`,
  });

  return record;
}

export function executeP2PTransfer(params: {
  sender: User;
  recipient: User;
  grossAmountCents: number;
  treasury: FounderTreasurySummary;
  ledgerLogs: LedgerLog[];
}): WithdrawalOrTransferRecord {
  const { sender, recipient, grossAmountCents, treasury, ledgerLogs } = params;

  if (sender.id === recipient.id) {
    throw new Error("Cannot transfer to the same account.");
  }
  if (grossAmountCents <= 0) {
    throw new Error("Transfer amount must be greater than zero.");
  }
  if (sender.availableBalanceCents < grossAmountCents) {
    throw new Error("Insufficient available wallet balance for P2P transfer.");
  }

  const platformFeeCents = Number(
    ((grossAmountCents * P2P_TRANSFER_FEE_PCT) / 100).toFixed(2)
  );
  const netAmountCents = Number(
    (grossAmountCents - platformFeeCents).toFixed(2)
  );

  sender.availableBalanceCents = Number(
    (sender.availableBalanceCents - grossAmountCents).toFixed(2)
  );
  recipient.availableBalanceCents = Number(
    (recipient.availableBalanceCents + netAmountCents).toFixed(2)
  );

  treasury.withdrawalAndP2PFeesCents = Number(
    (treasury.withdrawalAndP2PFeesCents + platformFeeCents).toFixed(2)
  );
  treasury.totalFounderRevenueCents = Number(
    (treasury.totalFounderRevenueCents + platformFeeCents).toFixed(2)
  );

  const txHash = generateTxHash("P2P");
  const nowIso = new Date().toISOString();

  const record: WithdrawalOrTransferRecord = {
    id: `p2p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: sender.id,
    userName: sender.name,
    channel: "P2P_MEMBER_TRANSFER",
    grossAmountCents,
    platformFeeCents,
    netAmountCents,
    currency: sender.preferredCurrency,
    destinationDetails: `P2P Transfer to ${recipient.name} (${recipient.referralCode})`,
    recipientUserId: recipient.id,
    status: "APPROVED_PAID",
    txHash,
    createdAt: nowIso,
    processedAt: nowIso,
  };

  ledgerLogs.unshift({
    id: `log-p2p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    category: "P2P_TRANSFER",
    userId: sender.id,
    userName: sender.name,
    amountCents: netAmountCents,
    direction: "DEBIT",
    description: `P2P Transfer sent to ${recipient.name} (1% fee: $${(
      platformFeeCents / 100
    ).toFixed(2)} to Treasury)`,
  });

  return record;
}
