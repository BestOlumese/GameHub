
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeaderboard } from "@/lib/actions";
import { getExtendedSession } from "@/lib/auth-utils";
import { Crown, Medal } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

// 🧠 You should fetch leaderboard and session on the server, not in client
export default async function Leaderboards() {
  const session = await getExtendedSession(headers());
  const {data: leaderboardData} = await getLeaderboard();

  // 🏆 Rank icons
  const getRankIcon = (rank: number) => {
    if (rank === 1)
      return <Crown className="w-5 h-5 text-yellow-500 drop-shadow-md" />;
    if (rank === 2)
      return <Medal className="w-5 h-5 text-gray-400 drop-shadow-sm" />;
    if (rank === 3)
      return <Medal className="w-5 h-5 text-amber-600 drop-shadow-sm" />;
    return (
      <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">
        {rank}
      </span>
    );
  };

  // 🎨 Rank colors (with your ranks included)
  const getRankColor = (rankTier: string) => {
    switch (rankTier?.toUpperCase()) {
      case "GODHOOD":
        return "bg-gradient-to-r from-purple-600 to-pink-600 text-white animate-pulse shadow-lg";
      case "LEGEND":
        return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md";
      case "GRANDMASTER":
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md";
      case "MASTER":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "DIAMOND":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
      case "PLATINUM":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
      case "GOLD":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "SILVER":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "BRONZE":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold">Leaderboards</h1>
          <p className="text-muted-foreground">
            See how you rank against other players
          </p>
        </div>
      </div>

      {/* 🧾 Leaderboard List */}
      <div className="space-y-2">
        {leaderboardData &&
          leaderboardData.map((entry, index) => {
            const winRate =
              entry.totalGames > 0
                ? ((entry.wins / entry.totalGames) * 100).toFixed(1)
                : "0.0";

            const isYou =
              entry.username?.toLowerCase() ===
              session?.user?.username?.toLowerCase();

            return (
              <Card
                key={index}
                className={`transition-colors hover:bg-accent/50 ${
                  isYou ? "border-primary/50 shadow-md" : ""
                }`}
              >
                <CardContent>
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12">
                      {getRankIcon(index + 1)}
                    </div>

                    {/* Player Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {entry.image}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">
                            {entry.username}
                          </h3>
                          {isYou && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Level {entry.level}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{winRate}%</div>
                        <div className="text-muted-foreground">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">
                          {entry.wins}
                        </div>
                        <div className="text-muted-foreground">Wins</div>
                      </div>
                    </div>

                    {/* Rank */}
                    <div className="flex items-center gap-2">
                      <Badge className={getRankColor(entry.rank)}>
                        {entry.rank}
                      </Badge>
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="sm:hidden mt-3 pt-3 border-t flex justify-between text-sm">
                    <div className="text-center">
                      <div className="font-medium">{winRate}%</div>
                      <div className="text-muted-foreground">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-600">
                        {entry.wins}
                      </div>
                      <div className="text-muted-foreground">Wins</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* 🧍 Your Current Ranking */}
      {session && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your Current Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const yourEntry = leaderboardData?.find(
                (e: any) =>
                  e.id ===
                  session?.user?.id
              );
              const yourRank = leaderboardData?.findIndex(
                (e: any) =>
                  e.id ===
                  session?.user?.id
              );
              return yourEntry ? (
                <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                      <span className="font-bold text-primary">
                        {getRankIcon(yourRank + 1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {yourEntry.image}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {yourEntry.username} (You)
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Level {yourEntry.level} • {yourEntry.rank}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Link href="/" className={buttonVariants({size: "sm", className: "mt-2"})}>
                      Play More Games
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  You haven’t appeared on the leaderboard yet. Play more matches
                  to rank up!
                </p>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
