import { db } from "./db";
import { sendEmail, emailShell } from "./notify";

const MAX_VERIFY_ATTEMPTS = 5;
export const MAX_CODES_PER_HOUR = 5;

// Creates a 6-digit login code for the email and sends it.
// With RESEND_API_KEY set, codes are emailed via Resend (https://resend.com).
// Without it (local dev), the code is printed to the server console and can be
// shown in the UI via SHOW_DEV_LOGIN_CODE=true.
export async function issueLoginCode(
  email: string
): Promise<{ sent: boolean; devCode: string | null; throttled?: boolean }> {
  const recentCount = await db.loginCode.count({
    where: {
      email: email.toLowerCase(),
      createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentCount >= MAX_CODES_PER_HOUR) {
    return { sent: false, devCode: null, throttled: true };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.loginCode.create({
    data: {
      email: email.toLowerCase(),
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const sent = await sendEmail(
    email,
    `${code} is your ChaiPani sign-in code`,
    loginEmailHtml(code),
    `Your ChaiPani sign-in code is ${code}. It works for 15 minutes. If you didn't request this, you can ignore this email.`
  );

  return {
    sent,
    devCode: process.env.SHOW_DEV_LOGIN_CODE === "true" ? code : null,
  };
}

// Large type and high contrast on purpose — many recipients are 70+.
function loginEmailHtml(code: string): string {
  return emailShell(`
    <p style="font-size:19px;line-height:1.6;margin:24px 0 8px;">Namaste! Here is your sign-in code:</p>
    <p style="font-size:44px;font-weight:bold;letter-spacing:10px;text-align:center;background:#faf5ec;border-radius:16px;padding:20px 8px;margin:8px 0;">${code}</p>
    <p style="font-size:17px;line-height:1.6;color:#6b5544;">Type these 6 digits on the ChaiPani sign-in page. The code works for 15 minutes.</p>
    <p style="font-size:15px;line-height:1.6;color:#8a7362;margin-top:24px;">Didn't ask for a code? You can safely ignore this email — nobody can enter your account without it. ChaiPani will never call you or ask for money.</p>
  `);
}

export async function verifyLoginCode(email: string, code: string): Promise<boolean> {
  const normalized = email.toLowerCase();

  const match = await db.loginCode.findFirst({
    where: {
      email: normalized,
      code: code.trim(),
      expiresAt: { gt: new Date() },
      attempts: { lt: MAX_VERIFY_ATTEMPTS },
    },
    orderBy: { createdAt: "desc" },
  });

  if (match) {
    // Single-use: remove all codes for this email once one is redeemed.
    await db.loginCode.deleteMany({ where: { email: normalized } });
    return true;
  }

  // Wrong code: count the attempt against every active code for this email.
  // After MAX_VERIFY_ATTEMPTS misses, the codes stop matching entirely and a
  // fresh code must be requested — blocks brute-forcing the 6 digits.
  await db.loginCode.updateMany({
    where: { email: normalized, expiresAt: { gt: new Date() } },
    data: { attempts: { increment: 1 } },
  });
  return false;
}
