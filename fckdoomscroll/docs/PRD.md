# Product Requirements Document: FckDoomScroll

## Executive Summary

FckDoomScroll is a daily anti-doomscrolling web application that provides curated educational content to replace mindless social media scrolling with intentional learning.

**Dual Purpose**:
1. **Product Goal**: Reduce doomscrolling by offering daily educational content
2. **Learning Goal**: Comprehensive full-stack development project with modern tech stack

## Problem Statement

Users spend excessive time doomscrolling through social media, resulting in:
- Lost productivity and time
- Mental fatigue and anxiety
- Lack of meaningful learning
- Habit of mindless consumption

FckDoomScroll solves this by offering a destination that:
- Provides curated, meaningful content daily
- Requires intentional action (visiting daily)
- Rewards consistency (streaks, achievements)
- Enables personal curation (favorites)

## Target Users

**Primary**: Individuals aged 18-45 seeking daily micro-learning opportunities
- Professionals wanting to learn during breaks
- Students wanting supplementary learning
- Anyone tired of social media but wanting daily digital interaction

**Secondary**: People building positive digital habits
- Those trying to reduce social media usage
- Users interested in gamification and streaks

**Tertiary**: Users motivated by achievement systems
- Streak chasers
- Collectors of interesting information
- Goal-oriented learners

## Core Value Proposition

**Every day you visit, receive exactly 4 pieces of curated content:**

1. **Word of the Day**
   - New vocabulary with definition
   - Example usage
   - Etymology (optional)
   - Pronunciation guide

2. **Capital/Country of the Day**
   - Capital city name
   - Fun fact about the country
   - Cultural information
   - Geographic data (optional)

3. **Fun Fact**
   - Interesting trivia from any category
   - Source attribution
   - Category (science, nature, history, etc.)
   - Verification status

4. **This Day in History**
   - Historical event occurred on this date
   - Year and context
   - Key people/places involved
   - Festival celebrations happening today (optional)

**Key Features**:
- Content rotates automatically daily
- No scrolling required (content fits single screen)
- Save favorites for later reference
- Track daily visit streaks
- Unlock achievements through consistency
- Receive email reminders and summaries

## Feature Requirements by Phase

### Phase 1: Core Content Display (MVP)
**Duration**: 4 weeks | **Hours**: 30-37 | **Goal**: Personally usable daily

**Features**:
- ✅ Daily rotating content based on date
- ✅ 4 content types displayed in card format
- ✅ Responsive design (mobile-first)
- ✅ 30-90 days of curated content in database
- ✅ Content automatically rotates at midnight (respecting user timezone)
- ✅ Loading states and error handling
- ✅ Smooth animations and transitions

**Success Criteria**:
- App is personally usable daily
- Content displays correctly on all devices
- Content rotates on schedule
- No console errors
- Page load time under 2 seconds

**Deployment**: Vercel with Vercel Postgres or Supabase

---

### Phase 2: Authentication & Favorites
**Duration**: 4 weeks | **Hours**: 30-37 | **Goal**: Users can build personal collections

**Features**:
- ✅ User sign up with email
- ✅ Email verification
- ✅ User sign in with credentials
- ✅ Session persistence across browser refresh
- ✅ Save/unsave favorite content items
- ✅ Favorites page showing all saved content
- ✅ Protected routes (require authentication)
- ✅ User profile page showing stats
- ✅ Sign out functionality
- ✅ Forgot password flow

**Success Criteria**:
- Users can create accounts and sign in
- Favorites persist across sessions
- Protected routes work correctly
- 3-5 test users can be onboarded
- Profile page shows accurate information

**Deployment**: Update Vercel with Cognito environment variables

---

### Phase 3: Streaks & Gamification
**Duration**: 3 weeks | **Hours**: 18-22 | **Goal**: Users motivated to return daily

**Features**:
- ✅ Daily visit tracking
- ✅ Current streak calculation
- ✅ Longest streak preservation
- ✅ Streak display on home page (flame emoji)
- ✅ Achievement system (8-10 achievements):
  - First Visit
  - 3-Day Streak
  - 7-Day Streak
  - 30-Day Streak
  - 100-Day Streak (future)
  - First Favorite
  - 10 Favorites
  - 50 Favorites
- ✅ Toast notifications when achievements unlock
- ✅ Visit calendar/history (optional)
- ✅ Stats page with detailed metrics

**Success Criteria**:
- Streaks track correctly (no false resets)
- Achievements unlock automatically
- Users see notifications on unlock
- Longest streak preserved even after reset
- Streak survives timezone changes

**Deployment**: Run database migrations in production

---

### Phase 4: Email & Notifications
**Duration**: 3 weeks | **Hours**: 20-25 | **Goal**: Re-engage users via email

**Features**:
- ✅ Streak reminder emails (sent when streak at risk)
- ✅ Weekly digest emails (Sunday summary of week)
- ✅ Email preference management
- ✅ Opt-in/opt-out controls
- ✅ Customizable reminder time
- ✅ Unsubscribe links
- ✅ Professional email templates
- ✅ Email tracking (opens, clicks - optional)

**Email Types**:
1. **Streak Reminder**
   - Triggered: 8 hours before streak breaks
   - Content: Current streak count, motivation, link to app
   - Frequency: Daily if streak at risk

