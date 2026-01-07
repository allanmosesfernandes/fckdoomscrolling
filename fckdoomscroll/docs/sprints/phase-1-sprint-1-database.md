# Phase 1, Sprint 1: Database Setup (10-12 hours)

**Phase**: 1 - Core Content Display
**Sprint**: 1 of 3
**Duration**: 10-12 hours (Weeks 1-2)
**Goal**: Set up PostgreSQL database with Prisma ORM and Docker for local development

## Context

You have a Next.js app with basic structure. Now you need:
- PostgreSQL database (local + cloud-ready)
- Prisma ORM for type-safe database access
- Database schema for 4 content types
- Docker for reproducible development environment

## Sprint Overview

| Task | Duration | Deliverable |
|------|----------|-------------|
| Install Prisma & initialize | 1h | Prisma config files |
| Design & create schema | 2-3h | `prisma/schema.prisma` |
| Docker Compose setup | 2-3h | `docker-compose.yml` + running DB |
| Create Prisma client utility | 1-2h | `lib/prisma.ts` singleton |
| Test connection & schema | 1h | ✅ Verify with Prisma Studio |

**Total**: 10-12 hours

## Prerequisites

- Node.js 18+ installed
- Docker & Docker Compose installed
- Basic understanding of databases

## Task 1: Install Prisma & Initialize (1 hour)

### Steps

**Step 1: Install Dependencies** (10 minutes)
```bash
cd C:\Users\AllanFernandes\Desktop\Code\fckdoomscrolling\fckdoomscroll
npm install prisma @prisma/client
npm install -D typescript ts-node @types/node
```

**Step 2: Initialize Prisma** (10 minutes)
```bash
npx prisma init
```

This creates:
- `prisma/.env` - Environment variables
- `prisma/schema.prisma` - Database schema file

**Step 3: Create .env.local** (10 minutes)
- File: `.env.local`

```env
# Database connection (will be updated after Docker setup)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fckdoomscroll?schema=public"

# Node environment
NODE_ENV="development"

# App configuration (for later phases)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Step 4: Verify Installation** (10 minutes)
```bash
npx prisma --version
```

Should output: `prisma <version>`

### Acceptance Criteria
- [ ] `prisma` package installed
- [ ] `@prisma/client` package installed
- [ ] `prisma/schema.prisma` file exists
- [ ] `.env.local` created with DATABASE_URL

---

## Task 2: Design & Create Schema (2-3 hours)

### Overview

You need tables for:
- 4 content types (word, capital, fact, history)
- User management (supplements Cognito in Phase 2)
- Relations for later phases

### Steps

**Step 1: Understand Prisma Schema Syntax** (30 minutes)
- Read: [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- Key concepts:
  - Models = Tables
  - Fields = Columns
  - `@id` = Primary key
  - `@unique` = Unique constraint
  - Relations = Foreign keys

**Step 2: Create Schema** (90-120 minutes)
- File: `prisma/schema.prisma`

Replace default content with:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// CONTENT MODELS
// ============================================================================

/// Word of the day
model DailyWord {
  id              String      @id @default(uuid())
  word            String      @unique
  definition      String      @db.Text
  exampleSentence String?     @db.Text
  etymology       String?     @db.Text
  pronunciation   String?
  partOfSpeech    String?     // noun, verb, adjective, adverb, etc.
  difficulty      String?     // beginner, intermediate, advanced

  // When to display
  displayDate     DateTime    @db.Date

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations (for Phase 2)
  favorites       Favorite[]

  @@unique([displayDate])
  @@index([displayDate])
}

/// Capital and country of the day
model Capital {
  id          String      @id @default(uuid())
  country     String
  capital     String
  continent   String?
  population  BigInt?
  funFact     String?     @db.Text
  flagEmoji   String?
  currency    String?
  language    String?
  lat         Float?
  lng         Float?

  displayDate DateTime    @db.Date

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  favorites   Favorite[]

  @@unique([displayDate])
  @@index([displayDate])
}

/// Fun fact of the day
model FunFact {
  id        String      @id @default(uuid())
  title     String
  content   String      @db.Text
  category  String?     // science, nature, history, technology, etc.
  source    String?     // Wikipedia, TED, etc.
  verified  Boolean     @default(false)

  displayDate DateTime   @db.Date

  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  favorites  Favorite[]

  @@unique([displayDate])
  @@index([displayDate])
}

/// Historical event or festival of the day
model HistoricalEvent {
  id          String      @id @default(uuid())
  title       String
  description String      @db.Text

  eventDate   DateTime    @db.Date  // When the event actually occurred
  year        Int?
  category    String?     // birth, death, invention, war, discovery, festival
  location    String?
  people      String[]    // Array of names

  displayDate DateTime    @db.Date  // When to show this event

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  favorites   Favorite[]

  @@unique([displayDate])
  @@index([displayDate])
}

// ============================================================================
// USER MODELS (for Phase 2)
// ============================================================================

model User {
  id              String    @id @default(uuid())

  // Cognito attributes (Phase 2)
  cognitoSub      String?   @unique
  email           String    @unique
  emailVerified   DateTime?

  displayName     String?
  profileImage    String?

  // Streaks (Phase 3)
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

// ============================================================================
// INTERACTION MODELS (for Phase 2+)
// ============================================================================

model Favorite {
  id          String    @id @default(uuid())
  userId      String?

  // Content reference
  contentType String    // 'word', 'capital', 'fact', 'history'
  contentId   String    // UUID of the content

  notes       String?   @db.Text
  createdAt   DateTime  @default(now())

  user        User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@unique([userId, contentType, contentId])
  @@index([userId])
}

model Visit {
  id            String    @id @default(uuid())
  userId        String?
  visitDate     DateTime  @db.Date
  contentViewed Json?
  timeSpent     Int?
  createdAt     DateTime  @default(now())

  user          User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@unique([userId, visitDate])
  @@index([userId, visitDate])
}
```

