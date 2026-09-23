import { signUpSchema, validationState, type AuthFormState } from "./validation";

export type SignUpValues = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const fields = [
  "firstName",
  "lastName",
  "username",
  "email",
  "password",
  "confirmPassword",
] as const;

function comparableValue(name: keyof SignUpValues, value: string) {
  return name === "username" || name === "email"
    ? value.trim().toLowerCase()
    : value.trim();
}

// Derive feedback from the same schema used on the server. Values stay in the
// mounted form only: never include passwords in action results or storage.
export function signUpFeedback(
  state: AuthFormState,
  values: SignUpValues,
  submitted: SignUpValues | null,
): AuthFormState {
  if (!submitted) return state;
  const changed = (name: keyof SignUpValues) =>
    comparableValue(name, values[name]) !== comparableValue(name, submitted[name]);
  const edited = fields.some(changed);
  if (!edited) return state;
  if (!state.error && !state.fields) return { ...state, success: undefined };

  const parsed = signUpSchema.safeParse(values);
  const currentErrors = parsed.success ? {} : validationState(parsed.error).fields ?? {};
  const visibleFields: Record<string, string> = {};

  for (const name of fields) {
    const relatedChanged = changed(name) || (name === "confirmPassword" && changed("password"));
    if (currentErrors[name] && (state.fields?.[name] || relatedChanged)) {
      visibleFields[name] = currentErrors[name];
    } else if (state.fields?.[name] && !relatedChanged) {
      // Availability errors remain until that identity actually changes;
      // editing an unrelated field or capitalization cannot dismiss them.
      visibleFields[name] = state.fields[name];
    }
  }

  return {
    ...state,
    fields: visibleFields,
    error: Object.keys(visibleFields).length
      ? "Please check the highlighted fields."
      : undefined,
    success: undefined,
  };
}
