import Header from "@/components/partials/Header";
import { userStats } from "@/lib/actions";
import { getExtendedSession } from "@/lib/auth-utils";
import { headers } from "next/headers";
import React from "react";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getExtendedSession(headers());
  const {data} = await userStats();

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} data={data} />
      {children}
    </div>
  );
}
