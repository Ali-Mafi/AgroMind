import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Use 3–30 lowercase letters, numbers, or underscores.")
  .max(30, "Use 3–30 lowercase letters, numbers, or underscores.")
  .regex(/^[a-z0-9_]+$/, "Use 3–30 lowercase letters, numbers, or underscores.");

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use no more than 128 characters.");

export const firstNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your first name.")
  .max(60, "Use no more than 60 characters.");

export const lastNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your last name.")
  .max(60, "Use no more than 60 characters.");

const identifierSchema = z
  .string()
  .trim()
  .min(1, "Enter your username or email.")
  .max(254)
  .transform((value) => (value.includes("@") ? value.toLowerCase() : value.toLowerCase()))
  .refine(
    (value) =>
      value.includes("@")
        ? emailSchema.safeParse(value).success
        : usernameSchema.safeParse(value).success,
    "Enter a valid username or email.",
  );

export const signInSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, "Enter your password.").max(128),
});

export const signUpSchema = z
  .object({
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    username: usernameSchema,
    email: emailSchema.transform((value) => value.toLowerCase()),
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
  verificationRequired?: boolean;
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
