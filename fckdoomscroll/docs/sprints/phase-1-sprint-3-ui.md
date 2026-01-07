# Phase 1, Sprint 3: Daily Content UI (8-10 hours)

**Phase**: 1 - Core Content Display
**Sprint**: 3 of 3
**Duration**: 8-10 hours (Weeks 3-4)
**Goal**: Build UI components to display daily content and create API route to serve it

## Context

You have PostgreSQL database with 30 days of seeded content and utility functions to fetch it. Now you need to display it beautifully on the home page.

## Sprint Overview

| Task | Duration | Deliverable |
|------|----------|-------------|
| Create API endpoint | 2h | `/api/content/today` returns 4 content items |
| Build card components | 3-4h | 4 styled card components (RSC) |
| Update home page | 2h | Displays today's 4 content cards |
| Add loading & animations | 1-2h | Smooth transitions, loading states |

**Total**: 8-10 hours

## Task 1: Create API Endpoint (2 hours)

### Objective
Build API route that returns today's content bundle.

### Steps

**Step 1: Create API Route** (1.5 hours)
- Create: `app/api/content/today/route.ts`

```typescript
// app/api/content/today/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTodaysContent } from "@/lib/content";

export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: NextRequest) {
  try {
    // Get timezone from query or header (optional)
    const timezone =
      request.nextUrl.searchParams.get("timezone") || "UTC";

    // Fetch today's content
    const content = await getTodaysContent(timezone);

    // Check if we have at least some content
    if (!content.word || !content.capital || !content.fact || !content.history) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INCOMPLETE_CONTENT",
            message: "Not all content types available for today",
          },
        },
        { status: 206 } // Partial content
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: content,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching today's content:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch content",
        },
      },
      { status: 500 }
    );
  }
}

// Health check endpoint for Phase 5 deployment
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
```

**Step 2: Test API Route** (30 minutes)
```bash
# Start dev server
npm run dev

# Test endpoint
curl http://localhost:3000/api/content/today

# Expected response:
# {
#   "success": true,
#   "data": {
#     "word": { "id": "...", "word": "serendipity", ... },
#     "capital": { "id": "...", "country": "Japan", ... },
#     "fact": { "id": "...", "title": "Honey Never Spoils", ... },
#     "history": { "id": "...", "title": "Martin Luther King Jr. Born", ... }
#   }
# }
```

### Acceptance Criteria
- [ ] `/api/content/today` endpoint created
- [ ] Returns JSON with 4 content items
- [ ] Handles missing content gracefully
- [ ] Includes Cache-Control headers
- [ ] Curl request returns 200 status

---

## Task 2: Build Content Card Components (3-4 hours)

### Objective
Create reusable card components for each content type (Server Components).

### Steps

**Step 1: Create Base Card Component** (1 hour)
- Create: `app/components/content/ContentCard.tsx`

```typescript
// app/components/content/ContentCard.tsx
import { ReactNode } from "react";

interface ContentCardProps {
  icon: string;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function ContentCard({
  icon,
  title,
  children,
  actions,
}: ContentCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-lg p-6 md:p-8 hover:border-purple-500/40 transition-all duration-300 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl md:text-4xl">{icon}</span>
        <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
      </div>

      {/* Content */}
      <div className="flex-grow text-gray-200 text-sm md:text-base leading-relaxed mb-4">
        {children}
      </div>

      {/* Actions */}
      {actions && <div className="flex gap-2 pt-4 border-t border-purple-500/10">{actions}</div>}
    </div>
  );
}
```

**Step 2: Create Word Card Component** (45 minutes)
- Create: `app/components/content/WordCard.tsx`

```typescript
// app/components/content/WordCard.tsx
import { ContentCard } from "./ContentCard";

interface WordCardProps {
  id: string;
  word: string;
  definition: string;
  exampleSentence?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  children?: React.ReactNode; // For interactive elements like favorite button
}

export function WordCard({
  id,
  word,
  definition,
  exampleSentence,
  pronunciation,
  partOfSpeech,
  children,
}: WordCardProps) {
  return (
    <ContentCard
      icon="📚"
      title="Word of the Day"
      actions={children}
    >
      <div className="space-y-3">
        {/* Word */}
        <div>
          <div className="text-xl md:text-2xl font-bold text-purple-300 uppercase tracking-wide">
            {word}
          </div>
          {pronunciation && (
            <div className="text-xs md:text-sm text-gray-400 italic">
              /{pronunciation}/
            </div>
          )}
        </div>

        {/* Definition */}
        <div>
          <div className="text-gray-100 font-semibold mb-1">Definition</div>
          <p className="text-gray-300">{definition}</p>
        </div>

        {/* Example */}
        {exampleSentence && (
          <div>
            <div className="text-gray-100 font-semibold mb-1">Example</div>
            <p className="text-gray-300 italic">"{exampleSentence}"</p>
          </div>
        )}

        {/* Metadata */}
        {partOfSpeech && (
          <div className="text-xs text-gray-500 pt-2">
            Part of Speech: <span className="capitalize">{partOfSpeech}</span>
          </div>
        )}
      </div>
    </ContentCard>
  );
}
```

