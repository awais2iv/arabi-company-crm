/**
 * OTP Verification Success Email Template - Minimal Design
 * Sent after successful email verification
 */
const OTPSuccessEmail = (userName, otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verified - Arabi Company</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #ffffff;
          margin: 0;
          padding: 20px;
          color: #000000;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          background-color: #ffffff;
          border: 1px solid #e0e0e0;
        }
        .header {
          background-color: #ffffff;
          color: #0066cc;
          padding: 20px;
          text-align: center;
          border-bottom: 1px solid #e0e0e0;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        .success-icon {
          font-size: 48px;
          margin: 10px 0;
          color: #0066cc;
        }
        .content {
          padding: 30px 20px;
          color: #000000;
          text-align: center;
          line-height: 1.5;
        }
        .success-box {
          background-color: #f8f8f8;
          border: 2px solid #0066cc;
          border-radius: 4px;
          padding: 20px;
          margin: 20px 0;
        }
        .success-box h3 {
          color: #0066cc;
          margin: 0 0 10px 0;
          font-size: 18px;
          font-weight: bold;
        }
        .success-box p {
          color: #000000;
          margin: 0;
          font-size: 14px;
        }
        .footer {
          background-color: #f8f8f8;
          padding: 15px 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          border-top: 1px solid #e0e0e0;
        }
        @media only screen and (max-width: 600px) {
          body {
            padding: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✓</div>
          <h1>Email Verified</h1>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          <p>Your email has been successfully verified.</p>

          <div class="success-box">
            <h3>Account Activated</h3>
            <p>You can now access all features of the Arabi Company platform.</p>
          </div>

          <p>You can now log in to your account.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Arabi Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default OTPSuccessEmail;
