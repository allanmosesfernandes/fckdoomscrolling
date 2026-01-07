# AWS Infrastructure Architecture

This document covers the infrastructure setup for Phase 5 (AWS Deployment). Phases 1-4 use Vercel and Vercel Postgres.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Route 53                                  │
│                  (DNS - yourdomain.com)                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   CloudFront CDN                                 │
│           (Static assets + caching layer)                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│         Application Load Balancer (ALB)                          │
│              (Layer 7 routing, SSL/TLS)                          │
│              (Security groups, rate limiting)                    │
└────────┬────────────────────────────────┬───────────────────────┘
         │                                │
┌────────▼────────┐              ┌────────▼────────┐
│  ECS Service    │              │  ECS Service    │
│  (Task 1)       │              │  (Task 2)       │
│  Fargate        │              │  Fargate        │
│ Port 3000       │              │ Port 3000       │
│ (Scaling 2-10)  │              │ (Scaling 2-10)  │
└────────┬────────┘              └────────┬────────┘
         │                                │
         └────────────┬───────────────────┘
                      │
     ┌────────────────┼────────────────┬──────────────────┐
     │                │                │                  │
┌────▼──────────┐ ┌──▼──────────────┐ │            ┌─────▼──────┐
│   RDS         │ │  CloudWatch     │ │            │   S3       │
│ PostgreSQL    │ │  Logs & Metrics │ │            │  Backups   │
│ Multi-AZ      │ │                 │ │            │  + Assets  │
│ Encryption    │ │  Alarms         │ │            └────────────┘
└───────────────┘ └─────────────────┘ │
                                       │
                              ┌────────▼──────────┐
                              │  AWS Cognito      │
                              │  User Management  │
                              └───────────────────┘

                              ┌───────────────────┐
                              │   AWS SES         │
                              │  Email Service    │
                              └───────────────────┘

                              ┌───────────────────┐
                              │  ECR              │
                              │  Container Reg.   │
                              └───────────────────┘
```

## Network Architecture

### VPC Configuration

**VPC**: `fckdoomscroll-vpc`
- **CIDR Block**: 10.0.0.0/16
- **Region**: us-east-1 (recommended)
- **Availability Zones**: 2 (us-east-1a, us-east-1b)

### Subnets

**Public Subnets** (for ALB):
- `public-subnet-1a`: 10.0.1.0/24 (us-east-1a)
- `public-subnet-1b`: 10.0.2.0/24 (us-east-1b)
- Route table: Routes to Internet Gateway

**Private Subnets** (for ECS + RDS):
- `private-subnet-1a`: 10.0.10.0/24 (us-east-1a)
- `private-subnet-1b`: 10.0.11.0/24 (us-east-1b)
- Route table: Routes to NAT Gateway

**NAT Gateway**: In public subnet for private subnet internet access

### Security Groups

**ALB Security Group** (`alb-sg`):
```
Inbound:
  - Port 443 (HTTPS) from 0.0.0.0/0
  - Port 80 (HTTP) from 0.0.0.0/0 → Redirect to 443

Outbound:
  - All traffic to 0.0.0.0/0
```

**ECS Task Security Group** (`ecs-sg`):
```
Inbound:
  - Port 3000 from alb-sg (only ALB can reach)

Outbound:
  - Port 443 (HTTPS) to 0.0.0.0/0 (for AWS APIs, Cognito)
  - Port 5432 to rds-sg (PostgreSQL)
```

**RDS Security Group** (`rds-sg`):
```
Inbound:
  - Port 5432 from ecs-sg (only ECS tasks can reach)

