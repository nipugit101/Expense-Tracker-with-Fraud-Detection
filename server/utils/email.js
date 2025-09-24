// utils->email.js 
const nodemailer = require('nodemailer');


const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // this should be your Gmail App Password
    },
  });
};

const sendVerificationEmail = async (email, token) => {
  const transporter = createTransporter();

  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - Expense Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Expense Tracker!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, token) => {
  const transporter = createTransporter();

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset - Expense Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your Expense Tracker account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendFraudAlertEmail = async (email, alert, transaction) => {
  const transporter = createTransporter();

  const severityColors = {
    low: '#ffc107',
    medium: '#fd7e14',
    high: '#dc3545'
  };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Fraud Alert: ${alert.severity.toUpperCase()} - Expense Tracker`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${severityColors[alert.severity]}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0;">🚨 Fraud Alert</h2>
          <p style="margin: 5px 0 0 0; font-size: 18px;">${alert.severity.toUpperCase()} SEVERITY</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px;">
          <h3 style="color: #333; margin-top: 0;">Alert Details</h3>
          <p><strong>Message:</strong> ${alert.message}</p>
          <p><strong>Transaction:</strong> $${transaction.amount.toFixed(2)} - ${transaction.description}</p>
          <p><strong>Category:</strong> ${transaction.category}</p>
          <p><strong>Date:</strong> ${transaction.date.toLocaleString()}</p>
          <p><strong>Alert Type:</strong> ${alert.alertType.replace('_', ' ').toUpperCase()}</p>
          
          ${alert.details ? `
            <h4 style="color: #333;">Additional Details</h4>
            ${alert.details.threshold ? `<p><strong>Threshold:</strong> $${alert.details.threshold.toFixed(2)}</p>` : ''}
            ${alert.details.actualAmount ? `<p><strong>Actual Amount:</strong> $${alert.details.actualAmount.toFixed(2)}</p>` : ''}
            ${alert.details.category ? `<p><strong>Category:</strong> ${alert.details.category}</p>` : ''}
            ${alert.details.percentage ? `<p><strong>Budget Usage:</strong> ${alert.details.percentage}%</p>` : ''}
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/fraud-alerts" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Review Alert
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If this transaction was legitimate, you can mark it as reviewed in your account.
            If you suspect unauthorized activity, please contact support immediately.
          </p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendTransactionSummaryEmail = async (email, userName, summary) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Monthly Transaction Summary - Expense Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Monthly Summary for ${userName}</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">This Month's Overview</h3>
          <p><strong>Total Income:</strong> $${summary.totalIncome.toFixed(2)}</p>
          <p><strong>Total Expenses:</strong> $${summary.totalExpenses.toFixed(2)}</p>
          <p><strong>Net Balance:</strong> $${(summary.totalIncome - summary.totalExpenses).toFixed(2)}</p>
          <p><strong>Total Transactions:</strong> ${summary.transactionCount}</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Top Spending Categories</h3>
          ${summary.topCategories.map(cat =>
      `<p><strong>${cat.category}:</strong> $${cat.amount.toFixed(2)} (${cat.count} transactions)</p>`
    ).join('')}
        </div>
        
        ${summary.alerts && summary.alerts.length > 0 ? `
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">⚠️ Fraud Alerts This Month</h3>
          <p>You had ${summary.alerts.length} fraud alert(s) this month. Please review them in your account.</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Full Dashboard
          </a>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendFraudAlertEmail,
  sendTransactionSummaryEmail
};
