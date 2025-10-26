"use client";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { AVATAR_OPTIONS } from "@/constants";
import { useUsernameAvailability } from "@/hooks/useUsernameAvailability";
import { OnboardingSchema, onboardingSchema } from "@/schemas/onboardingSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@radix-ui/react-label";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function OnboardingForm({ user }: { user: any }) {
  const form = useForm<OnboardingSchema>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: user?.name || "",
      username: "",
    },
  });

  const username = form.watch("username");
  const { data, isFetching } = useUsernameAvailability(username);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (values: OnboardingSchema) => {
    startTransition(async () => {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          username: values.username,
          avatar: selectedAvatar,
        }),
      });

      if (res.ok) {
        toast.success("Onboarded successfully. Redirecting...");
        router.push("/dashboard");
      } else {
        const err = await res.json();
        toast.error(err.error);
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="Enter your full name"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          {...form.register("username")}
          placeholder="Choose a unique username"
        />
        {form.formState.errors.username && (
          <p className="text-sm text-destructive">
            {form.formState.errors.username.message}
          </p>
        )}
        {username && !form.formState.errors.username && (
          <div className="text-sm">
            {isFetching && (
              <span className="text-muted-foreground">Checking…</span>
            )}
            {data && data.available && (
              <span className="text-green-600">✅ Username available</span>
            )}
            {data && !data.available && (
              <div className="text-destructive space-y-1">
                <div>❌ Username taken</div>
                <div className="flex gap-2 flex-wrap">
                  {data.suggestions.map((s: string) => (
                    <button
                      key={s}
                      type="button"
                      className="px-2 py-1 text-xs bg-muted rounded"
                      onClick={() => form.setValue("username", s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Avatar grid */}
      <div className="space-y-3">
        <Label>Choose Your Avatar</Label>
        <div className="flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-4xl border-2 border-primary">
            {selectedAvatar}
          </div>
        </div>
        <div className="grid grid-cols-10 gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-muted/30">
          {AVATAR_OPTIONS.map((avatar, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedAvatar(avatar)}
              className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors ${
                selectedAvatar === avatar
                  ? "bg-primary text-primary-foreground"
                  : "bg-background"
              }`}
            >
              <span className="text-sm">{avatar}</span>
            </button>
          ))}
        </div>
      </div>

      <LoadingButton
        loadingText="Onboarding..."
        isLoading={isPending}
        disabled={isPending}
        type="submit"
        className="w-full"
      >
        Complete Setup
      </LoadingButton>
    </form>
  );
}
