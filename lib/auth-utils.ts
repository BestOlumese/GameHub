import { auth } from "./auth";
import { prisma } from "./db";

export async function getExtendedSession(headers: Headers) {
  try {
    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      return null;
    }

    // Fetch additional user data manually
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        onboarded: true,
        username: true,
        xp: true,
        level: true,
        rank: true,
      },
    });

    return {
      ...session,
      user: {
        ...session.user,
        ...userData,
      },
    };
  } catch (error) {
    console.error("Error getting extended session:", error);
    return null;
  }
}
