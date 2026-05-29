import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

const baseStyle = `
  font-family: 'Segoe UI', Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #f8fafc;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
`;

const headerStyle = `
  background: linear-gradient(135deg, #1A3C8C 0%, #2563eb 100%);
  padding: 32px 24px;
  text-align: center;
`;

const bodyStyle = `
  padding: 32px 24px;
  background: #ffffff;
`;

const footerStyle = `
  padding: 16px 24px;
  background: #f8fafc;
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
`;

function otpBoxHtml(otp: string) {
  return `
    <div style="text-align:center; margin: 24px 0;">
      <div style="display:inline-block; background: #f1f5f9; border: 2px dashed #3b82f6; border-radius: 12px; padding: 16px 40px;">
        <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #1A3C8C; font-family: monospace;">${otp}</span>
      </div>
    </div>
  `;
}

/** Send OTP email for logged-in password change */
export async function sendOtpEmail(to: string, otp: string) {
  const html = `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color:white; margin:0; font-size:24px; font-weight:700;">🔐 Password Change OTP</h1>
        <p style="color:rgba(255,255,255,0.8); margin:8px 0 0; font-size:14px;">Astronix Realty Builder Portal</p>
      </div>
      <div style="${bodyStyle}">
        <p style="color:#334155; font-size:16px; margin:0 0 8px;">Hello,</p>
        <p style="color:#64748b; font-size:14px; margin:0 0 24px;">
          Use the following OTP to verify your identity and change your password. This code expires in <strong>10 minutes</strong>.
        </p>
        ${otpBoxHtml(otp)}
        <p style="color:#94a3b8; font-size:13px; text-align:center;">
          ⚠️ Do not share this OTP with anyone. Astronix Realty will never ask for this.
        </p>
      </div>
      <div style="${footerStyle}">
        © ${new Date().getFullYear()} Astronix Realty — Secured Platform
      </div>
    </div>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Password Change OTP — Astronix Realty",
    html,
  });
}

/** Send OTP email for forgot password (unauthenticated) */
export async function sendForgotPasswordEmail(to: string, otp: string) {
  const html = `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color:white; margin:0; font-size:24px; font-weight:700;">🔑 Reset Your Password</h1>
        <p style="color:rgba(255,255,255,0.8); margin:8px 0 0; font-size:14px;">Astronix Realty Builder Portal</p>
      </div>
      <div style="${bodyStyle}">
        <p style="color:#334155; font-size:16px; margin:0 0 8px;">Hello,</p>
        <p style="color:#64748b; font-size:14px; margin:0 0 24px;">
          We received a request to reset your password. Use the OTP below. It is valid for <strong>15 minutes</strong>.
          If you did not request this, please ignore this email.
        </p>
        ${otpBoxHtml(otp)}
        <p style="color:#94a3b8; font-size:13px; text-align:center;">
          ⚠️ Do not share this OTP with anyone. Astronix Realty will never ask for this.
        </p>
      </div>
      <div style="${footerStyle}">
        © ${new Date().getFullYear()} Astronix Realty — Secured Platform
      </div>
    </div>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Password Reset OTP — Astronix Realty",
    html,
  });
}

/** Confirmation email after password change */
export async function sendPasswordChangedEmail(to: string) {
  const html = `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="color:white; margin:0; font-size:24px; font-weight:700;">✅ Password Changed Successfully</h1>
        <p style="color:rgba(255,255,255,0.8); margin:8px 0 0; font-size:14px;">Astronix Realty Builder Portal</p>
      </div>
      <div style="${bodyStyle}">
        <p style="color:#334155; font-size:16px; margin:0 0 8px;">Hello,</p>
        <p style="color:#64748b; font-size:14px; margin:0 0 16px;">
          Your Astronix Realty account password was successfully changed on 
          <strong>${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</strong> (IST).
        </p>
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:16px; margin:16px 0;">
          <p style="color:#166534; margin:0; font-size:14px;">
            🛡️ If you did not make this change, please contact us immediately or reset your password again.
          </p>
        </div>
      </div>
      <div style="${footerStyle}">
        © ${new Date().getFullYear()} Astronix Realty — Secured Platform
      </div>
    </div>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Password Changed — Astronix Realty",
    html,
  });
}
