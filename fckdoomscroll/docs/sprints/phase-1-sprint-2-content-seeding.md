# Phase 1, Sprint 2: Content Seeding (12-15 hours)

**Phase**: 1 - Core Content Display
**Sprint**: 2 of 3
**Duration**: 12-15 hours (Weeks 2-3)
**Goal**: Populate database with 30 days of curated content and create utilities to fetch it

## Context

You now have an empty PostgreSQL database with schema. This sprint fills it with real content and creates the business logic to fetch "today's" content.

## Sprint Overview

| Task | Duration | Deliverable |
|------|----------|-------------|
| Research & curate content | 4-5h | 30 items per content type |
| Create seed data files | 2-3h | JSON files in `prisma/seed-data/` |
| Build seed script | 3-4h | `prisma/seed.ts` |
| Create content utilities | 2-3h | `lib/content.ts` with fetching logic |
| Test & verify data | 1h | ✅ Data in database |

**Total**: 12-15 hours

## Prerequisites

- Completed Phase 1, Sprint 1 (database setup)
- Docker running with PostgreSQL
- Basic familiarity with JSON

## Task 1: Research & Curate Content (4-5 hours)

### Objective
Find and collect 30 items for each of 4 content types over 30 days.

### Steps

**Step 1: Find Content Sources** (1 hour)