Outbound:
  - Deny all (database doesn't need outbound)
```

## Compute: ECS Fargate

### ECS Cluster

**Name**: `fckdoomscroll-prod`
**Launch Type**: Fargate (serverless containers)
**Platform Version**: LATEST

### ECS Service

**Name**: `fckdoomscroll-service`
**Task Definition**: `fckdoomscroll:1` (incrementing)

**Task Definition Config**:
- **CPU**: 512 (0.5 vCPU)
- **Memory**: 1024 MB
- **Container Name**: `app`
- **Container Port**: 3000
- **Log Group**: `/ecs/fckdoomscroll`
- **Log Retention**: 30 days

**Service Config**:
- **Desired Count**: 2 tasks
- **Deployment Type**: Rolling (zero-downtime)
- **Min Healthy Percent**: 100%
- **Max Percent**: 200% (allows rolling updates)
- **Health Check**:
  - Endpoint: `/api/health`
  - Interval: 30 seconds
  - Timeout: 5 seconds
  - Healthy Threshold: 2 consecutive
  - Unhealthy Threshold: 3 consecutive

### Auto Scaling

**Target Scaling Policy**:
- **Metric**: Average CPU Utilization
- **Target**: 70%
- **Scale-up Cooldown**: 60 seconds
- **Scale-down Cooldown**: 300 seconds
- **Min Capacity**: 2 tasks
- **Max Capacity**: 10 tasks

**CPU Scaling**:
- 60-70%: No change
- >70%: Scale up 1 task at a time
- <30%: Scale down 1 task (minimum 2)

## Load Balancer: ALB

**Name**: `fckdoomscroll-alb`
**Scheme**: Internet-facing
**Load Balancer Type**: Application Load Balancer

### Listeners

**HTTP Listener** (Port 80):
- Route: All traffic → Redirect to HTTPS (301)

**HTTPS Listener** (Port 443):
- Protocol: HTTPS
- Certificate: AWS Certificate Manager (ACM)
  - Domain: yourdomain.com
  - Auto-renewal: Yes
- Rule: Path `/` → Target Group: `ecs-targets`

### Target Group

**Name**: `ecs-targets`
- **Protocol**: HTTP (ALB to ECS tasks)
- **Port**: 3000
- **VPC**: fckdoomscroll-vpc
- **Health Check**:
  - Protocol: HTTP
  - Path: `/api/health`
  - Port: 3000
  - Interval: 30 seconds
  - Timeout: 5 seconds
  - Healthy Threshold: 2
  - Unhealthy Threshold: 3
  - Success Codes: 200

### Sticky Sessions
- Enabled: Yes (optional)
- Duration: 1 day
- Cookie: AWSALB

## Database: RDS PostgreSQL

**Instance ID**: `fckdoomscroll-db`
**Engine**: PostgreSQL 16
**Instance Class**: `db.t4g.micro` (initial) → `db.t4g.small` (scale)

### Configuration

**Multi-AZ**: Yes (automatic failover)
- Primary: us-east-1a
- Standby: us-east-1b (sync replication)

**Storage**:
- **Type**: gp3 (General Purpose)
- **Allocated**: 20 GB
- **IOPS**: 3000
- **Throughput**: 125 MB/s
- **Auto Scaling**: Enabled up to 100 GB

**Backup**:
- **Retention**: 7 days
- **Backup Window**: 03:00-04:00 UTC (adjust to off-peak)
- **Preferred Maintenance Window**: Sun 04:00-05:00 UTC
- **Copy Snapshots to**: (optional) Different region for DR

**Encryption**:
- **At Rest**: Enabled (AWS managed key)
- **In Transit**: SSL/TLS enforced
- **Deletion Protection**: Enabled

**Database**:
- **Name**: `fckdoomscroll`
- **Port**: 5432 (standard)
- **Username**: `fckadmin` (stored in Secrets Manager)
- **Password**: (strong, 20+ chars, stored in Secrets Manager)

**Parameter Groups**:
- `max_connections`: 100 (enough for connection pooling)
- `log_statement`: ddl (log DDL changes)
- `log_min_duration_statement`: 1000 (log slow queries > 1s)

**Option Groups**: None needed initially

### Connection Pooling

**Application Level** (Prisma):
```env
DATABASE_URL="postgresql://user:pass@endpoint:5432/db?schema=public&sslmode=require&pool_size=5&statement_cache_size=25"
```

- Pool size: 5-10 connections
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

## Container Registry: ECR

**Repository**: `fckdoomscroll/app`
**Visibility**: Private (images stored securely)

### Image Configuration
- **Image Scanning**: On push (vulnerability scanning)
- **Tag Immutability**: Enabled (prevent tag overwrites)
- **Image Retention Policy**:
  - Keep most recent: 10 images
  - Delete untagged images: 7 days

### Image Tagging Strategy
- `latest` - Most recent production build
- `v1.0.0` - Semantic versioning for releases
- `git-sha` - Commit hash for debugging

## Email Service: SES

**Region**: us-east-1 (or preferred region)
**Sending Limit**: Request increase after sandbox verification

### Email Verification

**Verified Sender Email**: noreply@yourdomain.com
- Verification method: Email link click
- DKIM: Enabled (domain signing)
- DMARC: Configured (domain authentication)

**Verified Domain**: yourdomain.com
- DNS Records:
  - **SPF**: `v=spf1 include:amazonses.com ~all`
  - **DKIM**: (auto-generated by SES)
  - **DMARC**: `v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com`

### Configuration

**Sending Rate**: 14 emails/second (production access)
**Daily Sending Quota**: 50,000 emails/day

**Configuration Set** (optional):
- Name: `fckdoomscroll-config-set`
- Event Publishing: CloudWatch (track sends, bounces, complaints)

**Email Templates** (optional, use SES API):
- `StreakReminder`
- `WeeklyDigest`
- `WelcomeEmail`

### Suppression List
- Bounce handling: Automatic
- Complaint handling: Automatic
- Bounce subtype: Permanent bounces kept 14 days

## Monitoring: CloudWatch

### Log Groups

**ECS Logs**: `/ecs/fckdoomscroll`
- **Log Stream**: `ecs/fckdoomscroll/[task-id]`
- **Retention**: 30 days
- **Format**: Structured JSON (optional)

**Application Logs**:
```typescript
// lib/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    // CloudWatch transport (optional)
  ],
});

