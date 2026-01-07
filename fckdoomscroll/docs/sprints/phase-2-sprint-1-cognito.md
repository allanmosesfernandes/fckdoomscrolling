# Phase 2, Sprint 1: AWS Cognito Setup (10-12 hours)

**Phase**: 2 - Authentication & Favorites
**Sprint**: 1 of 3
**Duration**: 10-12 hours (Weeks 5-6)
**Goal**: Integrate AWS Cognito for secure user authentication

## Context

You have a working app displaying daily content. Now users need the ability to sign up, sign in, and have personalized experiences (favorites, streaks).

## Sprint Overview

| Task | Duration | Deliverable |
|------|----------|-------------|
| Create Cognito User Pool | 2h | AWS User Pool configured |
| Install & configure SDK | 2h | Cognito client in Next.js |
| Build auth utilities | 3-4h | `lib/auth/cognito.ts` and `lib/auth/session.ts` |
| Create auth context | 2h | Global auth state management |
| Test auth flow | 1-2h | ✅ Full signup/signin/signout works |

**Total**: 10-12 hours

## Prerequisites

- AWS account created
- Phase 1 completed (app running)
- Basic understanding of OAuth/OIDC flows

## Task 1: Create AWS Cognito User Pool (2 hours)

### Objective
Set up AWS Cognito for handling user authentication.

### Steps

**Step 1: Create User Pool in AWS Console** (1 hour)
1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito)
2. Click "Create user pool"
3. **Configure sign-in experience**:
   - Sign-in options: ✅ Email
   - Uncheck Phone number
   - Click "Next"

4. **Configure security requirements**:
   - Password policy: Choose "Custom"
   - Min length: 8
   - Require: Uppercase, Lowercase, Numbers
   - MFA: Optional (unchecked for MVP)
   - Click "Next"

5. **Configure sign-up experience**:
   - Self-service sign-up: ✅ Enabled
   - Allow users to sign themselves up
   - Attribute verification: Email (checked)
   - Self-service account recovery: Email only
   - Click "Next"

6. **Configure message delivery**:
   - Email provider: Send with Cognito (free tier)
   - Click "Next"

7. **Integrate your app**:
   - User pool name: `fckdoomscroll-users`
   - Hosted authentication pages: ✅ Use Cognito Hosted UI
   - App client name: `fckdoomscroll-web`
   - Client type: Web application
   - Allow callback URLs: `http://localhost:3000/api/auth/callback`
   - Allow sign-out URLs: `http://localhost:3000/`
   - Allow cross-origin requests: `http://localhost:3000`
   - Identity providers: Cognito user pool (checked)
   - Click "Next"

8. **Review & Create**:
   - Review settings
   - Click "Create user pool"
   - **Wait for pool to be created (2-3 minutes)**

**Step 2: Get Credentials** (30 minutes)
1. In Cognito console, select your new user pool
2. Go to "App clients and analytics"
3. Click on your app client name
4. Copy these values:
   - **Client ID** → `NEXT_PUBLIC_COGNITO_CLIENT_ID`
   - **Client Secret** → `COGNITO_CLIENT_SECRET` (visible if you click "Show Details")

5. Back to pool overview:
6. Copy:
   - **User pool ID** → `NEXT_PUBLIC_COGNITO_USER_POOL_ID` (e.g., `us-east-1_xxxxxxxxx`)
   - **Region** → Use in URL

7. **Construct Cognito domain**:
   - Go to "App integration" → "Domain name"
   - Create domain: `fckdoomscroll-<random>`
   - This becomes: `https://fckdoomscroll-<random>.auth.us-east-1.amazoncognito.com`

**Step 3: Update Environment Variables** (15 minutes)
- Update: `.env.local`

