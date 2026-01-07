# Database Schema

Complete Prisma schema definition with explanations.

## Overview

The database is designed to support:
- Daily rotating content (4 types)
- User authentication (Cognito + local data)
- User interactions (favorites, visits)
- Gamification (streaks, achievements)
- Email preferences

## Complete Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// CONTENT MODELS - Daily rotating content
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

  // Schedule: which date to display this word
  displayDate     DateTime    @db.Date

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

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

  // Schedule: which date to display
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

  // Schedule: which date to display
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

  // When the event actually occurred
  eventDate   DateTime    @db.Date
  year        Int?

  category    String?     // birth, death, invention, war, discovery, festival, etc.
  location    String?
  people      String[]    // Array of names involved

  // Schedule: which date to display
  displayDate DateTime    @db.Date

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  favorites   Favorite[]

  @@unique([displayDate])
  @@index([displayDate])
}

// ============================================================================
// USER MODELS - Authentication and profile
// ============================================================================

/// User account (supplements Cognito)
model User {
  id              String    @id @default(uuid())

  // Cognito attributes
  cognitoSub      String    @unique  // Cognito subject ID
  email           String    @unique
  emailVerified   DateTime?

  // Profile
  displayName     String?
  profileImage    String?   // URL to avatar
  timezone        String    @default("UTC")

  // Gamification state
  currentStreak   Int       @default(0)
  longestStreak   Int       @default(0)
  lastVisitDate   DateTime?
  totalVisits     Int       @default(0)

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastLoginAt     DateTime?

  // Relations
  visits          Visit[]
  favorites       Favorite[]
  achievements    UserAchievement[]
  emailSettings   EmailSettings?

  @@index([email])
  @@index([cognitoSub])
}

// ============================================================================
// USER INTERACTION MODELS
// ============================================================================

/// User's saved favorite content items
model Favorite {
  id          String    @id @default(uuid())
  userId      String

  // Which content type and ID
  contentType String    // 'word', 'capital', 'fact', 'history'
  contentId   String    // UUID of the content item

  // Optional user notes
  notes       String?   @db.Text

  createdAt   DateTime  @default(now())

  // Relations
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // A user can only favorite an item once
  @@unique([userId, contentType, contentId])
  @@index([userId])
  @@index([contentType, contentId])
}

/// Daily visit tracking for streaks
model Visit {
  id            String    @id @default(uuid())
  userId        String

  // Which date (normalized to UTC midnight)
  visitDate     DateTime  @db.Date

  // What content was viewed (optional, for analytics)
  contentViewed Json?     // { word: true, capital: true, fact: true, history: true }

  // How long did they spend (optional)
  timeSpentSeconds Int?

  createdAt     DateTime  @default(now())

  // Relations
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // One visit per user per day
  @@unique([userId, visitDate])
  @@index([userId, visitDate])
}

// ============================================================================
// GAMIFICATION MODELS
// ============================================================================

/// Achievement definitions
model Achievement {
  id          String    @id @default(uuid())

  // Display
  name        String    @unique
  description String    @db.Text
  iconEmoji   String    // 🔥, 📚, ❤️, etc.

  // Category
  category    String    // 'streak', 'favorite', 'visit'

  // Unlock condition
  requirement Int       // e.g., 7 for 7-day streak
  requirementType String // 'streak_days', 'favorites_count', 'visits_count'

  createdAt   DateTime  @default(now())

  // Relations
  users       UserAchievement[]

  @@index([category])
}

/// Which achievements a user has unlocked
model UserAchievement {
  id            String    @id @default(uuid())
  userId        String
  achievementId String

  // When was it unlocked
  unlockedAt    DateTime  @default(now())

  // Relations
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement   Achievement   @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  // A user can only unlock an achievement once
  @@unique([userId, achievementId])
  @@index([userId])
}

// ============================================================================
// NOTIFICATION MODELS
// ============================================================================

