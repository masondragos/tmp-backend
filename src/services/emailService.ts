import nodemailer from "nodemailer";

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send a basic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: options.from || process.env.SMTP_FROM || process.env.SMTP_USER,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  /**
   * Send email using a template
   */
  async sendTemplateEmail(
    to: string | string[],
    template: EmailTemplate,
    variables?: Record<string, string>
  ): Promise<boolean> {
    try {
      let processedSubject = template.subject;
      let processedText = template.text;
      let processedHtml = template.html;

      // Replace variables in template
      if (variables) {
        Object.keys(variables).forEach((key) => {
          const placeholder = `{{${key}}}`;
          processedSubject = processedSubject.replace(
            new RegExp(placeholder, "g"),
            variables[key]
          );
          processedText = processedText.replace(
            new RegExp(placeholder, "g"),
            variables[key]
          );
          processedHtml = processedHtml.replace(
            new RegExp(placeholder, "g"),
            variables[key]
          );
        });
      }

      return await this.sendEmail({
        to,
        subject: processedSubject,
        text: processedText,
        html: processedHtml,
      });
    } catch (error) {
      console.error("Error sending template email:", error);
      return false;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(
    userEmail: string,
    userName: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: "Welcome to Mortgage Broker!",
      text: `Hello {{name}},\n\nWelcome to Mortgage Broker! We're excited to have you on board.\n\nBest regards,\nThe Mortgage Broker Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Mortgage Broker!</h2>
          <p>Hello {{name}},</p>
          <p>Welcome to Mortgage Broker! We're excited to have you on board.</p>
          <p>Best regards,<br>The Mortgage Broker Team</p>
        </div>
      `,
    };

    return await this.sendTemplateEmail(userEmail, template, {
      name: userName,
    });
  }

  /**
   * Send quote status update email
   */
  async sendQuoteStatusUpdateEmail(
    userEmail: string,
    userName: string,
    quoteAddress: string,
    status: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: "Quote Status Update - {{address}}",
      text: `Hello {{name}},\n\nYour quote for {{address}} has been updated to: {{status}}\n\nBest regards,\nThe Mortgage Broker Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Quote Status Update</h2>
          <p>Hello {{name}},</p>
          <p>Your quote for <strong>{{address}}</strong> has been updated to: <strong>{{status}}</strong></p>
          <p>Best regards,<br>The Mortgage Broker Team</p>
        </div>
      `,
    };

    return await this.sendTemplateEmail(userEmail, template, {
      name: userName,
      address: quoteAddress,
      status: status,
    });
  }

  /**
   * Send employee invitation email
   */
  async sendEmployeeInvitationEmail(
    employeeEmail: string,
    employeeName: string,
    invitationLink: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: "Welcome to {{company}} - Employee Invitation",
      text: `Hello {{name}},\n\nYou have been invited to join {{company}} as an employee.\n\nClick here to accept: {{link}}\n\nNote: This invitation will expire in 7 days.\n\nBest regards,\nThe Mortgage Broker Team`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #F68921 0%, #ff9d42 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Employee Invitation
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                Join our team today!
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <p style="margin: 0 0 20px 0; color: #1E2939; font-size: 18px; line-height: 1.6;">
                Hello <strong>{{name}}</strong>,
              </p>
              
              <p style="margin: 0 0 25px 0; color: #4a5568; font-size: 16px; line-height: 1.7;">
                We're excited to invite you to join <strong style="color: #F68921;">{{company}}</strong> as a team member. Your expertise and skills will be a valuable addition to our organization.
              </p>
              
              <p style="margin: 0 0 35px 0; color: #4a5568; font-size: 16px; line-height: 1.7;">
                Click the button below to accept your invitation and set up your account:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 35px 0;">
                    <a href="{{link}}" style="display: inline-block; background-color: #F68921; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(246, 137, 33, 0.3); transition: all 0.3s ease;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Info Box -->
              <div style="background-color: #fff5ec; border-left: 4px solid #F68921; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <p style="margin: 0; color: #1E2939; font-size: 14px; line-height: 1.6;">
                  <strong style="color: #F68921;">⏰ Important:</strong> This invitation will expire in <strong>7 days</strong>. Please accept it before then to ensure access to your account.
                </p>
              </div>
              
              <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance, feel free to reach out to our support team.
              </p>
              
              <p style="margin: 0; color: #4a5568; font-size: 16px; line-height: 1.7;">
                Looking forward to working with you!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1E2939; padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                The Mortgage Broker Team
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 13px; line-height: 1.6;">
                © 2025 The Mortgage Broker. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };

    return await this.sendTemplateEmail(employeeEmail, template, {
      name: employeeName,
      company: "The Mortgage Broker",
      link: invitationLink,
    });
  }
  async sendLenderInvitationEmail(
    lenderEmail: string,
    lenderName: string,
    invitationLink: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: "Welcome to {{company}} - Lender Partnership Invitation",
      text: `Hello {{name}},\n\nYou have been invited to join {{company}} as a Lender.\n\nClick here to accept: {{link}}\n\nNote: This invitation will expire in 7 days.\n\nBest regards,\nThe Mortgage Broker Team`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #F68921 0%, #ff9d42 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Lender Partnership
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                You're invited to partner with us!
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <p style="margin: 0 0 20px 0; color: #1E2939; font-size: 18px; line-height: 1.6;">
                Hello <strong>{{name}}</strong>,
              </p>
              
              <p style="margin: 0 0 25px 0; color: #4a5568; font-size: 16px; line-height: 1.7;">
                We're thrilled to invite you to partner with <strong style="color: #F68921;">{{company}}</strong> as a trusted lender. Your expertise will help us provide exceptional mortgage solutions to our clients.
              </p>
              
              <p style="margin: 0 0 35px 0; color: #4a5568; font-size: 16px; line-height: 1.7;">
                Click the button below to accept your invitation and begin our partnership:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 35px 0;">
                    <a href="{{link}}" style="display: inline-block; background-color: #F68921; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(246, 137, 33, 0.3); transition: all 0.3s ease;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Info Box -->
              <div style="background-color: #fff5ec; border-left: 4px solid #F68921; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <p style="margin: 0; color: #1E2939; font-size: 14px; line-height: 1.6;">
                  <strong style="color: #F68921;">⏰ Important:</strong> This invitation will expire in <strong>7 days</strong>. Please accept it before then to ensure access to your lender portal.
                </p>
              </div>
              
              <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance, our team is here to help you get started.
              </p>
              
              <p style="margin: 0; color: #4a5568; font-size: 16px; line-height: 1.7;">
                We look forward to a successful partnership!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1E2939; padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                The Mortgage Broker Team
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 13px; line-height: 1.6;">
                © 2025 The Mortgage Broker. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };

    return await this.sendTemplateEmail(lenderEmail, template, {
      name: lenderName,
      company: "The Mortgage Broker",
      link: invitationLink,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetLink: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: "Password Reset Request",
      text: `Hello {{name}},\n\nYou requested a password reset. Click here to reset your password: {{link}}\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe Mortgage Broker Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello {{name}},</p>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <p><a href="{{link}}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The Mortgage Broker Team</p>
        </div>
      `,
    };

    return await this.sendTemplateEmail(userEmail, template, {
      name: userName,
      link: resetLink,
    });
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("Email service is ready");
      return true;
    } catch (error) {
      console.error("Email service configuration error:", error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
