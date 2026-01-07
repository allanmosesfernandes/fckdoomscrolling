# Phase 4, Sprint 1: AWS SES Email Setup (8-10 hours)

**Phase**: 4 - Email & Notifications
**Sprint**: 1 of 2
**Duration**: 8-10 hours (Weeks 12-13)
**Goal**: Set up AWS SES and email templates

## Sprint Overview

| Task | Duration | Deliverable |
|------|----------|-------------|
| AWS SES setup | 2-3h | SES configured & verified |
| Install email library | 1h | Dependencies installed |
| Create SES wrapper | 2h | `lib/email/ses.ts` utility |
| Build email templates | 2h | HTML & plain text templates |
| Test email delivery | 1-2h | ✅ Emails sending |

**Total**: 8-10 hours

## Task 1: AWS SES Setup (2-3 hours)

### Steps in AWS Console

1. Go to Simple Email Service (SES)
2. Verify sender email: `noreply@yourdomain.com`
3. Click "Create DKIM" (adds authentication)
4. Add DNS records to your domain (if self-hosted)
5. Request production access

Get these credentials:
- AWS Access Key ID
- AWS Secret Access Key
- Region: `us-east-1`

Add to `.env.local`:
```env
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
SES_FROM_EMAIL=noreply@yourdomain.com
```

## Task 2: Install Dependencies (1 hour)

```bash
npm install @aws-sdk/client-ses nodemailer
npm install -D @types/nodemailer
```

## Task 3: Create SES Wrapper (2 hours)

Create `lib/email/ses.ts`:

```typescript
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}

export async function sendEmail(options: EmailOptions) {
  const command = new SendEmailCommand({
    Source: process.env.SES_FROM_EMAIL,
    Destination: {
      ToAddresses: [options.to],
    },
    Message: {
      Subject: {
        Data: options.subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: options.htmlBody,
          Charset: "UTF-8",
        },
        Text: {
          Data: options.textBody,
          Charset: "UTF-8",
        },
      },
    },
  });

  try {
    const response = await sesClient.send(command);
    console.log("Email sent:", response.MessageId);
    return response;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}
```

## Task 4: Build Email Templates (2 hours)

Create `lib/email/templates/streak-reminder.ts`:

```typescript
export function streakReminderTemplate(props: {
  displayName: string;
  currentStreak: number;
  appUrl: string;
}) {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto;">
        <h2>Hi ${props.displayName}! 🔥</h2>
        <p>You're on a <strong>${props.currentStreak}-day streak!</strong></p>
        <p>Don't break it! Check out today's curated content:</p>
        <a href="${props.appUrl}/dashboard" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #9333ea;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 16px;
        ">View Today's Content</a>
        <p style="margin-top: 24px; font-size: 12px; color: #666;">
          <a href="${props.appUrl}/profile">Update preferences</a>
        </p>
      </div>
    </body>
    </html>
  `;

  const textBody = `
    Hi ${props.displayName}!

    You're on a ${props.currentStreak}-day streak!

    Don't break it! Check out today's curated content:
    ${props.appUrl}/dashboard
  `;

  return { htmlBody, textBody };
}
```

Create `lib/email/templates/welcome.ts`:

```typescript
export function welcomeTemplate(props: {
  displayName: string;
  appUrl: string;
}) {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto;">
        <h2>Welcome to FckDoomScroll! 🎉</h2>
        <p>Hi ${props.displayName},</p>
        <p>Welcome to your new favorite daily destination. Here's what you can do:</p>
        <ul>
          <li>📚 Learn a new word every day</li>
          <li>🌍 Discover geography and culture</li>
          <li>💡 Find interesting facts</li>
          <li>📅 Connect with history</li>
        </ul>
        <a href="${props.appUrl}/dashboard" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #9333ea;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 16px;
        ">Get Started</a>
      </div>
    </body>
    </html>
  `;

  const textBody = `
    Welcome to FckDoomScroll!

    Get started here: ${props.appUrl}/dashboard
  `;

  return { htmlBody, textBody };
}
```

## Task 5: Test Email Delivery (1-2 hours)

Create `app/api/email/test/route.ts`:

```typescript
import { sendEmail } from "@/lib/email/ses";
import { NextRequest, NextResponse } from "next/server";
import { streakReminderTemplate } from "@/lib/email/templates/streak-reminder";

export async function POST(request: NextRequest) {
  try {
    const { email, displayName } = await request.json();

    const { htmlBody, textBody } = streakReminderTemplate({
      displayName,
      currentStreak: 5,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    });

    await sendEmail({
      to: email,
      subject: "Your streak is active!",
      htmlBody,
      textBody,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

Test with curl:
```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "displayName": "Test User"}'
```

## Completion Checklist

- [ ] SES configured in AWS
- [ ] Domain verified
- [ ] Credentials in `.env.local`
- [ ] SES wrapper created
- [ ] Email templates created
- [ ] Test endpoint works
- [ ] Email delivered to inbox
- [ ] HTML renders correctly
- [ ] No deployment issues

## Next Steps

1. Commit: `git add . && git commit -m "feat(phase4-sprint1): aws ses email setup"`
2. Test emails thoroughly
3. Move to Phase 4, Sprint 2: Email Automation
