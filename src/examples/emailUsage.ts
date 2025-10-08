import { emailService } from '../services/emailService';

// Example usage of the email service

async function exampleUsage() {
  // Test email configuration
  const isReady = await emailService.testConnection();
  console.log('Email service ready:', isReady);

  // Send a basic email
  const basicEmailSent = await emailService.sendEmail({
    to: 'user@example.com',
    subject: 'Test Email',
    text: 'This is a test email',
    html: '<h1>This is a test email</h1>'
  });
  console.log('Basic email sent:', basicEmailSent);

  // Send welcome email
  const welcomeEmailSent = await emailService.sendWelcomeEmail(
    'newuser@example.com',
    'John Doe'
  );
  console.log('Welcome email sent:', welcomeEmailSent);

  // Send quote status update
  const statusUpdateSent = await emailService.sendQuoteStatusUpdateEmail(
    'user@example.com',
    'John Doe',
    '123 Main St, City, State',
    'approved'
  );
  console.log('Status update email sent:', statusUpdateSent);

  // Send employee invitation
  const invitationSent = await emailService.sendEmployeeInvitationEmail(
    'employee@example.com',
    'Jane Smith',
    'ABC Company',
    'https://yourapp.com/invite?token=abc123'
  );
  console.log('Invitation email sent:', invitationSent);

  // Send password reset
  const resetEmailSent = await emailService.sendPasswordResetEmail(
    'user@example.com',
    'John Doe',
    'https://yourapp.com/reset?token=xyz789'
  );
  console.log('Password reset email sent:', resetEmailSent);

  // Send custom template email
  const customTemplateSent = await emailService.sendTemplateEmail(
    'user@example.com',
    {
      subject: 'Custom Email - {{name}}',
      text: 'Hello {{name}}, this is a custom email for {{company}}.',
      html: '<h1>Hello {{name}}</h1><p>This is a custom email for <strong>{{company}}</strong>.</p>'
    },
    {
      name: 'John Doe',
      company: 'ABC Company'
    }
  );
  console.log('Custom template email sent:', customTemplateSent);
}

// Uncomment to run the example
// exampleUsage().catch(console.error);

export { exampleUsage };
