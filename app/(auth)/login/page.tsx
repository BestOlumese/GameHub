import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import LoginForm from "./_components/LoginForm";

export default function Login() {
  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center mb-2">
          <CardTitle className="text-2xl">Welcome to GameHub</CardTitle>
          <CardDescription>
            Sign in to start playing with friends
          </CardDescription>
        </CardHeader>
        <CardContent>
              <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