```env
# Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID="us-east-1_xxxxxxxxx"
NEXT_PUBLIC_COGNITO_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxx"
COGNITO_CLIENT_SECRET="xxxxx+xxxxxx+xxxxxx+xxx"
NEXT_PUBLIC_COGNITO_REGION="us-east-1"
NEXT_PUBLIC_COGNITO_DOMAIN="https://fckdoomscroll-xxxxx.auth.us-east-1.amazoncognito.com"
NEXT_PUBLIC_COGNITO_REDIRECT_URI="http://localhost:3000/api/auth/callback"

# Existing
DATABASE_URL="postgresql://..."
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Acceptance Criteria
- [ ] User pool created in AWS
- [ ] App client created
- [ ] All credentials copied to `.env.local`
- [ ] Cognito domain created
- [ ] Test URL accessible: `https://fckdoomscroll-xxxxx.auth.us-east-1.amazoncognito.com/login`

---

## Task 2: Install & Configure SDK (2 hours)

### Objective
Set up AWS SDK in Next.js project.

### Steps

**Step 1: Install Dependencies** (30 minutes)
```bash
npm install @aws-sdk/client-cognito-identity-provider jose
npm install -D @types/jose
```

**Step 2: Create Cognito Utilities** (1.5 hours)
- Create: `lib/auth/cognito.ts`

```typescript
// lib/auth/cognito.ts
/**
 * AWS Cognito authentication utilities
 * Handles user signup, signin, and token management
 */

const config = {
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
  clientSecret: process.env.COGNITO_CLIENT_SECRET!,
  region: process.env.NEXT_PUBLIC_COGNITO_REGION!,
  domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN!,
  redirectUri: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI!,
};

/**
 * Get authorization URL for Cognito Hosted UI
 */
export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: "email openid profile",
  });

  return `${config.domain}/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  try {
    const response = await fetch(`${config.domain}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Token exchange failed:", error);
      throw new Error(`Failed to exchange code for tokens: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error exchanging code:", error);
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await fetch(`${config.domain}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    return response.json();
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
}

/**
 * Verify JWT token signature
 */
export async function verifyToken(token: string) {
  try {
    // Get public keys from Cognito
    const jwksUrl = `https://cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}/.well-known/jwks.json`;
    const jwksResponse = await fetch(jwksUrl);
    const jwks = await jwksResponse.json();

    // Decode token header to get kid
    const { header, payload } = JSON.parse(
      Buffer.from(token.split(".")[0], "base64").toString()
    );

    // Find matching key
    const key = jwks.keys.find((k: any) => k.kid === header.kid);
    if (!key) {
      throw new Error("Key not found");
    }

    // In production, use a proper JWT verification library
    // For now, just return the payload
    return payload;
  } catch (error) {
    console.error("Error verifying token:", error);
    throw error;
  }
}

export { config as cognitoConfig };
```

### Acceptance Criteria
- [ ] Dependencies installed
- [ ] `lib/auth/cognito.ts` created
- [ ] All config values from environment variables
- [ ] No TypeScript errors

---

## Task 3: Create Session Management (2-3 hours)

### Objective
Build session handling with JWT stored in HTTP-only cookies.

### Steps

**Step 1: Create Session Manager** (2 hours)
- Create: `lib/auth/session.ts`

```typescript
// lib/auth/session.ts
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

interface SessionData {
  userId: string;
  cognitoSub: string;
  email: string;
  displayName?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const secret = new TextEncoder().encode(
  process.env.JWT_SESSION_SECRET || "dev-secret-key-min-32-chars-long"
);

/**
 * Create and store session in HTTP-only cookie
 */
export async function createSession(data: SessionData) {
  try {
    const token = await new SignJWT(data)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return token;
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
}

/**
 * Get current session from cookie
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return null;
    }

    const { payload } = await jwtVerify(sessionCookie.value, secret);
    return payload as unknown as SessionData;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Delete session cookie
 */
export async function deleteSession() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
```

**Step 2: Update .env.local** (15 minutes)
```env
# JWT Session Secret (min 32 characters)
JWT_SESSION_SECRET="your-super-secret-key-min-32-chars-long"
```

### Acceptance Criteria
- [ ] `lib/auth/session.ts` created
- [ ] `createSession()` stores JWT in cookie
- [ ] `getSession()` retrieves and verifies JWT
- [ ] `deleteSession()` clears cookie
- [ ] `JWT_SESSION_SECRET` in `.env.local`

---

## Task 4: Create Auth Context (2 hours)

### Objective
Build React Context for global auth state management.

### Steps

**Step 1: Create Auth Context** (2 hours)
- Create: `app/context/AuthContext.tsx`

```typescript
// app/context/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  async function signOut() {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      setUser(null);
    } catch (err) {
      setError("Sign out failed");
      throw err;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

**Step 2: Wrap App with Provider** (15 minutes)
- Update: `app/layout.tsx`

```typescript
// In app/layout.tsx, add this import:
import { AuthProvider } from "./context/AuthContext";

// Wrap children with provider:
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {/* Rest of layout */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Acceptance Criteria
- [ ] `AuthContext` created
- [ ] `AuthProvider` wraps app
- [ ] `useAuth()` hook works
- [ ] `loading` state works
- [ ] `signOut()` function works

---

## Task 5: Test Authentication (1-2 hours)

### Objective
Verify full auth flow works end-to-end.

### Steps

**Step 1: Create Test Auth Routes** (1 hour)
- Create: `app/api/auth/callback/route.ts`

```typescript
// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/auth/cognito";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");

    if (!code) {
      return NextResponse.redirect(new URL("/signin?error=no_code", request.url));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Decode ID token to get user info
    const idTokenPayload = JSON.parse(
      Buffer.from(tokens.id_token.split(".")[1], "base64").toString()
    );

    const { sub, email, name } = idTokenPayload;

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { cognitoSub: sub },
      update: { lastLoginAt: new Date() },
      create: {
        cognitoSub: sub,
        email,
        displayName: name,
        lastLoginAt: new Date(),
      },
    });

    // Create session
    await createSession({
      userId: user.id,
      cognitoSub: sub,
      email,
      displayName: name,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    });

    // Redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(
      new URL("/signin?error=auth_failed", request.url)
    );
  }
}
```

- Create: `app/api/auth/me/route.ts`

```typescript
// app/api/auth/me/route.ts
import { getSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get full user from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get user" },
      { status: 500 }
    );
  }
}
```

**Step 2: Test Login Flow** (1 hour)
```bash
# Start dev server
npm run dev

