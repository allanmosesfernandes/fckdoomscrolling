# Phase 2, Sprint 3: Favorites & Personalization (12-15 hours)

**Phase**: 2 - Authentication & Favorites
**Sprint**: 3 of 3
**Duration**: 12-15 hours (Weeks 7-8)
**Goal**: Allow users to save and view favorite content

## Context

Users can now authenticate. They need ability to save favorite facts and view them later.

## Sprint Overview

| Task | Duration | Deliverable |
|------|----------|-------------|
| Extend database schema | 2h | User & Favorite models in Prisma |
| Create API routes | 3-4h | Favorites CRUD endpoints |
| Build FavoriteButton component | 2-3h | Interactive heart button (Client Component) |
| Create favorites page | 2-3h | Display user's saved favorites |
| Add to content cards | 1-2h | Integrate button into display |
| Test end-to-end | 1-2h | ✅ Save and view favorites |

**Total**: 12-15 hours

## Task 1: Extend Database Schema (2 hours)

### Steps

**Step 1: Update Prisma Schema** (1 hour)
- Update: `prisma/schema.prisma`

Add/update these models:

```prisma
// User model - Add these fields if not present
model User {
  id              String    @id @default(uuid())
  cognitoSub      String    @unique
  email           String    @unique
  emailVerified   DateTime?
  displayName     String?
  profileImage    String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastLoginAt     DateTime?

  // Relations
  favorites       Favorite[]

  @@index([email])
  @@index([cognitoSub])
}

// Favorites model
model Favorite {
  id          String    @id @default(uuid())
  userId      String

  // Content reference
  contentType String    // 'word', 'capital', 'fact', 'history'
  contentId   String    // UUID of the content

  // Metadata
  notes       String?   @db.Text
  createdAt   DateTime  @default(now())

  // Relations
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Constraints
  @@unique([userId, contentType, contentId])
  @@index([userId])
  @@index([contentType, contentId])
}
```

**Step 2: Create and Run Migration** (1 hour)
```bash
# Create migration
npx prisma migrate dev --name add_favorites

# When prompted, choose a name like:
# "add_favorites"

# This will:
# 1. Create migration file
# 2. Apply to database
# 3. Update Prisma client
```

### Acceptance Criteria
- [ ] User model includes relations
- [ ] Favorite model created
- [ ] Migration applied successfully
- [ ] Prisma Studio shows both tables

---

## Task 2: Create API Routes (3-4 hours)

### Steps

**Step 1: Create Favorites GET Route** (1 hour)
- Create: `app/api/favorites/route.ts`

```typescript
// app/api/favorites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

interface FavoriteWithContent extends Record<string, any> {
  id: string;
  contentType: string;
  contentId: string;
  notes?: string;
  createdAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");
    const contentType = request.nextUrl.searchParams.get("type");

    const whereClause: any = { userId: session.userId };
    if (contentType) {
      whereClause.contentType = contentType;
    }

    // Get total count
    const total = await prisma.favorite.count({ where: whereClause });

    // Get paginated results
    const favorites = await prisma.favorite.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    });

    return NextResponse.json({
      success: true,
      data: favorites,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Favorites GET error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch favorites" } },
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
    const { contentType, contentId, notes } = body;

    // Validate
    if (!contentType || !contentId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_contentType_contentId: {
          userId: session.userId,
          contentType,
          contentId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_FAVORITED", message: "Already favorited" } },
        { status: 409 }
      );
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.userId,
        contentType,
        contentId,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      data: favorite,
    }, { status: 201 });
  } catch (error) {
    console.error("Favorites POST error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create favorite" } },
      { status: 500 }
    );
  }
}
```

**Step 2: Create Favorites DELETE Route** (1 hour)
- Create: `app/api/favorites/[id]/route.ts`

```typescript
// app/api/favorites/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id } = params;

    // Verify ownership
    const favorite = await prisma.favorite.findUnique({
      where: { id },
    });

    if (!favorite) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Favorite not found" } },
        { status: 404 }
      );
    }

    if (favorite.userId !== session.userId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not your favorite" } },
        { status: 403 }
      );
    }

    // Delete
    await prisma.favorite.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error("Favorites DELETE error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete favorite" } },
      { status: 500 }
    );
  }
}
```

