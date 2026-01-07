# Phase 2, Sprint 2: Auth UI & Protected Routes (8-10 hours)

**Phase**: 2 - Authentication & Favorites
**Sprint**: 2 of 3
**Duration**: 8-10 hours (Weeks 6-7)
**Goal**: Build sign-up/sign-in pages and protect authenticated routes

## Context

You have Cognito configured and working backend. Now build the UI pages and middleware to protect routes.

## Sprint Overview

| Task | Duration | Deliverable |
|------|----------|-------------|
| Create sign-in page | 3h | `/auth/signin` page with form |
| Create sign-up page | 2h | `/auth/signup` page with form |
| Build auth layout | 1h | Centered auth-only layout |
| Create route protection middleware | 2h | `middleware.ts` redirects unauthenticated users |
| Test auth pages | 1-2h | ✅ Full signup/signin/logout works |

**Total**: 8-10 hours

## Task 1: Create Sign-In Page (3 hours)

### Steps

**Step 1: Create Auth Routes Group** (30 minutes)
```bash
mkdir -p app/\(auth\)/{signin,signup}
```

**Step 2: Create Sign-In Page** (2 hours)
- Create: `app/(auth)/signin/page.tsx`

```typescript
// app/(auth)/signin/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { getAuthorizationUrl } from "@/lib/auth/cognito";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    try {
      setLoading(true);
      setError(null);
      const authUrl = getAuthorizationUrl();
      window.location.href = authUrl;
    } catch (err) {
      setError("Failed to initiate sign in");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-gray-400">Sign in to your FckDoomScroll account</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleSignIn}
        disabled={loading}
        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg text-white font-semibold transition"
      >
        {loading ? "Signing In..." : "Sign In with Email"}
      </button>

      <div className="text-center">
        <p className="text-gray-400">
          Don't have an account?{" "}
          <Link href="/signup" className="text-purple-400 hover:text-purple-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
```

**Step 3: Create Auth Layout** (30 minutes)
- Create: `app/(auth)/layout.tsx`

```typescript
// app/(auth)/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - FckDoomScroll",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              FckDoomScroll
            </span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-8 backdrop-blur">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          © 2024 FckDoomScroll
        </p>
      </div>
    </div>
  );
}
```

### Acceptance Criteria
- [ ] `/auth/signin` page accessible
- [ ] Sign-in button redirects to Cognito
- [ ] Error handling works
- [ ] Link to sign-up page visible
- [ ] Responsive design

---

## Task 2: Create Sign-Up Page (2 hours)

### Steps

**Step 1: Create Sign-Up Page** (2 hours)
- Create: `app/(auth)/signup/page.tsx`

```typescript
// app/(auth)/signup/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { getAuthorizationUrl } from "@/lib/auth/cognito";

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp() {
    try {
      setLoading(true);
      setError(null);
      const authUrl = getAuthorizationUrl();
      window.location.href = authUrl;
    } catch (err) {
      setError("Failed to initiate sign up");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-400">Join FckDoomScroll and start learning daily</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Benefits */}
      <div className="space-y-3 bg-purple-500/5 p-4 rounded-lg border border-purple-500/10">
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <span>✅</span>
          <span>Save your favorite facts</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <span>🔥</span>
          <span>Build daily visit streaks</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <span>🏆</span>
          <span>Unlock achievements</span>
        </div>
      </div>

      <button
        onClick={handleSignUp}
        disabled={loading}
        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 rounded-lg text-white font-semibold transition"
      >
        {loading ? "Creating Account..." : "Create Free Account"}
      </button>

      <div className="text-center">
        <p className="text-gray-400">
          Already have an account?{" "}
          <Link href="/signin" className="text-purple-400 hover:text-purple-300">
            Sign in
          </Link>
        </p>
      </div>

      {/* Terms */}
      <p className="text-center text-xs text-gray-500">
        By creating an account, you agree to our{" "}
        <a href="#" className="text-purple-400 hover:text-purple-300">
          Terms of Service
        </a>
      </p>
    </div>
  );
}
```

### Acceptance Criteria
- [ ] `/auth/signup` page accessible
- [ ] Sign-up button redirects to Cognito
- [ ] Benefits section visible
- [ ] Link to sign-in page visible
- [ ] Mobile responsive

---

## Task 3: Create Protected Route Middleware (2 hours)

### Steps

**Step 1: Create Middleware** (1.5 hours)
- Create: `middleware.ts` (root of project)

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SESSION_SECRET || "dev-secret-key-min-32-chars-long"
);

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/signin",
  "/signup",
  "/api/auth/callback",
  "/api/auth/signout",
  "/api/content/today",
];

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/favorites", "/profile", "/settings"];

