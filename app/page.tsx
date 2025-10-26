import { Button, buttonVariants } from "@/components/ui/button";
import { getExtendedSession } from "@/lib/auth-utils";
import {
  ArrowRight,
  Gamepad2,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

export default async function LandingPage() {
  const session = await getExtendedSession(headers());
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6" />
            <span>GameHub</span>
          </div>
          {!session?.user?.id ? (
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Sign In
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Dashboard
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">
                Real-time multiplayer gaming
              </span>
            </div>

            <h1 className="text-6xl tracking-tight">
              Play. Compete. <br />
              <span className="text-muted-foreground">Climb the ranks.</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Challenge friends in classic games, track your progress, and
              compete on global leaderboards.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Link
                href="/dashboard"
                className={buttonVariants({ className: "group", size: "lg" })}
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                View Games
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="space-y-4 text-center md:text-left">
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mx-auto md:mx-0">
              <Users className="w-6 h-6" />
            </div>
            <h3>Real-time Multiplayer</h3>
            <p className="text-muted-foreground">
              Connect instantly with friends or find new opponents for quick
              matches
            </p>
          </div>

          <div className="space-y-4 text-center md:text-left">
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mx-auto md:mx-0">
              <Trophy className="w-6 h-6" />
            </div>
            <h3>Competitive Rankings</h3>
            <p className="text-muted-foreground">
              Climb global leaderboards in ranked matches and prove your skills
            </p>
          </div>

          <div className="space-y-4 text-center md:text-left">
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mx-auto md:mx-0">
              <Zap className="w-6 h-6" />
            </div>
            <h3>XP & Progression</h3>
            <p className="text-muted-foreground">
              Level up, unlock achievements, and showcase your gaming journey
            </p>
          </div>
        </div>
      </section>

      {/* Games Preview */}
      <section className="border-y border-border/40 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-16">
            <h2>Classic games, modern experience</h2>
            <p className="text-muted-foreground">
              Enjoy timeless favorites with real-time multiplayer functionality
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-background border border-border rounded-2xl p-8 space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-foreground rounded-full" />
              </div>
              <h3>Tic-Tac-Toe</h3>
              <p className="text-muted-foreground">
                Strategic gameplay in the classic grid challenge
              </p>
            </div>

            <div className="bg-background border border-border rounded-2xl p-8 space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/10 to-yellow-500/10 rounded-xl flex items-center justify-center">
                <div className="text-2xl">✊</div>
              </div>
              <h3>Rock Paper Scissors</h3>
              <p className="text-muted-foreground">
                Fast-paced battles of chance and psychology
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="max-w-3xl mx-auto text-center space-y-8 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl p-16 border border-primary/10">
          <h2>Ready to play?</h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of players competing in real-time matches
          </p>
          <Link
            href="/login"
            className={buttonVariants({ className: "group", size: "lg" })}
          >
            Start Playing Now
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gamepad2 className="w-5 h-5" />
              <span>© 2025 GameHub</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button className="hover:text-foreground transition-colors">
                About
              </button>
              <button className="hover:text-foreground transition-colors">
                Games
              </button>
              <button className="hover:text-foreground transition-colors">
                Leaderboards
              </button>
              <button className="hover:text-foreground transition-colors">
                Support
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