**Step 3: Create Check Favorite Route** (1 hour)
- Create: `app/api/favorites/check/route.ts`

```typescript
// app/api/favorites/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({
        success: true,
        data: { isFavorited: false },
      });
    }

    const contentType = request.nextUrl.searchParams.get("type");
    const contentId = request.nextUrl.searchParams.get("id");

    if (!contentType || !contentId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Missing parameters" } },
        { status: 400 }
      );
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_contentType_contentId: {
          userId: session.userId,
          contentType,
          contentId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { isFavorited: !!favorite },
    });
  } catch (error) {
    console.error("Check favorite error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to check favorite" } },
      { status: 500 }
    );
  }
}
```

### Acceptance Criteria
- [ ] GET `/api/favorites` returns user's favorites
- [ ] POST `/api/favorites` creates new favorite
- [ ] DELETE `/api/favorites/[id]` removes favorite
- [ ] GET `/api/favorites/check` checks if favorited
- [ ] All routes require authentication
- [ ] Pagination works on GET

---

## Task 3: Build FavoriteButton Component (2-3 hours)

### Steps

**Step 1: Create FavoriteButton** (2-3 hours)
- Create: `app/components/features/FavoriteButton.tsx`

```typescript
// app/components/features/FavoriteButton.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";

interface FavoriteButtonProps {
  contentType: "word" | "capital" | "fact" | "history";
  contentId: string;
  onFavorited?: (isFavorited: boolean) => void;
}

export function FavoriteButton({
  contentType,
  contentId,
  onFavorited,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if already favorited
  useEffect(() => {
    if (!user) return;

    const checkFavorite = async () => {
      try {
        const response = await fetch(
          `/api/favorites/check?type=${contentType}&id=${contentId}`
        );
        const data = await response.json();
        setIsFavorited(data.data.isFavorited);
      } catch (error) {
        console.error("Error checking favorite:", error);
      }
    };

    checkFavorite();
  }, [user, contentType, contentId]);

  async function handleToggle() {
    if (!user) {
      // Redirect to login
      window.location.href = "/signin";
      return;
    }

    setLoading(true);

    try {
      if (isFavorited) {
        // Find and delete favorite
        const favoritesResponse = await fetch(
          `/api/favorites?type=${contentType}&id=${contentId}`
        );
        const favoritesData = await favoritesResponse.json();
        const favorite = favoritesData.data[0];

        if (favorite) {
          await fetch(`/api/favorites/${favorite.id}`, {
            method: "DELETE",
          });
        }

        setIsFavorited(false);
      } else {
        // Create favorite
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType,
            contentId,
          }),
        });

        if (response.ok) {
          setIsFavorited(true);
        }
      }

      onFavorited?.(!isFavorited);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-lg transition ${
        isFavorited
          ? "bg-red-500/20 text-red-300 border border-red-500/30"
          : "bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {loading ? "..." : isFavorited ? "❤️ Saved" : "🤍 Save"}
    </button>
  );
}
```

### Acceptance Criteria
- [ ] Button shows heart icon
- [ ] Toggle works (save/unsave)
- [ ] State persists across refreshes
- [ ] Redirects to login if not authenticated
- [ ] Loading state visible
- [ ] Disabled while saving

---

## Task 4: Create Favorites Page (2-3 hours)

### Steps

**Step 1: Create Favorites Page** (2-3 hours)
- Create: `app/(protected)/favorites/page.tsx`