async function verifySession(
  sessionToken: string
): Promise<boolean> {
  try {
    await jwtVerify(sessionToken, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("session")?.value;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check protected routes
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    const isValid = await verifySession(sessionToken);
    if (!isValid) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

**Step 2: Create Signout Route** (30 minutes)
- Create: `app/api/auth/signout/route.ts`

```typescript
// app/api/auth/signout/route.ts
import { deleteSession } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await deleteSession();

    // Get redirect URL from query or default to home
    const redirectUrl = request.nextUrl.searchParams.get("redirect") || "/";

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json(
      { success: false, error: "Sign out failed" },
      { status: 500 }
    );
  }
}
```

### Acceptance Criteria
- [ ] `middleware.ts` created
- [ ] Public routes accessible without auth
- [ ] Protected routes redirect to signin if not authenticated
- [ ] Valid session allows access to protected routes
- [ ] `/api/auth/signout` clears session

---

## Task 4: Update Header & Navigation (1 hour)

### Steps

**Step 1: Update Header Component** (1 hour)
- Update: `app/components/Header.tsx`

```typescript
// app/components/Header.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useState } from "react";

export function Header() {
  const { user, loading, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  async function handleSignOut() {
    await signOut();
    setShowMenu(false);
  }

  return (
    <header className="border-b border-purple-500/20 backdrop-blur-sm bg-slate-900/50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            FckDoomScroll
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          {loading ? (
            <div className="w-8 h-8 bg-purple-500/20 rounded animate-pulse" />
          ) : user ? (
            <>
              {/* Authenticated Navigation */}
              <Link
                href="/dashboard"
                className="text-gray-300 hover:text-white transition"
              >
                Today
              </Link>
              <Link
                href="/favorites"
                className="text-gray-300 hover:text-white transition"
              >
                Favorites
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-sm"
                >
                  {user.displayName || user.email}
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-purple-500/20 rounded-lg shadow-lg z-50">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-purple-500/10"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-purple-500/10 border-t border-purple-500/10"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Unauthenticated Navigation */}
              <Link
                href="/signin"
                className="text-gray-300 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
```

### Acceptance Criteria
- [ ] Header shows different nav for authenticated vs unauthenticated
- [ ] User menu appears when logged in
- [ ] Sign out button works
- [ ] Links navigate correctly

---

## Task 5: Test Full Auth Flow (1-2 hours)

### Steps

**Step 1: Test Authentication**
```bash
# 1. Start app
npm run dev

# 2. Test sign-up:
# - Go to /signup
# - Click "Create Free Account"
# - Complete signup in Cognito
# - Should redirect to /api/auth/callback
# - Then redirect to /dashboard

# 3. Test protected route:
# - Go to /dashboard
# - Should load (you're authenticated)

# 4. Test sign-out:
# - Click user menu
# - Click "Sign Out"
# - Should redirect to /
# - Go to /dashboard
# - Should redirect to /signin

# 5. Test unauthorized access:
# - Open DevTools
# - Delete session cookie
# - Go to /favorites
# - Should redirect to /signin
```

### Acceptance Criteria
- [ ] Sign-up flow complete
- [ ] User can access /dashboard
- [ ] Sign-out works and clears session
- [ ] Unauthorized users redirected to /signin
- [ ] Header shows correct nav based on auth state

---

## Completion Checklist

- [ ] `/auth/signin` page created
- [ ] `/auth/signup` page created
- [ ] Auth layout centered and styled
- [ ] `middleware.ts` protects routes
- [ ] `/api/auth/signout` endpoint
- [ ] Header shows auth state
- [ ] Full auth flow tested
- [ ] Protected routes working
- [ ] Session persists on refresh

## Next Steps

1. Commit: `git add . && git commit -m "feat(phase2-sprint2): auth ui pages and protected routes"`
2. Deploy to Vercel and test
3. Move to Phase 2, Sprint 3: Favorites

## Troubleshooting

**Auth pages blank or not loading**:
- Check `getAuthorizationUrl()` is exported
- Verify Cognito config in `.env.local`
- Check browser console for errors

**Redirect to signin infinite loop**:
- Verify session cookie is being set
- Check `JWT_SESSION_SECRET` is correct
- Check `middleware.ts` logic

**Header not showing user info**:
- Verify `AuthProvider` wraps entire app
- Check `/api/auth/me` endpoint works
- Clear browser cache and refresh