**Words of the Day**:
- [Merriam-Webster Word of the Day](https://www.merriam-webster.com/word-of-the-day) - historical words
- [Oxford Dictionary](https://www.oxfordlearnersdictionaries.com/)
- [Vocabulary.com](https://www.vocabulary.com/)
- Strategy: Pick interesting, moderately difficult words (not too easy, not too hard)

**Capitals/Countries**:
- [Wikipedia: List of countries](https://en.wikipedia.org/wiki/List_of_countries_by_population)
- [Rest Countries API](https://restcountries.com/) - for accurate data
- Strategy: Mix continents, include interesting facts

**Fun Facts**:
- [Reddit: r/todayilearned](https://www.reddit.com/r/todayilearned/)
- [Wikipedia: Random article](https://en.wikipedia.org/wiki/Special:Random)
- [TED-Ed](https://www.ted.com/discover/ted-ed-collections)
- Strategy: Verify sources, keep digestible

**Historical Events/Festivals**:
- [Wikipedia: On this day](https://en.wikipedia.org/wiki/Portal:Current_events)
- [History.com: This day in history](https://www.history.com/this-day-in-history)
- Strategy: Mix births, deaths, inventions, cultural festivals

**Step 2: Collect 30 Words** (1 hour)

Create a spreadsheet or use these examples:

```
Day 1: serendipity - The occurrence of events by chance in a happy or beneficial way
Day 2: ephemeral - Lasting for a very short time
Day 3: querulous - Complaining in an annoying way
Day 4: mellifluous - Sweet or musical; pleasant to hear
Day 5: bamboozle - To confuse or perplex
... (25 more)
```

**Step 3: Collect 30 Capitals** (1 hour)

```
Day 1: Japan - Tokyo - Tokyo is the world's largest metropolitan area
Day 2: Australia - Canberra - Purpose-built capital in the 1920s
Day 3: Canada - Ottawa - Named after the Ottawa River
... (27 more)
```

**Step 4: Collect 30 Fun Facts** (1 hour)

```
Day 1: Honey never spoils - Archaeologists have found 3000-year-old honey...
Day 2: Octopuses have three hearts - Two pump blood to the gills...
Day 3: Bananas are berries, strawberries aren't - A berry is...
... (27 more)
```

**Step 5: Collect 30 Historical Events** (1 hour)

```
Day 1: Martin Luther King Jr. born (1929) - American civil rights leader
Day 2: First photograph of Earth from space (1968) - Apollo 8 mission
Day 3: World Wide Web invented (1989) - Tim Berners-Lee creates HTTP
... (27 more)
```

### Acceptance Criteria
- [ ] 30 words collected with definitions
- [ ] 30 capitals collected with fun facts
- [ ] 30 fun facts verified and summarized
- [ ] 30 historical events/festivals collected
- [ ] Sources noted (for verification)

---

## Task 2: Create Seed Data Files (2-3 hours)

### Objective
Format collected content as JSON files for importing into database.

### Steps

**Step 1: Create seed-data Directory** (10 minutes)
```bash
# Create directory
mkdir -p prisma/seed-data
```

**Step 2: Create words.json** (45 minutes)
- File: `prisma/seed-data/words.json`

```json
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
    "definition": "Lasting for a very short time; transitory",
    "exampleSentence": "The beauty of cherry blossoms is ephemeral, lasting only a few weeks.",
    "etymology": "From Greek 'ephemeros' meaning 'lasting only a day'",
    "pronunciation": "uh-fem-er-uhl",
    "partOfSpeech": "adjective",
    "difficulty": "intermediate"
  },
  {
    "word": "querulous",
    "definition": "Complaining in an annoying, whining manner",
    "exampleSentence": "She had a querulous tone when discussing the service.",
    "etymology": "From Latin 'queror' meaning 'to complain'",
    "pronunciation": "kwar-uh-lus",
    "partOfSpeech": "adjective",
    "difficulty": "advanced"
  }
  // ... 27 more words
]
```

**Tips for words.json**:
- Include 10 beginner, 10 intermediate, 10 advanced words
- Real example sentences
- Include etymology and pronunciation
- Vary parts of speech

**Step 3: Create capitals.json** (45 minutes)
- File: `prisma/seed-data/capitals.json`

```json
[
  {
    "country": "Japan",
    "capital": "Tokyo",
    "continent": "Asia",
    "population": 37400000,
    "funFact": "Tokyo is the world's largest metropolitan area by population",
    "flagEmoji": "🇯🇵",
    "currency": "Japanese Yen (JPY)",
    "language": "Japanese",
    "lat": 35.6762,
    "lng": 139.6503
  },
  {
    "country": "Australia",
    "capital": "Canberra",
    "continent": "Oceania",
    "population": 460000,
    "funFact": "Canberra was purpose-built as a compromise between rivals Sydney and Melbourne",
    "flagEmoji": "🇦🇺",
    "currency": "Australian Dollar (AUD)",
    "language": "English",
    "lat": -35.2809,
    "lng": 149.1300
  }
  // ... 28 more capitals
]
```

**Tips for capitals.json**:
- Include flag emoji for visual interest
- Real population figures
- Interesting cultural facts
- Lat/lng for future mapping features
- Mix all continents

**Step 4: Create facts.json** (45 minutes)
- File: `prisma/seed-data/facts.json`

```json
[
  {
    "title": "Honey Never Spoils",
    "content": "Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible. Honey's unique chemical composition and low moisture content prevent bacterial growth, making it virtually shelf-stable indefinitely.",
    "category": "nature",
    "source": "National Geographic",
    "verified": true
  },
  {
    "title": "Octopuses Have Three Hearts",
    "content": "Two hearts pump blood to the gills, while the third pumps it to the rest of the body. When an octopus swims, the heart that delivers blood to the body actually stops beating, which is why these creatures prefer crawling.",
    "category": "science",
    "source": "Marine Science Institute",
    "verified": true
  }
  // ... 28 more facts
]
```

**Tips for facts.json**:
- Verify facts before including
- Include varied categories (science, nature, history, technology)
- Note credible sources
- Make claims specific and interesting
- Keep explanations digestible (1-3 sentences)

**Step 5: Create history.json** (45 minutes)
- File: `prisma/seed-data/history.json`

```json
[
  {
    "title": "Martin Luther King Jr. Born",
    "description": "American civil rights leader Martin Luther King Jr. was born on January 15, 1929, in Atlanta, Georgia. He would go on to lead the Civil Rights Movement and be assassinated in 1968.",
    "eventDate": "1929-01-15",
    "year": 1929,
    "category": "birth",
    "location": "Atlanta, Georgia",
    "people": ["Martin Luther King Jr."]
  },
  {
    "title": "World Wide Web Invented",
    "description": "Tim Berners-Lee invents the World Wide Web on this day in 1989. While working at CERN, he created the first web browser and the HTTP protocol, enabling information sharing across the internet.",
    "eventDate": "1989-03-12",
    "year": 1989,
    "category": "invention",
    "location": "CERN, Switzerland",
    "people": ["Tim Berners-Lee"]
  }
  // ... 28 more events
]
```

**Tips for history.json**:
- Include births, deaths, inventions, wars, discoveries
- Mix different categories for variety
- Include key people involved
- Add location when significant
- Use accurate historical dates

### Acceptance Criteria
- [ ] `prisma/seed-data/words.json` created with 30 entries
- [ ] `prisma/seed-data/capitals.json` created with 30 entries
- [ ] `prisma/seed-data/facts.json` created with 30 entries
- [ ] `prisma/seed-data/history.json` created with 30 entries
- [ ] All JSON files are valid (can parse)
- [ ] No duplicate entries

---

## Task 3: Build Seed Script (3-4 hours)

### Objective
Create a script that reads JSON files and inserts into database, scheduling content for 30 days.

### Steps

**Step 1: Create Seed Script** (2-3 hours)
- File: `prisma/seed.ts`

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface SeedWord {
  word: string;
  definition: string;
  exampleSentence?: string;
  etymology?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  difficulty?: string;
}

interface SeedCapital {
  country: string;
  capital: string;
  continent?: string;
  population?: number;
  funFact?: string;
  flagEmoji?: string;
  currency?: string;
  language?: string;
  lat?: number;
  lng?: number;
}

interface SeedFact {
  title: string;
  content: string;
  category?: string;
  source?: string;
  verified?: boolean;
}

interface SeedHistory {
  title: string;
  description: string;
  eventDate: string;
  year?: number;
  category?: string;
  location?: string;
  people?: string[];
}

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Load seed data files
    const wordsPath = path.join(__dirname, "seed-data", "words.json");
    const capitalsPath = path.join(__dirname, "seed-data", "capitals.json");
    const factsPath = path.join(__dirname, "seed-data", "facts.json");
    const historyPath = path.join(__dirname, "seed-data", "history.json");

    const words: SeedWord[] = JSON.parse(fs.readFileSync(wordsPath, "utf-8"));
    const capitals: SeedCapital[] = JSON.parse(fs.readFileSync(capitalsPath, "utf-8"));
    const facts: SeedFact[] = JSON.parse(fs.readFileSync(factsPath, "utf-8"));
    const history: SeedHistory[] = JSON.parse(fs.readFileSync(historyPath, "utf-8"));

    console.log(`📚 Loaded ${words.length} words`);
    console.log(`🌍 Loaded ${capitals.length} capitals`);
    console.log(`💡 Loaded ${facts.length} facts`);
    console.log(`📅 Loaded ${history.length} history items`);

    // Clear existing data (development only!)
    if (process.env.NODE_ENV !== "production") {
      console.log("\n🗑️  Clearing existing data...");
      await prisma.dailyWord.deleteMany();
      await prisma.capital.deleteMany();
      await prisma.funFact.deleteMany();
      await prisma.historicalEvent.deleteMany();
    }

    // Seed words
    console.log("\n📚 Seeding words...");
    for (let i = 0; i < words.length; i++) {
      const displayDate = new Date();
      displayDate.setDate(displayDate.getDate() + i);
      displayDate.setHours(0, 0, 0, 0); // Midnight UTC

      await prisma.dailyWord.create({
        data: {
          ...words[i],
          displayDate: displayDate,
        },
      });
    }
    console.log(`✅ Created ${words.length} words`);

    // Seed capitals
    console.log("🌍 Seeding capitals...");
    for (let i = 0; i < capitals.length; i++) {
      const displayDate = new Date();
      displayDate.setDate(displayDate.getDate() + i);
      displayDate.setHours(0, 0, 0, 0);

      await prisma.capital.create({
        data: {
          ...capitals[i],
          population: capitals[i].population ? BigInt(capitals[i].population) : null,
          displayDate: displayDate,
        },
      });
    }
    console.log(`✅ Created ${capitals.length} capitals`);

    // Seed fun facts
    console.log("💡 Seeding fun facts...");
    for (let i = 0; i < facts.length; i++) {
      const displayDate = new Date();
      displayDate.setDate(displayDate.getDate() + i);
      displayDate.setHours(0, 0, 0, 0);

      await prisma.funFact.create({
        data: {
          ...facts[i],
          displayDate: displayDate,
        },
      });
    }
    console.log(`✅ Created ${facts.length} fun facts`);

    // Seed historical events
    console.log("📅 Seeding historical events...");
    for (let i = 0; i < history.length; i++) {
      const displayDate = new Date();
      displayDate.setDate(displayDate.getDate() + i);
      displayDate.setHours(0, 0, 0, 0);

      const eventDate = new Date(history[i].eventDate);
      eventDate.setHours(0, 0, 0, 0);

      await prisma.historicalEvent.create({
        data: {
          title: history[i].title,
          description: history[i].description,
          eventDate: eventDate,
          year: history[i].year,
          category: history[i].category,
          location: history[i].location,
          people: history[i].people || [],
          displayDate: displayDate,
        },
      });
    }
    console.log(`✅ Created ${history.length} historical events`);

    console.log("\n✨ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

**Step 2: Update package.json** (15 minutes)
- File: `package.json`
- Add seed script to prisma config:

```json
{
  // ... existing config ...
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

**Step 3: Run Seed Script** (1 hour)
```bash
# Run the seed script
npx prisma db seed

# Expected output:
# 🌱 Starting database seed...
# 📚 Loaded 30 words
# 🌍 Loaded 30 capitals
# 💡 Loaded 30 facts
# 📅 Loaded 30 history items
#
# 🗑️  Clearing existing data...
# 📚 Seeding words...
# ✅ Created 30 words
# 🌍 Seeding capitals...
# ✅ Created 30 capitals
# 💡 Seeding fun facts...
# ✅ Created 30 facts
# 📅 Seeding historical events...
# ✅ Created 30 historical events
#
# ✨ Seed completed successfully!
```

### Troubleshooting

**Seed fails - file not found**:
- Check paths in seed.ts match your file structure
- Ensure JSON files are in `prisma/seed-data/`

**Invalid JSON**:
- Validate JSON at [jsonlint.com](https://www.jsonlint.com/)
- Check for missing quotes, trailing commas

**Database constraint violations**:
- Check displayDate is unique per content type
- Ensure no duplicate data in JSON files

### Acceptance Criteria
- [ ] `prisma/seed.ts` created
- [ ] `prisma/seed.ts` runs without errors
- [ ] 120 total records created (30 each type)
- [ ] Dates properly scheduled for 30 days
- [ ] Can verify with: `npx prisma studio`

---

## Task 4: Create Content Utilities (2-3 hours)

### Objective
Build functions to fetch today's content and handle date-based queries.

### Steps

**Step 1: Create Content Module** (2 hours)
- File: `lib/content.ts`

```typescript
// lib/content.ts
import { prisma } from "./prisma";

export interface DailyContent {
  word: {
    id: string;
    word: string;
    definition: string;
    exampleSentence?: string;
    pronunciation?: string;
    displayDate: Date;
  } | null;
  capital: {
    id: string;
    country: string;
    capital: string;
    funFact?: string;
    flagEmoji?: string;
    displayDate: Date;
  } | null;
  fact: {
    id: string;
    title: string;
    content: string;
    category?: string;
    source?: string;
    displayDate: Date;
  } | null;
  history: {
    id: string;
    title: string;
    description: string;
    year?: number;
    displayDate: Date;
  } | null;
}

/**
 * Get content for today (respecting timezone)
 * Returns one item of each content type
 */
export async function getTodaysContent(
  timezone: string = "UTC"
): Promise<DailyContent> {
  const today = getDateInTimezone(new Date(), timezone);

  const [word, capital, fact, history] = await Promise.all([
    prisma.dailyWord.findUnique({
      where: { displayDate: today },
      select: {
        id: true,
        word: true,
        definition: true,
        exampleSentence: true,
        pronunciation: true,
        displayDate: true,
      },
    }),
    prisma.capital.findUnique({
      where: { displayDate: today },
      select: {
        id: true,
        country: true,
        capital: true,
        funFact: true,
        flagEmoji: true,
        displayDate: true,
      },
    }),
    prisma.funFact.findUnique({
      where: { displayDate: today },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        source: true,
        displayDate: true,
      },
    }),
    prisma.historicalEvent.findUnique({
      where: { displayDate: today },
      select: {
        id: true,
        title: true,
        description: true,
        year: true,
        displayDate: true,
      },
    }),
  ]);

  return {
    word,
    capital,
    fact,
    history,
  };
}

/**
 * Get content for a specific date
 */
export async function getContentForDate(
  date: Date
): Promise<DailyContent> {
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  const [word, capital, fact, history] = await Promise.all([
    prisma.dailyWord.findUnique({
      where: { displayDate: normalizedDate },
      select: {
        id: true,
        word: true,
        definition: true,
        exampleSentence: true,
        pronunciation: true,
        displayDate: true,
      },
    }),
    prisma.capital.findUnique({
      where: { displayDate: normalizedDate },
      select: {
        id: true,
        country: true,
        capital: true,
        funFact: true,
        flagEmoji: true,
        displayDate: true,
      },
    }),
    prisma.funFact.findUnique({
      where: { displayDate: normalizedDate },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        source: true,
        displayDate: true,
      },
    }),
    prisma.historicalEvent.findUnique({
      where: { displayDate: normalizedDate },
      select: {
        id: true,
        title: true,
        description: true,
        year: true,
        displayDate: true,
      },
    }),
  ]);

  return {
    word,
    capital,
    fact,
    history,
  };
}

/**
 * Get a single content item by ID
 */
export async function getContentById(
  contentType: "word" | "capital" | "fact" | "history",
  id: string
) {
  switch (contentType) {
    case "word":
      return prisma.dailyWord.findUnique({
        where: { id },
      });
    case "capital":
      return prisma.capital.findUnique({
        where: { id },
      });
    case "fact":
      return prisma.funFact.findUnique({
        where: { id },
      });
    case "history":
      return prisma.historicalEvent.findUnique({
        where: { id },
      });
    default:
      throw new Error(`Invalid content type: ${contentType}`);
  }
}

/**
 * Convert a date to the specified timezone (date portion only)
 * Returns date at 00:00:00 UTC for the given timezone
 */
function getDateInTimezone(date: Date, timezone: string): Date {
  // For now, simple UTC implementation
  // TODO: Use date-fns/zoneinfo for proper timezone support
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

/**
 * Get content for the next N days (for prefetching/preview)
 */
export async function getUpcomingContent(days: number = 7) {
  const upcoming: DailyContent[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const content = await getContentForDate(date);
    upcoming.push(content);
  }

  return upcoming;
}
```

**Step 2: Test Content Utilities** (1 hour)
- Create test file: `lib/content.test.ts` (temporary)

```typescript
// lib/content.test.ts
import { getTodaysContent, getContentForDate } from "./content";

async function testContent() {
  console.log("Testing content utilities...\n");

  try {
    // Test getting today's content
    console.log("Getting today's content...");
    const today = await getTodaysContent();

    console.log("✅ Word:", today.word?.word);
    console.log("✅ Capital:", today.capital?.capital);
    console.log("✅ Fact:", today.fact?.title);
    console.log("✅ History:", today.history?.title);

    // Test getting specific date
    console.log("\nGetting content for tomorrow...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowContent = await getContentForDate(tomorrow);

    console.log("✅ Got tomorrow's content:", tomorrowContent.word?.word);

    console.log("\n✨ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testContent().catch(console.error);
```

Run test:
```bash
npx ts-node lib/content.test.ts

# Expected output:
# Testing content utilities...
#
# Getting today's content...
# ✅ Word: serendipity
# ✅ Capital: Tokyo
# ✅ Fact: Honey Never Spoils
# ✅ History: Martin Luther King Jr. Born
#
# Getting content for tomorrow...
# ✅ Got tomorrow's content: ephemeral
#
# ✨ All tests passed!
```

### Acceptance Criteria
- [ ] `lib/content.ts` created with all functions
- [ ] `getTodaysContent()` returns all 4 content types
- [ ] `getContentForDate()` works for future dates
- [ ] `getContentById()` retrieves single items
- [ ] Content utilities test passes
- [ ] No TypeScript errors

---

## Task 5: Test & Verify Data (1 hour)

### Steps

**Step 1: Check Database with Prisma Studio** (30 minutes)
```bash
# Open Prisma Studio
npx prisma studio

# Verify:
# - 30 records in each content table
# - displayDate values span 30 days
# - All content types have data
```

**Step 2: Query Manually** (30 minutes)
```bash
# Test with psql
psql -h localhost -U postgres -d fckdoomscroll

# Run queries:
SELECT COUNT(*) FROM "DailyWord";        -- Should return 30
SELECT COUNT(*) FROM "Capital";          -- Should return 30
SELECT COUNT(*) FROM "FunFact";          -- Should return 30
SELECT COUNT(*) FROM "HistoricalEvent";  -- Should return 30

# Check date distribution
SELECT "displayDate", COUNT(*) FROM "DailyWord" GROUP BY "displayDate" ORDER BY "displayDate";
```

### Acceptance Criteria
- [ ] 30 records in each content table
- [ ] Dates span from today to today+29
- [ ] No NULL values in required fields
- [ ] Prisma Studio displays all records
- [ ] Manual SQL queries return expected counts

---

## Completion Checklist

- [ ] 30 items curated for each content type
- [ ] Seed data JSON files created and valid
- [ ] `prisma/seed.ts` script created and runs
- [ ] Database populated with 120 records
- [ ] `lib/content.ts` utilities created
- [ ] `getTodaysContent()` works correctly
- [ ] Content test passes
- [ ] Database verified with Prisma Studio
- [ ] All content accessible via utilities

## Next Steps

Once Task 5 is complete:

1. Commit: `git add . && git commit -m "feat(phase1-sprint2): content seeding with 30 days of data"`
2. Update todo list
3. Move to Phase 1, Sprint 3: UI Components

## Troubleshooting

**JSON files won't parse**:
- Check for syntax errors at jsonlint.com
- Remove trailing commas
- Ensure all strings quoted

**Seed script fails**:
- Verify file paths are correct
- Check DATABASE_URL in .env.local
- Run `docker-compose up -d` to restart DB

**displayDate not unique**:
- Seed script creates duplicate dates
- Clear database: `npx prisma migrate reset`
- Rerun: `npx prisma db seed`

**Content utilities have TypeScript errors**:
- Check Prisma client is generated: `npx prisma generate`
- Verify schema matches types
- Check import paths
