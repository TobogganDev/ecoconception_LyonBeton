import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";

export default async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/dashboard", "/account", "/orders"];
  const checkoutRoutes = pathname.startsWith("/checkout/");
  const adminRoutes = pathname.startsWith("/admin");

  const needsAuth =
    protectedRoutes.some((route) => pathname.startsWith(route)) ||
    checkoutRoutes;

  if (needsAuth && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (adminRoutes) {
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse("Accès refusé", { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Routes protégées
    "/dashboard/:path*",
    "/account/:path*",
    "/orders/:path*",
    "/checkout/:path*",
    "/admin/:path*",
    // Exclure les fichiers statiques et API
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
