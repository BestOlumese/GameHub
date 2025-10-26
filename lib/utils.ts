import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSuggestions(base: string): string[] {
  const lower = base.toLowerCase();
  const randomNum = () => Math.floor(Math.random() * 9999);

  const adjectives = [
    "cool",
    "pro",
    "real",
    "the",
    "official",
    "master",
    "legend",
    "x",
    "dev",
    "gamer",
    "boss",
    "hero",
    "prime",
    "alpha",
  ];

  return [
    `${lower}${randomNum()}`,
    `${lower}_${randomNum()}`,
    `${lower}_${adjectives[Math.floor(Math.random() * adjectives.length)]}`,
    `${adjectives[Math.floor(Math.random() * adjectives.length)]}_${lower}`,
    `${lower}${
      adjectives[Math.floor(Math.random() * adjectives.length)]
    }${randomNum()}`,
  ];
}

export function getRankForLevel(
  level: number
):
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER"
  | "LEGEND" {
  if (level >= 320) return "LEGEND";
  if (level >= 280) return "GRANDMASTER";
  if (level >= 220) return "MASTER";
  if (level >= 150) return "DIAMOND";
  if (level >= 90) return "PLATINUM";
  if (level >= 50) return "GOLD";
  if (level >= 20) return "SILVER";
  return "BRONZE";
}

export function xpForNextLevel(level: number) {
  const base = 2000;      // Level 1 XP
  const growth = 1.007;   // +0.7% per level
  return Math.floor(base * Math.pow(growth, level - 1));
}


export function humanizeXP(
  value: number,
  options: { decimals?: number; abbreviate?: boolean; locale?: string } = {}
): string {
  const {
    decimals = 2,
    abbreviate = true,
    locale = "en-US",
  } = options;

  if (!Number.isFinite(value)) return "0";

  const negative = value < 0;
  const abs = Math.abs(Math.trunc(value));

  if (!abbreviate) {
    return (negative ? "-" : "") + new Intl.NumberFormat(locale).format(abs);
  }

  const tiers = [
    { value: 1e12, suffix: "T" },
    { value: 1e9,  suffix: "B" },
    { value: 1e6,  suffix: "M" },
    { value: 1e3,  suffix: "k" },
  ];

  for (const tier of tiers) {
    if (abs >= tier.value) {
      const num = abs / tier.value;
      const str = Number(num.toFixed(decimals)).toString();
      return (negative ? "-" : "") + str + tier.suffix;
    }
  }

  return (negative ? "-" : "") + abs.toString();
}

export function calculateMatchXP(level: number, result: "win" | "draw" | "lose") {
  const xpNext = xpForNextLevel(level);

  // Slight scaling with level: rewards get bigger for high levels
  const levelScale = 1 + level / 2000; // up to 1.5x at lvl 999

  // Random variation (±10%)
  const variation = 0.9 + Math.random() * 0.2;

  let xpChange = 0;

  switch (result) {
    case "win":
      xpChange = xpNext * 0.25 * levelScale; // 25% of XP needed
      break;

    case "draw":
      xpChange = xpNext * 0.12 * levelScale; // 12% of XP needed
      break;

    case "lose":
      xpChange = -xpNext * 0.07 * (1 + level / 3000); // small scaling penalty
      break;
  }

  xpChange *= variation;
  return Math.round(xpChange);
}


