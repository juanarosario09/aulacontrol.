import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If authenticated, allow the request to proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - /login
     * - /registro
     * - /api/auth (NextAuth routes)
     * - /_next/static (Next.js static files)
     * - /_next/image (Next.js image optimization)
     * - /favicon.ico
     * - /public files (images, icons, etc.)
     */
    "/((?!login|registro|api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
