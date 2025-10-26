import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import XpTest from "@/components/ui/XpTest";
import { recentMatches, userStats } from "@/lib/actions";
import { getExtendedSession } from "@/lib/auth-utils";
import { cn, humanizeXP, xpForNextLevel } from "@/lib/utils";
import { Progress } from "@radix-ui/react-progress";
import { Clock, Play, Scissors, Target, TrendingUp } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import React from "react";

export default async function Dashboard() {
  const session = await getExtendedSession(headers());
  const { status, data } = await userStats();
  const { data: matches } = await recentMatches();
  console.log(matches);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">
          Welcome back, {session?.user.username}!
        </h1>
        <p className="text-muted-foreground">Ready for your next game?</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <section>
            <h2 className="text-xl font-medium mb-4">Quick Play</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Tic-Tac-Toe</CardTitle>
                      <CardDescription>
                        Classic 3x3 strategy game
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <Link
                    href="/game/tictactoe"
                    className={cn(
                      buttonVariants({
                        variant: "default",
                        className: "w-full",
                      })
                    )}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Scissors className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Rock Paper Scissors
                      </CardTitle>
                      <CardDescription>
                        Fast-paced decision game
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <Link
                    href="/game/rps"
                    className={cn(
                      buttonVariants({
                        variant: "default",
                        className: "w-full",
                      })
                    )}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="text-xl font-medium mb-4">Recent Matches</h2>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {matches && matches.map((match, index) => {
                    const isPlayerInMatch = match.players.find(
                      (player) => player.user.id === session?.user?.id
                    );
                    console.log(isPlayerInMatch);
                    
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              isPlayerInMatch.result === "WIN"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <div>
                            <div className="font-medium">
                              {match.players[0].user.username} vs{" "}
                              {match.players[1].user.username}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {match.gameType}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              isPlayerInMatch.result === "WIN"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {isPlayerInMatch.result}
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {/* {match.xp} XP */}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Player Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Level Progress</span>
                  <span>Level {session?.user.level}</span>
                </div>
                <Progress
                  value={Math.floor(
                    (session?.user.xp / xpForNextLevel(session?.user.level)) *
                      100
                  )}
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground">
                  {humanizeXP(
                    xpForNextLevel(session?.user.level) - session?.user.xp
                  )}{" "}
                  XP to next level
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">
                    {humanizeXP(Number(data?.wins))}
                  </div>
                  <div className="text-sm text-muted-foreground">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-red-600">
                    {data
                      ? humanizeXP(
                          Number(data.losses) +
                            Number(data.totalMatches - (data.wins + data.draws))
                        )
                      : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Losses</div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {data?.totalMatches
                      ? (
                          (Number(data.wins) / Number(data.totalMatches)) *
                          100
                        ).toFixed(2)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Quick Facts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Rank</span>
                  <Badge variant="secondary">{session?.user.rank}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Games Played</span>
                  <span>{humanizeXP(Number(data?.totalMatches))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Games Drawn</span>
                  <span>{humanizeXP(Number(data?.draws))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
