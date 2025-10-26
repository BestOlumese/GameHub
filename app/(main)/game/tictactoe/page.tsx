import { getExtendedSession } from "@/lib/auth-utils";
import TicTacToeMatchmaker from "./_components/TicTacToeMatchmaker";
import { headers } from "next/headers";

export default async function Page() {
  const session = await getExtendedSession(headers());
  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-black transition-colors duration-500">
      <TicTacToeMatchmaker userId={session?.user?.id} level={session?.user?.level} />
    </main>
  );
}
