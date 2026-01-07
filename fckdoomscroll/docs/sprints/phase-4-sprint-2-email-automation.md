# Phase 4, Sprint 2: Email Automation & Cron Jobs (12-15 hours)

**Phase**: 4 - Email & Notifications
**Sprint**: 2 of 2
**Duration**: 12-15 hours (Weeks 13-14)
**Goal**: Automated reminder and digest emails via scheduled jobs

## Sprint Overview

| Task | Duration | Deliverable |
|------|----------|-------------|
| Extend schema with email settings | 1-2h | EmailSettings model |
| Build email preference page | 2-3h | User can customize emails |
| Create streak reminder cron | 2-3h | Daily streak reminders |
| Create weekly digest cron | 2-3h | Weekly summary emails |
| Set up Vercel Cron | 1-2h | `vercel.json` configuration |
| Test end-to-end | 1-2h | ✅ Emails send on schedule |

**Total**: 12-15 hours

## Task 1: Extend Schema (1-2 hours)

Add to `prisma/schema.prisma`:

```prisma
model EmailSettings {
  id              String    @id @default(uuid())
  userId          String    @unique

  emailEnabled    Boolean   @default(true)
  streakReminders Boolean   @default(false)
  weeklyDigest    Boolean   @default(true)

  reminderTime    String    @default("09:00")  // HH:mm
  digestDay       String    @default("SUNDAY")
  digestTime      String    @default("18:00")

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id])
}
```

Update User model to include:
```prisma
emailSettings  EmailSettings?
```

Run: `npx prisma migrate dev --name add_email_settings`

## Task 2: Email Preferences Page (2-3 hours)

Create `app/(protected)/settings/email/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { getSession } from "@/lib/auth/session";

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/email-settings");
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/email-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Email Settings</h1>

      <div className="space-y-6 bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Email Notifications</h3>
            <p className="text-sm text-gray-400">Receive emails from FckDoomScroll</p>
          </div>
          <input
            type="checkbox"
            checked={settings?.emailEnabled}
            onChange={(e) => setSettings({...settings, emailEnabled: e.target.checked})}
            className="w-5 h-5"
          />
        </div>

        {settings?.emailEnabled && (
          <>
            <hr className="border-purple-500/10" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Streak Reminders</h3>
                <p className="text-sm text-gray-400">Get reminded when your streak is at risk</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.streakReminders}
                onChange={(e) => setSettings({...settings, streakReminders: e.target.checked})}
                className="w-5 h-5"
              />
            </div>

            {settings?.streakReminders && (
              <div className="ml-6">
                <label className="text-sm text-gray-300">Reminder Time</label>
                <input
                  type="time"
                  value={settings?.reminderTime}
                  onChange={(e) => setSettings({...settings, reminderTime: e.target.value})}
                  className="block mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            )}

            <hr className="border-purple-500/10" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Weekly Digest</h3>
                <p className="text-sm text-gray-400">Get a summary of your week</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.weeklyDigest}
                onChange={(e) => setSettings({...settings, weeklyDigest: e.target.checked})}
                className="w-5 h-5"
              />
            </div>

            {settings?.weeklyDigest && (
              <div className="ml-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-300">Day</label>
                  <select
                    value={settings?.digestDay}
                    onChange={(e) => setSettings({...settings, digestDay: e.target.value})}
                    className="block mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  >
                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-300">Time</label>
                  <input
                    type="time"
                    value={settings?.digestTime}
                    onChange={(e) => setSettings({...settings, digestTime: e.target.value})}
                    className="block mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
              </div>
            )}
          </>
        )}

        <hr className="border-purple-500/10" />

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg text-white font-semibold transition"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
```

