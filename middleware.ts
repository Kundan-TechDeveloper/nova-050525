import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isLoggedIn = !!token
    const isSuperAdmin = token?.role === "super_admin"
    const isAdmin = token?.role === "admin" || token?.role === "org_admin"
    const { pathname } = req.nextUrl

    // Block access to register route and redirect to login
    if (pathname.startsWith("/register")) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // If on auth pages (login/register) or auth API routes
    if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
      // If logged in and on auth pages (not API), redirect to appropriate page
      if (isLoggedIn && !pathname.startsWith("/api/auth")) {
        if (isSuperAdmin) {
          return NextResponse.redirect(new URL("/super-admin", req.url))
        }
        if (isAdmin) {
          return NextResponse.redirect(new URL("/admin", req.url))
        }
        return NextResponse.redirect(new URL("/chat", req.url))
      }
      // Not logged in or accessing API, allow access
      return NextResponse.next()
    }

    // If trying to access super admin pages
    if (pathname.startsWith("/super-admin")) {
      if (isLoggedIn && isSuperAdmin) return NextResponse.next()
      if (isLoggedIn) {
        // If logged in but not super admin, redirect to appropriate page
        if (isAdmin) return NextResponse.redirect(new URL("/admin", req.url))
        return NextResponse.redirect(new URL("/chat", req.url))
      }
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // If trying to access admin pages
    if (pathname.startsWith("/admin")) {
      if (isLoggedIn && (isAdmin || isSuperAdmin)) return NextResponse.next()
      if (isLoggedIn) return NextResponse.redirect(new URL("/chat", req.url))
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // If trying to access chat page
    if (pathname.startsWith("/chat")) {
      if (isLoggedIn) {
        // Redirect super admin to their dashboard, but allow admin to access chat
        if (isSuperAdmin) return NextResponse.redirect(new URL("/super-admin", req.url))
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // For root path '/'
    if (pathname === "/") {
      if (isLoggedIn) {
        if (isSuperAdmin) return NextResponse.redirect(new URL("/super-admin", req.url))
        if (isAdmin) return NextResponse.redirect(new URL("/admin", req.url))
        return NextResponse.redirect(new URL("/chat", req.url))
      }
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Block access to register route
        if (req.nextUrl.pathname.startsWith("/register")) {
          return false
        }

        // Allow access to auth pages and API routes without token
        if (req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/api/auth")) {
          return true
        }
        // Require token for all other routes
        return !!token
      },
    },
  },
)

export const config = {
  matcher: ["/", "/chat/:path*", "/admin/:path*", "/super-admin/:path*", "/login", "/register", "/api/auth/:path*"],
}