### Explanation

**DailyWord Model**:
- Stores word of the day
- `displayDate` is unique per day (can't have 2 words on same day)
- `@@index([displayDate])` for fast lookups

**Capital Model**:
- Stores capital/country info
- Same pattern as DailyWord

**FunFact Model**:
- Stores interesting facts
- `category` for filtering (optional)
- `verified` to mark trusted sources

**HistoricalEvent Model**:
- Stores historical events/festivals
- `people` is a string array for names
- `eventDate` vs `displayDate` (actual vs display)

**User Model**:
- Created now (empty fields for Phase 2)
- `cognitoSub` will store Cognito user ID
- Streak fields for Phase 3

**Favorite & Visit Models**:
- Created now but optional `userId`
- Phase 2 will make `userId` required

### Acceptance Criteria
- [ ] `prisma/schema.prisma` file created
- [ ] All 4 content models defined
- [ ] User model includes future fields
- [ ] Relations created (favorites, visits)
- [ ] Indexes added for performance
- [ ] No Prisma validation errors: `npx prisma validate`

---

## Task 3: Docker Compose Setup (2-3 hours)

### Objective
Set up local PostgreSQL database using Docker for zero-friction development.

### Steps

**Step 1: Create docker-compose.yml** (30 minutes)
- File: `docker-compose.yml` (root of project)

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: fckdoomscroll-db
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: fckdoomscroll
    volumes:
      # Persist data in a volume (survives container restart)
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  # Optional: Database GUI for exploring data
  adminer:
    image: adminer
    container_name: fckdoomscroll-adminer
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: db
    depends_on:
      - db
    networks:
      - app-network

volumes:
  postgres_data:
    driver: local

networks:
  app-network:
    driver: bridge
```

**Step 2: Create .dockerignore** (15 minutes)
- File: `.dockerignore`

```
node_modules
.next
.git
.env.local
.env*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
*.pem
coverage
.vscode
README.md
```

**Step 3: Start Docker** (30 minutes)
```bash
# Start PostgreSQL in background
docker-compose up -d

# Verify it's running
docker-compose ps

# Should show:
# fckdoomscroll-db    postgres:16-alpine    Up (healthy)
# fckdoomscroll-adminer adminer              Up
```

**Step 4: Verify Connection** (30 minutes)
```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d fckdoomscroll

# You should see:
# psql (version)
# Type "help" for help.
#
# fckdoomscroll=#

# Type \q to exit
```

If `psql` command not found, test via Adminer:
- Visit http://localhost:8080
- Server: `db`
- Username: `postgres`
- Password: `postgres`
- Database: `fckdoomscroll`
- Click "Login"

**Step 5: Stop & Restart** (15 minutes)
```bash
# Stop containers
docker-compose down

# Restart (data persists!)
docker-compose up -d

# Verify still connected
docker-compose exec db psql -U postgres -d fckdoomscroll -c "\dt"
```

### Acceptance Criteria
- [ ] `docker-compose.yml` file created
- [ ] `docker-compose up -d` starts without errors
- [ ] Database is healthy (psql or Adminer works)
- [ ] Can connect with: `postgres:postgres@localhost:5432/fckdoomscroll`
- [ ] Data persists after `docker-compose down`

---

## Task 4: Create Prisma Client Utility (1-2 hours)

### Objective
Create a singleton instance of Prisma client for safe reuse across Next.js.

### Steps

**Step 1: Create Prisma Client Module** (30 minutes)
- Create directory: `lib/`
- File: `lib/prisma.ts`

```typescript
// lib/prisma.ts
// Singleton Prisma client to avoid "too many connections" errors

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Why Singleton?**
- Next.js hot-reloads modules during development
- Each reload would create a new Prisma client
- Singleton pattern ensures one client instance reused
- Prevents "too many connections" error

**Step 2: Test Client** (30 minutes)
- Create test file: `lib/prisma.test.ts` (temporary)

```typescript
// lib/prisma.test.ts
import { prisma } from "./prisma";

async function main() {
  try {
    // Test connection
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log("✅ Database connection successful!");
    console.log("Current time from DB:", result);

    // Count tables
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
    `;
    console.log("✅ Tables in database:", tables);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

Run test:
```bash
npx ts-node lib/prisma.test.ts

# Expected output:
# ✅ Database connection successful!
# Current time from DB: [...]
# ✅ Tables in database: [] (empty, no tables yet)
```

**Step 3: Create database.ts utility** (30 minutes)
- File: `lib/database.ts`

```typescript
// lib/database.ts
// Database utility functions

import { prisma } from "./prisma";

/**
 * Connect to database
 */
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to database");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    throw error;
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log("✅ Disconnected from database");
  } catch (error) {
    console.error("❌ Failed to disconnect from database:", error);
    throw error;
  }
}

/**
 * Run a transaction
 */
export async function transaction<T>(
  callback: (tx: typeof prisma) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback);
}

export { prisma };
```

### Acceptance Criteria
- [ ] `lib/prisma.ts` created with singleton pattern
- [ ] `lib/database.ts` created with utilities
- [ ] `npx ts-node lib/prisma.test.ts` succeeds
- [ ] Database connection test passes
- [ ] Can query database with Prisma

---

## Task 5: Create Database & Run Migrations (1 hour)

### Steps

**Step 1: Create Initial Migration** (30 minutes)
```bash
# Create migration (applies schema to database)
npx prisma migrate dev --name init

# When prompted for name, type: init
# This creates:
# - prisma/migrations/[timestamp]_init/migration.sql
# - Updated .env.local (optional)
```

**Step 2: Verify Schema** (30 minutes)
```bash
# Open Prisma Studio (visual database browser)
npx prisma studio

# Browser should open at http://localhost:5555
# You should see all 4 content models
# Try clicking on each model
# Should be empty (no data yet)
```

**Step 3: Check Migration File** (10 minutes)
- File: `prisma/migrations/[timestamp]_init/migration.sql`
- Should contain CREATE TABLE statements for all models

### Acceptance Criteria
- [ ] Migration runs without errors
- [ ] `prisma/migrations/` directory created
- [ ] Prisma Studio opens and shows all models
- [ ] No data in tables (expected, Phase 1.2 adds data)

---

## Completion Checklist

- [ ] Prisma & dependencies installed
- [ ] `prisma/schema.prisma` defined with all models
- [ ] `docker-compose.yml` created and running
- [ ] PostgreSQL database is healthy
- [ ] `.env.local` configured with DATABASE_URL
- [ ] Prisma client singleton created in `lib/prisma.ts`
- [ ] Database utilities created in `lib/database.ts`
- [ ] Initial migration applied
- [ ] Prisma Studio opens successfully
- [ ] Database connection test passes

## Deployment Checklist (for later phases)

When you move to Vercel/AWS:
- [ ] Update `DATABASE_URL` in environment variables
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Verify schema in production: `npx prisma studio` (read-only access)

## Troubleshooting

**Docker not running**:
```bash
docker-compose up -d
docker-compose ps  # Check status
```

**Cannot connect to database**:
- Check Docker is running: `docker ps`
- Check container is healthy: `docker-compose ps`
- Check .env.local has correct DATABASE_URL
- Verify credentials: postgres/postgres

**Prisma schema validation fails**:
- Run: `npx prisma validate`
- Check for syntax errors in schema.prisma
- Ensure all models have `@id` field

**Migration fails**:
- Check database is empty (first run)
- If rerunning, reset: `npx prisma migrate reset`
- Check DATABASE_URL in .env.local

**Prisma Studio won't open**:
- Restart: `npx prisma studio --browser none`
- Then navigate to http://localhost:5555 manually

## Next Steps

Once Task 5 is complete:

1. Commit: `git add . && git commit -m "feat(phase1-sprint1): database setup with postgres and prisma"`
2. Update todo list
3. Move to Phase 1, Sprint 2: Content Seeding

## References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
