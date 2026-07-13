import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let companion = { callMe: "", chatLanguage: "English", style: "cheerful", hometown: "", aboutFamily: "" };
  try {
    companion = { ...companion, ...(user.companionProfile ? JSON.parse(user.companionProfile) : {}) };
  } catch {}

  return (
    <ProfileForm
      initial={{
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        city: user.city || "",
        area: user.area || "",
        ageRange: user.ageRange || "",
        origin: user.origin || "",
        languages: user.languages ? user.languages.split(",").map((s) => s.trim()) : [],
        faith: user.faith || "",
        interests: user.interests ? user.interests.split(",").map((s) => s.trim()) : [],
        bio: user.bio || "",
        helperName: user.helperName || "",
        helperEmail: user.helperEmail || "",
        helperPhone: user.helperPhone || "",
        ...companion,
      }}
      status={user.status}
    />
  );
}
