import { SUPPORT_CATEGORIES } from "../constants/help";
export type SupportDraft = {
  subject: string;
  category: string;
  description: string;
};
export function validateSupportDraft(
  draft: SupportDraft,
): Partial<Record<keyof SupportDraft, string>> {
  const errors: Partial<Record<keyof SupportDraft, string>> = {};
  if (draft.subject.trim().length < 3)
    errors.subject = "Enter a subject with at least 3 characters.";
  if (draft.subject.length > 120)
    errors.subject = "Keep the subject under 120 characters.";
  if (!SUPPORT_CATEGORIES.some((category) => category === draft.category))
    errors.category = "Choose a support category.";
  if (draft.description.trim().length < 20)
    errors.description = "Describe the issue in at least 20 characters.";
  if (draft.description.length > 4000)
    errors.description = "Keep the description under 4,000 characters.";
  return errors;
}
