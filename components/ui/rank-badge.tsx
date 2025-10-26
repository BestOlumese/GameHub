import { Badge } from "@/components/ui/badge";

export function RankBadge({ rank }: { rank: string }) {
  const styles: Record<string, string> = {
    BRONZE:
      "bg-gradient-to-r from-orange-600 via-amber-700 to-yellow-700 text-white shadow-[0_0_6px_rgba(255,150,0,0.4)]",
    SILVER:
      "bg-gradient-to-r from-gray-400 via-gray-300 to-gray-200 text-black shadow-[0_0_6px_rgba(180,180,180,0.4)]",
    GOLD:
      "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-400 text-black shadow-[0_0_8px_rgba(255,200,0,0.4)]",
    PLATINUM:
      "bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-400 text-black shadow-[0_0_8px_rgba(0,200,255,0.5)]",
    DIAMOND:
      "bg-gradient-to-r from-indigo-300 via-blue-400 to-sky-300 text-black shadow-[0_0_8px_rgba(100,180,255,0.6)]",
    MASTER:
      "bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500 text-white shadow-[0_0_8px_rgba(200,100,255,0.5)]",
    GRANDMASTER:
      "bg-gradient-to-r from-red-500 via-rose-500 to-fuchsia-500 text-white shadow-[0_0_10px_rgba(255,80,120,0.6)]",
    LEGEND:
      "bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 text-black shadow-[0_0_12px_rgba(255,200,0,0.8)] animate-pulse",
    GODHOOD:
      "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black shadow-[0_0_10px_rgba(255,200,0,0.7)] animate-bounce-slow",
  };

  return (
    <Badge
      variant="secondary"
      className={`text-xs font-semibold px-3 py-1 ${
        styles[rank] || "bg-gray-500 text-white"
      }`}
    >
      {rank}
    </Badge>
  );
}
