import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import CompanionChat from "./CompanionChat";

export default async function CompanionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let callMe = user.name.split(" ")[0];
  let chatLanguage = "English";
  try {
    const profile = user.companionProfile ? JSON.parse(user.companionProfile) : {};
    if (profile.callMe?.trim()) callMe = profile.callMe.trim();
    if (profile.chatLanguage) chatLanguage = profile.chatLanguage;
  } catch {}

  return <CompanionChat callMe={callMe} chatLanguage={chatLanguage} />;
}
