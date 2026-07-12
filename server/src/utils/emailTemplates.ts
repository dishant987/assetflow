const brandPurple = "#7C3AED";
const brandGrey = "#6B7280";
const brandBg = "#F8F5FF";
const brandSurface = "#FFFFFF";
const brandPrimary = "#714B67";

export function otpEmail(otp: string, expiryMinutes: number): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AssetFlow Password Reset</title>
  </head>
  <body style="margin:0;padding:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:${brandBg};color:${brandGrey};">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:${brandSurface};border-radius:24px;overflow:hidden;max-width:600px;">
            <tr>
              <td style="background:${brandPrimary};padding:36px 28px;text-align:center;">
                <h1 style="margin:0;font-size:30px;font-weight:800;color:#fff;letter-spacing:-0.04em;">AssetFlow</h1>
                <p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">Password reset verification</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                <p style="margin:0 0 20px;font-size:16px;color:#111827;">Hello,</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:${brandGrey};">
                  We received a request to reset your AssetFlow password. Use the code below within <strong>${expiryMinutes} minutes</strong> to continue.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F4F1FB;border-radius:18px;margin-bottom:28px;">
                  <tr>
                    <td align="center" style="padding:24px 0;">
                      <span style="display:inline-block;font-size:32px;letter-spacing:16px;font-weight:800;color:${brandPurple};">${otp}</span>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#111827;">Why am I getting this?</p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.75;color:${brandGrey};">
                  This code was generated because someone requested a password reset for your account. If this wasn’t you, no further action is required.
                </p>
                <div style="padding:20px 18px;background:#F9F5FF;border:1px solid rgba(113,75,103,0.12);border-radius:16px;">
                  <p style="margin:0;font-size:14px;color:${brandGrey};line-height:1.75;">
                    Need assistance? Reach out to your administrator or support team for help securing your account.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:#F9FAFB;padding:20px 28px 28px;border-top:1px solid #E5E7EB;">
                <p style="margin:0;font-size:13px;color:${brandGrey};line-height:1.6;">
                  © ${new Date().getFullYear()} AssetFlow. Manage your organization’s assets securely.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
