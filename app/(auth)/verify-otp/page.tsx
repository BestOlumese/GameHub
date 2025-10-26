import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import OTPForm from "./_components/OTPForm";
import { redirect } from "next/navigation";

export default function VerifyOTP({
  searchParams,
}: {
  searchParams: { email: string };
}) {
    const email = searchParams.email;
    if(!email) {
        redirect("/login");
    }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center mb-2">
          <CardTitle className="text-2xl">Verify OTP</CardTitle>
          <CardDescription>
            Enter otp to start playing with friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OTPForm email={email} />
        </CardContent>
      </Card>
    </div>
  );
}