**Step 3: Create Capital Card Component** (45 minutes)
- Create: `app/components/content/CapitalCard.tsx`

```typescript
// app/components/content/CapitalCard.tsx
import { ContentCard } from "./ContentCard";

interface CapitalCardProps {
  id: string;
  country: string;
  capital: string;
  funFact?: string;
  flagEmoji?: string;
  currency?: string;
  language?: string;
  children?: React.ReactNode;
}

export function CapitalCard({
  id,
  country,
  capital,
  funFact,
  flagEmoji,
  currency,
  language,
  children,
}: CapitalCardProps) {
  return (
    <ContentCard
      icon="🌍"
      title="Capital of the Day"
      actions={children}
    >
      <div className="space-y-3">
        {/* Capital & Country */}
        <div>
          <div className="text-2xl md:text-3xl font-bold text-blue-300 mb-1">
            {flagEmoji && `${flagEmoji} `}
            {capital}
          </div>
          <div className="text-lg text-gray-400">{country}</div>
        </div>

        {/* Fun Fact */}
        {funFact && (
          <div>
            <div className="text-gray-100 font-semibold mb-1">Fun Fact</div>
            <p className="text-gray-300">{funFact}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 space-y-1 pt-2">
          {language && <div>Language: {language}</div>}
          {currency && <div>Currency: {currency}</div>}
        </div>
      </div>
    </ContentCard>
  );
}
```

**Step 4: Create Fact Card Component** (45 minutes)
- Create: `app/components/content/FactCard.tsx`

```typescript
// app/components/content/FactCard.tsx
import { ContentCard } from "./ContentCard";

interface FactCardProps {
  id: string;
  title: string;
  content: string;
  category?: string;
  source?: string;
  verified?: boolean;
  children?: React.ReactNode;
}

export function FactCard({
  id,
  title,
  content,
  category,
  source,
  verified,
  children,
}: FactCardProps) {
  return (
    <ContentCard
      icon="💡"
      title="Fun Fact"
      actions={children}
    >
      <div className="space-y-3">
        {/* Title */}
        <div className="text-lg md:text-xl font-bold text-cyan-300">
          {title}
        </div>

        {/* Content */}
        <p className="text-gray-300">{content}</p>

        {/* Metadata */}
        <div className="text-xs text-gray-500 space-y-1 pt-2 flex flex-wrap gap-2">
          {category && (
            <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded">
              {category}
            </span>
          )}
          {verified && (
            <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded">
              ✓ Verified
            </span>
          )}
          {source && (
            <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs">
              {source}
            </span>
          )}
        </div>
      </div>
    </ContentCard>
  );
}
```

**Step 5: Create History Card Component** (45 minutes)
- Create: `app/components/content/HistoryCard.tsx`

```typescript
// app/components/content/HistoryCard.tsx
import { ContentCard } from "./ContentCard";

interface HistoryCardProps {
  id: string;
  title: string;
  description: string;
  year?: number;
  location?: string;
  people?: string[];
  children?: React.ReactNode;
}

export function HistoryCard({
  id,
  title,
  description,
  year,
  location,
  people,
  children,
}: HistoryCardProps) {
  return (
    <ContentCard
      icon="📅"
      title="This Day in History"
      actions={children}
    >
      <div className="space-y-3">
        {/* Title */}
        <div className="text-lg md:text-xl font-bold text-amber-300">
          {title}
        </div>

        {/* Year */}
        {year && (
          <div className="text-2xl font-bold text-gray-400">{year}</div>
        )}

        {/* Description */}
        <p className="text-gray-300">{description}</p>

        {/* Metadata */}
        <div className="text-xs text-gray-500 space-y-1 pt-2">
          {location && <div>📍 {location}</div>}
          {people && people.length > 0 && (
            <div>👥 {people.join(", ")}</div>
          )}
        </div>
      </div>
    </ContentCard>
  );
}
```

### Acceptance Criteria
- [ ] All 4 card components created
- [ ] Cards have consistent styling
- [ ] Cards responsive on mobile
- [ ] Icons and typography clear
- [ ] Metadata displayed appropriately
- [ ] Actions slot for interactive elements

---

## Task 3: Update Home Page (2 hours)

### Objective
Display today's 4 content cards on the home page.

### Steps

**Step 1: Create Content Display Component** (45 minutes)
- Create: `app/components/content/ContentGrid.tsx`

