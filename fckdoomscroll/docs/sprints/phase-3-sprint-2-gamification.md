# Phase 3, Sprint 2: Gamification UI & Achievements (10-12 hours)

**Phase**: 3 - Streaks & Gamification
**Sprint**: 2 of 2
**Duration**: 10-12 hours (Weeks 10-11)
**Goal**: Display streaks and implement achievement system

## Sprint Overview

| Task | Duration | Deliverable |
|------|----------|-------------|
| Extend schema with Achievements | 1-2h | Achievement models |
| Create achievement logic | 2-3h | `lib/achievements.ts` |
| Build streak display component | 2h | StreakDisplay component |
| Create achievements page | 2-3h | Profile with achievements |
| Add toast notifications | 1h | Toast when achievement unlocked |
| Seed achievements | 1h | Initial achievements in DB |

**Total**: 10-12 hours

## Task 1: Extend Schema (1-2 hours)

Add to `prisma/schema.prisma`:

```prisma
model Achievement {
  id          String    @id @default(uuid())
  name        String    @unique
  description String    @db.Text
  iconEmoji   String
  category    String    // 'streak', 'favorite', 'visit'
  requirement Int
  requirementType String // 'streak_days', 'favorites_count', 'visits_count'
  createdAt   DateTime  @default(now())

  users       UserAchievement[]
}

model UserAchievement {
  id            String    @id @default(uuid())
  userId        String
  achievementId String
  unlockedAt    DateTime  @default(now())

  user          User        @relation(fields: [userId], references: [id])
  achievement   Achievement @relation(fields: [achievementId], references: [id])

  @@unique([userId, achievementId])
  @@index([userId])
}
```

Run migration: `npx prisma migrate dev --name add_achievements`

## Task 2: Achievement Logic (2-3 hours)

Create `lib/achievements.ts`:

```typescript
import { prisma } from "./prisma";

export async function checkAchievements(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      achievements: true,
      favorites: true,
    },
  });

  if (!user) return [];

  const achievements = await prisma.achievement.findMany();
  const unlockedIds = user.achievements.map(a => a.achievementId);
  const newAchievements = [];

  for (const achievement of achievements) {
    if (unlockedIds.includes(achievement.id)) continue;

    let shouldUnlock = false;

    if (achievement.requirementType === 'streak_days') {
      shouldUnlock = user.currentStreak >= achievement.requirement;
    } else if (achievement.requirementType === 'favorites_count') {
      shouldUnlock = user.favorites.length >= achievement.requirement;
    } else if (achievement.requirementType === 'visits_count') {
      shouldUnlock = user.totalVisits >= achievement.requirement;
    }

    if (shouldUnlock) {
      const unlocked = await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
        },
        include: { achievement: true },
      });
      newAchievements.push(unlocked);
    }
  }

  return newAchievements;
}

export async function getUserAchievements(userId: string) {
  return prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { unlockedAt: 'desc' },
  });
}

export async function getAllAchievements() {
  return prisma.achievement.findMany({
    orderBy: { requirement: 'asc' },
  });
}
```

## Task 3: Streak Display Component (2 hours)

Create `app/components/features/StreakDisplay.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalVisits: number;
  history: any[];
}

export function StreakDisplay() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStreak = async () => {
      try {
        const response = await fetch("/api/streak?days=7");
        const data = await response.json();
        if (data.success) {
          setStreak(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch streak:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, [user]);

  if (loading) {
    return <div className="text-gray-400">Loading streak...</div>;
  }

  if (!streak) return null;

  return (
    <div className="grid md:grid-cols-3 gap-4 my-8">
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Current Streak</div>
        <div className="text-3xl font-bold text-purple-300 flex items-center gap-2">
          🔥 {streak.currentStreak}
        </div>
        <div className="text-xs text-gray-500 mt-1">day{streak.currentStreak !== 1 ? 's' : ''}</div>
      </div>

      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Longest Streak</div>
        <div className="text-3xl font-bold text-blue-300">👑 {streak.longestStreak}</div>
        <div className="text-xs text-gray-500 mt-1">personal best</div>
      </div>

      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Total Visits</div>
        <div className="text-3xl font-bold text-green-300">📚 {streak.totalVisits}</div>
        <div className="text-xs text-gray-500 mt-1">all time</div>
      </div>
    </div>
  );
}
```

