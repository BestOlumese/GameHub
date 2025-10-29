"use client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Trophy,
  User,
  Settings,
  LogOut,
  Gamepad2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { cn, humanizeXP, xpForNextLevel } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ToggleMode } from "../ui/ToggleMode";
import { RankBadge } from "../ui/rank-badge";

export default function Header({ user, data }: { user: any; data: any }) {
  const pathname = usePathname();
  const router = useRouter();

  const onLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out Successfully. Redirecting...");
          router.push("/login");
        },
      },
    });
  };

  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <span className="font-semibold">GameHub</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({
                  variant: pathname === "/dashboard" ? "default" : "ghost",
                  size: "sm",
                }),
                "gap-2"
              )}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/leaderboards"
              className={cn(
                buttonVariants({
                  variant: pathname === "/leaderboards" ? "default" : "ghost",
                  size: "sm",
                }),
                "gap-2"
              )}
            >
              <Trophy className="w-4 h-4" />
              Leaderboards
            </Link>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-3 h-auto p-2">
                <div className="text-right hidden sm:block">
                  <div className="font-medium">{user.name}</div>
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      user.level >= 999
                        ? "relative font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {user.level >= 999 ? (
                      <div className="relative flex items-center gap-2">
                        {/* Subtle aura behind text */}
                        <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-yellow-300/20 via-amber-300/20 to-orange-400/20 blur-[2px] z-0" />

                        {/* Clear visible level text */}
                        <span className="relative z-10 flex items-center gap-1 text-lg drop-shadow-[0_0_5px_rgba(255,200,0,0.6)]">
                          <Sparkles className="w-4 h-4 text-yellow-400 animate-spin-slow" />
                          <span className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500">
                            Level 999
                          </span>
                          <Sparkles className="w-4 h-4 text-yellow-400 animate-spin-slow-rev" />
                        </span>

                        {/* GODHOOD badge */}
                        <Badge
                          variant="secondary"
                          className="relative z-10 text-[11px] px-3 py-1 font-semibold 
          bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 
          text-black shadow-[0_0_6px_rgba(255,200,0,0.4)] animate-bounce-slow"
                        >
                          GODHOOD
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Level {user.level}</span>
                        <RankBadge rank={user.rank} />
                      </div>
                    )}
                  </div>
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{user.image}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="text-lg">
                      {user.image}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">
                      @{user.username} • Level {user.level} • {user.rank}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">
                      {user.level >= 999 ? "Level Progress" : "XP Progress"}
                    </span>

                    {user.level >= 999 ? (
                      <span className="font-semibold text-amber-500 flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        MAX LEVEL
                      </span>
                    ) : (
                      <span>
                        {humanizeXP(user.xp)} /{" "}
                        {humanizeXP(xpForNextLevel(user.level))} XP
                      </span>
                    )}
                  </div>

                  <Progress
                    value={
                      user.level >= 999
                        ? 100
                        : Math.min(
                            Math.floor(
                              (user.xp / xpForNextLevel(user.level)) * 100
                            ),
                            100
                          )
                    }
                    className={`h-2 rounded-full transition-all duration-500 ${
                      user.level >= 999
                        ? "bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 animate-pulse"
                        : ""
                    }`}
                  />

                  {user.level >= 999 ? (
                    <div className="text-xs font-semibold text-center text-amber-500 mt-1">
                      🌟 You’ve reached the pinnacle — Level 999
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      {humanizeXP(xpForNextLevel(user.level) - user.xp)} XP to
                      Level {user.level + 1}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-center text-sm">
                  <div>
                    <div className="font-medium text-green-600">
                      {humanizeXP(Number(data?.wins))}
                    </div>
                    <div className="text-muted-foreground">Wins</div>
                  </div>
                  <div>
                    <div className="font-medium text-red-600">
                      {data
                        ? humanizeXP(
                            Number(data.losses)
                          )
                        : 0}
                    </div>
                    <div className="text-muted-foreground">Losses</div>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "flex w-full justify-start gap-2 py-1.5 text-sm"
                  )}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "flex w-full justify-start gap-2 py-1.5 text-sm"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <ToggleMode />

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={onLogout}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "flex w-full justify-start gap-2 py-1.5 text-sm"
                )}
              >
                <LogOut className="w-4 h-4 stroke-red-500" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
