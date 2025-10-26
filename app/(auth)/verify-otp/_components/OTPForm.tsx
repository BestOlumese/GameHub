"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React, { useTransition } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { OtpSchema, otpSchema } from "@/schemas/otpSchema";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function OTPForm({ email }: { email: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<OtpSchema>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  function onSubmit(values: OtpSchema) {
    const { otp } = values;

    startTransition(async () => {
      await authClient.signIn.emailOtp(
        {
          email,
          otp,
        },
        {
          onSuccess: () => {
            toast.success("Signed in successfully!! Redirecting...");
            router.push(`/dashboard`);
          },
          onError: () => {
            toast.error("Something went wrong. Try again later!!");
          },
        }
      );
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-center">OTP</FormLabel>
              <FormControl>
                <InputOTP className="w-full" maxLength={6} {...field}>
                  <InputOTPGroup className="flex w-full gap-2">
                    {[...Array(6)].map((_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="flex-1 h-12 rounded-md border"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <LoadingButton
          isLoading={isPending}
          loadingText="Verifying OTP"
          disabled={isPending}
          type="submit"
          className="w-full"
        >
          Verify OTP
        </LoadingButton>
      </form>
    </Form>
  );
}
