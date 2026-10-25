"use client";
import { createContext, useContext, useState, type ReactNode } from "react";

type Agreement = { accepted: boolean; setAccepted: (next: boolean) => void };
const AgreementContext = createContext<Agreement | null>(null);

// One unchecked agreement is shared by email and Google registration.
export function SignupConsentProvider({ children }: { children: ReactNode }) {
  const [accepted, setAccepted] = useState(false);
  return <AgreementContext.Provider value={{ accepted, setAccepted }}>{children}</AgreementContext.Provider>;
}
export function useSignupConsent() {
  return useContext(AgreementContext);
}