logger.info('User signed in', { userId: '123', email: 'user@example.com' });
```

### Metrics & Dashboards

**CloudWatch Dashboard**: `fckdoomscroll-dashboard`

**Key Metrics**:
- **ECS Task Metrics**:
  - `CPUUtilization` (%) - Target: <70%
  - `MemoryUtilization` (%) - Target: <80%
  - `RunningCount` - Desired vs actual
  - `DesiredCount` - Target replicas

- **ALB Metrics**:
  - `TargetResponseTime` (ms) - Target: <500ms
  - `RequestCount` - Requests per minute
  - `HTTPCode_Target_5XX_Count` - Server errors
  - `HTTPCode_Target_4XX_Count` - Client errors

- **RDS Metrics**:
  - `CPUUtilization` (%)
  - `DatabaseConnections` - Current connections
  - `FreeableMemory` (GB)
  - `ReadLatency` (ms) - Should be <1ms
  - `WriteLatency` (ms) - Should be <1ms

### CloudWatch Alarms

**Critical Alarms** (pager duty):
- ECS CPU > 80% for 5 minutes
- ECS Memory > 85% for 5 minutes
- ALB 5XX errors > 10 per minute
- RDS CPU > 75% for 10 minutes
- RDS Free Space < 5 GB

**Warning Alarms** (email):
- ECS running count < desired count for 5 minutes
- ALB response time > 1000ms (average)
- RDS Free Space < 10 GB
- Database connections > 80% of max

### Logs Insights Queries

**Find errors**:
```
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by @message
```

**API latency**:
```
fields @duration
| filter @duration > 500
| stats avg(@duration), max(@duration), count()
```

**Failed requests**:
```
fields @message, statusCode
| filter statusCode >= 400
| stats count() by statusCode
```

## Secrets Management

**AWS Secrets Manager** stores sensitive data:

**Secret**: `fckdoomscroll/database`
```json
{
  "username": "fckadmin",
  "password": "SecurePassword123!",
  "host": "fckdoomscroll-db.xxxxx.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "dbname": "fckdoomscroll"
}
```

**Secret**: `fckdoomscroll/cognito`
```json
{
  "user_pool_id": "us-east-1_xxxxxxxxx",
  "client_id": "xxxxxxxxxxxxxxxxxxxxx",
  "client_secret": "xxxxx+xxxxxx+xxxxxx+xxx"
}
```

**Secret**: `fckdoomscroll/jwt`
```json
{
  "session_secret": "your-secret-key-min-32-chars-long"
}
```

### IAM Role for ECS Tasks

**Role**: `fckdoomscroll-task-role`

**Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fckdoomscroll/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:ACCOUNT_ID:log-group:/ecs/fckdoomscroll:*"
    }
  ]
}
```

## CI/CD Pipeline

### GitHub Actions Workflow

See [phase-5-sprint-2-cicd.md](./sprints/phase-5-sprint-2-cicd.md) for detailed setup.

**Flow**:
1. Push to `main` branch
2. Run tests and build checks
3. Build Docker image (multi-stage)
4. Push to ECR
5. Update ECS task definition
6. Deploy to ECS (rolling update)
7. Run smoke tests
8. Notify on success/failure

