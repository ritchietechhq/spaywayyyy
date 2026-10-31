import type { CurrencyCode } from "../models/types.ts";

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  rateFromUsd: number; // 1 USD = X units of currency
  region: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    rateFromUsd: 1,
    region: "Global / International",
  },
  NGN: {
    code: "NGN",
    name: "Nigerian Naira",
    symbol: "₦",
    rateFromUsd: 1600, // $7.50 = ₦12,000 accessible entry point
    region: "Nigeria (West Africa)",
  },
  GHS: {
    code: "GHS",
    name: "Ghanaian Cedi",
    symbol: "GH₵",
    rateFromUsd: 15.5, // $7.50 = GH₵116.25
    region: "Ghana (West Africa)",
  },
  XOF: {
    code: "XOF",
    name: "West African CFA Franc",
    symbol: "CFA ",
    rateFromUsd: 610, // $7.50 = 4,575 CFA (Senegal, Côte d'Ivoire, Benin, Togo)
    region: "Francophone West Africa (UEMOA)",
  },
  USDT: {
    code: "USDT",
    name: "Tether USD (TRC20/BEP20)",
    symbol: "₮",
    rateFromUsd: 1,
    region: "Global Crypto",
  },
  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    rateFromUsd: 0.78,
    region: "United Kingdom / Diaspora",
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    rateFromUsd: 0.92,
    region: "Europe / Diaspora",
  },
};

export function formatMoneyFromCents(
  usdCents: number,
  currency: CurrencyCode = "USD"
): string {
  const cfg = CURRENCIES[currency] || CURRENCIES.USD;
  const usdAmount = usdCents / 100;
  const converted = usdAmount * cfg.rateFromUsd;

  if (currency === "NGN" || currency === "XOF") {
    return `${cfg.symbol}${Math.round(converted).toLocaleString("en-US")}`;
  }
  return `${cfg.symbol}${converted.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
