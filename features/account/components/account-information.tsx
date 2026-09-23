"use client";
import { AccountShell } from "./account-shell";
import { HelpCenter } from "./help-center";
import { AboutProduct } from "./about-product";

export function AccountInformation({ kind }: { kind: "help" | "about" }) {
  return (
    <AccountShell title={kind === "help" ? "Help & Support" : "About AgroMind"}>
      {kind === "help" ? <HelpCenter /> : <AboutProduct />}
    </AccountShell>
  );
}
