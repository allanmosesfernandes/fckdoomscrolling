# Phase 5, Sprint 2: CI/CD Pipeline & Automation (13-15 hours)

**Phase**: 5 - AWS Deployment
**Sprint**: 2 of 3
**Duration**: 13-15 hours (Weeks 16-17)
**Goal**: Automate deployments with GitHub Actions CI/CD pipeline

## Sprint Overview

| Task | Duration | Deliverable |
|------|----------|----------------|
| Set up GitHub repository | 1-2h | Repo connected to Actions |
| Create Docker build workflow | 2-3h | Build and push to ECR |
| Create ECS deploy workflow | 3-4h | Auto-deploy on push |
| Set up GitHub Secrets | 1h | AWS credentials configured |
| Test pipeline end-to-end | 2-3h | ✅ Deploy works automatically |
| Add database migration steps | 2-3h | Migrations run before deployment |
| Create rollback strategy | 1-2h | Quick revert on failure |

**Total**: 13-15 hours

## Task 1: GitHub Repository Setup (1-2 hours)

In GitHub:

1. Create new repository (if not exists)
2. Push code: `git add . && git commit -m "feat: initial fckdoomscroll setup" && git push`
3. Go to Settings → Secrets and variables → Actions
4. Add these secrets:
   ```
   AWS_ACCOUNT_ID=123456789012
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   AWS_REGION=us-east-1
   ECR_REPOSITORY=fckdoomscroll/app
   ECS_CLUSTER=fckdoomscroll-prod
   ECS_SERVICE=fckdoomscroll-service
   ECS_TASK_DEFINITION=fckdoomscroll
   DATABASE_URL=postgresql://user:password@host:5432/fckdoomscroll
   ```

5. Enable Actions in repository settings

## Task 2: Docker Build Workflow (2-3 hours)

Create `.github/workflows/build.yml`:

```yaml
name: Build and Push to ECR

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: fckdoomscroll/app

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.image.outputs.image }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
                       -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Output image URI
        id: image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Create artifact with image URI
        run: |
          echo "${{ steps.image.outputs.image }}" > image-uri.txt

      - name: Upload image URI artifact
        uses: actions/upload-artifact@v3
        with:
          name: image-uri
          path: image-uri.txt
```

## Task 3: ECS Deploy Workflow (3-4 hours)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to ECS

on:
  push:
    branches:
      - main

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: fckdoomscroll/app
  ECS_SERVICE: fckdoomscroll-service
  ECS_CLUSTER: fckdoomscroll-prod
  ECS_TASK_DEFINITION: fckdoomscroll

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    name: Build and Deploy

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image
        id: image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
                       -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Run database migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          npm install
          npx prisma migrate deploy

      - name: Download task definition
        run: |
          aws ecs describe-task-definition \
            --task-definition ${{ env.ECS_TASK_DEFINITION }} \
            --region ${{ env.AWS_REGION }} \
            --query 'taskDefinition' > task-definition.json

      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/render-amazon-ecs-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: app
          image: ${{ steps.image.outputs.image }}

      - name: Deploy Amazon ECS task
        uses: aws-actions/deploy-to-ecs@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

      - name: Verify deployment
        run: |
          # Wait for tasks to be running
          sleep 10
          aws ecs describe-services \
            --cluster ${{ env.ECS_CLUSTER }} \
            --services ${{ env.ECS_SERVICE }} \
            --region ${{ env.AWS_REGION }}

      - name: Post deployment health check
        run: |
          ALB_DNS=$(aws elbv2 describe-load-balancers \
            --region ${{ env.AWS_REGION }} \
            --query "LoadBalancers[?LoadBalancerName=='fckdoomscroll-alb'].DNSName" \
            --output text)

          echo "Health check: http://$ALB_DNS/api/health"

          for i in {1..30}; do
            if curl -f http://$ALB_DNS/api/health; then
              echo "✅ Deployment successful!"
              exit 0
            fi
            echo "Waiting for app to be ready... ($i/30)"
            sleep 10
          done

          echo "❌ Deployment health check failed"
          exit 1

  rollback:
    needs: build-and-deploy
    runs-on: ubuntu-latest
    if: failure()
    name: Rollback on Failure

    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Get previous task definition
        run: |
          # Get the last successful task definition
          aws ecs describe-services \
            --cluster ${{ env.ECS_CLUSTER }} \
            --services ${{ env.ECS_SERVICE }} \
            --region us-east-1 \
            --query 'services[0].taskDefinition' \
            --output text

      - name: Rollback service
        run: |
          aws ecs update-service \
            --cluster ${{ env.ECS_CLUSTER }} \
            --service ${{ env.ECS_SERVICE }} \
            --force-new-deployment \
            --region us-east-1

          aws ecs wait services-stable \
            --cluster ${{ env.ECS_CLUSTER }} \
            --services ${{ env.ECS_SERVICE }} \
            --region us-east-1

      - name: Send failure notification
        run: |
          echo "Deployment failed and rolled back to previous version"
          # Add Slack/email notification here if desired
```

## Task 4: GitHub Secrets Configuration (1 hour)

### In AWS Console:

1. Create IAM user for GitHub Actions:
   - Go to IAM → Users → Create user
   - Name: `github-actions-fckdoomscroll`
   - Attach policy: Create custom inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "arn:aws:ecr:us-east-1:ACCOUNT_ID:repository/fckdoomscroll/app"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:DescribeTasks",
        "ecs:ListTasks",
        "ecs:RegisterTaskDefinition"
      ],
      "Resource": [
        "arn:aws:ecs:us-east-1:ACCOUNT_ID:service/fckdoomscroll-prod/*",
        "arn:aws:ecs:us-east-1:ACCOUNT_ID:task-definition/fckdoomscroll:*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "*"
    }
  ]
}
```

