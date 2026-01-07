# Phase 5, Sprint 3: Production Hardening & Optimization (8-10 hours)

**Phase**: 5 - AWS Deployment
**Sprint**: 3 of 3
**Duration**: 8-10 hours (Weeks 17-18)
**Goal**: Secure and optimize production application

## Sprint Overview

| Task | Duration | Deliverable |
|------|----------|-------------|
| Add security headers | 1-2h | HTTPS, CSP, HSTS headers |
| Implement rate limiting | 1-2h | API rate limiting (100 req/min) |
| Database backup strategy | 1h | Automated daily backups |
| Add CloudWatch alarms | 1-2h | Alerts for errors/high CPU |
| Load test application | 1-2h | ✅ Handles 100+ concurrent users |
| Optimize performance | 1-2h | Page load < 2s, optimize images |
| Final security audit | 1-2h | Manual security review |

**Total**: 8-10 hours

## Task 1: Security Headers (1-2 hours)

### Update `app/page.tsx` and layout files with headers

Create `lib/security-headers.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server";

export const securityHeaders = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS protection
  "X-XSS-Protection": "1; mode=block",

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions policy
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",

  // HSTS (HTTP Strict Transport Security)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

  // Content Security Policy
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https:;",
};

export function addSecurityHeaders(response: NextResponse) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
```

Create `middleware.ts` (update existing):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { securityHeaders, addSecurityHeaders } from "@/lib/security-headers";

export function middleware(request: NextRequest) {
  // Auth and route protection logic here...

  const response = NextResponse.next();

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### HTTPS Enforcement:

Create `app/api/[[...route]]/route.ts` (or update existing API routes):

```typescript
export async function GET(request: Request) {
  // AWS ALB will handle HTTPS
  // Ensure all API calls use https:// in client code
  // ...rest of handler
}
```

## Task 2: Rate Limiting (1-2 hours)

Create `lib/rate-limit.ts`:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis rate limiter (requires Upstash account)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
});

export async function checkRateLimit(
  identifier: string,
  limit: number = 100,
  window: string = "1 m"
): Promise<{ success: boolean; remaining: number }> {
  try {
    const { success, remaining } = await ratelimit.limit(identifier);
    return { success, remaining };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open - allow request if rate limiting service is down
    return { success: true, remaining: limit };
  }
}
```

### Alternative: Built-in Rate Limiting (No External Service)

Create `lib/simple-rate-limit.ts`:

```typescript
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkSimpleRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    // New window
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count < maxRequests) {
    record.count++;
    return { allowed: true, remaining: maxRequests - record.count };
  }

  return { allowed: false, remaining: 0 };
}

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime + 600000) {
      requestCounts.delete(key);
    }
  }
}, 600000);
```

### Apply Rate Limiting to API Routes:

Update `app/api/favorites/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkSimpleRateLimit } from "@/lib/simple-rate-limit";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  // Rate limit by user ID
  const { allowed, remaining } = checkSimpleRateLimit(session.userId, 100);

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // ... rest of handler
}
```

## Task 3: Database Backup Strategy (1 hour)

### In AWS Console:

1. Go to RDS → Databases → Select `fckdoomscroll`
2. Click "Modify"
3. Under "Backup":
   - **Backup retention period**: 30 days
   - **Backup window**: 02:00-03:00 UTC (low traffic)
   - **Copy backups to another region**: us-west-2 (disaster recovery)
4. Click "Apply immediately"

### Automated Backups via AWS CLI:

Create `scripts/backup.sh`:

```bash
#!/bin/bash

# Daily manual snapshot backup
BACKUP_ID="fckdoomscroll-backup-$(date +%Y%m%d-%H%M%S)"

aws rds create-db-snapshot \
  --db-instance-identifier fckdoomscroll \
  --db-snapshot-identifier $BACKUP_ID \
  --region us-east-1

echo "Backup created: $BACKUP_ID"

# Clean up old backups (keep last 30)
aws rds describe-db-snapshots \
  --db-instance-identifier fckdoomscroll \
  --region us-east-1 \
  --query 'DBSnapshots[?DBSnapshotType==`manual`]' \
  --output json | \
  jq -r '.[] | select(.SnapshotCreateTime < (now - 2592000)) | .DBSnapshotIdentifier' | \
  xargs -I {} aws rds delete-db-snapshot --db-snapshot-identifier {} --region us-east-1
