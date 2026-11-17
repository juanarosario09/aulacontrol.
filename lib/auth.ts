import { getServerSession as nextAuthGetServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export { authOptions };

/**
 * Helper to get the current server session.
 * Use this in Server Components, Route Handlers, and Server Actions.
 */
export async function getServerSession() {
  return await nextAuthGetServerSession(authOptions);
}

/**
 * Verifies that a session exists (and optionally that the user has the required role).
 * Redirects to /login if not authenticated or /dashboard if role is insufficient.
 *
 * @param role - Optional required role ("ADMIN" | "TEACHER"). If omitted, any authenticated user is allowed.
 */
export async function requireAuth(role?: "ADMIN" | "TEACHER") {
  const session = await getServerSession();

  if (!session || !session.user) {
    redirect("/login");
  }

  if (role && session.user.role !== role && session.user.role !== "ADMIN") {
    // ADMIN can access everything; others are redirected if role doesn't match
    redirect("/dashboard");
  }

  return session;
}