```typescript
// app/components/content/ContentGrid.tsx
import { WordCard } from "./WordCard";
import { CapitalCard } from "./CapitalCard";
import { FactCard } from "./FactCard";
import { HistoryCard } from "./HistoryCard";
import { getTodaysContent } from "@/lib/content";

export async function ContentGrid() {
  try {
    const content = await getTodaysContent();

    if (!content.word || !content.capital || !content.fact || !content.history) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-400">
            No content available for today. Please check back later.
          </p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-6">
        <WordCard
          id={content.word.id}
          word={content.word.word}
          definition={content.word.definition}
          exampleSentence={content.word.exampleSentence || undefined}
          pronunciation={content.word.pronunciation || undefined}
          partOfSpeech={content.word.partOfSpeech || undefined}
        />

        <CapitalCard
          id={content.capital.id}
          country={content.capital.country}
          capital={content.capital.capital}
          funFact={content.capital.funFact || undefined}
          flagEmoji={content.capital.flagEmoji || undefined}
          currency={content.capital.currency || undefined}
          language={content.capital.language || undefined}
        />

        <FactCard
          id={content.fact.id}
          title={content.fact.title}
          content={content.fact.content}
          category={content.fact.category || undefined}
          source={content.fact.source || undefined}
        />

        <HistoryCard
          id={content.history.id}
          title={content.history.title}
          description={content.history.description}
          year={content.history.year || undefined}
          location={content.history.location || undefined}
          people={content.history.people || undefined}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading content grid:", error);
    return (
      <div className="text-center py-12">
        <p className="text-red-400">
          Error loading content. Please refresh the page.
        </p>
      </div>
    );
  }
}
```

**Step 2: Update Home Page** (45 minutes)
- Update: `app/page.tsx`
- Add content grid section

```typescript
// In app/page.tsx, add this import at the top:
import { ContentGrid } from "./components/content/ContentGrid";
import { Suspense } from "react";

// Add this component after the CTA section:
function ContentGridSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-lg p-6 md:p-8 h-64"
        />
      ))}
    </div>
  );
}

// Add this section to your JSX (after your CTA):
<section className="mt-24">
  <h2 className="text-4xl font-bold text-white mb-12 text-center">
    Today's Learning
  </h2>
  <Suspense fallback={<ContentGridSkeleton />}>
    <ContentGrid />
  </Suspense>
  <div className="mt-12 text-center">
    <p className="text-gray-400 mb-6">
      Come back every day for new content!
    </p>
    <Link
      href="/signup"
      className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition"
    >
      Create Account to Save Favorites
    </Link>
  </div>
</section>
```

### Acceptance Criteria
- [ ] Content grid displays on home page
- [ ] All 4 card components visible
- [ ] Responsive layout on mobile
- [ ] Loading skeleton appears while fetching
- [ ] Error handling works
- [ ] Sign up CTA visible

---

## Task 4: Add Loading & Animations (1-2 hours)

### Objective
Polish the UI with smooth transitions and loading states.

### Steps

**Step 1: Add Animations** (1 hour)
- Update: `app/components/content/ContentCard.tsx`
- Add animations to cards

```typescript
// In ContentCard.tsx, update the div className:
<div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-lg p-6 md:p-8 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
```

**Step 2: Add Tailwind Animation Config** (15 minutes)
- Update: `tailwind.config.ts`

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        "in": "fadeInUp 0.5s ease-out",
      },
      keyframes: {
        fadeInUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
export default config;
```

**Step 3: Test Animations** (30 minutes)
```bash
# Start dev server
npm run dev

# Open http://localhost:3000
# Verify:
# - Cards fade in on page load
# - Cards lift on hover
# - Border color changes on hover
# - Smooth transitions
```

### Acceptance Criteria
- [ ] Cards fade in on page load
- [ ] Hover effects visible (lift, shadow)
- [ ] Animations smooth (no jank)
- [ ] Mobile animations work
- [ ] Loading skeleton animates

---

## Completion Checklist

- [ ] API endpoint created and tested
- [ ] All 4 card components created
- [ ] Home page displays content grid
- [ ] Loading skeleton appears while fetching
- [ ] Animations and transitions work smoothly
- [ ] Error handling implemented
- [ ] Mobile responsive on all devices
- [ ] No console errors
- [ ] Page load under 2 seconds

## Next Steps

Once Task 4 is complete:

1. Commit: `git add . && git commit -m "feat(phase1-sprint3): daily content UI with card components"`
2. Test on multiple devices (phone, tablet, desktop)
3. Deploy to Vercel: `vercel deploy`
4. Share with friends and get feedback
5. Move to Phase 2, Sprint 1: Authentication with Cognito

## Troubleshooting

**Cards not displaying**:
- Check API endpoint returns data: `curl http://localhost:3000/api/content/today`
- Verify ContentGrid component can fetch
- Check browser console for errors

**Animations not working**:
- Verify `tailwind.config.ts` includes animation config
- Check Tailwind CSS is imported in `globals.css`
- Restart dev server: `npm run dev`

**Mobile layout broken**:
- Check `md:` breakpoints are used correctly
- Test with browser dev tools mobile view
- Verify grid uses `md:grid-cols-2`

**API returns 206 (partial content)**:
- Some content types missing for today
- Run seed again if needed: `npx prisma db seed`
- Or manually add missing content via Prisma Studio
