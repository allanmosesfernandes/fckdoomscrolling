# Implementation Roadmap

This document maps out all the sprint documentation that needs to be created. Some files are already created, others are pending.

## Created Documentation

### Main Documentation ✅
- ✅ [README.md](./README.md) - Navigation and overview
- ✅ [PRD.md](./PRD.md) - Product Requirements Document
- ✅ [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical Architecture
- ✅ [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) - AWS Infrastructure (Phase 5)
- ✅ [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database design

### Sprint Documentation - Phase 0 ✅
- ✅ [sprints/phase-0-quick-wins.md](./sprints/phase-0-quick-wins.md) - Brand, layout, static preview

### Sprint Documentation - Phase 1 ✅
- ✅ [sprints/phase-1-sprint-1-database.md](./sprints/phase-1-sprint-1-database.md) - Prisma, PostgreSQL, Docker
- ✅ [sprints/phase-1-sprint-2-content-seeding.md](./sprints/phase-1-sprint-2-content-seeding.md) - Seed 30 days of content

## Pending Sprint Documentation

### Phase 1, Sprint 3: UI Components (Pending)
**Duration**: 8-10 hours (Weeks 3-4)
**File**: `sprints/phase-1-sprint-3-ui.md`

**Contents**:
- Create content card components (WordCard, CapitalCard, FactCard, HistoryCard)
- Build API route `/api/content/today`
- Update home page to fetch and display content
- Add loading states and animations
- Implement responsive grid layout
- Add error handling

**Key Files**:
- `app/api/content/today/route.ts`
- `app/page.tsx` (update)
- `components/content/WordCard.tsx`
- `components/content/CapitalCard.tsx`
- `components/content/FactCard.tsx`
- `components/content/HistoryCard.tsx`

---

### Phase 2, Sprint 1: AWS Cognito Setup (Pending)
**Duration**: 10-12 hours (Weeks 5-6)
**File**: `sprints/phase-2-sprint-1-cognito.md`

**Contents**:
- Create AWS Cognito User Pool
- Install Cognito client libraries
- Create Cognito integration utilities (`lib/auth/cognito.ts`)
- Create session management (`lib/auth/session.ts`)
- Set up environment variables
- Test authentication flow

**Key Files**:
- `lib/auth/cognito.ts`
- `lib/auth/session.ts`
- `.env.local` (update with Cognito vars)

---

### Phase 2, Sprint 2: Auth UI & Protected Routes (Pending)
**Duration**: 8-10 hours (Weeks 6-7)
**File**: `sprints/phase-2-sprint-2-auth-ui.md`

**Contents**:
- Create sign up page with form
- Create sign in page with form
- Build user menu dropdown
- Implement middleware for route protection
- Create protected route group
- Update header with auth state
- Add error handling and validation

**Key Files**:
- `app/auth/signin/page.tsx`
- `app/auth/signup/page.tsx`
- `app/components/features/UserMenu.tsx`
- `middleware.ts`
- `app/(protected)/layout.tsx`

---

### Phase 2, Sprint 3: Favorites Functionality (Pending)
**Duration**: 12-15 hours (Weeks 7-8)
**File**: `sprints/phase-2-sprint-3-favorites.md`

**Contents**:
- Extend Prisma schema with User & Favorite models
- Create favorites API routes (GET, POST, DELETE)
- Build FavoriteButton component with optimistic updates
- Create favorites page listing all saved items
- Add heart icon to content cards
- Implement grouping/filtering of favorites
- Add toast notifications

**Key Files**:
- `prisma/schema.prisma` (update)
- `app/api/favorites/route.ts`
- `app/api/favorites/[id]/route.ts`
- `components/features/FavoriteButton.tsx`
- `app/(protected)/favorites/page.tsx`

---

### Phase 3, Sprint 1: Streak Tracking Backend (Pending)
**Duration**: 8-10 hours (Weeks 9-10)
**File**: `sprints/phase-3-sprint-1-streaks.md`

**Contents**:
- Extend Prisma schema with Visit & streak fields
- Create streak calculation logic (`lib/streaks.ts`)
- Build API route to record visits
- Implement auto-record on dashboard view
- Handle timezone edge cases
- Test streak calculation with various scenarios

**Key Files**:
- `prisma/schema.prisma` (update)
- `lib/streaks.ts`
- `app/api/streak/route.ts`

---

### Phase 3, Sprint 2: Gamification UI & Achievements (Pending)
**Duration**: 10-12 hours (Weeks 10-11)
**File**: `sprints/phase-3-sprint-2-gamification.md`

**Contents**:
- Create Achievement & UserAchievement models
- Build achievement unlock logic (`lib/achievements.ts`)
- Create StreakDisplay component
- Add achievement badges to profile
- Implement toast notifications on unlock
- Create profile stats page
- Add visit calendar visualization
- Seed achievement definitions

**Key Files**:
- `prisma/schema.prisma` (update)
- `lib/achievements.ts`
- `components/features/StreakDisplay.tsx`
- `components/features/AchievementBadge.tsx`
- `app/(protected)/profile/page.tsx`

---

### Phase 4, Sprint 1: AWS SES Setup (Pending)
**Duration**: 8-10 hours (Weeks 12-13)
**File**: `sprints/phase-4-sprint-1-ses.md`

**Contents**:
- Set up AWS SES
- Verify sender domain
- Install email libraries (nodemailer, @aws-sdk/client-ses)
- Create SES utility wrapper (`lib/email/ses.ts`)
- Build email templates (HTML + plain text)
- Test email delivery
- Handle bounces and complaints

**Key Files**:
- `lib/email/ses.ts`
- `lib/email/templates/streak-reminder.ts`
- `lib/email/templates/weekly-digest.ts`
- `lib/email/templates/welcome.ts`

---

### Phase 4, Sprint 2: Email Automation & Cron Jobs (Pending)
**Duration**: 12-15 hours (Weeks 13-14)
**File**: `sprints/phase-4-sprint-2-email-automation.md`

**Contents**:
- Extend schema with EmailSettings
- Create email preference settings page
- Build cron jobs for streak reminders
- Build cron jobs for weekly digests
- Set up Vercel Cron configuration
- Test email delivery and scheduling
- Add unsubscribe functionality

**Key Files**:
- `prisma/schema.prisma` (update)
- `app/(protected)/settings/email/page.tsx`
- `app/api/cron/streak-reminder/route.ts`
- `app/api/cron/weekly-digest/route.ts`
- `vercel.json`

---

### Phase 5, Sprint 1: Docker & ECS Deployment (Pending)
**Duration**: 12-15 hours (Weeks 15-16)
**File**: `sprints/phase-5-sprint-1-docker-ecs.md`

**Contents**:
- Create production multi-stage Dockerfile
- Set up AWS RDS PostgreSQL instance
- Create AWS ECR repository
- Configure ECS cluster & task definition
- Set up Application Load Balancer
- Configure security groups & networking
- Deploy initial version to ECS
- Test production deployment

**Key Files**:
- `Dockerfile` (production)
- ECS task definition JSON
- AWS infrastructure setup (manual console or IaC)

---

### Phase 5, Sprint 2: CI/CD Pipeline & Monitoring (Pending)
**Duration**: 13-15 hours (Weeks 16-17)
**File**: `sprints/phase-5-sprint-2-cicd.md`

**Contents**:
- Create GitHub Actions CI/CD workflow
- Set up Docker image build and push to ECR
- Configure automated ECS deployment
- Set up CloudWatch logs and metrics
- Create CloudWatch dashboard
- Configure CloudWatch alarms
- Set up SNS notifications
- Test deployment pipeline end-to-end

**Key Files**:
- `.github/workflows/deploy.yml`
- CloudWatch configuration scripts

---

### Phase 5, Sprint 3: Production Hardening (Pending)
**Duration**: 8-10 hours (Weeks 17)
**File**: `sprints/phase-5-sprint-3-hardening.md`

**Contents**:
- Add rate limiting middleware
- Enforce HTTPS and security headers
- Configure RDS automated backups
- Set up database encryption
- Create disaster recovery procedures
- Perform load testing with k6
- Optimize performance (caching, compression)
- Document runbooks and procedures
- Security audit checklist

**Key Files**:
- `app/middleware.ts` (rate limiting)
- `lib/utils/security.ts` (headers)
- AWS RDS backup configuration
- Load testing scripts

---

## How to Use This Roadmap

### For Creating Missing Sprint Files
Each pending sprint file should follow the same structure:

```markdown
# Phase X, Sprint Y: [Task Name] (X-Y hours)

**Phase**: X - [Phase Goal]
**Sprint**: Y of Z
**Duration**: X-Y hours (Weeks A-B)
**Goal**: [Sprint Objective]

## Context
[What was completed before, what problem we're solving]

## Sprint Overview
[Table with tasks, durations, and deliverables]

## Prerequisites
[What you need to have completed first]

## Task 1: [Task Name] (X hours)

### Objective
[What this task accomplishes]

### Steps
[Detailed step-by-step instructions]

[Code examples where applicable]

### Acceptance Criteria
[Checklist of what's done when complete]

---

## Completion Checklist
[Full checklist for the entire sprint]

## Next Steps
[What to do after completing this sprint]

## Troubleshooting
[Common issues and solutions]
```

### For Using Sprints During Implementation
1. Read the sprint file for your current phase
2. Follow tasks in order
3. Use code examples provided
4. Check off acceptance criteria
5. Move to next sprint

### For LLM Usage
Pass the sprint file and related documentation (ARCHITECTURE.md, DATABASE_SCHEMA.md, etc.) to provide full context.

---

## Statistics

### Completed
- Main documentation: 5 files ✅
- Sprint documentation: 2 files ✅
- **Total**: 7 files, ~30KB

### Pending
- Sprint documentation: 13 files
- **Total**: ~50KB additional content needed

### Full Project
- **Total documentation**: 20 files
- **Estimated size**: 80KB
- **Line count**: 3,000+ lines of detailed instructions

---

## Creating Missing Sprint Files

To generate the remaining 13 sprint files, use the same format as the completed sprints:

Each sprint should include:
1. **Context** - What came before
2. **Sprint Overview** - Tasks, duration, deliverables
3. **Tasks** (2-5 tasks) - Step-by-step instructions
4. **Code Examples** - Working code blocks
5. **Acceptance Criteria** - How to verify completion
6. **Troubleshooting** - Common issues and solutions

Estimated effort to create all 13 remaining files:
- ~5-6 hours of writing
- ~1,500+ additional lines of documentation
- Comprehensive coverage of entire project

---

## Quick Reference

### By Timeline
- **Week 1**: Phase 0 Quick Wins + Phase 1 Sprint 1
- **Week 2-3**: Phase 1 Sprint 2-3
- **Week 4-5**: Phase 2 Sprint 1
- **Week 6-7**: Phase 2 Sprint 2-3
- **Week 8-9**: Phase 3 Sprint 1
- **Week 10-11**: Phase 3 Sprint 2
- **Week 12-13**: Phase 4 Sprint 1
- **Week 14**: Phase 4 Sprint 2
- **Week 15-17**: Phase 5 Sprint 1-3

### By File
- **Database**: Phase 1 Sprint 1-2
- **Authentication**: Phase 2 Sprint 1-2
- **Favorites**: Phase 2 Sprint 3
- **Gamification**: Phase 3 Sprint 1-2
- **Email**: Phase 4 Sprint 1-2
- **Deployment**: Phase 5 Sprint 1-3

---

## Notes

- Each sprint is independent but depends on previous sprints
- Code examples use TypeScript strict mode
- All sprints target Next.js 16 with App Router
- Security best practices included throughout
- Database migrations handled with Prisma
- Testing strategies included where applicable
