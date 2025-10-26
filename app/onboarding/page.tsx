import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import OnboardingForm from './_components/OnboardingForm';
import { getExtendedSession } from '@/lib/auth-utils';
import { headers } from 'next/headers';

export default async function Onboarding() {
  const session = await getExtendedSession(headers());

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome to GameHub!</CardTitle>
          <CardDescription>
            Let's set up your profile to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm user={session?.user} />
        </CardContent>
      </Card>
    </div>
  )
}
