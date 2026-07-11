import { db } from "./db";

// Creates a 6-digit login code for the email and sends it.
// With RESEND_API_KEY set, codes are emailed via Resend (https://resend.com).
// Without it (local dev), the code is printed to the server console and can be
// shown in the UI via SHOW_DEV_LOGIN_CODE=true.
export async function issueLoginCode(
  email: string
): Promise<{ sent: boolean; devCode: string | null }> {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.loginCode.create({
    data: {
      email: email.toLowerCase(),
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const sent = await sendCode(email, code);

  return {
    sent,
    devCode: process.env.SHOW_DEV_LOGIN_CODE === "true" ? code : null,
  };
}

async function sendCode(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n[ChaiPani] Login code for ${email}: ${code}\n`);
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "ChaiPani <onboarding@resend.dev>",
        to: [email],
        subject: `${code} is your ChaiPani sign-in code`,
        html: loginEmailHtml(code),
        text: `Your ChaiPani sign-in code is ${code}. It works for 15 minutes. If you didn't request this, you can ignore this email.`,
      }),
    });

    if (!res.ok) {
      console.error(`Resend error ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend request failed:", err);
    return false;
  }
}

// Large type and high contrast on purpose — many recipients are 70+.
function loginEmailHtml(code: string): string {
  return `
<div style="background:#faf5ec;padding:32px 16px;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#4a3426;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #f1e8d8;">
    <p style="font-size:40px;margin:0;text-align:center;">&#9749;</p>
    <h1 style="font-family:Georgia,serif;font-size:26px;text-align:center;color:#a05a2e;margin:12px 0 0;">ChaiPani</h1>
    <p style="font-size:19px;line-height:1.6;margin:24px 0 8px;">Namaste! Here is your sign-in code:</p>
    <p style="font-size:44px;font-weight:bold;letter-spacing:10px;text-align:center;background:#faf5ec;border-radius:16px;padding:20px 8px;margin:8px 0;">${code}</p>
    <p style="font-size:17px;line-height:1.6;color:#6b5544;">Type these 6 digits on the ChaiPani sign-in page. The code works for 15 minutes.</p>
    <p style="font-size:15px;line-height:1.6;color:#8a7362;margin-top:24px;">Didn't ask for a code? You can safely ignore this email — nobody can enter your account without it. ChaiPani will never call you or ask for money.</p>
  </div>
</div>`;
}

export async function verifyLoginCode(email: string, code: string): Promise<boolean> {
  const record = await db.loginCode.findFirst({
    where: {
      email: email.toLowerCase(),
      code: code.trim(),
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return false;
  // Single-use: remove all codes for this email once one is redeemed.
  await db.loginCode.deleteMany({ where: { email: email.toLowerCase() } });
  return true;
}
