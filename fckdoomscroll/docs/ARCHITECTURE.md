# Technical Architecture

## Tech Stack

### Frontend
- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - UI library with Server Components
- **TypeScript 5** - Strict mode for type safety
- **Tailwind CSS v4** - Utility-first CSS framework
- **Shadcn/ui** - High-quality component library (optional)

### Backend
- **Next.js API Routes** - Serverless backend endpoints
- **Prisma ORM** - Database abstraction layer
- **PostgreSQL 16** - Relational database

### Authentication
- **AWS Cognito** - User management and authentication
- **JWT** - Secure token format
- **HTTP-only Cookies** - Secure session storage

### Email
- **AWS SES** - Simple Email Service for transactional emails
- **Nodemailer** - Email templating

### Infrastructure
- **AWS ECS Fargate** - Container orchestration (Phase 5)
- **AWS RDS PostgreSQL** - Managed database (Phase 5)
- **AWS ECR** - Container registry (Phase 5)
- **AWS CloudWatch** - Monitoring and logs (Phase 5)
- **Vercel** - Deployment (Phase 1-4)
- **Docker** - Containerization

### DevOps
- **GitHub Actions** - CI/CD automation
- **Docker** - Multi-stage builds for production

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Browser / Client                      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Vercel / AWS ALB                       │
│              (Load Balancer + CDN)                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Application                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  App Router Pages (React Server Components)      │  │
│  │  - (auth) route group: signin, signup            │  │
│  │  - (protected) route group: dashboard, profile   │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API Routes                                      │  │
│  │  - /api/auth/*        (Cognito integration)      │  │
│  │  - /api/content/*     (Content delivery)         │  │
│  │  - /api/favorites/*   (User data)                │  │
│  │  - /api/streak/*      (Gamification)             │  │
│  │  - /api/cron/*        (Scheduled tasks)          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Middleware                                      │  │
│  │  - Route protection                              │  │
│  │  - Session validation                            │  │
│  └──────────────────────────────────────────────────┘  │
└────────┬──────────────────────┬──────────────────────┬──┘
         │                      │                      │
         ▼                      ▼                      ▼
    ┌─────────┐          ┌────────────┐         ┌───────────┐
    │ AWS     │          │ Cognito    │         │   AWS     │
    │ RDS     │          │ User Pool  │         │   SES     │
    │ Postgres│          │            │         │ (Email)   │
    └─────────┘          └────────────┘         └───────────┘
```

## Next.js App Structure

```
fckdoomscroll/
├── app/                           # Next.js App Router
│   ├── (auth)/                   # Authentication route group
│   │   ├── signin/
│   │   │   └── page.tsx          # Sign in page (Client)
│   │   ├── signup/
│   │   │   └── page.tsx          # Sign up page (Client)
│   │   └── layout.tsx            # Auth-specific layout
│   │
│   ├── (protected)/              # Protected route group
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Main content display (Server)
│   │   ├── favorites/
│   │   │   └── page.tsx          # User favorites (Server)
│   │   ├── profile/
│   │   │   └── page.tsx          # User profile & settings (Server)
│   │   └── layout.tsx            # Protected layout (auth check)
│   │
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   ├── callback/route.ts # Cognito OAuth callback
│   │   │   ├── refresh/route.ts  # Token refresh
│   │   │   └── signout/route.ts  # Logout handler
│   │   │
│   │   ├── content/
│   │   │   ├── today/route.ts    # GET today's content bundle
│   │   │   └── [id]/route.ts     # GET specific content item
│   │   │
│   │   ├── favorites/
│   │   │   ├── route.ts          # GET list (POST new favorite)
│   │   │   └── [id]/route.ts     # DELETE favorite
│   │   │
│   │   ├── streak/
│   │   │   └── route.ts          # GET streak (POST record visit)
│   │   │
│   │   └── cron/
│   │       ├── streak-reminder/route.ts
│   │       └── weekly-digest/route.ts
│   │
│   ├── components/
│   │   ├── ui/                   # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   └── ...
│   │   │
│   │   ├── content/              # Content display (Server Components)
│   │   │   ├── WordCard.tsx
│   │   │   ├── CapitalCard.tsx
│   │   │   ├── FactCard.tsx
│   │   │   └── HistoryCard.tsx
│   │   │
│   │   ├── features/             # Interactive features (Client Components)
│   │   │   ├── FavoriteButton.tsx
│   │   │   ├── StreakDisplay.tsx
│   │   │   ├── AchievementBadge.tsx
│   │   │   └── UserMenu.tsx
│   │   │
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Navigation.tsx
│   │
│   ├── page.tsx                  # Landing page (public)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── error.tsx                 # Global error boundary
│   └── not-found.tsx             # 404 handler
│
├── lib/
│   ├── prisma.ts                 # Prisma client (singleton)
│   │
│   ├── content.ts                # Content fetching logic
│   │   ├── getTodaysContent()    # Get all 4 content types
│   │   ├── getContentByDate()    # Get specific date
│   │   └── getContentById()      # Get by ID
│   │
│   ├── streaks.ts                # Streak calculation
│   │   ├── recordVisit()         # Log a visit
│   │   ├── calculateStreak()     # Calculate current streak
│   │   └── getVisitHistory()     # Get past visits
│   │
│   ├── achievements.ts           # Achievement unlock logic
│   │   ├── checkAchievements()   # Check for unlocks
│   │   ├── unlockAchievement()   # Unlock and notify
│   │   └── getUserAchievements() # Get user achievements
│   │
│   ├── auth/
│   │   ├── cognito.ts            # AWS Cognito integration
│   │   │   ├── exchangeCodeForTokens()
│   │   │   ├── getAuthorizationUrl()
│   │   │   └── validateToken()
│   │   ├── session.ts            # JWT session management
│   │   │   ├── createSession()
│   │   │   ├── getSession()
│   │   │   └── deleteSession()
│   │   └── middleware.ts         # Route protection
│   │
│   ├── email/
│   │   ├── ses.ts                # AWS SES client
│   │   │   └── sendEmail()
│   │   └── templates/
│   │       ├── streak-reminder.ts
│   │       ├── weekly-digest.ts
│   │       └── welcome.ts
│   │
│   ├── utils/
│   │   ├── date.ts               # Date helpers
│   │   ├── validation.ts         # Zod schemas
│   │   ├── errors.ts             # Custom error classes
│   │   └── logger.ts             # Logging setup
│   │
│   └── types/
│       ├── database.ts           # Generated from Prisma
│       ├── api.ts                # API request/response types
│       └── auth.ts               # Auth types
│
├── prisma/
│   ├── schema.prisma             # Prisma schema definition
│   ├── seed.ts                   # Database seeding script
│   ├── migrations/               # Prisma migrations (auto-generated)
│   │   └── migration_lock.toml
│   └── seed-data/                # JSON files for seeding
│       ├── words.json
│       ├── capitals.json
│       ├── facts.json
│       └── history.json
│
├── middleware.ts                 # Next.js middleware (route protection)
│
├── public/
│   ├── favicon.ico
│   └── assets/                   # Images, icons
│
├── docker/
│   ├── Dockerfile.prod           # Production multi-stage build
│   └── Dockerfile.dev            # Development build
│
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions CI/CD
│
├── docker-compose.yml            # Local dev environment
├── Dockerfile                    # Symlink to prod
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── package.json
├── .env.example                  # Environment variables template
└── README.md
```

## React Server Components vs Client Components Strategy

### Server Components (Default)
Use Server Components for:
- Data fetching and database queries
- API calls to Cognito
- Authorization checks
- Rendering large lists
- SEO-critical content

**Example: Dashboard Page**
```typescript
// app/(protected)/dashboard/page.tsx (Server Component)
import { getTodaysContent } from '@/lib/content';
import { getCurrentUser } from '@/lib/auth/session';
import { ContentCard } from '@/components/content/WordCard';
import { FavoriteButton } from '@/components/features/FavoriteButton';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const content = await getTodaysContent();

  return (
    <div className="grid gap-6">
      <ContentCard content={content.word}>
        <FavoriteButton contentId={content.word.id} /> {/* Client Component */}
      </ContentCard>
      {/* More cards... */}
    </div>
  );
}
```

### Client Components ('use client')
Use Client Components for:
- Interactive elements (buttons, forms, toggles)
- Real-time state (favorites, streak updates)
- Event listeners and animations
- React hooks (useState, useEffect, useContext)

**Example: Favorite Button**
```typescript
// components/features/FavoriteButton.tsx (Client Component)
'use client';