/// User email preferences
model EmailSettings {
  id              String    @id @default(uuid())
  userId          String    @unique

  // Master toggle
  emailEnabled    Boolean   @default(true)

  // Feature toggles
  streakReminders Boolean   @default(false)
  weeklyDigest    Boolean   @default(true)

  // Preferences
  reminderTime    String    @default("09:00")  // HH:mm format
  digestDay       String    @default("SUNDAY")  // Day of week
  digestTime      String    @default("18:00")   // HH:mm format

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

/// Email send history (optional, for tracking)
model EmailLog {
  id            String    @id @default(uuid())
  userId        String
  emailType     String    // 'streak-reminder', 'weekly-digest', 'welcome'
  recipient     String

  status        String    @default("sent")  // 'sent', 'bounced', 'complained'

  sentAt        DateTime  @default(now())

  @@index([userId, emailType])
  @@index([sentAt])
}
```

## Schema Relationships Diagram

```
User (1) ──┬──→ (M) Visit
           ├──→ (M) Favorite
           ├──→ (M) UserAchievement
           ├──→ (1) EmailSettings
           └──→ (M) EmailLog

DailyWord ──→ (M) Favorite
Capital ──────→ (M) Favorite
FunFact ──────→ (M) Favorite
HistoricalEvent → (M) Favorite

Achievement ───→ (M) UserAchievement
```

## Migration Strategy

### Phase 1: Initial Schema
1. Create content models (DailyWord, Capital, FunFact, HistoricalEvent)
2. Create User model
3. Generate Prisma client

```bash
npx prisma migrate dev --name initial_schema
```

### Phase 2: Add Favorites
1. Add Favorite model
2. Extend User with relations

```bash
npx prisma migrate dev --name add_favorites
```

### Phase 3: Add Streaks
1. Add Visit model
2. Add Achievement and UserAchievement
3. Update User with streak fields

```bash
npx prisma migrate dev --name add_streaks_and_gamification
```

### Phase 4: Add Email Settings
1. Add EmailSettings
2. Add EmailLog (optional)

```bash
npx prisma migrate dev --name add_email_settings
```

## Database Seeding

### Seed Script Structure

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (only in dev!)
  if (process.env.NODE_ENV !== 'production') {
    await prisma.favorite.deleteMany();
    await prisma.visit.deleteMany();
    await prisma.dailyWord.deleteMany();
    await prisma.capital.deleteMany();
    await prisma.funFact.deleteMany();
    await prisma.historicalEvent.deleteMany();
  }

  // Load seed data from JSON files
  const wordsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'seed-data/words.json'), 'utf-8')
  );

  // Seed words (one per day for 30 days)
  for (let i = 0; i < wordsData.length; i++) {
    const displayDate = new Date();
    displayDate.setDate(displayDate.getDate() + i);

    await prisma.dailyWord.create({
      data: {
        ...wordsData[i],
        displayDate: displayDate.toISOString().split('T')[0],
      },
    });
  }

  // Seed capitals, facts, history similarly...

  // Create achievements
  await prisma.achievement.createMany({
    data: [
      {
        name: '🔥 First Visit',
        description: 'Visit the app on a day',
        iconEmoji: '🔥',
        category: 'visit',
        requirement: 1,
        requirementType: 'visits_count',
      },
      {
        name: '🔥 3-Day Streak',
        description: 'Visit for 3 consecutive days',
        iconEmoji: '🔥',
        category: 'streak',
        requirement: 3,
        requirementType: 'streak_days',
      },
      {
        name: '🔥 7-Day Streak',
        description: 'Visit for 7 consecutive days',
        iconEmoji: '🔥',
        category: 'streak',
        requirement: 7,
        requirementType: 'streak_days',
      },
      {
        name: '🔥 30-Day Streak',
        description: 'Visit for 30 consecutive days',
        iconEmoji: '🔥',
        category: 'streak',
        requirement: 30,
        requirementType: 'streak_days',
      },
      {
        name: '❤️ First Favorite',
        description: 'Save your first favorite',
        iconEmoji: '❤️',
        category: 'favorite',
        requirement: 1,
        requirementType: 'favorites_count',
      },
      {
        name: '❤️ 10 Favorites',
        description: 'Save 10 favorite items',
        iconEmoji: '❤️',
        category: 'favorite',
        requirement: 10,
        requirementType: 'favorites_count',
      },
      {
        name: '❤️ 50 Favorites',
        description: 'Save 50 favorite items',
        iconEmoji: '❤️',
        category: 'favorite',
        requirement: 50,
        requirementType: 'favorites_count',
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Seed Data Format

```json
// prisma/seed-data/words.json
[
  {
    "word": "serendipity",
    "definition": "The occurrence of events by chance in a happy or beneficial way",
    "exampleSentence": "Finding that old photo was pure serendipity.",
    "etymology": "From Persian fairy tale 'The Three Princes of Serendip'",
    "pronunciation": "ser-uh-nip-i-tee",
    "partOfSpeech": "noun",
    "difficulty": "intermediate"
  },
  {
    "word": "ephemeral",
    "definition": "Lasting for a very short time",
    "exampleSentence": "The beauty of cherry blossoms is ephemeral.",
    "etymology": "From Greek 'ephemeros' meaning 'lasting only a day'",
    "pronunciation": "uh-fem-er-uhl",
    "partOfSpeech": "adjective",
    "difficulty": "intermediate"
  }
]
```

## Queries & Performance

### Common Queries

**Get today's content**:
```prisma
const word = await prisma.dailyWord.findUnique({
  where: { displayDate: today },
});
```

**Get user's favorites**:
```prisma
const favorites = await prisma.favorite.findMany({
  where: { userId: userId },
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' },
});
```

**Calculate streak**:
```prisma
const lastVisit = await prisma.visit.findFirst({
  where: { userId: userId },
  orderBy: { visitDate: 'desc' },
});
```

**Check achievement unlock**:
```prisma
const favorites = await prisma.favorite.count({
  where: { userId: userId },
});

if (favorites === 10) {
  await prisma.userAchievement.create({
    data: {
      userId: userId,
      achievementId: '10-favorites-achievement-id',
    },
  });
}
```

### Indexes

Prisma automatically creates indexes for:
- `@id` fields (primary key)
- `@unique` fields (unique constraint)
- `@relation` fields (foreign key)

Additional indexes for performance:

```prisma
@@index([displayDate])        // Query content by date
@@index([userId, visitDate])  // Streak calculations
@@index([userId, contentType]) // User favorites by type
```

## Data Retention Policies

### Keep Forever
- User accounts
- Saved favorites
- Achievement history
- Total visit counts

### Keep 12 Months
- Email logs
- Visit details
- API request logs

### Keep 3 Months
- Error logs
- CloudWatch logs
- Failed email logs

### Delete on Request
- User data deletion (GDPR)
- Related favorites, visits, achievements

## Backup & Recovery

### Automated Backups
- Daily snapshots (7-day retention)
- Point-in-time recovery (7 days)
- Tested monthly

### Manual Backups
- Before major migrations
- Before schema changes
- Backup command:
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y-%m-%d).sql
```

### Restore Procedure
```bash
# From RDS console or CLI
# Select snapshot → Create database → Restore
```

## Constraints & Validations

### Database Constraints
- User email: unique, required
- User cognitoSub: unique, required
- Content displayDate: unique per content type
- Favorite: unique (userId, contentType, contentId)
- Visit: unique (userId, visitDate)
- Achievement: unique (name)
- UserAchievement: unique (userId, achievementId)

### Application Validations (Zod)
- Email: valid email format
- Password: min 8 chars, uppercase, lowercase, number
- displayDate: valid date, not in past
- contentType: enum ['word', 'capital', 'fact', 'history']

## Future Enhancements

**Optional in future phases**:
- Collections/Lists (group favorites)
- User follows/friends
- Content ratings/reviews
- Custom streak freeze (use once per year)
- Leaderboards
- Content search
- User-generated content
- Analytics dashboard
- API versioning
