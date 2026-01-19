import nodemailer from 'nodemailer';
import logger from './logger.util.js';

/**
 * Email utility for sending emails via SMTP - FlexiPay pattern
 */

// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Additional Gmail-specific settings for better reliability
    secure: true,
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * Send an email with HTML content
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content of the email
 * @returns {Promise} - Mail info
 */
export const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"Avaya" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`Failed to send email to ${to}:`, error);
        throw error;
    }
};
