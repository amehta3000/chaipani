import { db } from "./db";

// Creates a 6-digit login code for the email and "sends" it.
// In production, wire sendCode() to an email provider (Resend, Postmark, SES).
// In development the code is printed to the console and optionally returned
// to the UI (SHOW_DEV_LOGIN_CODE=true).
export async function issueLoginCode(email: string): Promise<string | null> {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.loginCode.create({
    data: {
      email: email.toLowerCase(),
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  await sendCode(email, code);

  return process.env.SHOW_DEV_LOGIN_CODE === "true" ? code : null;
}

async function sendCode(email: string, code: string) {
  // TODO: replace with a real email provider.
  console.log(`\n[ChaiPani] Login code for ${email}: ${code}\n`);
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