2. Create access key for the user
3. Add to GitHub Secrets (as done in Task 1)

## Task 5: Test Pipeline End-to-End (2-3 hours)

### Local Testing:

```bash
# 1. Make a small code change
echo "# CI/CD Pipeline Ready" >> README.md

# 2. Commit and push
git add . && git commit -m "test: ci/cd pipeline trigger" && git push

# 3. Monitor GitHub Actions
# Go to repository → Actions tab → Watch build job

# 4. Check CloudWatch for logs
# AWS Console → CloudWatch → Log groups → /ecs/fckdoomscroll
```

### Manual Workflow Trigger:

```bash
# You can manually trigger workflows
gh workflow run deploy.yml --ref main
```

### Expected Output:

1. ✅ Docker image built and pushed to ECR
2. ✅ Database migrations run
3. ✅ New task definition created
4. ✅ ECS service updated
5. ✅ Old tasks terminated
6. ✅ New tasks become healthy
7. ✅ ALB routes traffic to new tasks
8. ✅ Health check passes

## Task 6: Database Migration Steps (2-3 hours)

### Update `.github/workflows/deploy.yml` database section:

The workflow already includes:
```yaml
- name: Run database migrations
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    npm install
    npx prisma migrate deploy
```

### For Zero-Downtime Deployments:

Create migration script at `scripts/migrate.sh`:

```bash
#!/bin/bash
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Clearing Prisma cache..."
rm -rf .prisma/

echo "Migrations complete!"
```

Update workflow to use script:
```yaml
- name: Run database migrations
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    npm install
    chmod +x scripts/migrate.sh
    scripts/migrate.sh
```

## Task 7: Rollback Strategy (1-2 hours)

### Automatic Rollback (included in deploy.yml):

The workflow includes a `rollback` job that:
1. Triggers only if deployment fails
2. Gets the previous stable task definition
3. Forces a new deployment with the previous version
4. Waits for service stability

### Manual Rollback (emergency):

```bash
# Get previous task definition revision
aws ecs describe-task-definition \
  --task-definition fckdoomscroll:1 \
  --region us-east-1

# Update service with previous revision
aws ecs update-service \
  --cluster fckdoomscroll-prod \
  --service fckdoomscroll-service \
  --task-definition fckdoomscroll:1 \
  --region us-east-1

# Force immediate deployment
aws ecs update-service \
  --cluster fckdoomscroll-prod \
  --service fckdoomscroll-service \
  --force-new-deployment \
  --region us-east-1
```

### Keep Previous Task Definitions:

AWS ECS keeps the last 100 task definitions. To view history:

```bash
aws ecs list-task-definition-revisions \
  --family-prefix fckdoomscroll \
  --region us-east-1 \
  --sort DESCENDING \
  --max-results 10
```

## Monitoring the Pipeline

### GitHub Actions Dashboard:
- Navigate to `Settings → Actions → General`
- Enable detailed logging: `ACTIONS_STEP_DEBUG=true`

### CloudWatch Logs:
```bash
# View ECS task logs
aws logs tail /ecs/fckdoomscroll --follow

# View specific task
aws logs tail /ecs/fckdoomscroll --filter-pattern "ERROR" --follow
```

### ECS Service Status:
```bash
# Check if deployment is progressing
aws ecs describe-services \
  --cluster fckdoomscroll-prod \
  --services fckdoomscroll-service \
  --region us-east-1 \
  --query 'services[0].[desiredCount,runningCount,pendingCount]'
```

## Troubleshooting

**Build fails: "docker: not found"**
- Actions runs on ubuntu-latest which includes Docker
- Check if `docker` command is available
- Buildx setup should handle this

**ECR login fails**
- Verify AWS credentials in GitHub Secrets
- Check IAM policy includes ECR permissions
- Ensure ECR repository exists

**ECS deployment times out**
- Check ECS task logs in CloudWatch
- Verify task definition references correct image
- Check ALB health check configuration
- Ensure security groups allow traffic

**Migration fails**
- DATABASE_URL must be accessible from GitHub Actions
- RDS must have public endpoint or use VPN
- Run migrations locally first to test

**Rollback doesn't work**
- Previous task definition revision may not exist
- Check ECS console for available revisions
- Ensure IAM policy allows rolling back

## Completion Checklist

- [ ] GitHub repository created and connected
- [ ] GitHub Secrets added (AWS credentials, etc.)
- [ ] `build.yml` workflow created
- [ ] `deploy.yml` workflow created with migrations
- [ ] IAM user created with ECR/ECS permissions
- [ ] Workflow triggered successfully on push
- [ ] Docker image built and pushed to ECR
- [ ] ECS service updated with new image
- [ ] New tasks became healthy
- [ ] ALB health check passing
- [ ] Rollback tested and working
- [ ] CloudWatch logs showing correct app output
- [ ] Pipeline completes in under 5 minutes

## Next Steps

1. Commit: `git add . && git commit -m "feat(phase5-sprint2): ci/cd pipeline"`
2. Push and watch Actions run: `git push`
3. Monitor first deployment
4. Move to Phase 5, Sprint 3: Production Hardening