```

Add to GitHub Actions:

Create `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    # Run at 2 AM UTC daily
    - cron: "0 2 * * *"

jobs:
  backup:
    runs-on: ubuntu-latest

    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Create RDS snapshot
        run: |
          BACKUP_ID="fckdoomscroll-backup-$(date +%Y%m%d-%H%M%S)"
          aws rds create-db-snapshot \
            --db-instance-identifier fckdoomscroll \
            --db-snapshot-identifier $BACKUP_ID \
            --region us-east-1
          echo "Snapshot created: $BACKUP_ID"

      - name: Clean old snapshots
        run: |
          # Delete snapshots older than 30 days
          aws rds describe-db-snapshots \
            --db-instance-identifier fckdoomscroll \
            --region us-east-1 \
            --query "DBSnapshots[?SnapshotCreateTime<='$(date -d '30 days ago' -Iseconds)'].DBSnapshotIdentifier" \
            --output text | \
            xargs -I {} aws rds delete-db-snapshot \
              --db-snapshot-identifier {} \
              --region us-east-1 || true
```

## Task 4: CloudWatch Alarms (1-2 hours)

### Create Alarms via AWS CLI:

```bash
#!/bin/bash

# High CPU Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name fckdoomscroll-high-cpu \
  --alarm-description "Alert when ECS CPU usage is high" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 70 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=fckdoomscroll-service Name=ClusterName,Value=fckdoomscroll-prod \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts

# High Memory Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name fckdoomscroll-high-memory \
  --alarm-description "Alert when ECS memory usage is high" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=fckdoomscroll-service Name=ClusterName,Value=fckdoomscroll-prod \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts

# ECS Task Failures
aws cloudwatch put-metric-alarm \
  --alarm-name fckdoomscroll-task-failures \
  --alarm-description "Alert when tasks fail to start" \
  --metric-name TaskCount \
  --namespace AWS/ECS \
  --statistic Sum \
  --period 60 \
  --threshold 1 \
  --comparison-operator LessThanThreshold \
  --dimensions Name=ServiceName,Value=fckdoomscroll-service Name=ClusterName,Value=fckdoomscroll-prod \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts

