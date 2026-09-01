import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 1. Client Creation Alert Mail
export const sendClientWelcomeEmail = async (
  toEmail: string,
  clientName: string,
  panNumber: string,
  trackingUrl: string,
  requiredServices: string[]
) => {
  if (!toEmail) return;

  const docsListHtml = requiredServices.length > 0
    ? `<ul>${requiredServices.map((s) => `<li><strong>${s}</strong></li>`).join('')}</ul>`
    : '<p>Standard verification documents required.</p>';

  const mailOptions = {
    from: `"TaxFollow CA Portal" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Document Request & Tax Filing Tracker - ${panNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #059669; margin-bottom: 8px;">Namaste ${clientName},</h2>
        <p style="color: #475569; font-size: 14px;">
          Aapke tax compliance aur filing ke liye portal ready hai. Kripya neeche diye gaye link par click karke maange gaye documents upload karein:
        </p>

        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0; font-size: 13px; color: #334155;"><strong>PAN Number:</strong> ${panNumber}</p>
          <p style="margin: 8px 0 4px 0; font-size: 13px; color: #334155;"><strong>Required Documents:</strong></p>
          ${docsListHtml}
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${trackingUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Upload Documents & Track Status
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
          Agar link click na ho toh ise browser me copy-paste karein:<br/>
          <a href="${trackingUrl}" style="color: #059669;">${trackingUrl}</a>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${toEmail}`);
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
};

// 2. Final ITR-V Deliverable Notification Mail
export const sendFinalAckEmail = async (
  toEmail: string,
  clientName: string,
  panNumber: string,
  trackingUrl: string,
  serviceType?: string
) => {
  if (!toEmail) return;

  const isGST = serviceType?.includes('GST');
  const isTDS = serviceType?.includes('TDS');

  const title = isGST 
    ? 'GST Return Filed Successfully!' 
    : isTDS 
    ? 'TDS Compliance Completed!' 
    : 'Tax Return Filed Successfully!';

  const docName = isGST 
    ? 'GSTR Filing Acknowledgement' 
    : isTDS 
    ? 'TDS Filing Receipt' 
    : 'ITR-V Acknowledgement Receipt';

  const mailOptions = {
    from: `"TaxFollow CA Portal" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${title} (${panNumber})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #059669; margin-bottom: 8px;">${title}</h2>
        <p style="color: #475569; font-size: 14px;">
          Namaste ${clientName}, aapka work successfully complete kar diya gaya hai.
        </p>

        <p style="color: #475569; font-size: 14px;">
          Aapki official <strong>${docName}</strong> portal par download ke liye uplabdh hai:
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${trackingUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Download ${docName}
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px;">
          PAN: <strong>${panNumber}</strong>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Final Ack email sent to ${toEmail}`);
  } catch (err) {
    console.error('Failed to send final ack email:', err);
  }
};