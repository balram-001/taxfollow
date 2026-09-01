import nodemailer from 'nodemailer';

export const sendOtpEmail = async (email: string, otp: string) => {
  // Test/Development ke liye console me bhi print karega:
  console.log(`\n============================\n🔐 OTP for ${email}: ${otp}\n============================\n`);

  // Production/Gmail SMTP transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    await transporter.sendMail({
      from: `"TaxFollow Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your TaxFollow Verification Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Verify your TaxFollow Account</h2>
          <p>Use the following 6-digit code to complete your registration:</p>
          <h1 style="color: #10b981; font-size: 32px; letter-spacing: 4px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });
  }
};