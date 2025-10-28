import { NextResponse } from "next/server";

export function middleware(request) {
  const jwt = request.cookies.get("jwt")?.value;
  const { pathname } = request.nextUrl;

    if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (pathname === "/" || pathname.startsWith("/forgetpassword") || pathname.startsWith("/changepassword") || pathname.startsWith("/feedback") || pathname.startsWith(`${process.env.NEXT_PUBLIC_BASE_URL}/images/**`) || pathname.startsWith("/consent") || pathname.startsWith("/invoice")) {
    return NextResponse.next();
  }
  if (!jwt) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|forgetpassword).*)"],
};