# 5XX Errors from ALB
aws cloudwatch put-metric-alarm \
  --alarm-name fckdoomscroll-5xx-errors \
  --alarm-description "Alert on high HTTP 5XX errors" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=LoadBalancer,Value=app/fckdoomscroll-alb/* \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts

# RDS CPU High
aws cloudwatch put-metric-alarm \
  --alarm-name fckdoomscroll-rds-cpu \
  --alarm-description "Alert when RDS CPU is high" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 75 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=fckdoomscroll \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts
```

### Create SNS Topic for Alerts:

```bash
# Create SNS topic
aws sns create-topic --name fckdoomscroll-alerts --region us-east-1

# Subscribe to email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:fckdoomscroll-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Task 5: Load Testing (1-2 hours)

### Install k6 Load Testing Tool:

```bash
# macOS
brew install k6

# Windows
choco install k6

# Or use Docker
docker run --rm -i grafana/k6 run - < script.js
```

### Create Load Test Script `scripts/load-test.js`:

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 10 },   // Ramp up to 10 users
    { duration: "5m", target: 100 },  // Ramp up to 100 users
    { duration: "2m", target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ["p(99)<1500"], // 99th percentile under 1.5s
    http_req_failed: ["rate<0.1"],     // Error rate less than 10%
  },
};

export default function () {
  // Test home page
  let res = http.get(`${__ENV.BASE_URL}/`);
  check(res, {
    "home status is 200": (r) => r.status === 200,
  });

  // Test API endpoint
  res = http.get(`${__ENV.BASE_URL}/api/content/today`);
  check(res, {
    "content api status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });

  // Simulate user interaction
  sleep(2);
}
```

### Run Load Test:

```bash
# Against local environment
BASE_URL=http://localhost:3000 k6 run scripts/load-test.js

# Against production
BASE_URL=https://fckdoomscroll.com k6 run scripts/load-test.js

# Generate HTML report
k6 run --out json=results.json scripts/load-test.js
```

## Task 6: Performance Optimization (1-2 hours)

### Next.js Build Optimization:

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    cacheMaxAge: 60 * 60 * 24 * 365, // 1 year
  },

  // Compression
  compress: true,

  // Generate etags for static files
  generateEtags: true,

  // Production source maps (disabled for security)
  productionBrowserSourceMaps: false,

  // SWR (Stale While Revalidate)
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  // Response headers for caching
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },

  // Redirects for old URLs
  async redirects() {
    return [
      {
        source: "/old-path",
        destination: "/new-path",
        permanent: true, // 301 redirect
      },
    ];
  },
};

module.exports = nextConfig;
```

### Database Query Optimization:

Ensure all Prisma queries use proper indexing and selection:

```typescript
// ❌ Bad: Fetches all fields
const users = await prisma.user.findMany();

// ✅ Good: Only fetch needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    displayName: true,
  },
});

// ✅ Good: Use indexes for filtering
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" }, // Indexed field
});
```

### CloudFront CDN (Optional):

If using CloudFront in front of ALB:
- Cache static assets (images, CSS, JS): 1 year
- Cache HTML: 1 hour
- Cache API responses: 0 (no-cache)

## Task 7: Security Audit (1-2 hours)

### Checklist:

**Authentication & Authorization**:
- [ ] All protected routes require valid session
- [ ] JWT tokens expire after 7 days
- [ ] CSRF tokens on all state-changing operations
- [ ] No sensitive data in URL parameters
- [ ] Password reset requires email verification

**Database Security**:
- [ ] Database not publicly accessible (private subnet)
- [ ] RDS encryption enabled at rest
- [ ] RDS traffic encrypted in transit
- [ ] Backups encrypted
- [ ] No hardcoded credentials in code

**API Security**:
- [ ] All inputs validated and sanitized
- [ ] Rate limiting enabled (100 req/min)
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Proper CORS configuration
- [ ] Content-Security-Policy headers set

**Infrastructure Security**:
- [ ] HTTPS only (no HTTP)
- [ ] Security groups restrict traffic
- [ ] ALB only accepts HTTPS on port 443
- [ ] ECS tasks run as non-root user
- [ ] CloudWatch logs encrypted
- [ ] AWS Secrets Manager for credentials

**Application Security**:
- [ ] Dependencies updated and no known vulnerabilities
- [ ] No debug mode in production
- [ ] No stack traces exposed to users
- [ ] Error logging includes context but no sensitive data
- [ ] Monitoring for suspicious activity

### Run OWASP Security Checks:

```bash
# Dependency vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

### Test Security Headers:

```bash
# Use https://securityheaders.com/
curl -i https://fckdoomscroll.com/

# Check HTTPS configuration
curl -I --insecure https://fckdoomscroll.com/
```

## Monitoring Dashboard

Create CloudWatch Dashboard:

```bash
aws cloudwatch put-dashboard \
  --dashboard-name fckdoomscroll-prod \
  --dashboard-body file://dashboard.json
```

Key metrics to monitor:
- ALB request count and latency
- ECS CPU/Memory utilization
- RDS connections and query time
- Error rates (4XX, 5XX)
- Active user sessions

## Completion Checklist

- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Database backups automated
- [ ] CloudWatch alarms created
- [ ] Load test passes (100+ users)
- [ ] Page load time < 2 seconds
- [ ] npm audit shows no vulnerabilities
- [ ] Security header audit passed
- [ ] CloudWatch dashboard created
- [ ] Monitoring alerts working
- [ ] HTTPS enforced
- [ ] All secrets in Secrets Manager

## Next Steps

1. Commit: `git add . && git commit -m "feat(phase5-sprint3): production hardening and optimization"`
2. Deploy and monitor for 24 hours
3. Celebrate! 🎉 Production-ready app complete

---

## Post-Launch Maintenance

### Weekly:
- Review CloudWatch logs for errors
- Check security alerts
- Monitor user feedback

### Monthly:
- Update dependencies
- Run `npm audit`
- Review access logs
- Optimize slow queries

### Quarterly:
- Penetration testing
- Disaster recovery drill
- Performance review
- Cost analysis

---

## Success! 🚀

You've built a production-ready, full-stack application from scratch:
- ✅ Modern architecture (Next.js, React, TypeScript)
- ✅ Secure authentication (AWS Cognito)
- ✅ Scalable infrastructure (ECS Fargate, RDS)
- ✅ Automated deployment (GitHub Actions CI/CD)
- ✅ Gamification system (streaks, achievements)
- ✅ Email automation (AWS SES, Cron jobs)
- ✅ Monitoring & alerts (CloudWatch)
- ✅ Production hardening (security, rate limiting, backups)

This is now a **resume-worthy project** demonstrating full-stack expertise!
