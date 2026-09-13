import { z } from "zod";
export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254);
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use no more than 128 characters.");
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(128),
});
export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(1, "Enter your full name.").max(120),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    language: z.enum(["en", "fa"]).default("en"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export const resetSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export const tokenHashSchema = z.string().regex(/^[A-Za-z0-9_-]{32,256}$/);
export type AuthFormState = {
  error?: string;
  success?: string;
  fields?: Record<string, string>;
};
export function validationState(error: z.ZodError): AuthFormState {
  return {
    error: "Please check the highlighted fields.",
    fields: Object.fromEntries(
      error.issues.map((issue) => [
        String(issue.path[0]),
        issue.code === "invalid_type" || issue.message.startsWith("Too ")
          ? "Please check this field."
          : issue.message,
      ]),
    ),
  };
}