```typescript
// app/(protected)/favorites/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { WordCard } from "@/app/components/content/WordCard";
import { CapitalCard } from "@/app/components/content/CapitalCard";
import { FactCard } from "@/app/components/content/FactCard";
import { HistoryCard } from "@/app/components/content/HistoryCard";
import { FavoriteButton } from "@/app/components/features/FavoriteButton";

interface Favorite {
  id: string;
  contentType: string;
  contentId: string;
  notes?: string;
  createdAt: string;
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const url = new URL("/api/favorites", window.location.origin);
        if (selectedType) {
          url.searchParams.set("type", selectedType);
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          setFavorites(data.data);
        } else {
          setError(data.error?.message || "Failed to load favorites");
        }
      } catch (err) {
        setError("Failed to load favorites");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user, selectedType]);

  async function handleRemoveFavorite(favoriteId: string) {
    try {
      await fetch(`/api/favorites/${favoriteId}`, {
        method: "DELETE",
      });
      setFavorites(favorites.filter((f) => f.id !== favoriteId));
    } catch (err) {
      setError("Failed to remove favorite");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">Saved Favorites</h1>
        <p className="text-gray-400">
          {favorites.length} item{favorites.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex gap-2 flex-wrap">
        {["word", "capital", "fact", "history"].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(selectedType === type ? null : type)}
            className={`px-4 py-2 rounded-lg transition ${
              selectedType === type
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-gray-300 hover:bg-slate-700"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading favorites...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-200">{error}</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No favorites yet</p>
          <p className="text-gray-500">Save your first favorite to see it here!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {favorites.map((fav) => {
            const RemoveButton = (
              <button
                onClick={() => handleRemoveFavorite(fav.id)}
                className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition"
              >
                🗑️ Remove
              </button>
            );

            // Render based on content type (simplified - just show ID for now)
            return (
              <div
                key={fav.id}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 rounded-lg p-6 md:p-8"
              >
                <div className="mb-4">
                  <span className="text-xs px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded">
                    {fav.contentType}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4">ID: {fav.contentId}</p>
                {fav.notes && (
                  <p className="text-gray-300 mb-4">Notes: {fav.notes}</p>
                )}
                <div className="flex gap-2 pt-4 border-t border-purple-500/10">
                  {RemoveButton}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### Acceptance Criteria
- [ ] `/favorites` page accessible when authenticated
- [ ] Lists all user's favorites
- [ ] Filter by content type works
- [ ] Remove button works
- [ ] Empty state shown when no favorites
- [ ] Mobile responsive

---

## Task 5: Integrate Button into Cards (1-2 hours)

### Steps

**Step 1: Update Content Components** (1-2 hours)
- Update: `app/components/content/ContentGrid.tsx`

```typescript
// In ContentGrid.tsx, import FavoriteButton:
import { FavoriteButton } from "../features/FavoriteButton";

// Update card rendering to include button:
<WordCard
  id={content.word.id}
  word={content.word.word}
  definition={content.word.definition}
  exampleSentence={content.word.exampleSentence || undefined}
  pronunciation={content.word.pronunciation || undefined}
  partOfSpeech={content.word.partOfSpeech || undefined}
>
  <FavoriteButton
    contentType="word"
    contentId={content.word.id}
  />
</WordCard>

{/* Repeat for other content types */}
```

### Acceptance Criteria
- [ ] Heart button appears on each card
- [ ] Button is interactive
- [ ] Save/unsave works
- [ ] Displays saved state correctly

---

## Completion Checklist

- [ ] User and Favorite models in database
- [ ] Migration applied successfully
- [ ] API routes for CRUD operations
- [ ] FavoriteButton component created
- [ ] Favorites page shows all saved items
- [ ] Filter by type works
- [ ] Remove favorite works
- [ ] Button integrated into cards
- [ ] Full end-to-end tested
- [ ] Responsive on all devices

## Next Steps

1. Commit: `git add . && git commit -m "feat(phase2-sprint3): favorites and personalization"`
2. Deploy and test
3. Move to Phase 3, Sprint 1: Streaks

## Troubleshooting

**Favorites not saving**:
- Check API returns 201 status
- Verify session is valid
- Check database has Favorite table

**Filter not working**:
- Check `selectedType` state updates
- Verify API accepts `type` query param

**Remove not working**:
- Verify favorite ID is correct
- Check you own the favorite
- Check CORS if using different domain
