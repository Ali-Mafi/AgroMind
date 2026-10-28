import { translator } from "@/features/settings/lib/translation";
import { renderPremiumEmail } from "@/lib/email/layout";
import type { TeamRole } from "../types";

export function renderFarmInvitationEmail({
  href,
  farmName,
  role,
  language,
}: {
  href: string;
  farmName: string;
  role: TeamRole;
  language: "en" | "fa";
}) {
  const t = translator(language);
  const roleLabel = t(role === "manager" ? "Manager" : role === "worker" ? "Worker" : "Viewer");
  return renderPremiumEmail({
    language,
    subject: t("You're invited to collaborate in AgroMind"),
    eyebrow: language === "fa" ? "دعوت به همکاری" : "COLLABORATION INVITATION",
    title: t("A farm has been shared with you"),
    paragraphs: [t("You've been invited to help manage {farm} with the {role} role.", { farm: farmName, role: roleLabel })],
    action: { label: t("Review invitation"), href },
    information: {
      title: language === "fa" ? "اطلاعات دعوت‌نامه" : "Invitation information",
      paragraphs: [
        t("This invitation expires in 7 days and can only be accepted by the email address that received it."),
        t("If you were not expecting this invitation, you can safely ignore this email."),
      ],
    },
  });
}