# Test signup:
# 1. Navigate to http://localhost:3000/
# 2. Click "Get Started Free" or "Sign Up"
# 3. You should be redirected to Cognito Hosted UI
# 4. Create an account with test email
# 5. Verify email
# 6. Should redirect to http://localhost:3000/api/auth/callback?code=...
# 7. Then redirect to /dashboard

# Check database:
# npx prisma studio
# Should see new user in User table
```

### Acceptance Criteria
- [ ] Sign-up flow works end-to-end
- [ ] User created in database
- [ ] Session cookie set
- [ ] Redirect to dashboard
- [ ] `/api/auth/me` returns logged-in user
- [ ] No console errors

---

## Completion Checklist

- [ ] AWS Cognito User Pool created
- [ ] App client configured
- [ ] All credentials in `.env.local`
- [ ] `lib/auth/cognito.ts` created
- [ ] `lib/auth/session.ts` created
- [ ] `AuthContext` created and provider added
- [ ] `/api/auth/callback` route works
- [ ] `/api/auth/me` route works
- [ ] Full login flow tested
- [ ] User created in database on signup

## Next Steps

Once Task 5 is complete:

1. Commit: `git add . && git commit -m "feat(phase2-sprint1): aws cognito authentication"`
2. Update todo list
3. Move to Phase 2, Sprint 2: Auth UI pages

## Troubleshooting

**Cognito domain creation fails**:
- Domain names must be globally unique
- Try adding timestamp: `fckdoomscroll-<timestamp>`

**Code exchange fails**:
- Verify `COGNITO_CLIENT_SECRET` is correct (needs to be copied from AWS)
- Check redirect URI matches exactly in AWS console

**Session not persisting**:
- Verify `JWT_SESSION_SECRET` is set
- Check cookie is being set: DevTools → Application → Cookies
- Verify cookie is httpOnly (can't access from JS)

**User not created in database**:
- Verify Prisma schema has User model
- Check database connection works
- Run migrations: `npx prisma migrate deploy`
