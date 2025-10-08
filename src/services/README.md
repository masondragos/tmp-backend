# Email Service

A reusable email module using nodemailer for sending various types of emails.

## Setup

1. Install dependencies:
```bash
pnpm add nodemailer @types/nodemailer
```

2. Add environment variables to your `.env` file:
```env
# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password_here"
SMTP_FROM="your_email@gmail.com"

# Frontend URL (for email links)
FRONTEND_URL="http://localhost:3000"
```

## Usage

### Basic Email
```typescript
import { emailService } from '../services/emailService';

await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Test Email',
  text: 'This is a test email',
  html: '<h1>This is a test email</h1>'
});
```

### Template Email
```typescript
await emailService.sendTemplateEmail(
  'user@example.com',
  {
    subject: 'Hello {{name}}',
    text: 'Hello {{name}}, welcome to {{company}}!',
    html: '<h1>Hello {{name}}</h1><p>Welcome to <strong>{{company}}</strong>!</p>'
  },
  {
    name: 'John Doe',
    company: 'ABC Company'
  }
);
```

### Pre-built Templates

#### Welcome Email
```typescript
await emailService.sendWelcomeEmail('user@example.com', 'John Doe');
```

#### Quote Status Update
```typescript
await emailService.sendQuoteStatusUpdateEmail(
  'user@example.com',
  'John Doe',
  '123 Main St, City, State',
  'approved'
);
```

#### Employee Invitation
```typescript
await emailService.sendEmployeeInvitationEmail(
  'employee@example.com',
  'Jane Smith',
  'ABC Company',
  'https://yourapp.com/invite?token=abc123'
);
```

#### Password Reset
```typescript
await emailService.sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  'https://yourapp.com/reset?token=xyz789'
);
```

## Gmail Setup

For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password as `SMTP_PASS`

## Testing

Test your email configuration:
```typescript
const isReady = await emailService.testConnection();
console.log('Email service ready:', isReady);
```

## Error Handling

All email methods return a boolean indicating success/failure:
```typescript
const emailSent = await emailService.sendEmail(options);
if (!emailSent) {
  console.error('Failed to send email');
}
```
