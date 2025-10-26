export function otpEmailTemplate(code: string) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Your OTP Code</title>
  </head>
  <body style="background:#f9f9f9;font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;">
    <table role="presentation" width="100%" style="max-width:500px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="padding:30px;text-align:center;">
          <h1 style="font-size:22px;color:#333;margin-bottom:10px;">🔒 Verify Your Login</h1>
          <p style="font-size:15px;color:#555;margin-bottom:30px;">Use the code below to complete your sign-in:</p>
          <div style="display:inline-block;background:#f1f1f1;border-radius:6px;padding:15px 25px;margin-bottom:30px;">
            <span style="font-size:24px;letter-spacing:4px;color:#111;font-weight:bold;">${code}</span>
          </div>
          <p style="font-size:13px;color:#999;">This code expires in 10 minutes. If you didn’t request it, you can ignore this email.</p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}
