# Phase 0: Quick Wins (4 hours)

**Goal**: Build momentum with visible progress before diving into deep technical work.

**Duration**: 4 hours
**Deployment**: Local only

## Context

You have a fresh Next.js 16 project with:
- TypeScript configured
- Tailwind CSS v4
- App Router setup
- Boilerplate homepage saying "PrinterPix"

This sprint makes the app feel real and branded, then shows what the final product will look like.

## Sprint Overview

| Task | Duration | Motivation |
|------|----------|-----------|
| Brand Identity | 1.5h | App feels like a real product |
| Basic Layout | 1.5h | Professional structure |
| Static Preview | 1h | See what's possible |

**Total**: 4 hours

## Task 1: Brand Identity (1.5 hours)

### Objective
Transform the generic Next.js boilerplate into branded FckDoomScroll app.

### Steps

**Step 1: Update App Metadata** (15 minutes)
- File: `app/layout.tsx`
- Replace metadata with your branding

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FckDoomScroll - Your Daily Dose of Knowledge",
  description: "Reduce doomscrolling with daily curated content: words, capitals, facts, and history",
  openGraph: {
    title: "FckDoomScroll",
    description: "Daily anti-doomscrolling content",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**Step 2: Create Hero Page** (45 minutes)
- File: `app/page.tsx`
- Replace entire homepage with branded landing page

```typescript
// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              FckDoomScroll
            </span>
          </div>
          <nav className="hidden md:flex gap-8">
            <a href="#features" className="text-gray-300 hover:text-white transition">
              Features
            </a>
            <a href="#how" className="text-gray-300 hover:text-white transition">
              How It Works
            </a>
            <Link
              href="/signin"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
            Stop Scrolling.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Start Learning.
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Every day, get exactly 4 pieces of curated content. No feed. No algorithm. Just knowledge.
          </p>

          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition transform hover:scale-105"
          >
            Get Started Free
          </Link>
        </div>

        {/* Feature Cards Preview */}
        <div id="features" className="mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-6 scroll-mt-20">
          <FeatureCard
            icon="📚"
            title="Word of the Day"
            desc="Expand your vocabulary daily"
          />
          <FeatureCard
            icon="🌍"
            title="Capital of the Day"
            desc="Learn geography and culture"
          />
          <FeatureCard
            icon="💡"
            title="Fun Fact"
            desc="Discover interesting trivia"
          />
          <FeatureCard
            icon="📅"
            title="This Day in History"
            desc="Connect with historical moments"
          />
        </div>

        {/* How It Works */}
        <section id="how" className="mt-24 scroll-mt-20">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">How It Works</h2>

          <div className="space-y-8">
            <Step
              number="1"
              title="Visit Daily"
              desc="Come to FckDoomScroll instead of your social media feed"
            />
            <Step
              number="2"
              title="Enjoy 4 Content Pieces"
              desc="Word, capital, fact, and historical event - curated just for today"
            />
            <Step
              number="3"
              title="Build Streaks"
              desc="Visit daily and watch your streak grow. Unlock achievements."
            />
            <Step
              number="4"
              title="Save Favorites"
              desc="Like what you learned? Save it to your favorites for later"
            />
          </div>
        </section>

        {/* CTA */}
        <div className="mt-24 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Replace the Doomscroll?</h2>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 mt-24 py-8 text-center text-gray-400">
        <p>© 2024 FckDoomScroll. Made with ❤️ to fight doomscrolling.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-6 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/40 transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  );
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
        <span className="font-bold text-white text-lg">{number}</span>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{desc}</p>
      </div>
    </div>
  );
}
```

### Acceptance Criteria
- [ ] App title shows "FckDoomScroll - Your Daily Dose of Knowledge"
- [ ] Homepage has gradient background (purple/blue theme)
- [ ] Hero section visible with main CTA button
- [ ] Feature cards displayed (4 content types)
- [ ] Links to "Sign In" and "Sign Up" appear
- [ ] Mobile responsive layout
- [ ] No console errors

---

## Task 2: Basic Layout (1.5 hours)

### Objective
Create a header component and basic navigation structure for authenticated users.

### Steps

**Step 1: Create Header Component** (1 hour)
- Create: `app/components/Header.tsx`

```typescript
// app/components/Header.tsx
import Link from "next/link";

interface HeaderProps {
  isAuthenticated?: boolean;
  userName?: string;
}

export function Header({ isAuthenticated = false, userName }: HeaderProps) {
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
          {isAuthenticated ? (
            <>
              {/* Authenticated Navigation */}
              <Link
                href="/dashboard"
                className="text-gray-300 hover:text-white transition"
              >
                Today's Content
              </Link>
              <Link
                href="/favorites"
                className="text-gray-300 hover:text-white transition"
              >
                Favorites
              </Link>
              <Link
                href="/profile"
                className="text-gray-300 hover:text-white transition"
              >
                Profile
              </Link>

              {/* User Menu */}
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">{userName}</span>
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition">
                  Sign Out
                </button>
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

**Step 2: Update Root Layout** (30 minutes)
- Update: `app/layout.tsx`
- Import and use Header component

```typescript
// app/layout.tsx (add to the existing file)
import { Header } from "./components/Header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <Header isAuthenticated={false} /> {/* Will be dynamic in Phase 2 */}
        {children}
      </body>
    </html>
  );
}
```

### Acceptance Criteria
- [ ] Header displays on all pages
- [ ] Logo links to homepage
- [ ] Navigation items visible
- [ ] Sign In / Sign Up buttons appear
- [ ] Mobile menu toggle not needed yet (simple layout)
- [ ] No console errors

---

## Task 3: Static Content Preview (1 hour)

### Objective
Create static content card components showing what the app will display daily.

### Steps

**Step 1: Create Content Card Components** (40 minutes)

Create: `app/components/content/ContentCard.tsx`
```typescript
// app/components/content/ContentCard.tsx
interface ContentCardProps {
  title: string;
  icon: string;
  content: string;
  metadata?: string;
}