import { useState } from 'react';
import { toggleFavorite } from '@/app/actions/favorites';

interface FavoriteButtonProps {
  contentId: string;
  contentType: string;
  initialState: boolean;
}

export function FavoriteButton({
  contentId,
  contentType,
  initialState
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialState);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    setIsFavorited(!isFavorited); // Optimistic update

    try {
      await toggleFavorite(contentType, contentId);
    } catch (error) {
      setIsFavorited(isFavorited); // Rollback on error
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={isFavorited ? 'text-red-500' : 'text-gray-400'}
    >
      ❤️
    </button>
  );
}
```

## Authentication Flow

### Cognito Hosted UI OAuth Flow

```
1. User visits app
   ↓
2. Clicks "Sign In"
   ↓
3. Redirected to Cognito Hosted UI (https://fckdoomscroll.auth.us-east-1.amazoncognito.com/login)
   ↓
4. User enters email & password
   ↓
5. Cognito verifies credentials
   ↓
6. Redirects to /api/auth/callback?code=AUTH_CODE&state=STATE
   ↓
7. Next.js API Route exchanges code for tokens
   ↓
8. Tokens validated (JWT signature verified)
   ↓
9. User data extracted from ID token
   ↓
10. Create/update user in PostgreSQL
   ↓
11. Create session JWT
   ↓
12. Set HTTP-only cookie with session
   ↓
13. Redirect to /dashboard
```

### Session Management

**Cookie Format**:
- **Name**: `session`
- **Value**: Signed JWT containing user ID and permissions
- **HttpOnly**: Yes (prevents JS access)
- **Secure**: Yes in production (HTTPS only)
- **SameSite**: Lax (prevents CSRF)
- **MaxAge**: 7 days

**Session Payload**:
```typescript
interface SessionData {
  userId: string;
  email: string;
  displayName: string;
  iat: number; // Issued at
  exp: number; // Expiration
}
```

## API Design Patterns

### Standard Response Format

**Success Response**:
```typescript
{
  success: true,
  data: { /* response data */ },
  meta: {
    page: 1,
    limit: 20,
    total: 100
  }
}
```

**Error Response**:
```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input provided",
    details: [ /* validation errors */ ]
  }
}
```

### HTTP Status Codes
- `200 OK` - Successful GET or POST
- `201 Created` - Successful resource creation
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Authenticated but no permission
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Example Endpoint: Get Today's Content

**Route**: `GET /api/content/today`

**Authentication**: Required (JWT in session cookie)

**Response**:
```typescript
{
  success: true,
  data: {
    word: {
      id: "uuid",
      word: "serendipity",
      definition: "The occurrence of events by chance in a happy or beneficial way",
      exampleSentence: "Finding that old photo was pure serendipity.",
      date: "2024-01-15T00:00:00Z"
    },
    capital: {
      id: "uuid",
      country: "Japan",
      capital: "Tokyo",
      funFact: "Tokyo is the world's largest metropolitan area...",
      date: "2024-01-15T00:00:00Z"
    },
    fact: {
      id: "uuid",
      title: "Honey never spoils",
      content: "Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible...",
      category: "nature",
      date: "2024-01-15T00:00:00Z"
    },
    history: {
      id: "uuid",
      title: "Martin Luther King Jr. born",
      description: "Birth of civil rights leader...",
      year: 1929,
      date: "2024-01-15T00:00:00Z"
    }
  }
}
```

## Performance Considerations

### Frontend
- **Image optimization**: Use Next.js `<Image>` component
- **Code splitting**: Automatic via Next.js App Router
- **CSS**: Tailwind v4 with purging
- **JS bundling**: Tree-shaking enabled
- **Caching**: 7-day browser cache for static assets

### Backend
- **Database connection pooling**: 2-10 connections
- **Query optimization**: Prisma with select fields
- **Response compression**: gzip enabled
- **Caching**: HTTP cache headers on responses

### Infrastructure
- **CDN**: CloudFront for static assets (Phase 5)
- **Database**: Multi-AZ RDS (Phase 5)
- **Auto-scaling**: 2-10 ECS tasks (Phase 5)
- **Health checks**: Every 30 seconds (Phase 5)

## Security Architecture

### Data Protection
- **In Transit**: HTTPS/TLS 1.2+ only
- **At Rest**: RDS encryption enabled
- **Sensitive Data**: Stored in AWS Secrets Manager

### Authentication & Authorization
- **Password Strength**: Min 8 chars, uppercase, lowercase, number
- **MFA**: Optional via Cognito
- **Token Expiration**: 7 days for sessions
- **Rate Limiting**: 100 requests/minute per IP

### Application Security
- **SQL Injection**: Prevented by Prisma ORM
- **XSS**: Prevented by React escaping
- **CSRF**: Protected by SameSite cookies
- **Clickjacking**: X-Frame-Options header
- **Dependency Scanning**: npm audit, dependabot

### Infrastructure Security
- **VPC Isolation**: Private database subnet
- **Security Groups**: Whitelist ports
- **Secrets Management**: AWS Secrets Manager
- **Logging**: CloudWatch logs for audit trail

## Error Handling

### Strategy
1. **User-facing errors**: Friendly messages
2. **Developer errors**: Detailed logs
3. **System errors**: Graceful degradation

### Example Error Handler

```typescript
// lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
  }
}