2. **Weekly Digest**
   - Triggered: Every Sunday at user's preferred time
   - Content: Weekly stats, achievements unlocked, preview of next week's content
   - Frequency: Once per week

3. **Welcome Email**
   - Triggered: After account creation
   - Content: Introduction, how app works, first content preview

**Success Criteria**:
- SES sends emails successfully
- Streak reminders reach at-risk users
- Weekly digests deliver weekly
- Users can disable emails via settings
- Emails render correctly in Gmail, Outlook
- Unsubscribe links work
- No spam folder issues

**Deployment**: Enable Vercel Cron in production

---

### Phase 5: AWS Deployment
**Duration**: 3 weeks | **Hours**: 33-40 | **Goal**: Production-ready, resume-worthy infrastructure

**Features**:
- ✅ Production deployment on AWS ECS Fargate
- ✅ PostgreSQL on RDS (Multi-AZ)
- ✅ Docker containerization (multi-stage builds)
- ✅ CI/CD pipeline via GitHub Actions
- ✅ CloudWatch monitoring and logs
- ✅ CloudWatch alarms for critical metrics
- ✅ Security hardening (HTTPS, rate limiting, headers)
- ✅ Automated backups and disaster recovery
- ✅ Custom domain with SSL certificate
- ✅ Load testing and optimization
- ✅ Documentation and runbooks

**Success Criteria**:
- App deploys automatically on git push
- Zero-downtime deployments
- Monitoring shows all metrics
- 99.5% uptime maintained
- Can handle 100+ concurrent users
- Backups tested and restorable
- Security audit passed

**Deployment**: AWS ECS Fargate with RDS, CloudFront, Route53

---

## Non-Functional Requirements

### Performance
- Page load time: < 2 seconds
- API response time: < 500ms
- Time to Interactive (TTI): < 3 seconds

### Availability
- Uptime target: 99.5% (5 nines in Phase 5)
- Graceful degradation if database unavailable
- Automatic failover for Phase 5 AWS

### Security
- HTTPS only (enforce in production)
- Password requirements: min 8 chars, uppercase, lowercase, number
- Rate limiting: 100 requests/minute per IP
- SQL injection prevention (via Prisma ORM)
- XSS prevention (via Next.js/React)
- CSRF protection for forms
- Secure session management (HTTP-only cookies)
- Email verification required
- Account lockout after 5 failed login attempts

### Scalability
- Handle 100+ concurrent users
- Auto-scaling on AWS (Phases 5)
- Database connection pooling
- CDN for static assets (optional in Phase 5)

### Maintainability
- TypeScript throughout
- Clear code organization
- Documented APIs and patterns
- Comprehensive error logging
- Database migrations versioned
- Environment configuration management

### Accessibility
- WCAG 2.1 AA compliance (minimum)
- Keyboard navigation
- Screen reader compatible
- Color contrast ratios
- Focus indicators

## Success Metrics

### Phase 1 Success
- [ ] Database runs in Docker
- [ ] 30 days of content seeded
- [ ] Content displays and rotates daily
- [ ] You personally use it daily
- [ ] All 4 content types display
- [ ] Mobile responsive

### Phase 2 Success
- [ ] Users can sign up and sign in
- [ ] Favorites persist across sessions
- [ ] 3-5 test users onboarded
- [ ] Profile page loads
- [ ] Auth errors handled gracefully

### Phase 3 Success
- [ ] Streaks track correctly
- [ ] Achievements unlock automatically
- [ ] You see gamification motivation
- [ ] Visit calendar displays
- [ ] Stats page is accurate

### Phase 4 Success
- [ ] Streak reminders sent successfully
- [ ] Weekly digests delivered
- [ ] Email preferences respected
- [ ] Users respond to emails
- [ ] No spam issues

### Phase 5 Success
- [ ] App runs on AWS ECS Fargate
- [ ] CI/CD pipeline working
- [ ] Monitoring shows no critical errors
- [ ] Custom domain resolves
- [ ] Can explain infrastructure decisions

## Out of Scope (Future Phases)

These features are explicitly NOT included in this plan to avoid scope creep:

- Social features (sharing, following, comments)
- Content recommendations/ML
- Multiple languages
- Native mobile apps
- Advanced content filtering
- User content creation
- Marketplace for content
- Subscription tiers/freemium
- Integration with other services (Slack, Discord)
- Search functionality

## Alternative Paths

### If Momentum Slows

**Option 1: Reorder Phases**
- Move Phase 3 (Streaks) before Phase 2 (Auth)
- Use localStorage for streaks initially
- Adds immediate gamification dopamine

**Option 2: Simplify AWS**
- Skip Phase 5 AWS deployment
- Keep on Vercel + Vercel Postgres forever
- Focus on features instead of infrastructure

**Option 3: MVP-First**
- Ship Phase 1 only
- Get 10+ daily users
- Build Phases 2-4 based on actual user feedback

## Conclusion

FckDoomScroll is a dual-purpose project that balances:
- **Product ambitions**: A useful anti-doomscrolling tool
- **Learning goals**: Full-stack development with modern tech
- **Realistic scope**: Phased approach ensures completion

Success is measured by:
1. Using the app yourself daily
2. Shipping working features regularly
3. Learning from the build process
4. Creating a resume-worthy project
