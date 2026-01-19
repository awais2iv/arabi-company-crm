/**
 * OTP Verification Email Template - Minimal Design
 * Used during user registration
 */
const OtpVerificationEmail = (userName, otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Arabi Company</title>
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
        .content {
          padding: 30px 20px;
          color: #000000;
          line-height: 1.5;
        }
        .otp-box {
          background-color: #f8f8f8;
          border: 2px solid #0066cc;
          border-radius: 4px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #0066cc;
          letter-spacing: 4px;
          font-family: monospace;
        }
        .otp-label {
          font-size: 14px;
          color: #666666;
          margin-top: 10px;
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
          .otp-code {
            font-size: 28px;
            letter-spacing: 2px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Arabi Company</h1>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          <p>Please verify your email address using the code below:</p>

          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-label">Valid for 5 minutes</div>
          </div>

          <p>Enter this code to complete your registration.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Arabi Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default OtpVerificationEmail;
