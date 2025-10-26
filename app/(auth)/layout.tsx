import { Gamepad2, Trophy, Users, Zap } from "lucide-react";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding & Features */}
          <div className="space-y-10 text-center lg:text-left">
            {/* Logo + tagline */}
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <Gamepad2 className="w-8 h-8 text-primary" />
                <h1 className="text-3xl sm:text-4xl font-bold">GameHub</h1>
              </div>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                Challenge friends in classic multiplayer games. Real-time
                gameplay, rankings, and endless fun.
              </p>
            </div>

            {/* Features inline */}
            <div className="grid gap-6">
              <div className="flex items-start gap-4 text-left">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Real-time Multiplayer</h3>
                  <p className="text-sm text-muted-foreground">
                    Play with friends or find new opponents instantly
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 text-left">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Competitive Rankings</h3>
                  <p className="text-sm text-muted-foreground">
                    Climb the leaderboards in ranked matches
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 text-left">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">XP Progression</h3>
                  <p className="text-sm text-muted-foreground">
                    Level up and unlock achievements as you play
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Forms */}
          <div className="w-full max-w-md mx-auto lg:mx-0">{children}</div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} GameHub. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