Create `app/api/email-settings/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const settings = await prisma.emailSettings.findUnique({
    where: { userId: session.userId },
  });

  if (!settings) {
    // Create default settings
    const newSettings = await prisma.emailSettings.create({
      data: { userId: session.userId },
    });
    return NextResponse.json({ success: true, data: newSettings });
  }

  return NextResponse.json({ success: true, data: settings });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const body = await request.json();

  const settings = await prisma.emailSettings.upsert({
    where: { userId: session.userId },
    update: body,
    create: { userId: session.userId, ...body },
  });

  return NextResponse.json({ success: true, data: settings });
}
```

## Task 3: Streak Reminder Cron (2-3 hours)

Create `app/api/cron/streak-reminder/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/ses";
import { streakReminderTemplate } from "@/lib/email/templates/streak-reminder";

// Verify cron request
function verifyCronSecret(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    // Find users at risk of losing streak
    const users = await prisma.user.findMany({
      where: {
        currentStreak: { gt: 0 },
        emailSettings: {
          streakReminders: true,
        },
      },
      include: { emailSettings: true },
    });

    let sent = 0;

    for (const user of users) {
      // Check if they visited today
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const todayVisit = await prisma.visit.findUnique({
        where: {
          userId_visitDate: {
            userId: user.id,
            visitDate: today,
          },
        },
      });

      // Only remind if they haven't visited today
      if (!todayVisit && user.emailSettings?.streakReminders) {
        const { htmlBody, textBody } = streakReminderTemplate({
          displayName: user.displayName || user.email,
          currentStreak: user.currentStreak,
          appUrl: process.env.NEXT_PUBLIC_APP_URL!,
        });

        try {
          await sendEmail({
            to: user.email,
            subject: `Don't break your ${user.currentStreak}-day streak!`,
            htmlBody,
            textBody,
          });
          sent++;
        } catch (error) {
          console.error(`Failed to send reminder to ${user.email}:`, error);
        }
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

## Task 4: Weekly Digest Cron (2-3 hours)

Create `app/api/cron/weekly-digest/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/ses";

function verifyCronSecret(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        emailSettings: {
          weeklyDigest: true,
        },
      },
      include: { emailSettings: true },
    });

    let sent = 0;

    for (const user of users) {
      // Get week stats
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyVisits = await prisma.visit.count({
        where: {
          userId: user.id,
          createdAt: { gte: weekAgo },
        },
      });

      const weeklyFavorites = await prisma.favorite.count({
        where: {
          userId: user.id,
          createdAt: { gte: weekAgo },
        },
      });

      const htmlBody = `
        <h2>Your Week in Review</h2>
        <p>Here's how your week went:</p>
        <ul>
          <li>📅 Visits: ${weeklyVisits}</li>
          <li>❤️ Favorites: ${weeklyFavorites}</li>
          <li>🔥 Streak: ${user.currentStreak} days</li>
        </ul>
      `;

      const textBody = `
        Your Week in Review

        Visits: ${weeklyVisits}
        Favorites: ${weeklyFavorites}
        Streak: ${user.currentStreak} days
      `;

      try {
        await sendEmail({
          to: user.email,
          subject: "Your Weekly Summary",
          htmlBody,
          textBody,
        });
        sent++;
      } catch (error) {
        console.error(`Failed to send digest to ${user.email}:`, error);
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

## Task 5: Vercel Cron Configuration (1-2 hours)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/streak-reminder",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/weekly-digest",
      "schedule": "0 18 * * 0"
    }
  ]
}
```

Add to `.env.local`:
```env
CRON_SECRET=your-super-secret-cron-key
```

## Completion Checklist

- [ ] EmailSettings model created
- [ ] Email preferences page works
- [ ] Streak reminder cron endpoint
- [ ] Weekly digest cron endpoint
- [ ] `vercel.json` configured
- [ ] `CRON_SECRET` in environment
- [ ] Cron endpoints protected
- [ ] Manual testing passes
- [ ] Email send errors handled

## Next Steps

1. Commit: `git add . && git commit -m "feat(phase4-sprint2): email automation and cron jobs"`
2. Test emails manually with curl
3. Deploy and verify cron runs
4. Move to Phase 5, Sprint 1: Docker & ECS
