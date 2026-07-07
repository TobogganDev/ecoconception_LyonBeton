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

  const response = NextResponse.next();

  // Garde-fou : toute réponse rattachée à une session est marquée
  // `private, no-store`. Même si une route publique venait à être consultée en
  // étant connecté, l'Edge Network ne mettra jamais en cache une réponse
  // contenant potentiellement des données personnelles (PASS/MISS garanti).
  if (session) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
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
