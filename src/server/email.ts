import nodemailer from "nodemailer";
import { env } from "~/env";

export async function sendVerificationRequest({
  identifier: email,
  url,
}: {
  identifier: string;
  url: string;
}) {
  const transporter = nodemailer.createTransport({
    host: env.EMAIL_SERVER_HOST,
    port: parseInt(env.EMAIL_SERVER_PORT),
    secure: parseInt(env.EMAIL_SERVER_PORT) === 465,
  });

  const { host } = new URL(url);

  const result = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: `Sign in to ${host}`,
    text: text({ url, host }),
    html: html({ url, host, email }),
  });

  const failed = result.rejected.filter(Boolean);
  if (failed.length) {
    throw new Error(
      `Email(s) (${failed.map(String).join(", ")}) could not be sent`,
    );
  }
}

function html({
  url,
  host,
  email,
}: {
  url: string;
  host: string;
  email: string;
}) {
  const escapedEmail = `${email.replace(/\./g, "&#8203;.")}`;
  const escapedHost = `${host.replace(/\./g, "&#8203;.")}`;
  const brandColor = "#346df1";
  const buttonColor = "#346df1";
  const color = {
    background: "#f9f9f9",
    text: "#444",
    mainBackground: "#fff",
    buttonBackground: buttonColor,
    buttonBorder: buttonColor,
    buttonText: "#fff",
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sign in to ${escapedHost}</title>
  <style>
    body {
      font-family: 'Sk-Modernist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: ${color.background};
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${color.mainBackground};
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, ${brandColor} 0%, #4f80ff 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: white;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      font-family: 'Sk-Modernist Bold', sans-serif;
    }
    .content {
      padding: 40px 20px;
      text-align: center;
    }
    .content p {
      color: ${color.text};
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .button {
      display: inline-block;
      background-color: ${color.buttonBackground};
      color: ${color.buttonText} !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 6px;
      font-weight: 700;
      font-family: 'Sk-Modernist Bold', sans-serif;
      border: 2px solid ${color.buttonBorder};
      margin: 20px 0;
      font-size: 16px;
      transition: all 0.3s ease;
    }
    .button:hover {
      background-color: #2952cc;
      border-color: #2952cc;
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #eee;
    }
    .email-display {
      background-color: #f5f5f5;
      padding: 12px 16px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
      color: ${color.text};
      margin: 20px 0;
      border: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome back!</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You requested to sign in to <strong>${escapedHost}</strong> using this email address:</p>
      <div class="email-display">${escapedEmail}</div>
      <p>Click the button below to complete your sign-in:</p>
      <a href="${url}" class="button">Sign in to ${escapedHost}</a>
      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        If you didn't request this email, you can safely ignore it.
        This link will expire in 24 hours.
      </p>
    </div>
    <div class="footer">
      <p>This email was sent to ${escapedEmail}</p>
    </div>
  </div>
</body>
</html>
`;
}

function text({ url, host }: { url: string; host: string }) {
  return `Sign in to ${host}\n\n${url}\n\nIf you didn't request this email, you can safely ignore it.\nThis link will expire in 24 hours.`;
}
