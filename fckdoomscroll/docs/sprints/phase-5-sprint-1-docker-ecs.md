# Phase 5, Sprint 1: Docker & ECS Deployment (12-15 hours)

**Phase**: 5 - AWS Deployment
**Sprint**: 1 of 3
**Duration**: 12-15 hours (Weeks 15-16)
**Goal**: Deploy app on AWS ECS Fargate with RDS

## Sprint Overview

| Task | Duration | Deliverable |
|------|----------|-------------|
| Create production Dockerfile | 2h | Multi-stage Docker image |
| Set up RDS PostgreSQL | 2-3h | Managed database running |
| Create ECR repository | 1h | Container registry ready |
| Build & push image to ECR | 1-2h | Docker image in registry |
| Configure ECS cluster | 2-3h | Fargate cluster setup |
| Configure ALB | 2h | Load balancer routing traffic |
| Deploy and test | 2-3h | ✅ App running on AWS |

**Total**: 12-15 hours

## Task 1: Create Production Dockerfile (2 hours)

Create `Dockerfile`:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
```

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
```

Test locally:
```bash
docker build -t fckdoomscroll:latest .
docker run -p 3000:3000 fckdoomscroll:latest
# Visit http://localhost:3000
```

## Task 2: Set up RDS PostgreSQL (2-3 hours)

In AWS Console:

1. Go to RDS
2. Click "Create database"
3. **Engine**: PostgreSQL 16
4. **Instance**: db.t4g.micro (free tier)
5. **Multi-AZ**: Yes (production)
6. **Storage**: 20GB gp3, auto-scaling to 100GB
7. **Database name**: `fckdoomscroll`
8. **Username**: `fckadmin`
9. **Password**: Strong random password (save it!)
10. **Publicly accessible**: No
11. **VPC**: Default (for now)
12. **Security group**: Allow port 5432 from ECS
13. Create instance

Once created:
- Note the **Endpoint** (hostname)
- Create database connection string:
  ```
  postgresql://fckadmin:PASSWORD@endpoint:5432/fckdoomscroll
  ```

Run migrations:
```bash
# From local machine with network access
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

## Task 3: Create ECR Repository (1 hour)

In AWS Console:

1. Go to ECR
2. Create repository: `fckdoomscroll/app`
3. Note the **URI**: `ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/fckdoomscroll/app`

Authenticate Docker:
```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

## Task 4: Build & Push Image (1-2 hours)

```bash
# Build image
docker build -t ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fckdoomscroll/app:latest .

# Push to ECR
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fckdoomscroll/app:latest
```

## Task 5: Configure ECS Cluster (2-3 hours)

In AWS Console:

1. Go to ECS
2. Create cluster: `fckdoomscroll-prod`
3. Select **Fargate**
4. Create task definition:
   - Name: `fckdoomscroll`
   - Memory: 1024
   - CPU: 512
   - Container name: `app`
   - Image: ECR URI
   - Port: 3000
   - Environment variables from RDS and other secrets
5. Create service:
   - Cluster: `fckdoomscroll-prod`
   - Task definition: `fckdoomscroll`
   - Desired count: 2
   - Load balancer: Create new (ALB)

## Task 6: Configure ALB (2 hours)

In AWS Console:

1. Go to EC2 → Load Balancers
2. Create ALB:
   - Name: `fckdoomscroll-alb`
   - Scheme: Internet-facing
   - VPC: Same as ECS
3. Listeners:
   - HTTP (80) → HTTPS (443)
   - Attach SSL certificate from ACM
4. Target group:
   - Protocol: HTTP
   - Port: 3000
   - Health check: `/api/health`

## Task 7: Deploy & Test (2-3 hours)

Check ECS tasks are running:
```bash
# In AWS Console or CLI
aws ecs describe-tasks \
  --cluster fckdoomscroll-prod \
  --tasks TASK_ID \
  --region us-east-1
```

Get ALB DNS name and test:
```bash
curl http://ALB_DNS_NAME/
```

Should see your app running!

## Completion Checklist

- [ ] Dockerfile builds successfully
- [ ] RDS PostgreSQL running
- [ ] ECR repository created
- [ ] Docker image pushed to ECR
- [ ] ECS cluster created
- [ ] Task definition registered
- [ ] Service running (2+ tasks)
- [ ] ALB routing traffic
- [ ] App accessible via ALB DNS
- [ ] Health check passing
- [ ] Database migrations applied

## Next Steps

1. Commit: `git add . && git commit -m "feat(phase5-sprint1): docker and ecs deployment"`
2. Monitor CloudWatch logs
3. Move to Phase 5, Sprint 2: CI/CD Pipeline
