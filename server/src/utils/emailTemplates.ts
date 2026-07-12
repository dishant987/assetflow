const brandPurple = "#7C3AED";

export function otpEmail(otp: string, expiryMinutes: number): string {
  return `
<!DOCTYPE html>
<html><body style="font-family:sans-serif;margin:0;padding:0;background:#f5f5f5">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 0">
<table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden">
<tr><td style="padding:32px;background:${brandPurple};text-align:center">
<h1 style="color:#fff;margin:0;font-size:24px">AssetFlow</h1>
</td></tr>
<tr><td style="padding:32px">
<h2 style="margin:0 0 16px;font-size:18px;color:#333">Password Reset Code</h2>
<p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.5">
Use the code below to reset your password. It expires in <strong>${expiryMinutes} minutes</strong>.
</p>
<div style="background:#f0f0f0;border-radius:6px;padding:20px;text-align:center;font-size:32px;letter-spacing:12px;font-weight:700;color:${brandPurple}">
${otp}
</div>
<p style="margin:24px 0 0;color:#999;font-size:12px;line-height:1.4">
If you didn't request a password reset, you can safely ignore this email.
</p>
</td></tr></table>
</td></tr></table>
</body></html>`;
}
