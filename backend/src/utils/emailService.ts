import { sendTransactionalEmail } from './sendEmail';

// 1. Password Reset / OTP Email
export const sendOtpEmail = async (toEmail: string, otp: string) => {
  if (!toEmail) return;

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #059669;">TaxFollow Password Reset</h2>
        <p style="color: #475569; font-size: 14px;">Aapka password reset OTP code neeche diya gaya hai:</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px;">Yeh code 10 minute ke liye valid hai. Kisi ke sath share na karein.</p>
      </div>
    `;

  try {
    await sendTransactionalEmail(toEmail, 'Your Password Reset OTP - TaxFollow', html, 'TaxFollow Security');
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    throw err;
  }
};

// 2. Client Creation Alert Mail
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

  const html = `
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
    `;

  try {
    await sendTransactionalEmail(toEmail, `Document Request & Tax Filing Tracker - ${panNumber}`, html, 'TaxFollow CA Portal');
    console.log(`Welcome email sent to ${toEmail}`);
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
};

// 3. Final ITR-V Deliverable Notification Mail
export const sendFinalAckEmail = async (
  toEmail: string,
  clientName: string,
  panNumber: string,
  trackingUrl: string,
  serviceType?: string,
  downloadUrl?: string,
  fileName?: string,
  attachmentContent?: string
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

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #059669; margin-bottom: 8px;">${title}</h2>
        <p style="color: #475569; font-size: 14px;">
          Namaste ${clientName}, aapka work successfully complete kar diya gaya hai.
        </p>

        <p style="color: #475569; font-size: 14px;">
          Aapki official <strong>${docName}</strong> is email ke saath attach ki gayi hai. Aap ise neeche diye button se bhi direct download kar sakte hain:
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${downloadUrl || trackingUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Download ${docName}
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px;">Aapka client portal dekhne ke liye: <a href="${trackingUrl}" style="color: #059669;">Open TaxFollow Portal</a></p>

        <p style="color: #64748b; font-size: 12px;">
          PAN: <strong>${panNumber}</strong>
        </p>
      </div>
    `;

  try {
    await sendTransactionalEmail(
      toEmail,
      `${title} (${panNumber})`,
      html,
      'TaxFollow CA Portal',
      fileName && attachmentContent ? { name: fileName, content: attachmentContent } : undefined
    );
    console.log(`Final Ack email sent to ${toEmail}`);
  } catch (err) {
    console.error('Failed to send final ack email:', err);
    throw err;
  }
};
