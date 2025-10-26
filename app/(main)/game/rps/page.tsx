import React from 'react'
import RPSMain from './_components/RPSMain'
import { getExtendedSession } from '@/lib/auth-utils';
import { headers } from 'next/headers';

export default async function RPS() {
    const session = await getExtendedSession(headers());
  return (
    <><RPSMain level={session?.user?.level} userId={session?.user?.id} /></>
  )
}
