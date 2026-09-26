"use client";

import Link from "next/link";
import {
  MailPlus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useFarm } from "@/features/farms/context/farm-context";
import { getLimit } from "@/features/entitlements/lib/entitlements";
import { PreferenceSelect } from "@/features/settings/components/preference-select";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import {
  changeFarmMemberRoleAction,
  inviteFarmMemberAction,
  removeFarmMemberAction,
  resendFarmInvitationAction,
  revokeFarmInvitationAction,
} from "../services/actions";
import type { TeamOverview, TeamRole } from "../types";
import { AccountShell, accountCardClass } from "@/features/account/components/account-shell";

const ROLE_OPTIONS: { value: TeamRole; label: string; detail: string }[] = [
  {
    value: "manager",
    label: "Manager",
    detail: "Can view and edit the farm and manage irrigation.",
  },
  {
    value: "worker",
    label: "Worker",
    detail: "Can view the farm and manage irrigation.",
  },
  {
    value: "viewer",
    label: "Viewer",
    detail: "Can view farm and irrigation details only.",
  },
];

export function TeamManagement({
  initialOverview,
}: {
  initialOverview: TeamOverview;
}) {
  const { cloud } = useFarm();
  const { format } = useSettings();
  const t = useTranslation();
  const [overview, setOverview] = useState(initialOverview);
  const [email, setEmail] = useState("");
  const [farmId, setFarmId] = useState(
    cloud.farms.find((farm) => farm.access.owned)?.id ?? "",
  );
  const [role, setRole] = useState<TeamRole>("viewer");
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const ownedFarms = cloud.farms.filter((farm) => farm.access.owned);
  const seatLimit = getLimit(cloud.entitlements, "team_members");
  const usedSeats = overview.activeSeats + overview.pendingSeats;
  const canInvite = ownedFarms.length > 0 && seatLimit > 0;

  const members = useMemo(() => {
    const grouped = new Map<
      string,
      {
        userId: string;
        email: string;
        displayName: string;
        assignments: TeamOverview["members"];
      }
    >();
    for (const assignment of overview.members) {
      const existing = grouped.get(assignment.userId);
      if (existing) existing.assignments.push(assignment);
      else
        grouped.set(assignment.userId, {
          userId: assignment.userId,
          email: assignment.email,
          displayName: assignment.displayName,
          assignments: [assignment],
        });
    }
    return [...grouped.values()];
  }, [overview.members]);

  async function run(
    key: string,
    action: () => Promise<
      | { ok: true; data: TeamOverview }
      | { ok: false; error: string }
    >,
    success?: string,
  ) {
    if (busyKey) return false;
    setBusyKey(key);
    setError("");
    setNotice("");
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setOverview(result.data);
      if (success) setNotice(success);
      return true;
    } catch {
      setError("Team access could not be updated. Please try again.");
      return false;
    } finally {
      setBusyKey("");
    }
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canInvite) return;
    const sent = await run(
      "invite",
      () =>
        inviteFarmMemberAction(
          { email, farmId, role },
          cloud.user.id,
        ),
      "Invitation sent.",
    );
    if (sent) setEmail("");
  }

  return (
    <AccountShell title="Team">
      <section className={accountCardClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
              <UsersRound size={22} />
            </span>
            <div>
              <h2 className="text-lg font-bold">{t("Farm team")}</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                {t(
                  "Invite people to individual farms and choose exactly what they can change.",
                )}
              </p>
            </div>
          </div>
          <div className="min-w-28 rounded-2xl bg-muted/55 px-4 py-3 text-end">
            <p className="text-xs text-muted-foreground">{t("Team seats")}</p>
            <p className="mt-1 text-lg font-bold">
              <bdi>
                {format.number(usedSeats)} / {format.number(seatLimit)}
              </bdi>
            </p>
          </div>
        </div>

        <progress
          aria-label={t("Team seats")}
          max={Math.max(1, seatLimit)}
          value={Math.min(usedSeats, Math.max(1, seatLimit))}
          className="h-2 w-full accent-primary"
        />
        <p className="text-xs leading-5 text-muted-foreground">
          {t(
            "A person uses one team seat even when they have access to more than one of your farms.",
          )}
        </p>
      </section>

      {seatLimit === 0 ? (
        <section className={accountCardClass}>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={21} />
            <div>
              <h2 className="font-bold">
                {t("Team collaboration is not included in your current plan.")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("Check your subscription to see the team member limit.")}
              </p>
              <Link
                href="/account/subscription"
                className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary hover:underline"
              >
                {t("View subscription")}
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className={accountCardClass}>
          <div>
            <h2 className="flex items-center gap-2 font-bold">
              <MailPlus size={19} className="text-primary" />
              {t("Invite a team member")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t(
                "The invitation is valid for 7 days and only the invited email address can accept it.",
              )}
            </p>
          </div>

          <form onSubmit={invite} className="grid gap-4 lg:grid-cols-3">
            <label className="space-y-2 lg:col-span-3">
              <span className="text-sm font-semibold">{t("Email address")}</span>
              <input
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                dir="ltr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("Email address")}
                disabled={Boolean(busyKey)}
                className="min-h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              />
            </label>

            <PreferenceSelect
              id="team-invite-farm"
              label={t("Farm")}
              value={farmId}
              options={ownedFarms.map((farm) => ({
                value: farm.id,
                label: farm.name,
              }))}
              onChange={setFarmId}
              disabled={Boolean(busyKey) || ownedFarms.length === 0}
              placeholder={t("Choose a farm")}
            />

            <PreferenceSelect<TeamRole>
              id="team-invite-role"
              label={t("Role")}
              value={role}
              options={ROLE_OPTIONS.map((option) => ({
                value: option.value,
                label: t(option.label),
                description: t(option.detail),
              }))}
              onChange={setRole}
              disabled={Boolean(busyKey)}
            />

            <div className="flex items-end">
              <Button
                type="submit"
                disabled={!canInvite || Boolean(busyKey) || !email || !farmId}
                className="min-h-12 w-full rounded-xl"
              >
                <MailPlus size={17} />
                {t(busyKey === "invite" ? "Please wait…" : "Send invitation")}
              </Button>
            </div>
          </form>

          {usedSeats >= seatLimit && (
            <p className="rounded-xl bg-gold/10 p-4 text-sm leading-6">
              {t(
                "Your team member limit has been reached. Remove an active or pending seat before inviting someone new.",
              )}
            </p>
          )}
        </section>
      )}

      {(error || notice) && (
        <p
          role={error ? "alert" : "status"}
          className={
            error
              ? "rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
              : "rounded-xl bg-primary/8 p-4 text-sm text-primary"
          }
        >
          {t(error || notice)}
        </p>
      )}

      <section className={accountCardClass}>
        <div>
          <h2 className="flex items-center gap-2 font-bold">
            <UserRoundCheck size={19} className="text-primary" />
            {t("Active team members")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Roles are assigned separately for each farm.")}
          </p>
        </div>

        {members.length ? (
          <div className="divide-y">
            {members.map((member) => (
              <article key={member.userId} className="py-5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold">
                    {member.displayName}
                  </h3>
                  <p dir="ltr" className="mt-1 break-all text-sm text-muted-foreground">
                    {member.email}
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {member.assignments.map((assignment) => {
                    const key = `${member.userId}:${assignment.farmId}`;
                    return (
                      <div
                        key={key}
                        className="grid gap-3 rounded-2xl border bg-muted/20 p-4 sm:grid-cols-[1fr_170px_auto] sm:items-center"
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {assignment.farmName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("Farm access")}
                          </p>
                        </div>
                        <PreferenceSelect<TeamRole>
                          id={`team-role-${member.userId}-${assignment.farmId}`}
                          label={t("Role")}
                          hideLabel
                          value={assignment.role}
                          disabled={Boolean(busyKey)}
                          options={ROLE_OPTIONS.map((option) => ({
                            value: option.value,
                            label: t(option.label),
                          }))}
                          onChange={(nextRole) =>
                            void run(
                              `role:${key}`,
                              () =>
                                changeFarmMemberRoleAction(
                                  {
                                    farmId: assignment.farmId,
                                    userId: member.userId,
                                    role: nextRole,
                                  },
                                  cloud.user.id,
                                ),
                              "Role updated.",
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={Boolean(busyKey)}
                          aria-label={t("Remove access")}
                          title={t("Remove access")}
                          onClick={() =>
                            void run(
                              `remove:${key}`,
                              () =>
                                removeFarmMemberAction(
                                  {
                                    farmId: assignment.farmId,
                                    userId: member.userId,
                                  },
                                  cloud.user.id,
                                ),
                              "Access removed.",
                            )
                          }
                          className="min-h-11 rounded-xl text-destructive"
                        >
                          <Trash2 size={16} />
                          <span className="sm:hidden">{t("Remove access")}</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-muted/35 p-5 text-sm leading-6 text-muted-foreground">
            {t("No active team members yet.")}
          </p>
        )}
      </section>

      <section className={accountCardClass}>
        <div>
          <h2 className="font-bold">{t("Pending invitations")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Pending invitations reserve a team seat until they expire or are cancelled.")}
          </p>
        </div>

        {overview.invitations.length ? (
          <div className="divide-y">
            {overview.invitations.map((invitation) => (
              <article
                key={invitation.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p dir="ltr" className="break-all font-semibold">
                    {invitation.email}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {invitation.farmName} · {t(
                      invitation.role === "manager"
                        ? "Manager"
                        : invitation.role === "worker"
                          ? "Worker"
                          : "Viewer",
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("Expires")} · {format.date(new Date(invitation.expiresAt))}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={Boolean(busyKey)}
                    onClick={() =>
                      void run(
                        `resend:${invitation.id}`,
                        () =>
                          resendFarmInvitationAction(
                            { invitationId: invitation.id },
                            cloud.user.id,
                          ),
                        "Invitation resent.",
                      )
                    }
                    className="min-h-11 gap-2 rounded-xl"
                  >
                    <RefreshCw
                      size={16}
                      className={
                        busyKey === `resend:${invitation.id}`
                          ? "animate-spin motion-reduce:animate-none"
                          : undefined
                      }
                    />
                    {t("Resend invitation")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={Boolean(busyKey)}
                    onClick={() =>
                      void run(
                        `revoke:${invitation.id}`,
                        () =>
                          revokeFarmInvitationAction(
                            { invitationId: invitation.id },
                            cloud.user.id,
                          ),
                        "Invitation cancelled.",
                      )
                    }
                    className="min-h-11 gap-2 rounded-xl"
                  >
                    <X size={16} />
                    {t("Cancel invitation")}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-muted/35 p-5 text-sm leading-6 text-muted-foreground">
            {t("No pending invitations.")}
          </p>
        )}
      </section>
    </AccountShell>
  );
}
