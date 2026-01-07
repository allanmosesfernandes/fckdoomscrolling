# Phase 3, Sprint 1: Streak Tracking Backend (8-10 hours)

**Phase**: 3 - Streaks & Gamification
**Sprint**: 1 of 2
**Duration**: 8-10 hours (Weeks 9-10)
**Goal**: Implement daily visit tracking and streak calculation

## Context

Users can now save favorites. Add streak gamification to encourage daily visits.

## Sprint Overview

| Task | Duration | Deliverable |
|------|----------|-------------|
| Extend schema with Visit model | 1-2h | Visit tracking table |
| Build streak calculation logic | 2-3h | `lib/streaks.ts` utility |
| Create API endpoint | 2h | POST `/api/streak/visit` |
| Auto-record visits | 1-2h | Log visit when viewing content |
| Test streak logic | 1-2h | ✅ Streaks calculate correctly |

**Total**: 8-10 hours

## Task 1: Extend Database Schema (1-2 hours)

### Steps

**Step 1: Update Prisma Schema** (1 hour)
- Update: `prisma/schema.prisma`

Add/update these models:

```prisma
// User model - add streak fields
model User {
  id              String    @id @default(uuid())
  cognitoSub      String    @unique
  email           String    @unique
  emailVerified   DateTime?
  displayName     String?
  profileImage    String?

  // Streaks
  currentStreak   Int       @default(0)
  longestStreak   Int       @default(0)
  lastVisitDate   DateTime?
  totalVisits     Int       @default(0)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastLoginAt     DateTime?

  // Relations
  visits          Visit[]
  favorites       Favorite[]

  @@index([email])
  @@index([cognitoSub])
}

// Visit model
model Visit {
  id            String    @id @default(uuid())
  userId        String

  // Date of visit (normalized to UTC midnight)
  visitDate     DateTime  @db.Date

  // Optional tracking
  contentViewed Json?     // { word: true, capital: true, fact: true, history: true }
  timeSpentSeconds Int?

  createdAt     DateTime  @default(now())

  // Relations
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // One visit per user per day
  @@unique([userId, visitDate])
  @@index([userId, visitDate])
}
```

**Step 2: Create and Run Migration** (1 hour)
```bash
npx prisma migrate dev --name add_streaks

# Select: "add_streaks" as migration name
```

### Acceptance Criteria
- [ ] Visit model created
- [ ] User model has streak fields
- [ ] Migration applied
- [ ] Prisma Studio shows Visit table

---

## Task 2: Build Streak Calculation Logic (2-3 hours)

### Steps

**Step 1: Create Streaks Utility** (2-3 hours)
- Create: `lib/streaks.ts`

```typescript
// lib/streaks.ts
import { prisma } from "./prisma";
import { addDays, isToday } from "date-fns";

/**
 * Get user's current streak info
 */
export async function getUserStreak(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastVisitDate: true,
      totalVisits: true,
    },
  });

  return user || {
    currentStreak: 0,
    longestStreak: 0,
    lastVisitDate: null,
    totalVisits: 0,
  };
}

/**
 * Record a user visit and update streaks
 * Returns the updated user streak info
 */
export async function recordVisit(userId: string, date: Date = new Date()) {
  const visitDate = normalizeDate(date);

  try {
    // Check if already visited today
    const existingVisit = await prisma.visit.findUnique({
      where: {
        userId_visitDate: {
          userId,
          visitDate,
        },
      },
    });

    if (existingVisit) {
      // Already visited today, just return current streak
      return getUserStreak(userId);
    }

    // Create visit record
    await prisma.visit.create({
      data: {
        userId,
        visitDate,
      },
    });

    // Calculate and update streaks
    return await calculateAndUpdateStreak(userId);
  } catch (error) {
    console.error("Error recording visit:", error);
    throw error;
  }
}

/**
 * Calculate streak based on visit history
 */
async function calculateAndUpdateStreak(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get all visits ordered by date
  const visits = await prisma.visit.findMany({
    where: { userId },
    orderBy: { visitDate: "desc" },
  });

  if (visits.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastVisitDate: null,
      totalVisits: 0,
    };
  }

  const today = normalizeDate(new Date());
  const lastVisitDate = visits[0].visitDate;

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Check if streak is broken (missed a day)
  const daysSinceLastVisit = daysBetween(lastVisitDate, today);

  // If more than 1 day has passed, streak is broken
  if (daysSinceLastVisit > 1) {
    currentStreak = 0;
    tempStreak = 0;
  } else {
    // Calculate streaks by finding consecutive visit days
    let previousDate = visits[0].visitDate;
    tempStreak = 1;

    for (let i = 1; i < visits.length; i++) {
      const daysBetweenVisits = daysBetween(visits[i].visitDate, previousDate);

      if (daysBetweenVisits === 1) {
        // Consecutive day
        tempStreak++;
      } else {
        // Streak broken
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }

      previousDate = visits[i].visitDate;
    }

    // Don't forget the last streak
    longestStreak = Math.max(longestStreak, tempStreak);

    // Current streak is from today backwards
    currentStreak = tempStreak;
    if (daysSinceLastVisit === 1 || daysSinceLastVisit === 0) {
      // Only count if visited today or yesterday
      currentStreak = tempStreak;
    } else {
      currentStreak = 0;
    }
  }

  // Update user
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak,
      longestStreak: Math.max(longestStreak, user.longestStreak),
      lastVisitDate: today,
      totalVisits: visits.length,
    },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastVisitDate: true,
      totalVisits: true,
    },
  });

  return updated;
}

/**
 * Get visit history for a user (last N days)
 */
export async function getVisitHistory(userId: string, days: number = 30) {
  const startDate = addDays(normalizeDate(new Date()), -days);

  const visits = await prisma.visit.findMany({
    where: {
      userId,
      visitDate: {
        gte: startDate,
      },
    },
    orderBy: { visitDate: "asc" },
    select: { visitDate: true },
  });

  // Create a map of visited dates
  const visitMap = new Set(
    visits.map((v) => v.visitDate.toISOString().split("T")[0])
  );

  // Create array of all days in range
  const history = [];
  for (let i = -days; i <= 0; i++) {
    const date = addDays(normalizeDate(new Date()), i);
    const dateStr = date.toISOString().split("T")[0];
    history.push({
      date,
      visited: visitMap.has(dateStr),
    });
  }

  return history;
}

/**
 * Normalize date to UTC midnight
 */
function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  return Math.round(
    Math.abs((date2.getTime() - date1.getTime()) / ONE_DAY)
  );
}
```

