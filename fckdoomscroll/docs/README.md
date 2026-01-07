# FckDoomScroll Documentation

This documentation is organized to make it easy to reference specific sections during implementation.

## Quick Navigation

### Main Documentation
- **[PRD.md](./PRD.md)** - Product Requirements Document
  - Problem statement, target users, feature requirements by phase
  - Non-functional requirements, success metrics

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical Architecture
  - Tech stack, Next.js app structure, authentication flow, API design patterns
  - React Server Components vs Client Components strategy

- **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)** - AWS Infrastructure
  - VPC setup, ECS Fargate, RDS PostgreSQL, Security configuration
  - CI/CD pipeline, CloudWatch monitoring

- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database Design
  - Complete Prisma schema with explanations
  - Relationships, indexes, and migration strategy

### Sprint Documentation

Each phase is broken into specific sprints with actionable tasks.

#### Phase 0: Quick Wins (4 hours)
- **[phase-0-quick-wins.md](./sprints/phase-0-quick-wins.md)** - Build momentum with branding and layout

#### Phase 1: Core Content Display (30-37 hours)
- **[phase-1-sprint-1-database.md](./sprints/phase-1-sprint-1-database.md)** - Prisma, PostgreSQL, Docker setup
- **[phase-1-sprint-2-content-seeding.md](./sprints/phase-1-sprint-2-content-seeding.md)** - Curate and seed 30 days of content
- **[phase-1-sprint-3-ui.md](./sprints/phase-1-sprint-3-ui.md)** - Daily content display components

#### Phase 2: Authentication & Favorites (30-37 hours)
- **[phase-2-sprint-1-cognito.md](./sprints/phase-2-sprint-1-cognito.md)** - AWS Cognito setup
- **[phase-2-sprint-2-auth-ui.md](./sprints/phase-2-sprint-2-auth-ui.md)** - Sign in/sign up flows
- **[phase-2-sprint-3-favorites.md](./sprints/phase-2-sprint-3-favorites.md)** - Save and manage favorites

#### Phase 3: Streaks & Gamification (18-22 hours)
- **[phase-3-sprint-1-streaks.md](./sprints/phase-3-sprint-1-streaks.md)** - Streak tracking backend
- **[phase-3-sprint-2-gamification.md](./sprints/phase-3-sprint-2-gamification.md)** - Achievements and UI

#### Phase 4: Email & Notifications (20-25 hours)
- **[phase-4-sprint-1-ses.md](./sprints/phase-4-sprint-1-ses.md)** - AWS SES setup
- **[phase-4-sprint-2-email-automation.md](./sprints/phase-4-sprint-2-email-automation.md)** - Cron jobs and templates

#### Phase 5: AWS Deployment (33-40 hours)
- **[phase-5-sprint-1-docker-ecs.md](./sprints/phase-5-sprint-1-docker-ecs.md)** - Docker and ECS Fargate
- **[phase-5-sprint-2-cicd.md](./sprints/phase-5-sprint-2-cicd.md)** - GitHub Actions CI/CD
- **[phase-5-sprint-3-hardening.md](./sprints/phase-5-sprint-3-hardening.md)** - Security and production hardening

## How to Use This Documentation

### For Starting a New Sprint
1. Read the relevant sprint markdown file
2. Follow the tasks in order
3. Check off completion criteria
4. Reference the code examples provided

### For Understanding Architecture
1. Start with [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Check [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for data models
3. Review [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) for AWS setup

### For LLM Context
- Pass the entire docs folder for comprehensive context
- Or pass specific sprint files for focused work
- Each file is self-contained with necessary context

## File Structure

```
docs/
├── README.md (this file)
├── PRD.md
├── ARCHITECTURE.md
├── INFRASTRUCTURE.md
├── DATABASE_SCHEMA.md
└── sprints/
    ├── phase-0-quick-wins.md
    ├── phase-1-sprint-1-database.md
    ├── phase-1-sprint-2-content-seeding.md
    ├── phase-1-sprint-3-ui.md
    ├── phase-2-sprint-1-cognito.md
    ├── phase-2-sprint-2-auth-ui.md
    ├── phase-2-sprint-3-favorites.md
    ├── phase-3-sprint-1-streaks.md
    ├── phase-3-sprint-2-gamification.md
    ├── phase-4-sprint-1-ses.md
    ├── phase-4-sprint-2-email-automation.md
    ├── phase-5-sprint-1-docker-ecs.md
    ├── phase-5-sprint-2-cicd.md
    └── phase-5-sprint-3-hardening.md
```

## Timeline Summary

| Phase | Sprints | Hours | Weeks (15h/week) | Weeks (10h/week) |
|-------|---------|-------|------------------|------------------|
| Quick Wins | 1 | 4 | 0.3 | 0.4 |
| Phase 1 | 3 | 30-37 | 2-2.5 | 3-3.7 |
| Phase 2 | 3 | 30-37 | 2-2.5 | 3-3.7 |
| Phase 3 | 2 | 18-22 | 1.2-1.5 | 1.8-2.2 |
| Phase 4 | 2 | 20-25 | 1.3-1.7 | 2-2.5 |
| Phase 5 | 3 | 33-40 | 2.2-2.7 | 3.3-4 |
| **Total** | **14** | **135-165** | **9-11** | **13.5-16.5** |

## Key Principles

1. **Ship Early, Ship Often**: Deploy working features regularly
2. **Maintain Momentum**: Quick wins first, celebrate progress
3. **Avoid Scope Creep**: Finish phases before adding features
4. **Use the App**: Build features you'll use yourself daily
5. **Learning Focus**: Understand patterns, not just copy-paste

## Getting Help

Each sprint file includes:
- Context and prerequisites
- Step-by-step tasks
- Code examples and patterns
- Critical files to create/modify
- Acceptance criteria
- Common pitfalls

If stuck on a task:
1. Re-read the relevant section
2. Check the code examples
3. Review acceptance criteria
4. Consult the main architecture docs