export function ContentCard({ title, icon, content, metadata }: ContentCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-lg p-8 hover:border-purple-500/40 transition">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>

      <p className="text-gray-200 text-lg mb-4">{content}</p>

      {metadata && (
        <p className="text-gray-500 text-sm">{metadata}</p>
      )}

      <button className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition text-sm">
        ❤️ Save
      </button>
    </div>
  );
}
```

Create: `app/components/content/ContentGrid.tsx`
```typescript
// app/components/content/ContentGrid.tsx
"use client";

import { ContentCard } from "./ContentCard";

export function ContentGrid() {
  const mockData = {
    word: {
      title: "Word of the Day",
      icon: "📚",
      word: "serendipity",
      definition: "The occurrence of events by chance in a happy or beneficial way",
      example: "Finding that old photo was pure serendipity.",
    },
    capital: {
      title: "Capital of the Day",
      icon: "🌍",
      country: "Japan",
      capital: "Tokyo",
      fact: "Tokyo is the world's largest metropolitan area with over 37 million people.",
    },
    fact: {
      title: "Fun Fact",
      icon: "💡",
      title_text: "Honey Never Spoils",
      content:
        "Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible.",
    },
    history: {
      title: "This Day in History",
      icon: "📅",
      event: "Martin Luther King Jr. Born",
      year: 1929,
      description: "Birth of the influential American civil rights leader.",
    },
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <ContentCard
        icon={mockData.word.icon}
        title={mockData.word.title}
        content={`${mockData.word.word.toUpperCase()}\n\n${mockData.word.definition}\n\n"${mockData.word.example}"`}
        metadata="Part of Speech: Noun | Difficulty: Intermediate"
      />

      <ContentCard
        icon={mockData.capital.icon}
        title={mockData.capital.title}
        content={`${mockData.capital.capital}, ${mockData.capital.country}\n\n${mockData.capital.fact}`}
        metadata="Population: 37.4 million"
      />

      <ContentCard
        icon={mockData.fact.icon}
        title={mockData.fact.title}
        content={`${mockData.fact.title_text}\n\n${mockData.fact.content}`}
        metadata="Category: Nature | Verified: Yes"
      />

      <ContentCard
        icon={mockData.history.icon}
        title={mockData.history.title}
        content={`${mockData.history.event}\n\n${mockData.history.description}`}
        metadata={`Year: ${mockData.history.year} | Category: Birth`}
      />
    </div>
  );
}
```

**Step 2: Update Homepage** (20 minutes)
- Update: `app/page.tsx`
- Add content preview grid

```typescript
// In app/page.tsx, add after the features section:

import { ContentGrid } from "./components/content/ContentGrid";

// ... existing code ...

{/* Content Preview */}
<section className="mt-24">
  <h2 className="text-4xl font-bold text-white mb-12 text-center">Here's What You'll See Daily</h2>
  <ContentGrid />
  <div className="mt-12 text-center">
    <p className="text-gray-400 mb-6">
      Sign up to start getting your daily content and building your streak!
    </p>
    <Link
      href="/signup"
      className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition"
    >
      Get Started
    </Link>
  </div>
</section>
```

### Acceptance Criteria
- [ ] 4 content cards display (word, capital, fact, history)
- [ ] Mock content shows format clearly
- [ ] Cards have icons and metadata
- [ ] Heart button visible on each card
- [ ] Cards are responsive (stack on mobile)
- [ ] Cards have hover effects
- [ ] No console errors

---

## Completion Checklist

- [ ] App title updated to "FckDoomScroll"
- [ ] Landing page has gradient background
- [ ] Hero section with CTA buttons visible
- [ ] Feature cards showing what app does
- [ ] Header component created and displays on all pages
- [ ] Navigation links present (not functional yet)
- [ ] Content preview cards display mock data
- [ ] Mobile responsive on all screens
- [ ] No console errors
- [ ] Looks professional and branded

## Dopamine Hits Achieved

✅ **You have a branded product** - App no longer says "Create Next App"
✅ **You can see the vision** - Mock content shows what's possible
✅ **Professional appearance** - Gradient design, proper typography, spacing
✅ **Ready for deeper work** - Foundation is set for Phases 1-5

## Next Steps

Once Quick Wins are complete:

1. Commit changes: `git add . && git commit -m "feat: quick wins - branding and layout"`
2. Deploy to Vercel (optional): `vercel deploy`
3. Take a screenshot and share with friends - you have something to show!
4. Move to Phase 1, Sprint 1: Database setup

## Troubleshooting

**Content cards not displaying properly**:
- Check that `ContentGrid` is imported correctly
- Verify Tailwind classes are applied
- Check browser console for errors

**Header not showing**:
- Ensure `Header` is imported in `layout.tsx`
- Check that it's in the JSX before `{children}`

**Mobile layout broken**:
- Verify `max-w-6xl` and responsive classes are used
- Check that grid uses `md:` breakpoints correctly