## Task 4: Achievements Page (2-3 hours)

Create `app/(protected)/achievements/page.tsx`:

```typescript
import { getSession } from "@/lib/auth/session";
import { getUserAchievements, getAllAchievements } from "@/lib/achievements";
import { redirect } from "next/navigation";

export default async function AchievementsPage() {
  const session = await getSession();
  if (!session) redirect("/signin");

  const [unlocked, allAchievements] = await Promise.all([
    getUserAchievements(session.userId),
    getAllAchievements(),
  ]);

  const unlockedIds = new Set(unlocked.map(a => a.achievementId));
  const locked = allAchievements.filter(a => !unlockedIds.has(a.id));

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-white mb-12">Achievements</h1>

      {unlocked.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Unlocked</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {unlocked.map((item) => (
              <div
                key={item.id}
                className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-6 text-center"
              >
                <div className="text-5xl mb-4">{item.achievement.iconEmoji}</div>
                <h3 className="font-bold text-white mb-2">{item.achievement.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{item.achievement.description}</p>
                <p className="text-xs text-gray-500">
                  Unlocked {new Date(item.unlockedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Locked</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {locked.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center opacity-50"
              >
                <div className="text-5xl mb-4 grayscale">{achievement.iconEmoji}</div>
                <h3 className="font-bold text-gray-400 mb-2">{achievement.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{achievement.description}</p>
                <p className="text-xs text-gray-600">Requirement: {achievement.requirement}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Task 5: Toast Notifications (1 hour)

Create `app/components/Toast.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

const toasts: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

export function showToast(message: string, type: "success" | "error" | "info" = "success") {
  const id = Math.random().toString(36);
  const toast = { id, message, type };
  toasts.push(toast);
  listeners.forEach(listener => listener([...toasts]));

  setTimeout(() => {
    toasts.splice(toasts.indexOf(toast), 1);
    listeners.forEach(listener => listener([...toasts]));
  }, 3000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter(l => l !== setToasts);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg text-white animate-in fade-in slide-in-from-right ${
            toast.type === "success" ? "bg-green-500" :
            toast.type === "error" ? "bg-red-500" :
            "bg-blue-500"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
```

## Task 6: Seed Achievements (1 hour)

Add to your seed script or create achievements manually:

```typescript
// In prisma/seed.ts, add:
await prisma.achievement.createMany({
  data: [
    { name: "🔥 First Visit", description: "Make your first visit", iconEmoji: "🔥", category: "visit", requirement: 1, requirementType: "visits_count" },
    { name: "🔥 3-Day Streak", description: "Visit for 3 consecutive days", iconEmoji: "🔥", category: "streak", requirement: 3, requirementType: "streak_days" },
    { name: "🔥 7-Day Streak", description: "Visit for 7 consecutive days", iconEmoji: "🔥", category: "streak", requirement: 7, requirementType: "streak_days" },
    { name: "🔥 30-Day Streak", description: "Visit for 30 consecutive days", iconEmoji: "🔥", category: "streak", requirement: 30, requirementType: "streak_days" },
    { name: "❤️ First Favorite", description: "Save your first favorite", iconEmoji: "❤️", category: "favorite", requirement: 1, requirementType: "favorites_count" },
    { name: "❤️ 10 Favorites", description: "Save 10 favorite items", iconEmoji: "❤️", category: "favorite", requirement: 10, requirementType: "favorites_count" },
    { name: "❤️ 50 Favorites", description: "Save 50 favorite items", iconEmoji: "❤️", category: "favorite", requirement: 50, requirementType: "favorites_count" },
  ],
  skipDuplicates: true,
});
```

## Completion Checklist

- [ ] Achievement and UserAchievement models
- [ ] Migration applied
- [ ] Achievement checking logic
- [ ] Streak display component
- [ ] Achievements page shows locked/unlocked
- [ ] Toast notifications work
- [ ] Achievements seeded
- [ ] Achievements unlock automatically
- [ ] Profile shows streak info

## Next Steps

1. Commit: `git add . && git commit -m "feat(phase3-sprint2): gamification and achievements"`
2. Test achievements unlock
3. Move to Phase 4, Sprint 1: Email Setup
