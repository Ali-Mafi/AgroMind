import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254);

const usernameMessage =
  "Use 6–30 lowercase English letters, numbers, or underscores.";
const loginUsernameMessage =
  "Use 3–30 lowercase English letters, numbers, or underscores.";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(6, usernameMessage)
  .max(30, usernameMessage)
  .regex(/^[a-z0-9_]+$/, usernameMessage);

const loginUsernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, loginUsernameMessage)
  .max(30, loginUsernameMessage)
  .regex(/^[a-z0-9_]+$/, loginUsernameMessage);

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export function passwordRequirementStatus(
  password: string,
  confirmPassword: string,
) {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    symbol: /[^\p{L}\p{N}\s]/u.test(password),
    englishLetter: /[A-Za-z]/.test(password),
    number: /[0-9]/.test(password),
    match:
      password.length > 0 &&
      confirmPassword.length > 0 &&
      password === confirmPassword,
  };
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, "Use at least 8 characters.")
  .max(PASSWORD_MAX_LENGTH, "Use no more than 128 characters.")
  .refine((value) => /[^\p{L}\p{N}\s]/u.test(value), {
    message: "Add at least one symbol.",
  })
  .refine((value) => /[A-Za-z]/.test(value), {
    message: "Add at least one English letter.",
  })
  .refine((value) => /[0-9]/.test(value), {
    message: "Add at least one number.",
  });

const identifierSchema = z
  .string()
  .trim()
  .min(1, "Enter your username or email.")
  .max(254)
  .transform((value) => value.toLowerCase())
  .refine(
    (value) =>
      value.includes("@")
        ? emailSchema.safeParse(value).success
        : loginUsernameSchema.safeParse(value).success,
    "Enter a valid username or email.",
  );

export const signInSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, "Enter your password.").max(PASSWORD_MAX_LENGTH),
});

export const signUpSchema = z
  .object({
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
