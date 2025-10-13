/**
 * Email notification service
 * Integrates with Supabase Edge Functions to send emails
 */

import { supabase } from '@/integrations/supabase/client';

export interface EmailTemplate {
  to: string;
  subject: string;
  template: 'welcome' | 'password-reset' | 'notification' | 'invitation';
  context: Record<string, any>;
}

export class EmailService {
  /**
   * Send an email using Supabase Edge Function
   */
  static async sendEmail(emailData: EmailTemplate): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData,
      });

      if (error) {
        console.error('Email sending failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(
    email: string,
    fullName: string,
    password: string,
    admissionNumber: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Bunifu - Your Account Credentials',
      template: 'welcome',
      context: {
        fullName,
        password,
        loginUrl: `${window.location.origin}/login`,
        admissionNumber,
      },
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    resetLink: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Password Reset for Bunifu',
      template: 'password-reset',
      context: {
        resetLink,
      },
    });
  }

  /**
   * Send notification email
   */
  static async sendNotificationEmail(
    email: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject,
      template: 'notification',
      context: {
        message,
      },
    });
  }

  /**
   * Send invitation email
   */
  static async sendInvitationEmail(
    email: string,
    inviterName: string,
    invitationType: string,
    invitationLink: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `${inviterName} invited you to ${invitationType}`,
      template: 'invitation',
      context: {
        inviterName,
        invitationType,
        invitationLink,
      },
    });
  }
}
