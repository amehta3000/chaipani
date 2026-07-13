// Outbound email via Resend, shared by login codes and notifications.
// Without RESEND_API_KEY (local dev), emails are logged to the console.

const APP_URL = process.env.APP_URL || "https://www.chaipanisocial.com";

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipients = Array.isArray(to) ? to : [to];

  if (!apiKey) {
    console.log(`\n[ChaiPani email → ${recipients.join(", ")}] ${subject}\n${text}\n`);
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
        to: recipients,
        subject,
        html,
        text,
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

// Shared warm wrapper — large type and high contrast for older readers.
export function emailShell(inner: string): string {
  return `
<div style="background:#faf5ec;padding:32px 16px;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#4a3426;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #f1e8d8;">
    <p style="font-size:40px;margin:0;text-align:center;">&#9749;</p>
    <h1 style="font-family:Georgia,serif;font-size:26px;text-align:center;color:#a05a2e;margin:12px 0 0;">ChaiPani</h1>
    ${inner}
  </div>
</div>`;
}

function bigButton(href: string, label: string): string {
  return `<p style="text-align:center;margin:28px 0 8px;"><a href="${href}" style="display:inline-block;background:#c2703d;color:#ffffff;text-decoration:none;font-size:20px;font-weight:bold;padding:16px 32px;border-radius:16px;">${label}</a></p>`;
}

// A member received a message. Sent only for the first unread message from
// that sender, so a back-and-forth doesn't flood the inbox.
export async function notifyNewMessage(opts: {
  toEmail: string;
  toFirstName: string;
  senderName: string;
  senderId: string;
}) {
  const link = `${APP_URL}/messages/${opts.senderId}`;
  await sendEmail(
    opts.toEmail,
    `${opts.senderName} sent you a message on ChaiPani ☕`,
    emailShell(`
      <p style="font-size:19px;line-height:1.6;margin:24px 0 8px;">Namaste ${opts.toFirstName}!</p>
      <p style="font-size:19px;line-height:1.6;"><strong>${opts.senderName}</strong> has written to you on ChaiPani. They're waiting to hear back!</p>
      ${bigButton(link, "Read the message")}
      <p style="font-size:15px;line-height:1.6;color:#8a7362;margin-top:24px;">You'll be asked for a 6-digit code sent to this email — that's how you sign in, no password needed.</p>
    `),
    `Namaste ${opts.toFirstName}! ${opts.senderName} sent you a message on ChaiPani. Read it here: ${link}`
  );
}

// Admins hear about every new signup so nobody waits long in the queue.
export async function notifyAdminsNewMember(member: {
  name: string;
  email: string;
  area?: string | null;
  origin?: string | null;
  setUpByFamily: boolean;
  helperName?: string | null;
}) {
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (admins.length === 0) return;

  const details = [
    member.email,
    member.area,
    member.origin && `from ${member.origin}`,
    member.setUpByFamily && `set up by family (${member.helperName || "unnamed"})`,
  ]
    .filter(Boolean)
    .join(" · ");
  const link = `${APP_URL}/admin`;
  await sendEmail(
    admins,
    `New ChaiPani member waiting for approval: ${member.name}`,
    emailShell(`
      <p style="font-size:19px;line-height:1.6;margin:24px 0 8px;"><strong>${member.name}</strong> just joined and is waiting for review.</p>
      <p style="font-size:16px;line-height:1.6;color:#6b5544;">${details}</p>
      ${bigButton(link, "Review in the admin dashboard")}
    `),
    `${member.name} just joined ChaiPani and is waiting for approval (${details}). Review: ${link}`
  );
}

// A member was approved — welcome them in (and their family helper, if any).
export async function notifyApproved(member: {
  name: string;
  email: string;
  helperEmail?: string | null;
}) {
  const first = member.name.split(" ")[0];
  const to = [member.email];
  if (member.helperEmail && member.helperEmail.toLowerCase() !== member.email.toLowerCase()) {
    to.push(member.helperEmail);
  }
  const link = `${APP_URL}/login`;
  await sendEmail(
    to,
    `Welcome to ChaiPani, ${first}! You're in ☕`,
    emailShell(`
      <p style="font-size:19px;line-height:1.6;margin:24px 0 8px;">Namaste ${first}!</p>
      <p style="font-size:19px;line-height:1.6;">Your ChaiPani membership has been approved. You can now meet the other members, send messages, and of course — chat with your Chai Companion any time.</p>
      ${bigButton(link, "Come in for chai")}
      <p style="font-size:15px;line-height:1.6;color:#8a7362;margin-top:24px;">Sign in with this email address — we'll send you a simple 6-digit code, no password needed.</p>
    `),
    `Namaste ${first}! Your ChaiPani membership has been approved. Sign in at ${link} — we'll send a 6-digit code to this email, no password needed.`
  );
}