## Disaster Recovery & Backups

### RDS Backups
- **Automatic**: Daily, 7-day retention
- **Manual**: Create before major changes
- **Restore**: Point-in-time to any time in 7 days
- **Test Restore**: Monthly validation

### Cross-Region Replication (Optional)
- Replicate snapshots to us-west-2
- Create read replica for load distribution
- Minimum 2-3 hour recovery time

### Application Backups
- Database: Automated by RDS
- User uploads (S3): Versioning + lifecycle
- Configuration: Stored in GitHub (infrastructure as code)

### Recovery Procedures
1. **Database Failure**: Automatic RDS failover (2-3 minutes)
2. **Task Failure**: ECS replaces unhealthy task (1 minute)
3. **ALB Failure**: AWS manages (automatic failover)
4. **Region Failure**: Manual failover to backup region (1-2 hours)

## Cost Optimization

### Services & Estimated Monthly Costs

**Development/Testing** (t4g.micro):
- ECS Fargate: ~$15 (2 tasks)
- RDS db.t4g.micro: ~$20
- ALB: ~$16
- Data transfer: ~$5
- **Total**: ~$60/month

**Production** (scaling):
- ECS Fargate (avg 3 tasks): ~$22
- RDS db.t4g.small: ~$50
- ALB: ~$16
- CloudWatch: ~$10
- Data transfer: ~$10
- SES: ~$5
- **Total**: ~$110/month

### Cost Saving Tips
1. Use Fargate Spot for non-critical workloads (70% savings)
2. Reserved instances for predictable load
3. Set up budget alerts in AWS Billing
4. Use appropriate instance types (t4g is cheaper than t3)
5. Clean up unused resources (snapshots, logs)

## Security Best Practices

### Network
- ✅ VPC with private subnets for compute/database
- ✅ Security groups whitelist ports
- ✅ NAT Gateway for private subnet internet
- ✅ No direct internet access to RDS

### Encryption
- ✅ RDS encryption at rest
- ✅ ALB SSL/TLS (TLS 1.2+)
- ✅ Secrets Manager for credentials
- ✅ HTTPS enforced (301 redirects)

### Access Control
- ✅ IAM roles for ECS tasks
- ✅ Database user with limited permissions
- ✅ No hardcoded credentials
- ✅ Audit logging in CloudWatch

### Application
- ✅ Rate limiting on API routes
- ✅ Input validation
- ✅ Security headers (HSTS, CSP, X-Frame-Options)
- ✅ Dependency scanning

## Scaling Strategy

### Horizontal Scaling
- **ECS**: Auto-scales tasks 2-10 based on CPU
- **RDS**: Read replicas for read-heavy workloads
- **ALB**: Automatically distributes traffic

### Vertical Scaling
- **ECS Task**: Increase CPU/memory if needed
- **RDS**: Upgrade instance class (minimal downtime)

### Monitoring for Scaling
- Watch CloudWatch metrics
- Set up auto-scaling alarms
- Test scaling with load tests

## Deployment Checklist

Before deploying to production:

- [ ] VPC and subnets created
- [ ] Security groups configured
- [ ] ALB created with SSL certificate
- [ ] RDS instance running
- [ ] Database migrated and tested
- [ ] ECR repository created
- [ ] Docker image builds and runs locally
- [ ] GitHub Actions workflow configured
- [ ] Secrets stored in Secrets Manager
- [ ] IAM roles created
- [ ] CloudWatch dashboard created
- [ ] Alarms configured
- [ ] Custom domain configured in Route 53
- [ ] Health check endpoint verified
- [ ] Smoke tests pass
- [ ] Team trained on deployment

## Troubleshooting

**Task fails to start**:
- Check ECS task logs in CloudWatch
- Verify environment variables
- Check container can connect to RDS
- Verify IAM role permissions

**Database connection fails**:
- Check RDS security group allows port 5432
- Verify credentials in Secrets Manager
- Check RDS endpoint is correct
- Test with psql from EC2

**ALB health check fails**:
- Verify `/api/health` endpoint returns 200
- Check container listening on port 3000
- Check ECS security group allows port 3000
- Check ALB security group allows outbound

**High CPU/Memory**:
- Check slow database queries (RDS logs)
- Check for infinite loops
- Monitor task count scaling
- Consider upgrading instance size