// API route
export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        },
        { status: error.statusCode }
      );
    }

    // Log unexpected errors
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      },
      { status: 500 }
    );
  }
}
```

## State Management

**Approach**: Server State + Client State

**Server State**:
- User authentication status
- User profile and settings
- User favorites and streaks
- Managed via database and API

**Client State**:
- UI state (modals, dropdowns, forms)
- Temporary form data
- Managed via React hooks and Context API

**Avoid**: Global state management libraries (Redux, Zustand) until needed

## Development Workflow

### Local Development
1. Start PostgreSQL: `docker-compose up -d`
2. Apply migrations: `npx prisma migrate dev`
3. Seed data: `npx prisma db seed`
4. Start dev server: `npm run dev`
5. Open http://localhost:3000

### Type Safety
- All database queries typed via Prisma
- API request/response validated with Zod
- Component props properly typed
- No `any` types without justification

### Testing Strategy
- Unit tests for business logic (streaks, achievements)
- Integration tests for API routes
- Manual testing for user flows
- E2E tests (optional) for critical paths

### Deployment Checklist
- [ ] All TypeScript errors fixed
- [ ] ESLint warnings addressed
- [ ] Environment variables set
- [ ] Database migrations tested
- [ ] API endpoints tested in Postman/curl
- [ ] Pages tested on mobile
- [ ] Performance budget checked
- [ ] Security audit completed