**Step 2: Install date-fns** (optional but recommended)
```bash
npm install date-fns
# Or use native Date methods if preferred
```

### Acceptance Criteria
- [ ] `lib/streaks.ts` created
- [ ] `recordVisit()` creates visits
- [ ] `getUserStreak()` returns streak info
- [ ] `getVisitHistory()` returns visit calendar
- [ ] Streak calculation correct
- [ ] No TypeScript errors

---

## Task 3: Create API Endpoint (2 hours)

### Steps

**Step 1: Create Streak Route** (2 hours)
- Create: `app/api/streak/route.ts`

```typescript
// app/api/streak/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserStreak, recordVisit, getVisitHistory } from "@/lib/streaks";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const days = parseInt(request.nextUrl.searchParams.get("days") || "30");

    const [streak, history] = await Promise.all([
      getUserStreak(session.userId),
      getVisitHistory(session.userId, days),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastVisitDate: streak.lastVisitDate,
        totalVisits: streak.totalVisits,
        history,
      },
    });
  } catch (error) {
    console.error("Streak GET error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch streak" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const date = body.date ? new Date(body.date) : new Date();

    const streak = await recordVisit(session.userId, date);

    return NextResponse.json({
      success: true,
      data: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastVisitDate: streak.lastVisitDate,
        totalVisits: streak.totalVisits,
      },
    });
  } catch (error) {
    console.error("Streak POST error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to record visit" } },
      { status: 500 }
    );
  }
}
```

### Acceptance Criteria
- [ ] GET `/api/streak` returns streak info
- [ ] POST `/api/streak` records visit
- [ ] Visit history calculated
- [ ] Pagination works for history
- [ ] Authentication required

---

## Task 4: Auto-Record Visits (1-2 hours)

### Steps

**Step 1: Add Visit Recording to Dashboard** (1-2 hours)
- Update: `app/(protected)/dashboard/page.tsx`

```typescript
// Add this to your dashboard page.tsx:
"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  // Record visit when user visits dashboard
  useEffect(() => {
    if (!user) return;

    async function recordVisit() {
      try {
        await fetch("/api/streak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch (error) {
        console.error("Failed to record visit:", error);
        // Don't fail the page if streak recording fails
      }
    }

    recordVisit();
  }, [user]);

  // Rest of your dashboard component...
}
```

### Acceptance Criteria
- [ ] Visit recorded when viewing content
- [ ] Doesn't fail if recording fails
- [ ] Called only once per load
- [ ] Streak updates immediately

---

## Task 5: Test Streak Logic (1-2 hours)

### Steps

**Step 1: Manual Testing**
```bash
# 1. Open Prisma Studio
npx prisma studio

# 2. Create test user if needed (through UI)

# 3. Test API:
# POST /api/streak
curl -X POST http://localhost:3000/api/streak \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_TOKEN"

# 4. Verify Visit created in database

# 5. Test GET streak
curl http://localhost:3000/api/streak \
  -H "Cookie: session=YOUR_SESSION_TOKEN"

# 6. Visit dashboard and check:
# - Streak increments
# - No errors in console
# - Visit saved in database
```

**Step 2: Test Edge Cases**
- Visit on same day twice (should not double)
- Visit, skip day, visit (streak should break)
- Check longest streak preserved

### Acceptance Criteria
- [ ] Visits recorded correctly
- [ ] Streaks calculated correctly
- [ ] Duplicate visits prevented
- [ ] Streak breaks on missed day
- [ ] Longest streak preserved
- [ ] No console errors

---

## Completion Checklist

- [ ] Visit model in database
- [ ] User has streak fields
- [ ] Migration applied
- [ ] `lib/streaks.ts` created
- [ ] Streak calculation logic correct
- [ ] `/api/streak` GET and POST working
- [ ] Visits auto-recorded on dashboard
- [ ] Edge cases tested
- [ ] Manual testing passed

## Next Steps

1. Commit: `git add . && git commit -m "feat(phase3-sprint1): streak tracking backend"`
2. Test thoroughly with multiple days
3. Move to Phase 3, Sprint 2: Gamification UI

## Troubleshooting

**Streaks not calculating**:
- Check Visit records in database
- Verify dates are normalized to midnight
- Check user.lastVisitDate is updated

**Visits not recording**:
- Check POST /api/streak returns 200
- Verify session is valid
- Check browser console for errors

**Streak broken unexpectedly**:
- Check daysBetween calculation
- Verify date normalization
- Check timezone handling
