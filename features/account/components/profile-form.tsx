"use client";

import { useState } from "react";
import { useFarm } from "@/features/farms/context/farm-context";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { PreferenceSelect } from "@/features/settings/components/preference-select";
import {
  COUNTRY_CODES,
  LANGUAGE_OPTIONS,
  countryDisplayName,
} from "@/features/settings/constants/locale-options";
import { saveProfileAction } from "@/features/cloud/services/actions";
import { Button } from "@/components/ui/button";
import { accountInputClass } from "@/features/authentication/components/auth-form";
import type { MfaSecurityState } from "@/features/authentication/types/mfa";
import { AccountShell, accountCardClass } from "./account-shell";
import { UsernameForm } from "./username-form";

export function ProfileForm({
  securityState,
}: {
  securityState: MfaSecurityState;
}) {
  const { cloud, run, busy } = useFarm();
  const settings = useSettings();
  const t = useTranslation();
  const [name, setName] = useState(cloud.profile.full_name);
  const [country, setCountry] = useState(
    cloud.profile.country_code ?? settings.country,
  );
  const [language, setLanguage] = useState(cloud.profile.language);
  const [timezone, setTimezone] = useState(cloud.profile.timezone);
  const [saved, setSaved] = useState(false);

  return (
    <AccountShell title="Profile">
      <form
        className={accountCardClass}
        onSubmit={async (event) => {
          event.preventDefault();
          setSaved(false);
          setSaved(
            await run(() =>
              saveProfileAction(
                { full_name: name, country_code: country, language, timezone },
                cloud.user.id,
              ),
            ),
          );
        }}
      >
        <fieldset disabled={busy} className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="profile-name"
              className="block text-sm font-semibold"
            >
              {t("Full name")}
            </label>
            <input
              id="profile-name"
              required
              maxLength={120}
              autoComplete="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSaved(false);
              }}
              className={accountInputClass}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              {t("Your full name is separate from your username.")}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">{t("Email")}</p>
            <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm break-all">
              <bdi>{cloud.user.email}</bdi>
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                "Your verified email is managed separately for account security.",
              )}
            </p>
          </div>

          <PreferenceSelect
            label={t("Country / Region")}
            value={country}
            options={COUNTRY_CODES.map((value) => ({
              value,
              label: countryDisplayName(value, settings.locale),
            }))}
            onChange={(value) => {
              setCountry(value);
              setSaved(false);
            }}
          />
          <PreferenceSelect
            label={t("Language")}
            value={language}
            options={LANGUAGE_OPTIONS}
            onChange={(value) => {
              setLanguage(value);
              setSaved(false);
            }}
          />
          <PreferenceSelect
            label={t("Time zone")}
            value={timezone}
            options={[
              ...new Set([
                "UTC",
                timezone,
                ...Intl.supportedValuesOf("timeZone"),
              ]),
            ].map((value) => ({ value, label: value }))}
            onChange={(value) => {
              setTimezone(value);
              setSaved(false);
            }}
          />
          <div className="space-y-2">
            <p className="text-sm font-semibold">{t("Account created")}</p>
            <p className="text-sm">
              {settings.format.date(new Date(cloud.user.createdAt))}
            </p>
          </div>
        </fieldset>

        {saved && (
          <p role="status" className="text-sm text-primary">
            {t("Profile saved.")}
          </p>
        )}

        <Button
          type="submit"
          disabled={busy}
          className="min-h-12 rounded-xl px-6"
        >
          {t(busy ? "Please wait…" : "Save changes")}
        </Button>
      </form>

      <UsernameForm
        key={cloud.profile.username ?? "username-unset"}
        currentUsername={cloud.profile.username}
        securityState={securityState}
      />
    </AccountShell>
  );
}
