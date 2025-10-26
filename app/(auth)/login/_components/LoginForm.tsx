"use client";
import { loginSchema, LoginSchema } from "@/schemas/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React, { useTransition } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/LoadingButton";

export default function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(values: LoginSchema) {
    const { email } = values;

    startTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp(
        {
          email,
          type: "sign-in",
        },
        {
          onSuccess: () => {
            toast.success("OTP Sent successfully!! Redirecting...");
            router.push(`/verify-otp?email=${email}`);
          },
          onError: () => {
            toast.error("Something went wrong. Try again later!!");
          },
        }
      );
    });
  }

  const signInWithGoogle = async () => {
    await authClient.signIn.social(
      {
        provider: "google",
      },
      {
        onSuccess: () => {
          toast.success("Signed in successfully!! Redirecting...");
          router.push("/dashboard");
        },
        onError: () => {
          toast.error("Something went wrong. Try again later!!");
        },
      }
    );
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <LoadingButton
            isLoading={isPending}
            loadingText="Sending OTP"
            disabled={isPending}
            type="submit"
            className="w-full"
          >
            <Send />
            Send OTP
          </LoadingButton>
        </form>
      </Form>

      <div className="flex items-center my-4">
        <div className="flex-1 border-t border-gray-300/20"></div>
        <span className="mx-4 text-sm text-white">OR</span>
        <div className="flex-1 border-t border-gray-300/20"></div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signInWithGoogle}
      >
        <FcGoogle />
        Sign in with Google
      </Button>
    </div>
  );
}
